/**
 * 通知系统集成服务
 * 实现班级公告通知、伙伴消息通知、错题本同步通知
 * Requirements: 3.8, 22.5, 23.8, 23.20
 * Task: 18.2
 */

import { executeQuery } from '../config/database.js';

export class NotificationIntegrationService {
  /**
   * 发送班级公告通知
   * Requirements: 3.8
   */
  async sendClassAnnouncement(
    classId: number,
    title: string,
    content: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ success: boolean; notifiedCount: number }> {
    const startTime = Date.now();
    try {
      // 获取班级所有学生
      const students = await executeQuery<any[]>(
        `SELECT DISTINCT cp.user_id
         FROM course_purchases cp
         WHERE cp.assigned_class_id = ? AND cp.payment_status = 'paid'`,
        [classId]
      );

      if (students.length === 0) {
        return { success: true, notifiedCount: 0 };
      }

      // 批量创建通知
      const notificationPromises = students.map(student =>
        executeQuery(
          `INSERT INTO notifications 
           (user_id, type, priority, title, content, action_url, metadata, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            student.user_id,
            'system',
            priority,
            `【班级公告】${title}`,
            content,
            `/student/classes/${classId}`,
            JSON.stringify({ class_id: classId, announcement_title: title })
          ]
        )
      );

      await Promise.all(notificationPromises);

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 3000) {
        console.warn(`班级公告通知延迟${elapsedTime}ms超过3秒`);
      }

      return { success: true, notifiedCount: students.length };
    } catch (error) {
      console.error('发送班级公告通知失败:', error);
      return { success: false, notifiedCount: 0 };
    }
  }

  /**
   * 发送伙伴消息通知
   * Requirements: 22.5
   */
  async sendPartnerMessageNotification(
    userId: number,
    partnerName: string,
    messageContent: string
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await executeQuery(
        `INSERT INTO notifications 
         (user_id, type, priority, title, content, action_url, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'partner_message',
          'medium',
          `${partnerName}发来消息`,
          messageContent.substring(0, 100), // 截取前100字符
          '/student/my-partner'
        ]
      );

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 3000) {
        console.warn(`伙伴消息通知延迟${elapsedTime}ms超过3秒`);
      }
    } catch (error) {
      console.error('发送伙伴消息通知失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 发送错题本同步通知（教师和家长）
   * Requirements: 23.8, 23.20
   */
  async sendWrongBookSyncNotification(
    studentId: number,
    questionId: number,
    lessonTitle: string
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // 获取学生的班级和教师
      const classInfo = await executeQuery<any[]>(
        `SELECT c.id as class_id, c.teacher_id
         FROM course_classes c
         INNER JOIN course_purchases cp ON c.id = cp.assigned_class_id
         WHERE cp.user_id = ? AND cp.payment_status = 'paid'
         LIMIT 1`,
        [studentId]
      );

      // 获取家长
      const parents = await executeQuery<any[]>(
        `SELECT parent_id FROM parent_students WHERE student_id = ?`,
        [studentId]
      );

      const notifications = [];

      // 通知教师
      if (classInfo.length > 0 && classInfo[0].teacher_id) {
        notifications.push({
          user_id: classInfo[0].teacher_id,
          type: 'wrong_question',
          priority: 'high',
          title: '学生错题提醒',
          content: `学生有新的错题：${lessonTitle}`,
          action_url: `/teacher/wrong-book/${studentId}`,
          metadata: JSON.stringify({ student_id: studentId, question_id: questionId })
        });
      }

      // 通知家长
      parents.forEach(parent => {
        notifications.push({
          user_id: parent.parent_id,
          type: 'wrong_question',
          priority: 'medium',
          title: '孩子错题提醒',
          content: `您的孩子有新的错题：${lessonTitle}`,
          action_url: `/parent/wrong-book/${studentId}`,
          metadata: JSON.stringify({ student_id: studentId, question_id: questionId })
        });
      });

      // 批量插入通知
      if (notifications.length > 0) {
        const notificationPromises = notifications.map(notif =>
          executeQuery(
            `INSERT INTO notifications 
             (user_id, type, priority, title, content, action_url, metadata, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              notif.user_id,
              notif.type,
              notif.priority,
              notif.title,
              notif.content,
              notif.action_url,
              notif.metadata
            ]
          )
        );

        await Promise.all(notificationPromises);
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 3000) {
        console.warn(`错题本同步通知延迟${elapsedTime}ms超过3秒`);
      }
    } catch (error) {
      console.error('发送错题本同步通知失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}

export const notificationIntegrationService = new NotificationIntegrationService();

