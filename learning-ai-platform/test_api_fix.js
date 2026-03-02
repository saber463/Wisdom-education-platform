const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:4001/api'; // 后端服务地址

// 测试生成学习路径功能
async function testGenerateLearningPath() {
  console.log('=== 测试AI生成学习路径功能 ===');
  
  try {
    // 使用无需认证的测试接口
    console.log('1. 测试POST /ai/test/generate-learning-path接口:');
    const response = await axios.post(`${BASE_URL}/ai/test/generate-learning-path`, {
      goal: '30天通过计算机一级考试',
      daysNum: 30,
      intensity: 'medium'
    });
    
    console.log('接口请求成功');
    console.log('响应状态:', response.data.success ? '成功' : '失败');
    console.log('生成的学习计划天数:', response.data.plan?.days || 'N/A');
    console.log('学习计划类型:', response.data.plan?.certificateType || 'N/A');
    console.log('模块数量:', response.data.plan?.modules?.length || 'N/A');
    
    // 验证学习计划的基本结构
    console.log('\n2. 验证学习计划结构:');
    const learningPlan = response.data.plan;
    const requiredFields = ['title', 'days', 'certificateType', 'modules', 'summary'];
    let allFieldsPresent = true;
    
    requiredFields.forEach(field => {
      if (!learningPlan.hasOwnProperty(field)) {
        console.log(`❌ 缺少必要字段: ${field}`);
        allFieldsPresent = false;
      } else {
        console.log(`✅ 包含字段: ${field}`);
      }
    });
    
    if (allFieldsPresent) {
      console.log('\n✅ 学习计划结构完整');
    } else {
      console.log('\n❌ 学习计划结构不完整');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    return false;
  }
}

// 运行测试
async function runTests() {
  const testResult = await testGenerateLearningPath();
  
  if (testResult) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n💥 测试失败！');
    process.exit(1);
  }
}

runTests();