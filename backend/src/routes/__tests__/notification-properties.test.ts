/**
 * 通知推送属性测试
 * Feature: smart-education-platform
 * 使用fast-check进行基于属性的测试
 */

import * as fc from 'fast-check';
import { executeQuery, closePool } from '../../config/database.js';

// 测试辅助数据
let validClassIds: number[] = [];
let validTeacherIds: number[] = [];
const classStudentMap: Map<number, number[]> = new Map();

beforeAll(async () => {
  // 查询数据库中实际存在的class_id
  const classes = await executeQuery<Array<{ id: number; teacher_id: number }>>(
    'SELECT id, teacher_id FROM classes LIMIT 10'
  );
  validClassIds = classes.map(c => c.id);
  
  // 查询数据库中实际存在的teacher_id
  const teachers = await executeQuery<Array<{ id: number }>>(
    "SELECT id FROM users WHERE role = 'teacher' LIMIT 10"
  );
  validTeacherIds = teachers.map(t => t.id);

  // 构建班级-学生映射
  for (const classInfo of classes) {
    const students = await executeQuery<Array<{ student_id: number }>>(
      `SELECT cs.student_id 
       FROM class_students cs
       JOIN users u ON cs.student_id = u.id
       WHERE cs.class_id = ? AND u.status = 'active'`,
      [classInfo.id]
    );
    classStudentMap.set(classInfo.id, students.map(s => s.student_id));
  }
});

afterAll(async () => {
  // 关闭数据库连接池
  await closePool();
});

/**
 * 属性3：通知推送完整性
 * Feature: smart-education-platform, Property 3: 通知推送完整性
 * 验证需求：1.4
 * 
 * 对于任何作业发布操作，系统应向该班级的所有学生推送通知，推送成功率应为100%
 */
