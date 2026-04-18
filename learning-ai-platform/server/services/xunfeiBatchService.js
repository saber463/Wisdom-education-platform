/**
 * 讯飞星火批处理API服务
 * 费用仅为实时调用的30%
 * 文档: https://spark-api-open.xf-yun.com/v1/files
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// 批处理API配置
const BATCH_CONFIG = {
  baseURL: 'https://spark-api-open.xf-yun.com',
  apiPassword: 'BLxtuxOPqePwFbUcXdKy:dKJVMwHikqHhRvUVrpgD',
  appId: '557bb679',
  // 支持的模型
  models: {
    spark4Ultra: '4.0Ultra', // Spark 4.0 Ultra
    sparkX1: 'spark-x', // Spark X1 (深度推理)
    generalV35: 'generalv3.5', // Spark Max
  },
};

/**
 * 上传jsonl文件到批处理服务
 * @param {string} filePath - jsonl文件路径
 * @returns {Promise<object>} - {id, object, bytes, created_at, filename}
 */
export async function uploadBatchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const form = new FormData();
  form.append('purpose', 'batch');
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post(`${BATCH_CONFIG.baseURL}/v1/files`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${BATCH_CONFIG.apiPassword}`,
    },
    timeout: 60000,
  });

  console.log('[Batch] 文件上传成功:', response.data.id);
  return response.data;
}

/**
 * 查询文件列表
 * @param {number} page - 页码(默认1)
 * @param {number} size - 每页数量(默认20)
 */
export async function listFiles(page = 1, size = 20) {
  const response = await axios.get(`${BATCH_CONFIG.baseURL}/v1/files?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });
  return response.data;
}

/**
 * 查询单个文件信息
 * @param {string} fileId - file_xxxx格式
 */
export async function getFileInfo(fileId) {
  const response = await axios.get(`${BATCH_CONFIG.baseURL}/v1/files/${fileId}`, {
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });
  return response.data;
}

/**
 * 删除文件
 * @param {string} fileId
 */
export async function deleteFile(fileId) {
  const response = await axios.delete(`${BATCH_CONFIG.baseURL}/v1/files/${fileId}`, {
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });
  return response.data;
}

/**
 * 下载文件内容（结果/错误）
 * @param {string} fileId - output_file_id 或 error_file_id
 */
export async function downloadFileContent(fileId) {
  const response = await axios.get(`${BATCH_CONFIG.baseURL}/v1/files/${fileId}/content`, {
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });

  // 解析JSONL内容，每行一个JSON对象
  const lines = response.data.split('\n').filter(line => line.trim());
  return lines.map(line => JSON.parse(line));
}

/**
 * 创建Batch任务
 * @param {string} inputFileId - 上传文件返回的file_id
 * @param {object} options - 可选配置
 */
