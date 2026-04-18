import express from 'express';
import { auth } from '../middleware/auth.js';
import * as batchService from '../services/xunfeiBatchService.js';

const router = express.Router();

/**
 * POST /api/ai/batch - 执行批量AI任务
 */
router.post('/', auth, async (req, res) => {
  try {
    const { tasks, model, pollInterval } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tasks参数不能为空，需要数组格式',
      });
    }

    // 限制单次请求数量
    if (tasks.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '单次请求最多1000个任务',
      });
    }

    // 验证每个任务的格式
    for (const task of tasks) {
      if (!task.messages || !Array.isArray(task.messages)) {
        return res.status(400).json({
          success: false,
          message: '每个task必须有messages字段（数组格式）',
        });
      }
    }

    // 执行批处理
    const result = await batchService.executeBatch(tasks, {
      model: model || 'generalv3.5',
      pollInterval: pollInterval || 30000,
      onStatusChange: status => {
        // SSE推送状态更新（如果客户端支持）
        if (status.step === 'completed' || status.progress % 10 === 0) {
          console.log(`[Batch] 状态: ${JSON.stringify(status)}`);
        }
      },
    });

    res.json({
      success: true,
      message: `批处理完成，共${result.results.length}条结果`,
      data: result,
    });
  } catch (error) {
    console.error('[Batch] 错误:', error.message);

    // 如果是超时或失败，返回降级方案提示
    res.status(500).json({
      success: false,
      message: error.message,
      suggestion: '建议使用实时API或本地模板方案',
    });
  }
});

/**
 * GET /api/ai/batch/status/:batchId - 查询批处理状态
 */
router.get('/status/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const status = await batchService.getBatchStatus(batchId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/batch/list - 获取批处理任务列表
 */
router.get('/list', auth, async (req, res) => {
  try {
    const { limit, after } = req.query;
    const list = await batchService.listBatches(parseInt(limit) || 10, after || null);

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/ai/batch/cancel/:batchId - 取消批处理任务
 */
router.post('/cancel/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await batchService.cancelBatchTask(batchId);

    res.json({
      success: true,
      message: '任务取消请求已发送',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/batch/files - 获取文件列表
 */
router.get('/files', auth, async (req, res) => {
  try {
    const files = await batchService.listFiles();
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