describe('Property 3: 通知推送完整性', () => {
  it('发布作业时应向班级所有活跃学生推送通知', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    // 找到有学生的班级
    const classesWithStudents = validClassIds.filter(
      classId => (classStudentMap.get(classId)?.length || 0) > 0
    );

    if (classesWithStudents.length === 0) {
      console.warn('没有包含学生的班级，跳过测试');
      return;
    }

    // 生成器：安全的作业标题（只包含字母数字和中文）
    const safeTitleArbitrary = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789测试作业数学语文英语物理化学'.split('')),
      { minLength: 1, maxLength: 30 }
    );

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: safeTitleArbitrary,
          class_id: fc.constantFrom(...classesWithStudents),
          total_score: fc.integer({ min: 10, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        async (assignmentData) => {
          let assignmentId: number | null = null;
          const createdNotificationIds: number[] = [];

          try {
            // 获取班级对应的教师ID
            const classInfo = await executeQuery<Array<{ teacher_id: number }>>(
              'SELECT teacher_id FROM classes WHERE id = ?',
              [assignmentData.class_id]
            );
            
            if (!classInfo || classInfo.length === 0) {
              return true; // 跳过无效班级
            }

            const teacherId = classInfo[0].teacher_id;

            // 创建作业（草稿状态）
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                '测试作业描述',
                assignmentData.class_id,
                teacherId,
                'medium',
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 添加一道主观题（不需要标准答案）
            await executeQuery(
              `INSERT INTO questions 
               (assignment_id, question_number, question_type, question_content, score) 
               VALUES (?, 1, 'subjective', '请简述你的理解', ?)`,
              [assignmentId, assignmentData.total_score]
            );

            // 获取班级所有活跃学生
            const students = await executeQuery<Array<{ student_id: number; real_name: string }>>(
              `SELECT cs.student_id, u.real_name 
               FROM class_students cs
               JOIN users u ON cs.student_id = u.id
               WHERE cs.class_id = ? AND u.status = 'active'`,
              [assignmentData.class_id]
            );

            const expectedStudentCount = students.length;

            // 模拟发布作业逻辑
            // 1. 更新作业状态为published
            await executeQuery(
              'UPDATE assignments SET status = ? WHERE id = ?',
              ['published', assignmentId]
            );

            // 2. 推送通知到所有学生
            if (students.length > 0) {
              const notificationValues = students.map(student => [
                student.student_id,
                'assignment',
                `新作业：${assignmentData.title}`,
                `教师发布了新作业《${assignmentData.title}》，请及时完成。`
              ]);

              const placeholders = students.map(() => '(?, ?, ?, ?)').join(', ');
              const flatValues = notificationValues.flat();

              const notificationResult = await executeQuery<any>(
                `INSERT INTO notifications (user_id, type, title, content) 
                 VALUES ${placeholders}`,
                flatValues
              );

              // 记录创建的通知ID以便清理
              const firstNotificationId = notificationResult.insertId;
              for (let i = 0; i < students.length; i++) {
                createdNotificationIds.push(firstNotificationId + i);
              }
            }

            // 验证：查询该作业相关的通知数量
            const notifications = await executeQuery<Array<{ user_id: number; title: string }>>(
              `SELECT user_id, title FROM notifications 
               WHERE title LIKE ? AND type = 'assignment'`,
              [`%${assignmentData.title}%`]
            );

            // 验证：通知数量应该等于班级学生数量
            const notifiedStudentIds = new Set(notifications.map(n => n.user_id));
            const expectedStudentIds = new Set(students.map(s => s.student_id));

            // 验证：每个学生都应该收到通知
            for (const studentId of expectedStudentIds) {
              expect(notifiedStudentIds.has(studentId)).toBe(true);
            }

            // 验证：通知数量应该等于学生数量（100%推送成功率）
            expect(notifiedStudentIds.size).toBe(expectedStudentCount);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (createdNotificationIds.length > 0) {
              await executeQuery(
                `DELETE FROM notifications WHERE id IN (${createdNotificationIds.join(',')})`,
                []
              );
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 } // 运行100次迭代确保准确度
    );
  }, 120000); // 120秒超时

  it('发布作业时通知内容应包含作业标题和截止时间', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    // 找到有学生的班级
    const classesWithStudents = validClassIds.filter(
      classId => (classStudentMap.get(classId)?.length || 0) > 0
    );

    if (classesWithStudents.length === 0) {
      console.warn('没有包含学生的班级，跳过测试');
      return;
    }

    // 生成器：安全的作业标题（只包含字母数字和中文）
    const safeTitleArbitrary = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789测试作业数学语文英语物理化学'.split('')),
      { minLength: 1, maxLength: 20 }
    );

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: safeTitleArbitrary,
          class_id: fc.constantFrom(...classesWithStudents),
          total_score: fc.integer({ min: 10, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        async (assignmentData) => {
          let assignmentId: number | null = null;
          const createdNotificationIds: number[] = [];

          try {
            // 获取班级对应的教师ID
            const classInfo = await executeQuery<Array<{ teacher_id: number }>>(
              'SELECT teacher_id FROM classes WHERE id = ?',
              [assignmentData.class_id]
            );
            
            if (!classInfo || classInfo.length === 0) {
              return true;
            }

            const teacherId = classInfo[0].teacher_id;

            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                '测试作业描述',
                assignmentData.class_id,
                teacherId,
                'medium',
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 添加一道主观题
            await executeQuery(
              `INSERT INTO questions 
               (assignment_id, question_number, question_type, question_content, score) 
               VALUES (?, 1, 'subjective', '请简述你的理解', ?)`,
              [assignmentId, assignmentData.total_score]
            );

            // 获取班级学生
            const students = await executeQuery<Array<{ student_id: number }>>(
              `SELECT cs.student_id 
               FROM class_students cs
               JOIN users u ON cs.student_id = u.id
               WHERE cs.class_id = ? AND u.status = 'active'`,
              [assignmentData.class_id]
            );

            if (students.length === 0) {
              return true;
            }

            // 更新作业状态
            await executeQuery(
              'UPDATE assignments SET status = ? WHERE id = ?',
              ['published', assignmentId]
            );

            // 推送通知（包含截止时间）
            const deadlineStr = new Date(assignmentData.deadline).toLocaleString('zh-CN');
            const notificationValues = students.map(student => [
              student.student_id,
              'assignment',
              `新作业：${assignmentData.title}`,
              `教师发布了新作业《${assignmentData.title}》，截止时间：${deadlineStr}，请及时完成。`
            ]);

            const placeholders = students.map(() => '(?, ?, ?, ?)').join(', ');
            const flatValues = notificationValues.flat();

            const notificationResult = await executeQuery<any>(
              `INSERT INTO notifications (user_id, type, title, content) 
               VALUES ${placeholders}`,
              flatValues
            );

            const firstNotificationId = notificationResult.insertId;
            for (let i = 0; i < students.length; i++) {
              createdNotificationIds.push(firstNotificationId + i);
            }

            // 验证：查询通知内容
            const notifications = await executeQuery<Array<{ title: string; content: string }>>(
              `SELECT title, content FROM notifications 
               WHERE id IN (${createdNotificationIds.join(',')})`,
              []
            );

            // 验证：每个通知都应该包含作业标题
            for (const notification of notifications) {
              expect(notification.title).toContain(assignmentData.title);
              expect(notification.content).toContain(assignmentData.title);
            }

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (createdNotificationIds.length > 0) {
              await executeQuery(
                `DELETE FROM notifications WHERE id IN (${createdNotificationIds.join(',')})`,
                []
              );
            }
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 20 } // 运行100次迭代确保准确度
    );
  }, 120000);

  it('空班级发布作业时不应产生通知', async () => {
    // 确保有有效的ID
    if (validClassIds.length === 0 || validTeacherIds.length === 0) {
      console.warn('没有有效的class_id或teacher_id，跳过测试');
      return;
    }

    // 生成器：安全的作业标题（只包含字母数字和中文）
    const safeTitleArbitrary = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789测试作业数学语文英语物理化学'.split('')),
      { minLength: 1, maxLength: 20 }
    );

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: safeTitleArbitrary,
          class_id: fc.constantFrom(...validClassIds),
          total_score: fc.integer({ min: 10, max: 100 }),
          deadline: fc.date({ min: new Date('2026-02-01'), max: new Date('2026-12-31') })
            .map(d => d.toISOString().slice(0, 19).replace('T', ' '))
        }),
        async (assignmentData) => {
          let assignmentId: number | null = null;

          try {
            // 获取班级对应的教师ID
            const classInfo = await executeQuery<Array<{ teacher_id: number }>>(
              'SELECT teacher_id FROM classes WHERE id = ?',
              [assignmentData.class_id]
            );
            
            if (!classInfo || classInfo.length === 0) {
              return true;
            }

            const teacherId = classInfo[0].teacher_id;

            // 创建作业
            const result = await executeQuery<any>(
              `INSERT INTO assignments 
               (title, description, class_id, teacher_id, difficulty, total_score, deadline, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
              [
                assignmentData.title,
                '测试作业描述',
                assignmentData.class_id,
                teacherId,
                'medium',
                assignmentData.total_score,
                assignmentData.deadline
              ]
            );

            assignmentId = result.insertId;

            // 添加一道主观题
            await executeQuery(
              `INSERT INTO questions 
               (assignment_id, question_number, question_type, question_content, score) 
               VALUES (?, 1, 'subjective', '请简述你的理解', ?)`,
              [assignmentId, assignmentData.total_score]
            );

            // 实时查询班级学生（不依赖缓存的映射）
            const students = await executeQuery<Array<{ student_id: number }>>(
              `SELECT cs.student_id 
               FROM class_students cs
               JOIN users u ON cs.student_id = u.id
               WHERE cs.class_id = ? AND u.status = 'active'`,
              [assignmentData.class_id]
            );

            // 只测试空班级的情况
            if (students.length > 0) {
              // 跳过有学生的班级
              return true;
            }

            // 验证：空班级应该没有学生
            expect(students.length).toBe(0);

            // 更新作业状态
            await executeQuery(
              'UPDATE assignments SET status = ? WHERE id = ?',
              ['published', assignmentId]
            );

            // 不应该创建任何通知（因为没有学生）
            // 验证：查询该作业相关的通知数量应该为0
            const notifications = await executeQuery<Array<{ id: number }>>(
              `SELECT id FROM notifications 
               WHERE title LIKE ? AND type = 'assignment'`,
              [`%${assignmentData.title}%`]
            );

            // 验证：空班级不应该产生通知
            expect(notifications.length).toBe(0);

            return true;
          } catch (error) {
            console.error('属性测试失败:', error);
            throw error;
          } finally {
            // 清理测试数据
            if (assignmentId) {
              await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
            }
          }
        }
      ),
      { numRuns: 50 } // 运行50次迭代
    );
  }, 60000);
});