export async function createBatchTask(inputFileId, options = {}) {
  const body = {
    input_file_id: inputFileId,
    endpoint: '/v1/chat/completions', // 当前仅支持此路径
    completion_window: options.completionWindow || '24h',
    metadata: options.metadata || {},
  };

  const response = await axios.post(`${BATCH_CONFIG.baseURL}/v1/batches`, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BATCH_CONFIG.apiPassword}`,
    },
  });

  console.log('[Batch] 任务创建成功:', response.data.id);
  return response.data;
}

/**
 * 查询Batch任务状态
 * @param {string} batchId - batch_xxxx格式
 */
export async function getBatchStatus(batchId) {
  const response = await axios.get(`${BATCH_CONFIG.baseURL}/v1/batches/${batchId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BATCH_CONFIG.apiPassword}`,
    },
  });
  return response.data;
}

/**
 * 取消Batch任务
 * @param {string} batchId
 */
export async function cancelBatchTask(batchId) {
  const response = await axios.post(`${BATCH_CONFIG.baseURL}/v1/batches/${batchId}/cancel`, null, {
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });
  return response.data;
}

/**
 * 查询Batch任务列表
 */
export async function listBatches(limit = 10, after = null) {
  let url = `/v1/batches?limit=${limit}`;
  if (after) url += `&after=${after}`;

  const response = await axios.get(url, {
    baseURL: BATCH_CONFIG.baseURL,
    headers: { Authorization: `Bearer ${BATCH_CONFIG.apiPassword}` },
  });
  return response.data;
}

// ==================== 高级工具函数 ====================

/**
 * 构建JSONL请求行
 * @param {string} customId - 唯一ID
 * @param {object} messages - [{role, content}]
 * @param {string} model - 模型名
 * @returns {string} - JSONL行
 */
function buildJsonlLine(customId, messages, model = 'generalv3.5') {
  return JSON.stringify({
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model,
      messages,
      max_tokens: 2000,
    },
  });
}

/**
 * 从数组生成JSONL文件
 * @param {Array<{id, messages}>} tasks - 任务列表
 * @param {string} outputPath - 输出路径
 * @param {string} model - 默认模型
 */
export async function generateJsonlFile(tasks, outputPath, model = 'generalv3.5') {
  const lines = tasks.map(task => buildJsonlLine(task.custom_id || task.id, task.messages, model));

  // 写入文件
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');

  console.log(`[Batch] JSONL已生成: ${outputPath}, 共${lines.length}条`);
  return outputPath;
}

/**
 * 一站式执行批处理：生成JSONL → 上传 → 创建任务 → 轮询等待 → 下载结果
 * @param {Array<{id, messages}>} tasks - 任务列表
 * @param {object} options - 配置选项
 * @returns {Promise<Array>} - 结果列表
 */
export async function executeBatch(tasks, options = {}) {
  const {
    model = 'generalv3.5',
    onStatusChange = null,
    pollInterval = 30000, // 30秒轮询一次
    maxWaitTime = 86400000, // 最长等待24小时
  } = options;

  if (!tasks || tasks.length === 0) {
    throw new Error('任务列表不能为空');
  }

  if (tasks.length > 50000) {
    throw new Error('单次批处理最多支持50000个任务');
  }

  console.log(`\n[Batch] ========== 开始批处理 ==========`);
  console.log(`[Batch] 任务数: ${tasks.length}`);
  console.log(`[Batch] 模型: ${model}`);

  // Step 1: 生成JSONL文件
  const tempPath = `./temp_batch_${Date.now()}.jsonl`;
  generateJsonlFile(tasks, tempPath, model);

  // Step 2: 上传文件
  onStatusChange?.({ step: 'uploading', message: '正在上传文件...' });
  const fileInfo = await uploadBatchFile(tempPath);

  // 清理临时文件
  try {
    fs.unlinkSync(tempPath);
  } catch (e) {}

  // Step 3: 创建批处理任务
  onStatusChange?.({ step: 'creating', message: '正在创建批处理任务...' });
  const batchInfo = await createBatchTask(fileInfo.id, {
    metadata: {
      task_count: tasks.length.toString(),
      model,
      created_at: new Date().toISOString(),
    },
  });

  const batchId = batchInfo.id;
  console.log(`[Batch] 任务ID: ${batchId}`);
  console.log(`[Batch] 状态: ${batchInfo.status}`);

  // Step 4: 轮询等待完成
  onStatusChange?.({ step: 'processing', message: '正在处理中...', progress: 0 });

  const startTime = Date.now();
  let currentStatus = batchInfo;
  let lastProgress = 0;

  while (
    currentStatus.status !== 'completed' &&
    currentStatus.status !== 'failed' &&
    currentStatus.status !== 'expired' &&
    currentStatus.status !== 'cancelled'
  ) {
    // 检查超时
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('批处理超时');
    }

    // 等待后轮询
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    currentStatus = await getBatchStatus(batchId);

    // 计算进度
    let progress = 0;
    if (currentStatus.request_counts) {
      const counts = currentStatus.request_counts;
      progress = Math.round(((counts.completed + counts.failed) / counts.total) * 100);
    }

    // 只在进度变化时通知
    if (progress !== lastProgress || lastProgress === 0) {
      lastProgress = progress;

      const statusMap = {
        queuing: '排队中',
        in_progress: '处理中',
        finalizing: '生成结果中',
      };

      console.log(`[Batch] 进度: ${progress}% (${statusMap[currentStatus.status]})`);
      onStatusChange?.({
        step: 'processing',
        message: statusMap[currentStatus.status],
        progress,
        completed: currentStatus.request_counts?.completed,
        failed: currentStatus.request_counts?.failed,
        total: currentStatus.request_counts?.total,
      });
    }
  }

  // Step 5: 下载结果
  if (currentStatus.status === 'completed' && currentStatus.output_file_id) {
    onStatusChange?.({ step: 'downloading', message: '正在下载结果...' });

    const results = await downloadFileContent(currentStatus.output_file_id);
    console.log(`[Batch] ✅ 完成! 获得 ${results.length} 条结果`);

    // 如果有错误也获取
    let errors = [];
    if (currentStatus.error_file_id) {
      try {
        errors = await downloadFileContent(currentStatus.error_file_id);
      } catch (e) {}
    }

    return {
      success: true,
      batchId,
      results,
      errors,
      stats: currentStatus.request_counts,
    };
  } else {
    throw new Error(`批处理失败: ${currentStatus.status}`);
  }
}

// 导出配置供其他模块使用
export { BATCH_CONFIG };

export default {
  uploadBatchFile,
  listFiles,
  getFileInfo,
  deleteFile,
  downloadFileContent,
  createBatchTask,
  getBatchStatus,
  cancelBatchTask,
  listBatches,
  generateJsonlFile,
  executeBatch,
};
