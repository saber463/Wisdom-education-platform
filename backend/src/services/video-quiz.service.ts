/**
 * 视频答题与错题本服务
 * Requirements: 23.1-23.20
 * Task: 10
 */

import { executeQuery } from '../config/database.js';
import { connectMongoDB } from '../config/mongodb.js';

export class VideoQuizService {
  /**
   * 获取视频答题触发信息
   * Requirements: 23.1, 23.16, 23.17
   * Task: 10.1
   */
  async getTriggerInfo(
    userId: number,
    lessonId: number
  ): Promise<{
    success: boolean;
    shouldTrigger: boolean;
    triggerTime?: number;
    question?: {
      id: number;
      question_content: string;
      question_type: string;
      options?: any;
      correct_answer: string;
      explanation?: string;
    };
  }> {
    try {
      // 1. 检查该视频已触发次数（最多3次）
      const triggerCount = await executeQuery<any[]>(
        `SELECT COUNT(*) as count FROM video_quiz_records 
         WHERE user_id = ? AND lesson_id = ?`,
        [userId, lessonId]
      );

      if (triggerCount[0]?.count >= 3) {
        return {
          success: true,
          shouldTrigger: false
        };
      }

      // 2. 获取该视频的题目
      const questions = await executeQuery<any[]>(
        `SELECT id, question_content, question_type, options, 
                correct_answer, explanation, trigger_time_range_start, 
                trigger_time_range_end
         FROM video_quiz_questions 
         WHERE lesson_id = ?
         ORDER BY RAND()
         LIMIT 1`,
        [lessonId]
      );

      if (questions.length === 0) {
        return {
          success: true,
          shouldTrigger: false
        };
      }

      const question = questions[0];

      // 3. 检查该位置是否已触发过
      const existingTriggers = await executeQuery<any[]>(
        `SELECT trigger_time FROM video_quiz_records 
         WHERE user_id = ? AND lesson_id = ? AND question_id = ?`,
        [userId, lessonId, question.id]
      );

      const triggerTimeRanges = existingTriggers.map(t => ({
        start: Math.max(0, t.trigger_time - 60), // ±60秒范围
        end: t.trigger_time + 60
      }));

      // 4. 生成随机触发时间（10-20分钟，即600-1200秒）
      const minTime = 600; // 10分钟
      const maxTime = 1200; // 20分钟
      let triggerTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

      // 5. 确保不在已触发的时间范围内
      let attempts = 0;
      while (attempts < 10) {
        const isInRange = triggerTimeRanges.some(range => 
          triggerTime >= range.start && triggerTime <= range.end
        );

        if (!isInRange) {
          break;
        }

        triggerTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        attempts++;
      }

      // 6. 确保在题目的触发时间范围内
      if (triggerTime < question.trigger_time_range_start || 
          triggerTime > question.trigger_time_range_end) {
        triggerTime = Math.floor(
          (question.trigger_time_range_start + question.trigger_time_range_end) / 2
        );
      }

      return {
        success: true,
        shouldTrigger: true,
        triggerTime,
        question: {
          id: question.id,
          question_content: question.question_content,
          question_type: question.question_type,
          options: question.options ? JSON.parse(question.options) : undefined,
          correct_answer: question.correct_answer,
          explanation: question.explanation
        }
      };
    } catch (error) {
      console.error('获取触发信息失败:', error);
      return {
        success: false,
        shouldTrigger: false
      };
    }
  }

