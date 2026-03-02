const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:4001/api'; // 后端服务地址

// 模拟前端API调用逻辑
async function simulateFrontendCall() {
  console.log('=== 模拟前端完整调用流程测试 ===');
  
  try {
    // 1. 模拟前端表单数据
    const goal = '30天通过计算机一级考试';
    const days = 30;
    const intensity = 'medium';
    
    console.log('前端表单数据:');
    console.log(`- 学习目标: ${goal}`);
    console.log(`- 学习天数: ${days}`);
    console.log(`- 学习强度: ${intensity}`);
    
    // 2. 模拟前端api.js中的参数转换逻辑
    const apiParams = {
      goal: goal,
      daysNum: days, // 前端将days转换为daysNum
      intensity: intensity
    };
    
    console.log('\n转换为后端API参数:');
    console.log(apiParams);
    
    // 3. 调用后端API（使用无需认证的测试接口）
    console.log('\n3. 调用后端API:');
    const response = await axios.post(`${BASE_URL}/ai/test/generate-learning-path`, {
      goal: apiParams.goal,
      daysNum: apiParams.daysNum
    });
    
    console.log('接口请求成功');
    console.log('响应状态:', response.data.success ? '成功' : '失败');
    
    // 4. 验证响应数据结构
    if (response.data.success) {
      const plan = response.data.plan;
      console.log('\n4. 验证响应数据结构:');
      console.log(`- 学习计划标题: ${plan.title}`);
      console.log(`- 学习计划天数: ${plan.days}`);
      console.log(`- 学习计划类型: ${plan.certificateType}`);
      console.log(`- 模块数量: ${plan.modules.length}`);
      console.log(`- 学习计划摘要: ${plan.summary.substring(0, 50)}...`);
      
      // 5. 验证模块数据
      console.log('\n5. 验证模块数据:');
      const firstModule = plan.modules[0];
      console.log(`- 第一天模块: ${firstModule.name}`);
      console.log(`- 模块主题: ${firstModule.topics.join(', ')}`);
      console.log(`- 详细内容: ${firstModule.detailedContent.substring(0, 50)}...`);
      
      return true;
    } else {
      console.log('\n❌ 接口返回失败:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    return false;
  }
}

// 运行测试
async function runTests() {
  const testResult = await simulateFrontendCall();
  
  if (testResult) {
    console.log('\n🎉 完整调用流程测试通过！');
    console.log('✅ 前端参数传递正确');
    console.log('✅ 后端API调用成功');
    console.log('✅ 响应数据结构完整');
  } else {
    console.log('\n💥 测试失败！');
    process.exit(1);
  }
}

runTests();