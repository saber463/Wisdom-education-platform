/**
 * 测试路径调整日志API
 * 
 * 此脚本演示如何使用路径调整日志API
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your-jwt-token-here'; // 需要替换为实际的JWT token

interface AdjustmentLog {
  id: string;
  learning_path_id: number;
  adjustment_type: string;
  trigger_event: string;
  adjustment_details: Array<{
    knowledge_point_id: number;
    knowledge_point_name: string;
    old_mastery_level: string;
    new_mastery_level: string;
    action: string;
    reason: string;
  }>;
  learning_ability_tag: string;
  evaluation_score: number;
  adjustment_summary: string;
  created_at: string;
}

interface AdjustmentLogResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    logs: AdjustmentLog[];
  };
}

async function testAdjustmentLogAPI() {
  console.log('=== 测试路径调整日志API ===\n');

  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // 测试1: 获取所有调整日志
    console.log('测试1: 获取所有调整日志');
    const response1 = await axios.get<AdjustmentLogResponse>(
      `${API_BASE_URL}/api/ai-learning-path/adjustment-log`,
      { headers }
    );
    console.log(`✓ 成功获取 ${response1.data.data.total} 条调整日志`);
    if (response1.data.data.logs.length > 0) {
      const firstLog = response1.data.data.logs[0];
      console.log(`  最新调整: ${firstLog.adjustment_summary}`);
      console.log(`  调整时间: ${firstLog.created_at}`);
      console.log(`  能力标签: ${firstLog.learning_ability_tag}`);
      console.log(`  评估得分: ${firstLog.evaluation_score}`);
    }
    console.log();

    // 测试2: 按学习路径筛选
    console.log('测试2: 按学习路径筛选 (learning_path_id=1)');
    const response2 = await axios.get<AdjustmentLogResponse>(
      `${API_BASE_URL}/api/ai-learning-path/adjustment-log?learning_path_id=1`,
      { headers }
    );
    console.log(`✓ 成功获取路径1的 ${response2.data.data.total} 条调整日志`);
    console.log();

    // 测试3: 按调整类型筛选
    console.log('测试3: 按调整类型筛选 (adjustment_type=knowledge_evaluation)');
    const response3 = await axios.get<AdjustmentLogResponse>(
      `${API_BASE_URL}/api/ai-learning-path/adjustment-log?adjustment_type=knowledge_evaluation`,
      { headers }
    );
    console.log(`✓ 成功获取知识点评估类型的 ${response3.data.data.total} 条调整日志`);
    console.log();

    // 测试4: 自定义返回数量
    console.log('测试4: 自定义返回数量 (limit=5)');
    const response4 = await axios.get<AdjustmentLogResponse>(
      `${API_BASE_URL}/api/ai-learning-path/adjustment-log?limit=5`,
      { headers }
    );
    console.log(`✓ 成功获取最近 ${response4.data.data.logs.length} 条调整日志`);
    console.log();

    // 测试5: 组合筛选
    console.log('测试5: 组合筛选 (learning_path_id=1&adjustment_type=knowledge_evaluation&limit=10)');
    const response5 = await axios.get<AdjustmentLogResponse>(
      `${API_BASE_URL}/api/ai-learning-path/adjustment-log?learning_path_id=1&adjustment_type=knowledge_evaluation&limit=10`,
      { headers }
    );
    console.log(`✓ 成功获取符合条件的 ${response5.data.data.logs.length} 条调整日志`);
    console.log();

    // 显示详细的调整信息
    if (response1.data.data.logs.length > 0) {
      console.log('=== 最新调整详情 ===');
      const latestLog = response1.data.data.logs[0];
      console.log(`调整ID: ${latestLog.id}`);
      console.log(`学习路径ID: ${latestLog.learning_path_id}`);
      console.log(`调整类型: ${latestLog.adjustment_type}`);
      console.log(`触发事件: ${latestLog.trigger_event}`);
      console.log(`学习能力: ${latestLog.learning_ability_tag}`);
      console.log(`评估得分: ${latestLog.evaluation_score}`);
      console.log(`调整说明: ${latestLog.adjustment_summary}`);
      console.log(`\n调整详情:`);
      latestLog.adjustment_details.forEach((detail, index) => {
        console.log(`  ${index + 1}. 知识点: ${detail.knowledge_point_name}`);
        console.log(`     掌握度变化: ${detail.old_mastery_level} → ${detail.new_mastery_level}`);
        console.log(`     采取行动: ${detail.action}`);
        console.log(`     原因: ${detail.reason}`);
      });
      console.log();
    }

    console.log('=== 所有测试通过 ✓ ===');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ API请求失败:');
      console.error(`  状态码: ${error.response?.status}`);
      console.error(`  错误信息: ${error.response?.data?.msg || error.message}`);
      if (error.response?.status === 401) {
        console.error('\n提示: 请在脚本中设置有效的JWT token');
      }
    } else {
      console.error('✗ 未知错误:', error);
    }
  }
}

// 运行测试
testAdjustmentLogAPI().catch(console.error);

/**
 * 使用说明:
 * 
 * 1. 确保后端服务正在运行 (npm run dev)
 * 2. 替换 TEST_TOKEN 为有效的JWT token
 * 3. 运行脚本: npx ts-node scripts/test-adjustment-log-api.ts
 * 
 * 预期输出:
 * - 成功获取调整日志列表
 * - 支持各种筛选条件
 * - 显示详细的调整信息
 */