  /**
   * 提交答案
   * Requirements: 23.4, 23.5, 23.6, 23.18
   * Task: 10.2
   */
  async submitAnswer(
    userId: number,
    questionId: number,
    lessonId: number,
    userAnswer: string,
    triggerTime: number,
    timeSpent?: number
  ): Promise<{
    success: boolean;
    isCorrect: boolean;
    reward?: number;
    addedToWrongBook?: boolean;
  }> {
    const startTime = Date.now();
    try {
      // 1. 获取题目信息
      const questions = await executeQuery<any[]>(
        `SELECT id, correct_answer, reward_points, knowledge_point_ids
         FROM video_quiz_questions 
         WHERE id = ?`,
        [questionId]
      );

      if (questions.length === 0) {
        return {
          success: false,
          isCorrect: false
        };
      }

      const question = questions[0];
      const correctAnswer = question.correct_answer.trim().toLowerCase();
      const userAnswerNormalized = userAnswer.trim().toLowerCase();

      // 2. 验证答案（≤100ms）
      const isCorrect = correctAnswer === userAnswerNormalized;
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime > 100) {
        console.warn(`答案验证耗时${elapsedTime}ms超过100ms`);
      }

      // 3. 记录答题记录
      await executeQuery(
        `INSERT INTO video_quiz_records 
         (user_id, question_id, lesson_id, user_answer, is_correct, 
          trigger_time, time_spent, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          questionId,
          lessonId,
          userAnswer,
          isCorrect,
          triggerTime,
          timeSpent || 0
        ]
      );

      if (isCorrect) {
        // 4. 答对：奖励积分
        const rewardPoints = question.reward_points || 5;
        
        await executeQuery(
          `UPDATE user_points SET points = points + ? WHERE user_id = ?`,
          [rewardPoints, userId]
        );

        await executeQuery(
          `INSERT INTO point_transactions 
           (user_id, points, transaction_type, description)
           VALUES (?, ?, 'reward', ?)`,
          [userId, rewardPoints, '视频答题正确奖励']
        );

        return {
          success: true,
          isCorrect: true,
          reward: rewardPoints
        };
      } else {
        // 5. 答错：添加到错题本
        const questionDetails = await executeQuery<any[]>(
          `SELECT question_content, correct_answer, explanation, 
                  knowledge_point_ids, video_url
           FROM video_quiz_questions 
           WHERE id = ?`,
          [questionId]
        );

        if (questionDetails.length > 0) {
          const detail = questionDetails[0];
          const videoUrl = await executeQuery<any[]>(
            `SELECT video_url FROM course_lessons WHERE id = ?`,
            [lessonId]
          );

          await executeQuery(
            `INSERT INTO wrong_question_book 
             (user_id, question_id, lesson_id, video_url, question_content,
              user_answer, correct_answer, explanation, knowledge_point_ids, answered_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              userId,
              questionId,
              lessonId,
              videoUrl[0]?.video_url || '',
              detail.question_content,
              userAnswer,
              detail.correct_answer,
              detail.explanation || '',
              detail.knowledge_point_ids || JSON.stringify([])
            ]
          );

          // 6. 触发AI重新评估（异步，延迟≤5秒）
          this.triggerAIReevaluation(userId, JSON.parse(detail.knowledge_point_ids || '[]'))
            .catch(err => console.error('触发AI重新评估失败:', err));

          // 7. 通知教师和家长（实时同步，≤3秒）
          this.notifyTeacherAndParent(userId, questionId, lessonId)
            .catch(err => console.error('通知教师和家长失败:', err));
        }

