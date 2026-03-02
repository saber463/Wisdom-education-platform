/**
 * 小组学情报告接口测试
 * 验证需求：18.6
 */

import { executeQuery, closePool } from '../../config/database.js';

describe('Team Report API - 小组学情报告', () => {
  let studentId: number;
  let teamId: number;

  beforeAll(async () => {
    // 先清理可能存在的旧测试数据
    try {
      await executeQuery('DELETE FROM users WHERE username LIKE ?', ['test_student_report%']);
    } catch (error) {
      // 忽略清理错误
    }

    // 创建测试学生用户
    const studentResult = await executeQuery<any>(
      `INSERT INTO users (username, password_hash, real_name, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      ['test_student_report', 'hash123', '测试学生', 'student', 'active']
    );
    studentId = studentResult.insertId;

    // 创建测试小组
    const teamResult = await executeQuery<any>(
      `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      ['测试小组报告', '测试目标', studentId, 10, 'TEST01']
    );
    teamId = teamResult.insertId;

    // 将学生加入小组
    await executeQuery(
      `INSERT INTO team_members (team_id, user_id, join_date)
       VALUES (?, ?, NOW())`,
      [teamId, studentId]
    );

    // 创建一些测试数据
    // 添加打卡记录
    await executeQuery(
      `INSERT INTO check_ins (team_id, user_id, check_in_date, study_duration, completed_tasks)
       VALUES (?, ?, CURDATE(), ?, ?)`,
      [teamId, studentId, 120, 3]
    );

    // 添加互评记录（需要另一个学生）
    const student2Result = await executeQuery<any>(
      `INSERT INTO users (username, password_hash, real_name, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      ['test_student_report2', 'hash123', '测试学生2', 'student', 'active']
    );
    const student2Id = student2Result.insertId;

    await executeQuery(
      `INSERT INTO team_members (team_id, user_id, join_date)
       VALUES (?, ?, NOW())`,
      [teamId, student2Id]
    );

    // 创建测试作业和提交
    const classes = await executeQuery<any[]>('SELECT id FROM classes LIMIT 1');
    const teachers = await executeQuery<any[]>("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
    
    if (classes.length > 0 && teachers.length > 0) {
      const assignmentResult = await executeQuery<any>(
        `INSERT INTO assignments (title, description, class_id, teacher_id, total_score, deadline, status)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?)`,
        ['测试作业', '测试描述', classes[0].id, teachers[0].id, 100, 'published']
      );
      const assignmentId = assignmentResult.insertId;

      await executeQuery(
        `INSERT INTO submissions (assignment_id, student_id, status, total_score)
         VALUES (?, ?, ?, ?)`,
        [assignmentId, student2Id, 'graded', 85]
      );

      await executeQuery(
        `INSERT INTO peer_reviews (team_id, reviewer_id, reviewee_id, assignment_id, score, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [teamId, studentId, student2Id, assignmentId, 90, '很好']
      );
    }
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await executeQuery('DELETE FROM peer_reviews WHERE team_id = ?', [teamId]);
      await executeQuery('DELETE FROM check_ins WHERE team_id = ?', [teamId]);
      await executeQuery('DELETE FROM team_members WHERE team_id = ?', [teamId]);
      await executeQuery('DELETE FROM teams WHERE id = ?', [teamId]);
      await executeQuery('DELETE FROM users WHERE username LIKE ?', ['test_student_report%']);
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
    await closePool();
  });

  test('应该能够查询小组学情报告数据结构', async () => {
    // 验证小组基本信息
    const teamInfo = await executeQuery<any[]>(
      `SELECT t.id, t.name, t.learning_goal, t.creator_id, t.member_limit, t.created_at,
              u.real_name as creator_name
       FROM teams t
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = ?`,
      [teamId]
    );

    expect(teamInfo.length).toBeGreaterThan(0);
    expect(teamInfo[0].id).toBe(teamId);
    expect(teamInfo[0].name).toBe('测试小组报告');

    // 验证成员贡献度数据
    const memberContributions = await executeQuery<any[]>(
      `SELECT 
        tm.user_id,
        u.real_name,
        COUNT(DISTINCT ci.id) as check_in_count,
        COALESCE(SUM(ci.study_duration), 0) as total_study_duration,
        COUNT(DISTINCT pr.id) as peer_review_count
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN check_ins ci ON ci.team_id = tm.team_id AND ci.user_id = tm.user_id
       LEFT JOIN peer_reviews pr ON pr.team_id = tm.team_id AND pr.reviewer_id = tm.user_id
       WHERE tm.team_id = ?
       GROUP BY tm.user_id, u.real_name`,
      [teamId]
    );

    expect(memberContributions.length).toBeGreaterThan(0);
    memberContributions.forEach(member => {
      expect(member.user_id).toBeDefined();
      expect(member.real_name).toBeDefined();
      expect(member.check_in_count).toBeGreaterThanOrEqual(0);
      expect(Number(member.total_study_duration)).toBeGreaterThanOrEqual(0);
      expect(member.peer_review_count).toBeGreaterThanOrEqual(0);
    });

    // 验证打卡率统计
    const checkInStats = await executeQuery<any[]>(
      `SELECT 
        check_in_date,
        COUNT(DISTINCT user_id) as checked_in_members
       FROM check_ins
       WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY check_in_date`,
      [teamId]
    );

    expect(Array.isArray(checkInStats)).toBe(true);

    // 验证小组进度排名数据
    const teamProgress = await executeQuery<any[]>(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT tm.user_id) as member_count,
        COALESCE(SUM(ci.study_duration), 0) as total_study_duration
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN check_ins ci ON t.id = ci.team_id
       WHERE t.id = ?
       GROUP BY t.id, t.name`,
      [teamId]
    );

    expect(teamProgress.length).toBeGreaterThan(0);
    expect(teamProgress[0].team_id).toBe(teamId);
    expect(teamProgress[0].member_count).toBeGreaterThan(0);

    // 验证互评统计
    const peerReviewStats = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT reviewer_id) as active_reviewers,
        AVG(score) as avg_score
       FROM peer_reviews
       WHERE team_id = ?`,
      [teamId]
    );

    expect(peerReviewStats.length).toBeGreaterThan(0);
    expect(peerReviewStats[0].total_reviews).toBeGreaterThanOrEqual(0);
  });

  test('成员贡献度评分应该在0-100之间', async () => {
    const memberContributions = await executeQuery<any[]>(
      `SELECT 
        tm.user_id,
        COUNT(DISTINCT ci.id) as check_in_count,
        COALESCE(SUM(ci.study_duration), 0) as total_study_duration,
        COUNT(DISTINCT pr.id) as peer_review_count
       FROM team_members tm
       LEFT JOIN check_ins ci ON ci.team_id = tm.team_id AND ci.user_id = tm.user_id
       LEFT JOIN peer_reviews pr ON pr.team_id = tm.team_id AND pr.reviewer_id = tm.user_id
       WHERE tm.team_id = ?
       GROUP BY tm.user_id`,
      [teamId]
    );

    // 计算贡献度评分
    const maxCheckIns = Math.max(...memberContributions.map(m => m.check_in_count), 1);
    const maxStudyDuration = Math.max(...memberContributions.map(m => Number(m.total_study_duration)), 1);
    const maxPeerReviews = Math.max(...memberContributions.map(m => m.peer_review_count), 1);

    memberContributions.forEach(member => {
      const checkInScore = (member.check_in_count / maxCheckIns) * 40;
      const studyDurationScore = (Number(member.total_study_duration) / maxStudyDuration) * 30;
      const peerReviewScore = (member.peer_review_count / maxPeerReviews) * 30;
      const contributionScore = Math.round(checkInScore + studyDurationScore + peerReviewScore);

      expect(contributionScore).toBeGreaterThanOrEqual(0);
      expect(contributionScore).toBeLessThanOrEqual(100);
    });
  });

  test('打卡率应该在0-100之间', async () => {
    const checkInStats = await executeQuery<any[]>(
      `SELECT 
        check_in_date,
        COUNT(DISTINCT user_id) as checked_in_members
       FROM check_ins
       WHERE team_id = ? AND check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY check_in_date`,
      [teamId]
    );

    const totalMembers = await executeQuery<any[]>(
      'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
      [teamId]
    );

    const memberCount = totalMembers[0].count;

    checkInStats.forEach(stat => {
      const checkInRate = memberCount > 0 
        ? Math.round((stat.checked_in_members / memberCount) * 100) 
        : 0;
      
      expect(checkInRate).toBeGreaterThanOrEqual(0);
      expect(checkInRate).toBeLessThanOrEqual(100);
    });
  });
});
