/**
 * 离线模式路由
 * 需求：17.1-17.8 - 离线模式与本地缓存
 */

import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getPool } from '../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

/**
 * 35.1 实现缓存同步接口
 * POST /api/offline/sync - 增量同步缓存数据
 * 需求：17.5
 */
router.post('/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      cacheRecords,  // 客户端缓存记录数组
      conflictStrategy = 'server_priority'  // 冲突解决策略：server_priority | client_priority
    } = req.body;

    if (!Array.isArray(cacheRecords) || cacheRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缓存记录不能为空'
      });
    }

    const pool = await getPool();
    const syncResults = [];
    const conflicts = [];

    for (const record of cacheRecords) {
      const { data_type, data_id, cache_data, local_modified_time } = record;

      // 查询服务器端记录
      const [serverRecords] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM offline_cache_records 
         WHERE user_id = ? AND data_type = ? AND data_id = ?`,
        [userId, data_type, data_id]
      );

      let syncStatus = 'synced';
      let finalData = cache_data;

      if (serverRecords.length > 0) {
        const serverRecord = serverRecords[0];
        const serverModifiedTime = new Date(serverRecord.server_modified_time);
        const localModifiedTime = new Date(local_modified_time);

        // 检测冲突
        if (serverModifiedTime > localModifiedTime) {
          syncStatus = 'conflict';
          conflicts.push({
            data_type,
            data_id,
            server_data: serverRecord.cache_data,
            client_data: cache_data,
            server_modified_time: serverModifiedTime,
            local_modified_time: localModifiedTime
          });

          // 根据策略解决冲突
          if (conflictStrategy === 'server_priority') {
            finalData = serverRecord.cache_data;
          } else if (conflictStrategy === 'client_priority') {
            finalData = cache_data;
          }
        }

        // 更新现有记录
        await pool.query(
          `UPDATE offline_cache_records 
           SET cache_data = ?, 
               sync_status = ?, 
               last_sync_time = NOW(),
               local_modified_time = ?,
               server_modified_time = NOW(),
               access_count = access_count + 1,
               last_access_time = NOW()
           WHERE user_id = ? AND data_type = ? AND data_id = ?`,
          [JSON.stringify(finalData), syncStatus, local_modified_time, userId, data_type, data_id]
        );
      } else {
        // 插入新记录
        await pool.query(
          `INSERT INTO offline_cache_records 
           (user_id, data_type, data_id, cache_data, sync_status, 
            last_sync_time, local_modified_time, server_modified_time, 
            cache_size, access_count, last_access_time, expires_at)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))`,
          [
            userId, 
            data_type, 
            data_id, 
            JSON.stringify(cache_data), 
            syncStatus,
            local_modified_time,
            JSON.stringify(cache_data).length
          ]
        );
      }

      syncResults.push({
        data_type,
        data_id,
        sync_status: syncStatus,
        synced_data: finalData
      });
    }

    res.json({
      success: true,
      message: '缓存同步完成',
      data: {
        synced_count: syncResults.filter(r => r.sync_status === 'synced').length,
        conflict_count: conflicts.length,
        sync_results: syncResults,
        conflicts: conflicts
      }
    });

  } catch (error) {
    console.error('缓存同步失败:', error);
    res.status(500).json({
      success: false,
      message: '缓存同步失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 35.2 实现缓存数据查询接口
 * GET /api/offline/cache/:userId - 查询用户缓存记录
 * 需求：17.1
 */
router.get('/cache/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestUserId = (req as any).user.userId;
    const { data_type } = req.query;  // 可选的数据类型筛选

    // 权限检查：只能查询自己的缓存记录
    if (parseInt(userId) !== requestUserId) {
      return res.status(403).json({
        success: false,
        message: '无权访问其他用户的缓存记录'
      });
    }

    const pool = await getPool();
    let query = `
      SELECT 
        id, user_id, data_type, data_id, cache_data, 
        sync_status, last_sync_time, local_modified_time, server_modified_time,
        cache_size, access_count, last_access_time, expires_at,
        created_at, updated_at
      FROM offline_cache_records 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    // 按数据类型筛选
    if (data_type) {
      query += ' AND data_type = ?';
      params.push(data_type);
    }

    // 按最后访问时间排序
    query += ' ORDER BY last_access_time DESC';

    const [cacheRecords] = await pool.query<RowDataPacket[]>(query, params);

    // 更新访问时间
    if (cacheRecords.length > 0) {
      await pool.query(
        `UPDATE offline_cache_records 
         SET access_count = access_count + 1, last_access_time = NOW()
         WHERE user_id = ?`,
        [userId]
      );
    }

    // 统计信息
    const stats = {
      total_count: cacheRecords.length,
      total_size: cacheRecords.reduce((sum, r) => sum + (r.cache_size || 0), 0),
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>
    };

    cacheRecords.forEach(record => {
      stats.by_type[record.data_type] = (stats.by_type[record.data_type] || 0) + 1;
      stats.by_status[record.sync_status] = (stats.by_status[record.sync_status] || 0) + 1;
    });

    res.json({
      success: true,
      message: '缓存记录查询成功',
      data: {
        cache_records: cacheRecords,
        stats: stats
      }
    });

  } catch (error) {
    console.error('缓存记录查询失败:', error);
    res.status(500).json({
      success: false,
      message: '缓存记录查询失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 35.3 实现缓存清理接口
 * DELETE /api/offline/cache/cleanup - 清理过期缓存
 * 需求：17.7
 */
router.delete('/cache/cleanup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { days = 30 } = req.query;  // 默认清理30天未访问的缓存

    const pool = await getPool();
    // 查询将要删除的记录
    const [expiredRecords] = await pool.query<RowDataPacket[]>(
      `SELECT id, data_type, data_id, cache_size 
       FROM offline_cache_records 
       WHERE user_id = ? 
       AND (
         last_access_time < DATE_SUB(NOW(), INTERVAL ? DAY)
         OR expires_at < NOW()
       )`,
      [userId, days]
    );

    if (expiredRecords.length === 0) {
      return res.json({
        success: true,
        message: '没有需要清理的缓存记录',
        data: {
          deleted_count: 0,
          freed_space: 0
        }
      });
    }

    // 计算释放的空间
    const freedSpace = expiredRecords.reduce((sum, r) => sum + (r.cache_size || 0), 0);

    // 删除过期记录
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM offline_cache_records 
       WHERE user_id = ? 
       AND (
         last_access_time < DATE_SUB(NOW(), INTERVAL ? DAY)
         OR expires_at < NOW()
       )`,
      [userId, days]
    );

    res.json({
      success: true,
      message: '缓存清理完成',
      data: {
        deleted_count: result.affectedRows,
        freed_space: freedSpace,
        freed_space_mb: (freedSpace / 1024 / 1024).toFixed(2),
        deleted_records: expiredRecords.map(r => ({
          data_type: r.data_type,
          data_id: r.data_id
        }))
      }
    });

  } catch (error) {
    console.error('缓存清理失败:', error);
    res.status(500).json({
      success: false,
      message: '缓存清理失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;
