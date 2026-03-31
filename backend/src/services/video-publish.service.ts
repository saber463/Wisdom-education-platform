/**
 * AutoPublish 视频智能上下架服务
 *
 * 规则：
 * - 新视频（创建后7天内）：保护期，跳过
 * - 完成率 < 30% 且已过保护期 → 自动下架
 * - 完成率 ≥ 30% → 自动上架
 * 每天凌晨2点由定时任务触发
 */

import { executeQuery } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface LessonStats {
  lesson_id: number;
  title: string;
  is_published: number;
  protected_until: Date | null;
  enrolled_count: number;
  completed_count: number;
  completion_rate: number;
}

/**
 * 执行一次视频上下架扫描
 */
export async function runVideoPublishCheck(): Promise<{
  published: number;
  unpublished: number;
  skipped: number;
}> {
  logger.info('[AutoPublish] 开始视频上下架智能扫描...');

  try {
    // 统计每个 lesson 的完成率（用 MySQL，VideoProgress 用 MongoDB 故用进度表代替）
    // 利用 video_progress 聚合或直接基于 enrollment + completion 字段
    const lessons = await executeQuery<LessonStats[]>(`
      SELECT
        l.id AS lesson_id,
        l.title,
        l.is_published,
        l.protected_until,
        COUNT(DISTINCT ue.user_id) AS enrolled_count,
        SUM(CASE WHEN ue.is_completed = 1 THEN 1 ELSE 0 END) AS completed_count,
        ROUND(
          SUM(CASE WHEN ue.is_completed = 1 THEN 1 ELSE 0 END) * 100.0
          / GREATEST(COUNT(DISTINCT ue.user_id), 1),
          2
        ) AS completion_rate
      FROM lessons l
      LEFT JOIN user_enrollments ue ON ue.lesson_id = l.id
      GROUP BY l.id, l.title, l.is_published, l.protected_until
      HAVING enrolled_count >= 5
    `, []);

    let published = 0;
    let unpublished = 0;
    let skipped = 0;

    const now = new Date();

    for (const lesson of (lessons || [])) {
      // 保护期内跳过
      if (lesson.protected_until && new Date(lesson.protected_until) > now) {
        await writeAuditLog(lesson.lesson_id, 'skip_protected', lesson.completion_rate, lesson.enrolled_count, '7天保护期内，跳过审核');
        skipped++;
        continue;
      }

      const rate = lesson.completion_rate;

      if (rate < 30 && lesson.is_published) {
        // 完成率低于30%，自动下架
        await executeQuery(
          `UPDATE lessons
           SET is_published = FALSE,
               publish_reason = ?,
               last_completion_rate = ?
           WHERE id = ?`,
          [`完成率${rate}% < 30%，自动下架`, rate, lesson.lesson_id]
        );
        await writeAuditLog(lesson.lesson_id, 'unpublish', rate, lesson.enrolled_count, `完成率${rate}% < 30%阈值`);
        unpublished++;
      } else if (rate >= 30 && !lesson.is_published) {
        // 完成率达到30%，自动上架
        await executeQuery(
          `UPDATE lessons
           SET is_published = TRUE,
               publish_reason = ?,
               last_completion_rate = ?
           WHERE id = ?`,
          [`完成率${rate}% ≥ 30%，自动上架`, rate, lesson.lesson_id]
        );
        await writeAuditLog(lesson.lesson_id, 'publish', rate, lesson.enrolled_count, `完成率${rate}% ≥ 30%阈值`);
        published++;
      } else {
        // 状态未变化，仅更新完成率
        await executeQuery(
          'UPDATE lessons SET last_completion_rate = ? WHERE id = ?',
          [rate, lesson.lesson_id]
        );
      }
    }

    logger.info(`[AutoPublish] 完成：上架 ${published}，下架 ${unpublished}，跳过 ${skipped}`);
    return { published, unpublished, skipped };
  } catch (error) {
    logger.error('[AutoPublish] 扫描失败', error);
    return { published: 0, unpublished: 0, skipped: 0 };
  }
}

async function writeAuditLog(
  lessonId: number,
  action: 'publish' | 'unpublish' | 'skip_protected',
  rate: number,
  enrolledCount: number,
  reason: string
): Promise<void> {
  await executeQuery(
    `INSERT INTO video_publish_audit_log
       (lesson_id, action, completion_rate, enrolled_count, reason, triggered_by)
     VALUES (?, ?, ?, ?, ?, 'auto')`,
    [lessonId, action, rate, enrolledCount, reason]
  );
}

/**
 * 为新创建的视频设置7天保护期
 * 在 lesson 创建时调用
 */
export async function setProtectionPeriod(lessonId: number): Promise<void> {
  await executeQuery(
    `UPDATE lessons
     SET protected_until = DATE_ADD(NOW(), INTERVAL 7 DAY),
         is_published = TRUE
     WHERE id = ?`,
    [lessonId]
  );
  logger.info(`[AutoPublish] 课节 ${lessonId} 已设置7天保护期`);
}

/**
 * 手动触发上下架（教师/管理员）
 */
export async function manualPublish(
  lessonId: number,
  publish: boolean,
  reason: string,
  operatorId: number
): Promise<void> {
  await executeQuery(
    `UPDATE lessons
     SET is_published = ?, publish_reason = ?
     WHERE id = ?`,
    [publish, reason, lessonId]
  );
  await executeQuery(
    `INSERT INTO video_publish_audit_log
       (lesson_id, action, reason, triggered_by)
     VALUES (?, ?, ?, 'manual')`,
    [lessonId, publish ? 'publish' : 'unpublish', `手动操作(by ${operatorId}): ${reason}`]
  );
}
