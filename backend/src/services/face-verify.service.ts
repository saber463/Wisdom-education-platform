/**
 * 人脸核验服务
 * FaceGuard - 静默核验防刷课系统
 *
 * 算法：余弦相似度比对128维特征向量
 * 阈值：≥0.85通过 / 0.6-0.85警告 / <0.6失败
 */

import { executeQuery } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface FaceFeatureRow {
  feature_vector: string;
  user_id: number;
}

// 计算两个向量的余弦相似度
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 核验结果判定
function judgeResult(similarity: number): 'pass' | 'warning' | 'fail' {
  if (similarity >= 0.85) return 'pass';
  if (similarity >= 0.60) return 'warning';
  return 'fail';
}

/**
 * 注册人脸特征
 */
export async function registerFace(
  userId: number,
  featureVector: number[],
  photoUrl?: string
): Promise<{ success: boolean; message: string }> {
  if (!Array.isArray(featureVector) || featureVector.length !== 128) {
    return { success: false, message: '特征向量格式错误，需要128维数组' };
  }

  try {
    await executeQuery(
      `INSERT INTO face_features (user_id, feature_vector, register_photo_url)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         feature_vector = VALUES(feature_vector),
         register_photo_url = VALUES(register_photo_url),
         updated_at = NOW()`,
      [userId, JSON.stringify(featureVector), photoUrl ?? null]
    );
    logger.info(`人脸特征注册成功: userId=${userId}`);
    return { success: true, message: '人脸特征注册成功' };
  } catch (error) {
    logger.error('人脸特征注册失败', error);
    return { success: false, message: '注册失败，请重试' };
  }
}

/**
 * 核验人脸特征（每2分钟调用一次）
 */
export async function verifyFace(
  userId: number,
  lessonId: number,
  courseId: number,
  inputVector: number[],
  snapshotUrl?: string
): Promise<{
  success: boolean;
  result: 'pass' | 'warning' | 'fail' | 'no_registration';
  similarity?: number;
  message: string;
}> {
  if (!Array.isArray(inputVector) || inputVector.length !== 128) {
    return { success: false, result: 'fail', message: '特征向量格式错误' };
  }

  try {
    // 获取注册特征
    const rows = await executeQuery<FaceFeatureRow[]>(
      'SELECT feature_vector FROM face_features WHERE user_id = ?',
      [userId]
    );

    if (!rows || rows.length === 0) {
      return { success: false, result: 'no_registration', message: '未找到注册人脸，请先注册' };
    }

    const registeredVector: number[] = JSON.parse(rows[0].feature_vector);
    const similarity = cosineSimilarity(inputVector, registeredVector);
    const result = judgeResult(similarity);

    // 只有失败和警告时记录抓拍URL
    const effectiveSnapshotUrl = result !== 'pass' ? (snapshotUrl ?? null) : null;

    // 写入日志
    await executeQuery(
      `INSERT INTO face_verify_logs
         (user_id, lesson_id, course_id, similarity, result, snapshot_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, lessonId, courseId, similarity.toFixed(4), result, effectiveSnapshotUrl]
    );

    const messages: Record<string, string> = {
      pass: '身份核验通过',
      warning: '身份核验异常，请保持正常学习姿态',
      fail: '身份核验失败，请配合验证'
    };

    return {
      success: result === 'pass',
      result,
      similarity: parseFloat(similarity.toFixed(4)),
      message: messages[result]
    };
  } catch (error) {
    logger.error('人脸核验失败', error);
    return { success: false, result: 'fail', message: '核验服务暂时不可用' };
  }
}

/**
 * 查询用户是否已注册人脸
 */
export async function hasFaceRegistered(userId: number): Promise<boolean> {
  const rows = await executeQuery<{ cnt: number }[]>(
    'SELECT COUNT(*) as cnt FROM face_features WHERE user_id = ?',
    [userId]
  );
  return rows[0]?.cnt > 0;
}
