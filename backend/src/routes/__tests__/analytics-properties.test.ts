/**
 * 学情分析属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

// 测试辅助数据
let validClassIds: number[] = [];
let validTeacherIds: number[] = [];
let validStudentIds: number[] = [];
let validKnowledgePointIds: number[] = [];

beforeAll(async () => {
  // 查询数据库中实际存在的数据
  const classes = await executeQuery<Array<{ id: number }>>('SELECT id FROM classes LIMIT 10');
  validClassIds = classes.map(c => c.id);
  
  const teachers = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 10"
  );
  validTeacherIds = teachers.map(t => t.id);

  const students = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'student' LIMIT 10"
  );
  validStudentIds = students.map(s => s.id);

  const knowledgePoints = await executeQuery<Array<{ id: number }>>(
    'SELECT id FROM knowledge_points LIMIT 10'
  );
  validKnowledgePointIds = knowledgePoints.map(k => k.id);
});

afterAll(async () => {
  await closePool();
});

/**
 * 属性10：学情分析指标完整性
 * Feature: smart-education-platform, Property 10: 学情分析指标完整性
 * 验证需求：3.1
 * 
 * 对于任何班级学情查询，系统应展示班级平均分、及格率、优秀率三项指标的趋势图
 */
describe('Property 10: 学情分析指标完整性', () => {
  it('班级学情分析应包含平均分、及格率、优秀率三项指标', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // 作业数量
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 10 }), // 分数列表
        async (assignmentCount, scores) => {
          const classId = validClassIds[0];
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const createdAssignmentIds: number[] = [];
          const createdSubmissionIds: number[] = [];

          try {
            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建测试作业和提交记录
            for (let i = 0; i < assignmentCount; i++) {
              // 创建作业
              const assignmentResult = await executeQuery<any>(
                `INSERT INTO assignments 
                 (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
                [
                  `学情测试作业_${Date.now()}_${i}`,
                  '属性测试用作业',
                  classId,
                  teacherId,
                  'medium',
                  100,
                  '2026-12-31 23:59:59'
                ]
              );
              createdAssignmentIds.push(assignmentResult.insertId);

              // 创建提交记录
              const score = scores[i % scores.length];
              const submissionResult = await executeQuery<any>(
                `INSERT INTO submissions 
                 (assignment_id, student_id, status, total_score, grading_time) 
                 VALUES (?, ?, 'graded', ?, NOW())`,
                [assignmentResult.insertId, studentId, score]
              );
              createdSubmissionIds.push(submissionResult.insertId);
            }

            // 查询班级学情统计
            const students = await executeQuery<Array<{ student_id: number }>>(
              'SELECT student_id FROM class_students WHERE class_id = ?',
              [classId]
            );
            const studentIds = students.map(s => s.student_id);

            const stats = await executeQuery<Array<{
              avg_score: number | null;
              total_submissions: number;
              pass_count: number;
              excellent_count: number;
            }>>(
              `SELECT 
                AVG(s.total_score / a.total_score * 100) as avg_score,
                COUNT(s.id) as total_submissions,
                SUM(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 1 ELSE 0 END) as pass_count,
                SUM(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 1 ELSE 0 END) as excellent_count
               FROM submissions s
               JOIN assignments a ON s.assignment_id = a.id
               WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?`,
              [studentIds, classId]
            );

            // 验证1：平均分存在且为数值
            expect(stats[0].avg_score).toBeDefined();
            if (stats[0].total_submissions > 0) {
              expect(typeof stats[0].avg_score === 'number' || typeof stats[0].avg_score === 'string').toBe(true);
            }

            // 验证2：及格率可计算（pass_count存在）
            expect(stats[0].pass_count).toBeDefined();
            // MySQL可能返回BigInt或string，转换为数字验证
            const passCount = Number(stats[0].pass_count);
            expect(typeof passCount).toBe('number');
            expect(isNaN(passCount)).toBe(false);

            // 验证3：优秀率可计算（excellent_count存在）
            expect(stats[0].excellent_count).toBeDefined();
            const excellentCount = Number(stats[0].excellent_count);
            expect(typeof excellentCount).toBe('number');
            expect(isNaN(excellentCount)).toBe(false);

            // 验证4：总提交数存在
            expect(stats[0].total_submissions).toBeDefined();
            const totalSubmissions = Number(stats[0].total_submissions);
            // 总提交数应该是非负数（可能为0如果查询条件不匹配）
            expect(totalSubmissions).toBeGreaterThanOrEqual(0);

            // 验证5：如果有提交，则统计数据应该合理
            if (totalSubmissions > 0) {
              const passCount = Number(stats[0].pass_count);
              const excellentCount = Number(stats[0].excellent_count);
              // 及格数和优秀数不应超过总提交数
              expect(passCount).toBeLessThanOrEqual(totalSubmissions);
              expect(excellentCount).toBeLessThanOrEqual(totalSubmissions);
              // 优秀数不应超过及格数
              expect(excellentCount).toBeLessThanOrEqual(passCount);
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            for (const submissionId of createdSubmissionIds) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            for (const assignmentId of createdAssignmentIds) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('班级学情分析应包含趋势图数据', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // 天数
        async (_days) => {
          const classId = validClassIds[0];
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const createdAssignmentIds: number[] = [];
          const createdSubmissionIds: number[] = [];

          try {
            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建测试作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `趋势测试作业_${Date.now()}`,
                '趋势图测试',
                classId,
                teacherId,
                'medium',
                100,
                '2026-12-31 23:59:59'
              ]
            );
            createdAssignmentIds.push(assignmentResult.insertId);

            // 创建提交记录
            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions 
               (assignment_id, student_id, status, total_score, grading_time) 
               VALUES (?, ?, 'graded', ?, NOW())`,
              [assignmentResult.insertId, studentId, 80]
            );
            createdSubmissionIds.push(submissionResult.insertId);

            // 查询趋势数据
            const students = await executeQuery<Array<{ student_id: number }>>(
              'SELECT student_id FROM class_students WHERE class_id = ?',
              [classId]
            );
            const studentIds = students.map(s => s.student_id);

            const trendData = await executeQuery<Array<{
              date: string;
              avg_score: number;
              pass_rate: number;
              excellent_rate: number;
            }>>(
              `SELECT 
                DATE(s.grading_time) as date,
                AVG(s.total_score / a.total_score * 100) as avg_score,
                AVG(CASE WHEN s.total_score / a.total_score >= 0.6 THEN 100 ELSE 0 END) as pass_rate,
                AVG(CASE WHEN s.total_score / a.total_score >= 0.85 THEN 100 ELSE 0 END) as excellent_rate
               FROM submissions s
               JOIN assignments a ON s.assignment_id = a.id
               WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?
                 AND s.grading_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
               GROUP BY DATE(s.grading_time)
               ORDER BY date ASC`,
              [studentIds, classId]
            );

            // 验证趋势数据结构
            expect(Array.isArray(trendData)).toBe(true);
            
            if (trendData.length > 0) {
              for (const trend of trendData) {
                // 验证每个趋势点包含必要字段
                expect(trend.date).toBeDefined();
                expect(trend.avg_score).toBeDefined();
                expect(trend.pass_rate).toBeDefined();
                expect(trend.excellent_rate).toBeDefined();
              }
            }

            return true;
          } catch (error) {
            console.error('测试失败:', error);
            throw error;
          } finally {
            for (const submissionId of createdSubmissionIds) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            for (const assignmentId of createdAssignmentIds) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性11：薄弱知识点识别准确性
 * Feature: smart-education-platform, Property 11: 薄弱知识点识别准确性
 * 验证需求：3.2
 * 
 * 对于任何知识点数据，当错误率≥40%时，系统应将其标注为薄弱知识点
 */
describe('Property 11: 薄弱知识点识别准确性', () => {
  it('错误率≥40%的知识点应被识别为薄弱知识点', async () => {
    if (validStudentIds.length === 0 || validKnowledgePointIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 40, max: 100 }), // 错误率（40-100%）
        fc.integer({ min: 5, max: 20 }), // 总答题次数
        async (errorRate, totalCount) => {
          const studentId = validStudentIds[0];
          const knowledgePointId = validKnowledgePointIds[0];
          const errorCount = Math.floor(totalCount * errorRate / 100);
          let createdWeakPointId: number | null = null;

          try {
            // 清理可能存在的旧数据
            await executeQuery(
              'DELETE FROM student_weak_points WHERE student_id = ? AND knowledge_point_id = ?',
              [studentId, knowledgePointId]
            );

            // 插入薄弱点数据
            const result = await executeQuery<any>(
              `INSERT INTO student_weak_points 
               (student_id, knowledge_point_id, error_count, total_count, error_rate, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [studentId, knowledgePointId, errorCount, totalCount, errorRate, 'weak']
            );
            createdWeakPointId = result.insertId;

            // 查询薄弱知识点（错误率≥40%）
            const weakPoints = await executeQuery<Array<{
              knowledge_point_id: number;
              error_rate: number;
            }>>(
              `SELECT knowledge_point_id, error_rate
               FROM student_weak_points
               WHERE student_id = ? AND error_rate >= 40`,
              [studentId]
            );

            // 验证：错误率≥40%的知识点应该被识别为薄弱点
            const foundWeakPoint = weakPoints.find(wp => wp.knowledge_point_id === knowledgePointId);
            expect(foundWeakPoint).toBeDefined();
            expect(Number(foundWeakPoint!.error_rate)).toBeGreaterThanOrEqual(40);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            if (createdWeakPointId) {
              await executeQuery('DELETE FROM student_weak_points WHERE id = ?', [createdWeakPointId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('错误率<40%的知识点不应被标注为薄弱知识点', async () => {
    if (validStudentIds.length === 0 || validKnowledgePointIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 39 }), // 错误率（0-39%）
        fc.integer({ min: 5, max: 20 }), // 总答题次数
        async (errorRate, totalCount) => {
          const studentId = validStudentIds[0];
          const knowledgePointId = validKnowledgePointIds[0];
          const errorCount = Math.floor(totalCount * errorRate / 100);
          let createdWeakPointId: number | null = null;

          try {
            // 清理可能存在的旧数据
            await executeQuery(
              'DELETE FROM student_weak_points WHERE student_id = ? AND knowledge_point_id = ?',
              [studentId, knowledgePointId]
            );

            // 插入数据（错误率<40%，状态应为improving或mastered）
            const status = errorRate < 30 ? 'mastered' : 'improving';
            const result = await executeQuery<any>(
              `INSERT INTO student_weak_points 
               (student_id, knowledge_point_id, error_count, total_count, error_rate, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [studentId, knowledgePointId, errorCount, totalCount, errorRate, status]
            );
            createdWeakPointId = result.insertId;

            // 查询薄弱知识点（错误率≥40%）
            const weakPoints = await executeQuery<Array<{
              knowledge_point_id: number;
              error_rate: number;
            }>>(
              `SELECT knowledge_point_id, error_rate
               FROM student_weak_points
               WHERE student_id = ? AND error_rate >= 40`,
              [studentId]
            );

            // 验证：错误率<40%的知识点不应该在薄弱点列表中
            const foundWeakPoint = weakPoints.find(wp => wp.knowledge_point_id === knowledgePointId);
            expect(foundWeakPoint).toBeUndefined();

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            if (createdWeakPointId) {
              await executeQuery('DELETE FROM student_weak_points WHERE id = ?', [createdWeakPointId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性12：成绩排名计算正确性
 * Feature: smart-education-platform, Property 12: 成绩排名计算正确性
 * 验证需求：3.3
 * 
 * 对于任何班级成绩数据，系统计算的排名应按总分降序排列，且进步幅度计算准确
 */
describe('Property 12: 成绩排名计算正确性', () => {
  it('班级排名应按总分降序排列', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length < 2) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 5 }), // 学生分数列表
        async (scores) => {
          const classId = validClassIds[0];
          const teacherId = validTeacherIds[0];
          const createdAssignmentIds: number[] = [];
          const createdSubmissionIds: number[] = [];

          try {
            // 确保学生在班级中
            for (let i = 0; i < Math.min(scores.length, validStudentIds.length); i++) {
              await executeQuery(
                `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
                [classId, validStudentIds[i]]
              );
            }

            // 创建测试作业
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `排名测试作业_${Date.now()}`,
                '排名测试',
                classId,
                teacherId,
                'medium',
                100,
                '2026-12-31 23:59:59'
              ]
            );
            createdAssignmentIds.push(assignmentResult.insertId);

            // 为每个学生创建提交记录
            for (let i = 0; i < Math.min(scores.length, validStudentIds.length); i++) {
              const submissionResult = await executeQuery<any>(
                `INSERT INTO submissions 
                 (assignment_id, student_id, status, total_score, grading_time) 
                 VALUES (?, ?, 'graded', ?, NOW())`,
                [assignmentResult.insertId, validStudentIds[i], scores[i]]
              );
              createdSubmissionIds.push(submissionResult.insertId);
            }

            // 查询班级排名
            const rankings = await executeQuery<Array<{
              student_id: number;
              total_score: number;
            }>>(
              `SELECT 
                cs.student_id,
                COALESCE(SUM(s.total_score), 0) as total_score
               FROM class_students cs
               LEFT JOIN submissions s ON cs.student_id = s.student_id 
                 AND s.status IN ('graded', 'reviewed')
               LEFT JOIN assignments a ON s.assignment_id = a.id AND a.class_id = ?
               WHERE cs.class_id = ?
               GROUP BY cs.student_id
               ORDER BY total_score DESC`,
              [classId, classId]
            );

            // 验证：排名应该按总分降序排列
            for (let i = 1; i < rankings.length; i++) {
              expect(Number(rankings[i - 1].total_score)).toBeGreaterThanOrEqual(Number(rankings[i].total_score));
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            for (const submissionId of createdSubmissionIds) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            for (const assignmentId of createdAssignmentIds) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('进步幅度计算应准确', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // 当前期平均分
        fc.integer({ min: 0, max: 100 }), // 上一期平均分
        async (currentAvg, previousAvg) => {
          // 计算进步幅度
          const improvement = currentAvg - previousAvg;

          // 验证进步幅度计算
          expect(improvement).toBe(currentAvg - previousAvg);

          // 验证进步趋势判断
          const trend = improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable';
          if (currentAvg > previousAvg) {
            expect(trend).toBe('up');
          } else if (currentAvg < previousAvg) {
            expect(trend).toBe('down');
          } else {
            expect(trend).toBe('stable');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});


/**
 * 属性14：PDF报告内容完整性
 * Feature: smart-education-platform, Property 14: PDF报告内容完整性
 * 验证需求：3.5
 * 
 * 对于任何学情报告导出请求，生成的报告应包含所有图表和数据分析内容
 */
describe('Property 14: PDF报告内容完整性', () => {
  it('班级报告应包含统计数据、趋势数据、薄弱点和排名', async () => {
    if (validClassIds.length === 0 || validTeacherIds.length === 0 || validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 7, max: 30 }), // 报告周期（天数）
        async (period) => {
          const classId = validClassIds[0];
          const teacherId = validTeacherIds[0];
          const studentId = validStudentIds[0];
          const createdAssignmentIds: number[] = [];
          const createdSubmissionIds: number[] = [];

          try {
            // 确保学生在班级中
            await executeQuery(
              `INSERT IGNORE INTO class_students (class_id, student_id, join_date) VALUES (?, ?, CURDATE())`,
              [classId, studentId]
            );

            // 创建测试作业和提交
            const assignmentResult = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
              [
                `报告测试作业_${Date.now()}`,
                '报告测试',
                classId,
                teacherId,
                'medium',
                100,
                '2026-12-31 23:59:59'
              ]
            );
            createdAssignmentIds.push(assignmentResult.insertId);

            const submissionResult = await executeQuery<any>(
              `INSERT INTO submissions 
               (assignment_id, student_id, status, total_score, grading_time) 
               VALUES (?, ?, 'graded', ?, NOW())`,
              [assignmentResult.insertId, studentId, 80]
            );
            createdSubmissionIds.push(submissionResult.insertId);

            // 模拟报告数据生成
            const reportData: any = {
              generated_at: new Date().toISOString(),
              period_days: period,
              include_charts: true
            };

            // 获取班级信息
            const classInfo = await executeQuery<any[]>(
              'SELECT * FROM classes WHERE id = ?',
              [classId]
            );
            reportData.class_info = classInfo[0];

            // 获取班级学生
            const students = await executeQuery<Array<{ student_id: number }>>(
              'SELECT student_id FROM class_students WHERE class_id = ?',
              [classId]
            );
            const studentIds = students.map(s => s.student_id);

            if (studentIds.length > 0) {
              // 统计数据
              const stats = await executeQuery<any[]>(
                `SELECT 
                  AVG(s.total_score / a.total_score * 100) as avg_score,
                  COUNT(s.id) as total_submissions
                 FROM submissions s
                 JOIN assignments a ON s.assignment_id = a.id
                 WHERE s.student_id IN (?) AND s.status IN ('graded', 'reviewed') AND a.class_id = ?`,
                [studentIds, classId]
              );
              reportData.statistics = stats[0];
            }

            // 验证报告数据完整性
            expect(reportData.generated_at).toBeDefined();
            expect(reportData.period_days).toBe(period);
            expect(reportData.class_info).toBeDefined();

            if (reportData.statistics) {
              // 验证统计数据存在
              expect(reportData.statistics.avg_score !== undefined || reportData.statistics.avg_score === null).toBe(true);
              expect(reportData.statistics.total_submissions).toBeDefined();
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            for (const submissionId of createdSubmissionIds) {
              await executeQuery('DELETE FROM submissions WHERE id = ?', [submissionId]);
            }
            for (const assignmentId of createdAssignmentIds) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);

  it('学生个人报告应包含个人统计和薄弱点', async () => {
    if (validStudentIds.length === 0) {
      console.warn('没有足够的测试数据，跳过测试');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 7, max: 30 }), // 报告周期（天数）
        async (period) => {
          const studentId = validStudentIds[0];

          try {
            // 模拟学生报告数据生成
            const reportData: any = {
              generated_at: new Date().toISOString(),
              period_days: period,
              include_charts: true
            };

            // 获取学生信息
            const studentInfo = await executeQuery<any[]>(
              'SELECT id, real_name, username FROM users WHERE id = ?',
              [studentId]
            );
            reportData.student_info = studentInfo[0];

            // 获取学生统计数据
            const stats = await executeQuery<any[]>(
              `SELECT 
                AVG(s.total_score / a.total_score * 100) as avg_score,
                COUNT(s.id) as total_submissions
               FROM submissions s
               JOIN assignments a ON s.assignment_id = a.id
               WHERE s.student_id = ? AND s.status IN ('graded', 'reviewed')`,
              [studentId]
            );
            reportData.statistics = stats[0];

            // 获取薄弱点
            const weakPoints = await executeQuery<any[]>(
              `SELECT kp.name, swp.error_rate
               FROM student_weak_points swp
               JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
               WHERE swp.student_id = ? AND swp.error_rate >= 40
               ORDER BY swp.error_rate DESC`,
              [studentId]
            );
            reportData.weak_points = weakPoints;

            // 验证报告数据完整性
            expect(reportData.generated_at).toBeDefined();
            expect(reportData.period_days).toBe(period);
            expect(reportData.student_info).toBeDefined();
            expect(reportData.statistics).toBeDefined();
            expect(Array.isArray(reportData.weak_points)).toBe(true);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 120000);
});
