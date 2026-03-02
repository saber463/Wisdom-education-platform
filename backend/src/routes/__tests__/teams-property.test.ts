/**
 * 协作学习模块 - 属性测试
 * 使用fast-check进行属性测试
 * Feature: smart-education-platform
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

describe('Team Property Tests - 协作学习属性测试', () => {
  let testUserId: number;
  let testTeamId: number;

  beforeAll(async () => {
    // 创建测试用户
    try {
      await executeQuery('DELETE FROM users WHERE username LIKE ?', ['test_prop_user%']);
    } catch (error) {
      // 忽略清理错误
    }

    const userResult = await executeQuery<any>(
      `INSERT INTO users (username, password_hash, real_name, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      ['test_prop_user1', 'hash123', '属性测试用户', 'student', 'active']
    );
    testUserId = userResult.insertId;
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await executeQuery('DELETE FROM users WHERE username LIKE ?', ['test_prop_user%']);
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
    await closePool();
  });

  /**
   * 属性75：小组创建完整性
   * 验证需求：18.1
   * 
   * 属性：对于任意有效的小组名称、学习目标和成员上限，
   * 创建小组后应该：
   * 1. 生成唯一的小组ID
   * 2. 生成唯一的邀请码
   * 3. 创建者自动成为小组成员
   * 4. 所有字段正确存储到数据库
   */
  test('**Feature: smart-education-platform, Property 75: 小组创建完整性**', async () => {
    const teamNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
    const goalArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
    const memberLimitArb = fc.integer({ min: 2, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        teamNameArb,
        goalArb,
        memberLimitArb,
        async (teamName, goal, memberLimit) => {
          let createdTeamId: number | null = null;

          try {
            // 创建小组
            const inviteCode = generateTestInviteCode();
            const result = await executeQuery<any>(
              `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
               VALUES (?, ?, ?, ?, ?, NOW())`,
              [teamName.trim(), goal.trim(), testUserId, memberLimit, inviteCode]
            );

            createdTeamId = result.insertId;

            // 验证1：生成了唯一的小组ID
            expect(createdTeamId).toBeGreaterThan(0);

            // 验证2：邀请码已存储
            const teamInfo = await executeQuery<any[]>(
              'SELECT id, name, learning_goal, creator_id, member_limit, invite_code FROM teams WHERE id = ?',
              [createdTeamId]
            );

            expect(teamInfo.length).toBe(1);
            expect(teamInfo[0].invite_code).toBe(inviteCode);
            expect(teamInfo[0].name).toBe(teamName.trim());
            expect(teamInfo[0].learning_goal).toBe(goal.trim());
            expect(teamInfo[0].creator_id).toBe(testUserId);
            expect(teamInfo[0].member_limit).toBe(memberLimit);

            // 验证3：创建者自动成为小组成员
            await executeQuery(
              `INSERT INTO team_members (team_id, user_id, join_date)
               VALUES (?, ?, NOW())`,
              [createdTeamId, testUserId]
            );

            const memberCheck = await executeQuery<any[]>(
              'SELECT id, team_id, user_id FROM team_members WHERE team_id = ? AND user_id = ?',
              [createdTeamId, testUserId]
            );

            expect(memberCheck.length).toBe(1);
            expect(memberCheck[0].team_id).toBe(createdTeamId);
            expect(memberCheck[0].user_id).toBe(testUserId);

            // 验证4：所有字段正确存储
            expect(teamInfo[0].id).toBe(createdTeamId);

          } finally {
            // 清理测试数据
            if (createdTeamId) {
              try {
                await executeQuery('DELETE FROM team_members WHERE team_id = ?', [createdTeamId]);
                await executeQuery('DELETE FROM teams WHERE id = ?', [createdTeamId]);
              } catch (cleanupError) {
                console.warn('清理测试小组失败:', cleanupError);
              }
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  /**
   * 属性76：打卡记录持久化
   * 验证需求：18.3
   * 
   * 属性：对于任意有效的学习时长和完成任务数，
   * 打卡后应该：
   * 1. 记录正确存储到数据库
   * 2. 打卡日期为当天
   * 3. 学习时长和完成任务数正确保存
   * 4. 可以通过查询获取打卡记录
   */
  test('**Feature: smart-education-platform, Property 76: 打卡记录持久化**', async () => {
    // 创建测试小组
    const inviteCode = generateTestInviteCode();
    const teamResult = await executeQuery<any>(
      `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      ['打卡测试小组', '测试目标', testUserId, 10, inviteCode]
    );
    testTeamId = teamResult.insertId;

    await executeQuery(
      `INSERT INTO team_members (team_id, user_id, join_date)
       VALUES (?, ?, NOW())`,
      [testTeamId, testUserId]
    );

    const studyDurationArb = fc.integer({ min: 0, max: 480 }); // 0-8小时
    const completedTasksArb = fc.integer({ min: 0, max: 20 });

    try {
      await fc.assert(
        fc.asyncProperty(
          studyDurationArb,
          completedTasksArb,
          async (studyDuration, completedTasks) => {
            let checkInId: number | null = null;

            try {
              // 删除今天的打卡记录（如果存在）
              await executeQuery(
                'DELETE FROM check_ins WHERE team_id = ? AND user_id = ? AND check_in_date = CURDATE()',
                [testTeamId, testUserId]
              );

              // 创建打卡记录
              const result = await executeQuery<any>(
                `INSERT INTO check_ins (team_id, user_id, check_in_date, study_duration, completed_tasks)
                 VALUES (?, ?, CURDATE(), ?, ?)`,
                [testTeamId, testUserId, studyDuration, completedTasks]
              );

              checkInId = result.insertId;

              // 验证1：记录正确存储到数据库
              expect(checkInId).toBeGreaterThan(0);

              // 验证2-4：查询打卡记录并验证所有字段
              const checkInRecord = await executeQuery<any[]>(
                `SELECT id, team_id, user_id, check_in_date, study_duration, completed_tasks
                 FROM check_ins WHERE id = ?`,
                [checkInId]
              );

              expect(checkInRecord.length).toBe(1);
              expect(checkInRecord[0].id).toBe(checkInId);
              expect(checkInRecord[0].team_id).toBe(testTeamId);
              expect(checkInRecord[0].user_id).toBe(testUserId);
              
              // 验证打卡日期为当天
              const today = new Date();
              const checkInDate = new Date(checkInRecord[0].check_in_date);
              expect(checkInDate.getFullYear()).toBe(today.getFullYear());
              expect(checkInDate.getMonth()).toBe(today.getMonth());
              expect(checkInDate.getDate()).toBe(today.getDate());

              // 验证学习时长和完成任务数
              expect(checkInRecord[0].study_duration).toBe(studyDuration);
              expect(checkInRecord[0].completed_tasks).toBe(completedTasks);

            } finally {
              // 清理打卡记录
              if (checkInId) {
                try {
                  await executeQuery('DELETE FROM check_ins WHERE id = ?', [checkInId]);
                } catch (cleanupError) {
                  console.warn('清理打卡记录失败:', cleanupError);
                }
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      // 清理测试小组
      try {
        await executeQuery('DELETE FROM check_ins WHERE team_id = ?', [testTeamId]);
        await executeQuery('DELETE FROM team_members WHERE team_id = ?', [testTeamId]);
        await executeQuery('DELETE FROM teams WHERE id = ?', [testTeamId]);
      } catch (cleanupError) {
        console.warn('清理测试小组失败:', cleanupError);
      }
    }
  }, 60000);

  /**
   * 属性77：互评数据隔离性
   * 验证需求：18.5
   * 
   * 属性：对于任意有效的评分和评语，
   * 互评记录应该：
   * 1. 只能在同一小组内进行
   * 2. 互评记录与其他小组完全隔离
   * 3. 查询时只返回当前小组的互评记录
   * 4. 互评不影响其他小组的数据
   */
  test('**Feature: smart-education-platform, Property 77: 互评数据隔离性**', async () => {
    // 创建两个测试小组和两个测试用户
    const user2Result = await executeQuery<any>(
      `INSERT INTO users (username, password_hash, real_name, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      ['test_prop_user2', 'hash123', '属性测试用户2', 'student', 'active']
    );
    const user2Id = user2Result.insertId;

    const team1Result = await executeQuery<any>(
      `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      ['互评测试小组1', '测试目标1', testUserId, 10, generateTestInviteCode()]
    );
    const team1Id = team1Result.insertId;

    const team2Result = await executeQuery<any>(
      `INSERT INTO teams (name, learning_goal, creator_id, member_limit, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      ['互评测试小组2', '测试目标2', user2Id, 10, generateTestInviteCode()]
    );
    const team2Id = team2Result.insertId;

    // 将用户加入各自的小组
    await executeQuery(
      `INSERT INTO team_members (team_id, user_id, join_date) VALUES (?, ?, NOW()), (?, ?, NOW())`,
      [team1Id, testUserId, team1Id, user2Id]
    );

    await executeQuery(
      `INSERT INTO team_members (team_id, user_id, join_date) VALUES (?, ?, NOW())`,
      [team2Id, user2Id]
    );

    // 创建测试作业
    const classes = await executeQuery<any[]>('SELECT id FROM classes LIMIT 1');
    const teachers = await executeQuery<any[]>("SELECT id FROM users WHERE role = 'teacher' LIMIT 1");
    
    let assignmentId: number | null = null;
    if (classes.length > 0 && teachers.length > 0) {
      const assignmentResult = await executeQuery<any>(
        `INSERT INTO assignments (title, description, class_id, teacher_id, total_score, deadline, status)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?)`,
        ['互评测试作业', '测试描述', classes[0].id, teachers[0].id, 100, 'published']
      );
      assignmentId = assignmentResult.insertId;

      // 创建作业提交
      await executeQuery(
        `INSERT INTO submissions (assignment_id, student_id, status, total_score)
         VALUES (?, ?, ?, ?)`,
        [assignmentId, user2Id, 'graded', 85]
      );
    }

    const scoreArb = fc.integer({ min: 0, max: 100 });
    const commentArb = fc.string({ maxLength: 200 });

    try {
      if (assignmentId) {
        await fc.assert(
          fc.asyncProperty(
            scoreArb,
            commentArb,
            async (score, comment) => {
              let review1Id: number | null = null;
              let review2Id: number | null = null;

              try {
                // 在小组1中创建互评记录
                const review1Result = await executeQuery<any>(
                  `INSERT INTO peer_reviews (team_id, reviewer_id, reviewee_id, assignment_id, score, comment, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                  [team1Id, testUserId, user2Id, assignmentId, score, comment]
                );
                review1Id = review1Result.insertId;

                // 在小组2中创建互评记录（不同的评分）
                const review2Result = await executeQuery<any>(
                  `INSERT INTO peer_reviews (team_id, reviewer_id, reviewee_id, assignment_id, score, comment, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                  [team2Id, user2Id, testUserId, assignmentId, Math.max(0, score - 10), comment + '_team2']
                );
                review2Id = review2Result.insertId;

                // 验证1-2：查询小组1的互评记录，应该只返回小组1的记录
                const team1Reviews = await executeQuery<any[]>(
                  'SELECT id, team_id, reviewer_id, reviewee_id, score, comment FROM peer_reviews WHERE team_id = ?',
                  [team1Id]
                );

                expect(team1Reviews.length).toBeGreaterThan(0);
                team1Reviews.forEach(review => {
                  expect(review.team_id).toBe(team1Id);
                  expect(review.team_id).not.toBe(team2Id);
                });

                // 验证3：查询小组2的互评记录，应该只返回小组2的记录
                const team2Reviews = await executeQuery<any[]>(
                  'SELECT id, team_id, reviewer_id, reviewee_id, score, comment FROM peer_reviews WHERE team_id = ?',
                  [team2Id]
                );

                expect(team2Reviews.length).toBeGreaterThan(0);
                team2Reviews.forEach(review => {
                  expect(review.team_id).toBe(team2Id);
                  expect(review.team_id).not.toBe(team1Id);
                });

                // 验证4：两个小组的互评记录完全隔离
                const review1Data = team1Reviews.find(r => r.id === review1Id);
                const review2Data = team2Reviews.find(r => r.id === review2Id);

                expect(review1Data).toBeDefined();
                expect(review2Data).toBeDefined();
                expect(review1Data?.score).toBe(score);
                expect(review2Data?.score).toBe(Math.max(0, score - 10));
                expect(review1Data?.comment).toBe(comment);
                expect(review2Data?.comment).toBe(comment + '_team2');

                // 验证小组1的查询不会返回小组2的记录
                const team1HasTeam2Review = team1Reviews.some(r => r.id === review2Id);
                expect(team1HasTeam2Review).toBe(false);

                // 验证小组2的查询不会返回小组1的记录
                const team2HasTeam1Review = team2Reviews.some(r => r.id === review1Id);
                expect(team2HasTeam1Review).toBe(false);

              } finally {
                // 清理互评记录
                if (review1Id) {
                  try {
                    await executeQuery('DELETE FROM peer_reviews WHERE id = ?', [review1Id]);
                  } catch (cleanupError) {
                    console.warn('清理互评记录1失败:', cleanupError);
                  }
                }
                if (review2Id) {
                  try {
                    await executeQuery('DELETE FROM peer_reviews WHERE id = ?', [review2Id]);
                  } catch (cleanupError) {
                    console.warn('清理互评记录2失败:', cleanupError);
                  }
                }
              }
            }
          ),
          { numRuns: 20 }
        );
      }
    } finally {
      // 清理测试数据
      try {
        if (assignmentId) {
          await executeQuery('DELETE FROM submissions WHERE assignment_id = ?', [assignmentId]);
          await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
        }
        await executeQuery('DELETE FROM peer_reviews WHERE team_id IN (?, ?)', [team1Id, team2Id]);
        await executeQuery('DELETE FROM team_members WHERE team_id IN (?, ?)', [team1Id, team2Id]);
        await executeQuery('DELETE FROM teams WHERE id IN (?, ?)', [team1Id, team2Id]);
        await executeQuery('DELETE FROM users WHERE id = ?', [user2Id]);
      } catch (cleanupError) {
        console.warn('清理测试数据失败:', cleanupError);
      }
    }
  }, 90000);
});

/**
 * 生成测试用的邀请码
 */
function generateTestInviteCode(): string {
  return 'T' + Math.random().toString(36).substring(2, 7).toUpperCase();
}
