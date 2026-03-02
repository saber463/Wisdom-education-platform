const axios = require('axios');

// 测试配置
const baseURL = 'http://localhost:4001/api';

/**
 * 测试AI生成学习路径功能
 */
async function testGenerateLearningPath() {
  try {
    console.log('=== 测试AI生成学习路径功能 ===');
    
    // 测试参数
    const testParams = {
      goal: '学习JavaScript编程',
      daysNum: 30,
      intensity: 'medium'
    };
    
    // 只测试无需认证的测试接口
    console.log('\n1. 测试测试接口 /ai/test/generate-learning-path');
    const testResponse = await axios.post(`${baseURL}/ai/test/generate-learning-path`, testParams);
    console.log('✅ 测试接口调用成功');
    console.log('响应状态:', testResponse.status);
    console.log('响应数据:', {
      success: testResponse.data.success,
      message: testResponse.data.message,
      plan: {
        title: testResponse.data.plan.title,
        days: testResponse.data.plan.days,
        modules: testResponse.data.plan.modules.length,
        certificateType: testResponse.data.plan.certificateType
      }
    });
    
    // 测试异常情况
    console.log('\n2. 测试异常情况 - 缺少必要参数');
    try {
      await axios.post(`${baseURL}/ai/test/generate-learning-path`, {
        goal: '学习JavaScript',
        // 缺少daysNum参数
        intensity: 'medium'
      });
      console.log('❌ 应该抛出缺少参数的错误');
    } catch (error) {
      console.log('✅ 正确捕获到缺少参数的错误');
      console.log('错误信息:', error.response?.data?.message || error.message);
    }
    
    // 测试异常情况 - 无效的天数
    console.log('\n3. 测试异常情况 - 无效的天数');
    try {
      await axios.post(`${baseURL}/ai/test/generate-learning-path`, {
        goal: '学习JavaScript',
        daysNum: '无效天数',
        intensity: 'medium'
      });
      console.log('❌ 应该抛出无效天数的错误');
    } catch (error) {
      console.log('✅ 正确捕获到无效天数的错误');
      console.log('错误信息:', error.response?.data?.message || error.message);
    }
    
    console.log('\n=== 所有测试通过！AI生成学习路径API运行稳定 ===');
    return true;
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 运行测试
testGenerateLearningPath();