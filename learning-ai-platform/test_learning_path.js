const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:4001/api'; // 注意：服务器在4001端口运行，且API有/api前缀

// 测试生成学习路径功能
async function testGenerateLearningPath() {
  console.log('=== 测试AI生成学习路径功能 ===');
  
  try {
    // 测试新的无需认证的接口
    console.log('1. 测试POST /ai/test/generate-learning-path接口:');
    const response = await axios.post(`${BASE_URL}/ai/test/generate-learning-path`, {
      goal: '学习C语言编程',
      daysNum: 7
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
    
    // 验证模块内容
    if (learningPlan.modules && learningPlan.modules.length > 0) {
      console.log('\n3. 查看第一天学习内容:');
      const firstDay = learningPlan.modules[0];
      console.log(`第${firstDay.day}天: ${firstDay.moduleName}`);
      console.log(`学习主题: ${firstDay.topics.join(', ')}`);
      if (firstDay.detailedContent) {
        console.log(`详细内容: ${firstDay.detailedContent.substring(0, 100)}...`);
      }
      
      // 查看最后一天学习内容
      console.log('\n4. 查看最后一天学习内容:');
      const lastDay = learningPlan.modules[learningPlan.modules.length - 1];
      console.log(`第${lastDay.day}天: ${lastDay.moduleName}`);
      console.log(`学习主题: ${lastDay.topics.join(', ')}`);
    }
    
    console.log('\n=== 学习路径生成功能测试完成 ===');
    return { 
      success: true, 
      message: 'AI学习路径生成功能测试通过',
      result: learningPlan
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error.response?.data || '无详细信息');
    console.log('\n=== 学习路径生成功能测试失败 ===');
    return { 
      success: false, 
      message: 'AI学习路径生成功能测试失败',
      error: error.message
    };
  }
}

// 运行测试
testGenerateLearningPath().then(result => {
  process.exit(result.success ? 0 : 1);
});