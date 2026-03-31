/**
 * SmartAlert 差分异常上报服务
 *
 * 逻辑：每2小时扫描 face_verify_logs，
 * 按 course_id + teacher_id 分组汇总疑似刷课记录，
 * MD5 去重后仅推送新增内容至教师微信群。
 */

import crypto from 'crypto';
import { executeQuery } from '../config/database.js';
import { pushService } from './push-service.js';
import { logger } from '../utils/logger.js';

interface AnomalyGroup {
  teacher_id: number;
  teacher_name: string;
  course_id: number;
  course_name: string;
  students: Array<{ user_id: number; name: string; student_no: string; fail_count: number }>;
  students_raw: string | Array<{ user_id: number; name: string; student_no: string; fail_count: number }>;
}

/**
 * 执行一次差分异常上报
 * 由定时任务每2小时调用
 */
export async function runAnomalyReport(): Promise<{ pushed: number; skipped: number }> {
  logger.info('[SmartAlert] 开始执行异常上报扫描...');

  try {
    // 查询过去2小时内有 fail/warning 记录的课程-教师组合
    const anomalies = await executeQuery<AnomalyGroup[]>(`
      SELECT
        c.teacher_id,
        u_teacher.name AS teacher_name,
        fvl.course_id,
        co.display_name AS course_name,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'user_id', fvl.user_id,
            'name', u_student.name,
            'student_no', u_student.student_id,
            'fail_count', COUNT(*)
          )
        ) AS students_raw,
        COUNT(DISTINCT fvl.user_id) AS student_count
      FROM face_verify_logs fvl
      JOIN courses co ON co.id = fvl.course_id
      JOIN classes c ON c.course_id = fvl.course_id
      JOIN users u_teacher ON u_teacher.id = c.teacher_id
      JOIN users u_student ON u_student.id = fvl.user_id
      WHERE fvl.result IN ('fail', 'warning')
        AND fvl.verify_time >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        AND fvl.is_reported = FALSE
      GROUP BY fvl.course_id, c.teacher_id, u_teacher.name, co.display_name
      HAVING COUNT(*) >= 3
    `, []);

    let pushed = 0;
    let skipped = 0;

    for (const group of (anomalies || [])) {
      const students: AnomalyGroup['students'] = typeof group.students_raw === 'string'
        ? JSON.parse(group.students_raw)
        : (group.students_raw ?? []);

      // 构建推送内容
      const studentList = students
        .slice(0, 10) // 最多显示10人
        .map(s => `${s.name}(${s.student_no})`)
        .join('、');

      const contentBody = `课程「${group.course_name}」发现 ${students.length} 名学生疑似刷课：${studentList}`;
      const contentHash = crypto.createHash('md5').update(contentBody).digest('hex');

      // 差分去重：检查是否已推送过相同内容
      const existing = await executeQuery<{ cnt: number }[]>(
        'SELECT COUNT(*) as cnt FROM alert_push_records WHERE content_hash = ?',
        [contentHash]
      );

      if (existing[0]?.cnt > 0) {
        skipped++;
        continue;
      }

      // 执行推送
      const pushResult = await pushService.sendWechatPush(
        `[防刷课预警] ${group.course_name}`,
        contentBody,
        `教师：${group.teacher_name}\n异常学生数：${students.length}\n时间范围：过去2小时`
      );

      // 记录推送，防止重复
      await executeQuery(
        `INSERT INTO alert_push_records
           (teacher_id, course_id, content_hash, student_count, push_status, detail)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          group.teacher_id,
          group.course_id,
          contentHash,
          students.length,
          pushResult.success ? 'success' : 'failed',
          JSON.stringify(students)
        ]
      );

      // 标记已上报
      await executeQuery(
        `UPDATE face_verify_logs
         SET is_reported = TRUE
         WHERE course_id = ?
           AND result IN ('fail', 'warning')
           AND verify_time >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
           AND is_reported = FALSE`,
        [group.course_id]
      );

      pushed++;
    }

    logger.info(`[SmartAlert] 完成：推送 ${pushed} 条，跳过 ${skipped} 条`);
    return { pushed, skipped };
  } catch (error) {
    logger.error('[SmartAlert] 异常上报执行失败', error);
    return { pushed: 0, skipped: 0 };
  }
}