        return {
          success: true,
          isCorrect: false,
          addedToWrongBook: true
        };
      }
    } catch (error) {
      console.error('提交答案失败:', error);
      return {
        success: false,
        isCorrect: false
      };
    }
  }

  /**
   * 获取错题本
   * Requirements: 23.11, 23.12
   * Task: 10.3
   */
  async getWrongBook(
    userId: number,
    filters?: {
      lesson_id?: number;
      knowledge_point_id?: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{
    success: boolean;
    wrongQuestions: Array<{
      id: number;
      question_id: number;
      lesson_id: number;
      question_content: string;
      user_answer: string;
      correct_answer: string;
      explanation?: string;
      answered_at: Date;
      retry_count: number;
      is_mastered: boolean;
    }>;
  }> {
    try {
      let query = `SELECT id, question_id, lesson_id, question_content,
                          user_answer, correct_answer, explanation,
                          answered_at, retry_count, is_mastered
                   FROM wrong_question_book
                   WHERE user_id = ?`;
      const params: any[] = [userId];

      if (filters?.lesson_id) {
        query += ' AND lesson_id = ?';
        params.push(filters.lesson_id);
      }

      if (filters?.knowledge_point_id) {
        query += ' AND JSON_CONTAINS(knowledge_point_ids, ?)';
        params.push(JSON.stringify(filters.knowledge_point_id));
      }

      if (filters?.start_date) {
        query += ' AND answered_at >= ?';
        params.push(filters.start_date);
      }

      if (filters?.end_date) {
        query += ' AND answered_at <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY answered_at DESC';

      const wrongQuestions = await executeQuery<any[]>(query, params);

      return {
        success: true,
        wrongQuestions: wrongQuestions.map(q => ({
          id: q.id,
          question_id: q.question_id,
          lesson_id: q.lesson_id,
          question_content: q.question_content,
          user_answer: q.user_answer,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          answered_at: q.answered_at,
          retry_count: q.retry_count,
          is_mastered: q.is_mastered === 1
        }))
      };
    } catch (error) {
      console.error('获取错题本失败:', error);
      return {
        success: false,
        wrongQuestions: []
      };
    }
  }

  /**
   * 重做错题
   * Requirements: 23.13
   * Task: 10.3
   */
  async retryWrongQuestion(
    userId: number,
    wrongQuestionId: number,
    newAnswer: string
  ): Promise<{
    success: boolean;
    isCorrect: boolean;
    mastered?: boolean;
  }> {
    try {
      // 1. 获取错题信息
      const wrongQuestions = await executeQuery<any[]>(
        `SELECT question_id, correct_answer, retry_count
         FROM wrong_question_book
         WHERE id = ? AND user_id = ?`,
        [wrongQuestionId, userId]
      );

      if (wrongQuestions.length === 0) {
        return {
          success: false,
          isCorrect: false
        };
      }

      const wrongQuestion = wrongQuestions[0];
      const isCorrect = wrongQuestion.correct_answer.trim().toLowerCase() === 
                       newAnswer.trim().toLowerCase();

      // 2. 更新重做次数
      const newRetryCount = wrongQuestion.retry_count + 1;

      if (isCorrect) {
        // 3. 答对：标记为已掌握
        await executeQuery(
          `UPDATE wrong_question_book 
           SET retry_count = ?, is_mastered = TRUE, mastered_at = NOW()
           WHERE id = ?`,
          [newRetryCount, wrongQuestionId]
        );

        return {
          success: true,
          isCorrect: true,
          mastered: true
        };
      } else {
        await executeQuery(
          `UPDATE wrong_question_book 
           SET retry_count = ?
           WHERE id = ?`,
          [newRetryCount, wrongQuestionId]
        );

        return {
          success: true,
          isCorrect: false
        };
      }
    } catch (error) {
      console.error('重做错题失败:', error);
      return {
        success: false,
        isCorrect: false
      };
    }
  }

  /**
   * 标记已掌握
   * Requirements: 23.14
   * Task: 10.3
   */
  async markMastered(
    userId: number,
    wrongQuestionId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await executeQuery(
        `UPDATE wrong_question_book 
         SET is_mastered = TRUE, mastered_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [wrongQuestionId, userId]
      );

      return {
        success: true,
        message: '已标记为掌握'
      };
    } catch (error) {
      console.error('标记已掌握失败:', error);
      return {
        success: false,
        message: `标记失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取错题本统计
   * Requirements: 23.15
   * Task: 10.4
   */
  async getStatistics(userId: number): Promise<{
    success: boolean;
    statistics?: {
      total_questions: number;
      correct_rate: number;
      wrong_count: number;
      weak_points: Array<{
        knowledge_point_id: number;
        knowledge_point_name: string;
        error_count: number;
      }>;
    };
  }> {
    try {
      // 1. 获取总答题数和错题数
      const totalRecords = await executeQuery<any[]>(
        `SELECT COUNT(*) as total FROM video_quiz_records WHERE user_id = ?`,
        [userId]
      );

      const wrongRecords = await executeQuery<any[]>(
        `SELECT COUNT(*) as wrong FROM wrong_question_book 
         WHERE user_id = ? AND is_mastered = FALSE`,
        [userId]
      );

      const total = totalRecords[0]?.total || 0;
      const wrong = wrongRecords[0]?.wrong || 0;
      const correctRate = total > 0 ? ((total - wrong) / total * 100).toFixed(2) : 0;

      // 2. 获取TOP5薄弱知识点
      const weakPoints = await executeQuery<any[]>(
        `SELECT 
           JSON_UNQUOTE(JSON_EXTRACT(knowledge_point_ids, '$[0]')) as knowledge_point_id,
           COUNT(*) as error_count
         FROM wrong_question_book
         WHERE user_id = ? AND is_mastered = FALSE
         GROUP BY knowledge_point_id
         ORDER BY error_count DESC
         LIMIT 5`,
        [userId]
      );

      // 3. 获取知识点名称
      const weakPointsWithNames = await Promise.all(
        weakPoints.map(async (wp) => {
          const kpId = parseInt(wp.knowledge_point_id);
          if (isNaN(kpId)) return null;

          const kpInfo = await executeQuery<any[]>(
            `SELECT name FROM knowledge_points WHERE id = ?`,
            [kpId]
          );

          return {
            knowledge_point_id: kpId,
            knowledge_point_name: kpInfo[0]?.name || `知识点${kpId}`,
            error_count: wp.error_count
          };
        })
      );

      return {
        success: true,
        statistics: {
          total_questions: total,
          correct_rate: parseFloat(correctRate as string),
          wrong_count: wrong,
          weak_points: weakPointsWithNames.filter(p => p !== null) as any[]
        }
      };
    } catch (error) {
      console.error('获取统计失败:', error);
      return {
        success: false
      };
    }
  }

  /**
   * 教师查看学生错题
   * Requirements: 23.9
   * Task: 10.5
   */
  async getTeacherWrongBook(
    teacherId: number,
    studentId: number
  ): Promise<{
    success: boolean;
    wrongQuestions: Array<{
      student_name: string;
      lesson_name: string;
      question_content: string;
      user_answer: string;
      correct_answer: string;
      answered_at: Date;
    }>;
  }> {
    try {
      // 验证教师权限
      const classCheck = await executeQuery<any[]>(
        `SELECT c.id FROM classes c
         INNER JOIN class_students cs ON c.id = cs.class_id
         WHERE c.teacher_id = ? AND cs.student_id = ?`,
        [teacherId, studentId]
      );

      if (classCheck.length === 0) {
        return {
          success: false,
          wrongQuestions: []
        };
      }

      const wrongQuestions = await executeQuery<any[]>(
        `SELECT 
           u.real_name as student_name,
           cl.title as lesson_name,
           wq.question_content,
           wq.user_answer,
           wq.correct_answer,
           wq.answered_at
         FROM wrong_question_book wq
         INNER JOIN users u ON wq.user_id = u.id
         INNER JOIN course_lessons cl ON wq.lesson_id = cl.id
         WHERE wq.user_id = ? AND wq.is_mastered = FALSE
         ORDER BY wq.answered_at DESC`,
        [studentId]
      );

      return {
        success: true,
        wrongQuestions: wrongQuestions.map(q => ({
          student_name: q.student_name,
          lesson_name: q.lesson_name,
          question_content: q.question_content,
          user_answer: q.user_answer,
          correct_answer: q.correct_answer,
          answered_at: q.answered_at
        }))
      };
    } catch (error) {
      console.error('获取教师错题本失败:', error);
      return {
        success: false,
        wrongQuestions: []
      };
    }
  }

  /**
   * 家长查看孩子错题
   * Requirements: 23.10
   * Task: 10.5
   */
  async getParentWrongBook(
    parentId: number,
    childId: number
  ): Promise<{
    success: boolean;
    wrongQuestions: Array<{
      lesson_name: string;
      question_content: string;
      user_answer: string;
      correct_answer: string;
      answered_at: Date;
    }>;
    statistics?: {
      total_wrong: number;
      weak_points: Array<{
        knowledge_point_name: string;
        error_count: number;
      }>;
    };
  }> {
    try {
      // 验证家长权限
      const parentCheck = await executeQuery<any[]>(
        `SELECT 1 FROM parent_students 
         WHERE parent_id = ? AND student_id = ?`,
        [parentId, childId]
      );

      if (parentCheck.length === 0) {
        return {
          success: false,
          wrongQuestions: []
        };
      }

      const wrongQuestions = await executeQuery<any[]>(
        `SELECT 
           cl.title as lesson_name,
           wq.question_content,
           wq.user_answer,
           wq.correct_answer,
           wq.answered_at
         FROM wrong_question_book wq
         INNER JOIN course_lessons cl ON wq.lesson_id = cl.id
         WHERE wq.user_id = ? AND wq.is_mastered = FALSE
         ORDER BY wq.answered_at DESC`,
        [childId]
      );

      // 获取统计信息
      const stats = await this.getStatistics(childId);

      return {
        success: true,
        wrongQuestions: wrongQuestions.map(q => ({
          lesson_name: q.lesson_name,
          question_content: q.question_content,
          user_answer: q.user_answer,
          correct_answer: q.correct_answer,
          answered_at: q.answered_at
        })),
        statistics: stats.statistics ? {
          total_wrong: stats.statistics.wrong_count,
          weak_points: stats.statistics.weak_points.map(wp => ({
            knowledge_point_name: wp.knowledge_point_name,
            error_count: wp.error_count
          }))
        } : undefined
      };
    } catch (error) {
      console.error('获取家长错题本失败:', error);
      return {
        success: false,
        wrongQuestions: []
      };
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 触发AI重新评估
   * Requirements: 23.19
   */
  private async triggerAIReevaluation(
    userId: number,
    knowledgePointIds: number[]
  ): Promise<void> {
    // 延迟触发（≤5秒）
    setTimeout(async () => {
      try {
        // 调用AI学习路径服务的重新评估接口
        // 这里简化实现，实际应该调用aiLearningPathService
        console.log(`触发AI重新评估: userId=${userId}, knowledgePointIds=${knowledgePointIds.join(',')}`);
      } catch (error) {
        console.error('触发AI重新评估失败:', error);
      }
    }, 2000); // 2秒延迟
  }

  /**
   * 通知教师和家长
   * Requirements: 23.8, 23.20
   */
  private async notifyTeacherAndParent(
    userId: number,
    questionId: number,
    lessonId: number
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // 1. 获取学生的班级和教师
      const classInfo = await executeQuery<any[]>(
        `SELECT c.id as class_id, c.teacher_id
         FROM classes c
         INNER JOIN class_students cs ON c.id = cs.class_id
         WHERE cs.student_id = ?
         LIMIT 1`,
        [userId]
      );

      // 2. 获取家长
      const parents = await executeQuery<any[]>(
        `SELECT parent_id FROM parent_students WHERE student_id = ?`,
        [userId]
      );

      // 3. 发送通知（实时同步，≤3秒）
      const notifications = [];

      if (classInfo.length > 0) {
        notifications.push({
          user_id: classInfo[0].teacher_id,
          title: '学生错题提醒',
          content: `学生有新的错题，请及时查看`,
          type: 'wrong_question',
          priority: 'high'
        });
      }

      parents.forEach(parent => {
        notifications.push({
          user_id: parent.parent_id,
          title: '孩子错题提醒',
          content: `您的孩子有新的错题，请关注`,
          type: 'wrong_question',
          priority: 'medium'
        });
      });

      // 批量插入通知
      for (const notif of notifications) {
        await executeQuery(
          `INSERT INTO notifications 
           (user_id, title, content, type, priority, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            notif.user_id,
            notif.title,
            notif.content,
            notif.type,
            notif.priority
          ]
        );
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 3000) {
        console.warn(`通知教师和家长耗时${elapsedTime}ms超过3秒`);
      }
    } catch (error) {
      console.error('通知教师和家长失败:', error);
    }
  }
}

export const videoQuizService = new VideoQuizService();

