// 测试AI备用密钥机制
const dotenv = require('dotenv');
dotenv.config();

// 保存原始密钥
const originalQwenKey = process.env.QWEN_API_KEY;
const originalChatbotKey = process.env.CHATBOT_API_KEY;

// 导入AI服务
const Qwen3EmbeddingService = require('./services/qwen3EmbeddingService');
const ChatbotService = require('./services/chatbotService');

// 测试函数
async function testQwen3EmbeddingService() {
  console.log('\n=== 测试 Qwen3EmbeddingService ===');

  // 测试1：正常密钥情况下的功能
  console.log('\n1. 测试正常密钥情况...');
  try {
    const result = await Qwen3EmbeddingService.rankDocuments('什么是JavaScript？', [
      'JavaScript是一种编程语言',
      'Python是一种编程语言',
      'Java是一种编程语言',
    ]);
    console.log('✅ 正常密钥测试成功:', result.slice(0, 2));
  } catch (error) {
    console.log('⚠️  正常密钥测试失败:', error.message);
  }

  // 测试2：主密钥失效，使用备用密钥
  console.log('\n2. 测试主密钥失效，使用备用密钥...');
  try {
    // 临时设置无效的主密钥
    process.env.QWEN_API_KEY = 'invalid_key';

    const result = await Qwen3EmbeddingService.rankDocuments('什么是JavaScript？', [
      'JavaScript是一种编程语言',
      'Python是一种编程语言',
      'Java是一种编程语言',
    ]);
    console.log('✅ 备用密钥测试成功:', result.slice(0, 2));
    return true;
  } catch (error) {
    console.log('❌ 备用密钥测试失败:', error.message);
    return false;
  } finally {
    // 恢复原始密钥
    process.env.QWEN_API_KEY = originalQwenKey;
  }
}

async function testChatbotService() {
  console.log('\n=== 测试 ChatbotService ===');

  // 测试1：正常密钥情况下的功能
  console.log('\n1. 测试正常密钥情况...');
  try {
    const result = await ChatbotService.sendMessage('你好，简单介绍一下自己', []);
    console.log('✅ 正常密钥测试成功:', result.substring(0, 50) + '...');
  } catch (error) {
    console.log('⚠️  正常密钥测试失败:', error.message);
  }

  // 测试2：主密钥失效，使用备用密钥
  console.log('\n2. 测试主密钥失效，使用备用密钥...');
  try {
    // 临时设置无效的主密钥
    process.env.CHATBOT_API_KEY = 'invalid_key';

    const result = await ChatbotService.sendMessage('你好，简单介绍一下自己', []);
    console.log('✅ 备用密钥测试成功:', result.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.log('❌ 备用密钥测试失败:', error.message);
    return false;
  } finally {
    // 恢复原始密钥
    process.env.CHATBOT_API_KEY = originalChatbotKey;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试AI备用密钥机制...');

  const embeddingResult = await testQwen3EmbeddingService();
  const chatbotResult = await testChatbotService();

  console.log('\n=== 测试总结 ===');
  console.log(
    `Qwen3EmbeddingService备用密钥机制: ${embeddingResult ? '✅ 正常工作' : '❌ 不工作'}`
  );
  console.log(`ChatbotService备用密钥机制: ${chatbotResult ? '✅ 正常工作' : '❌ 不工作'}`);

  if (embeddingResult && chatbotResult) {
    console.log('\n🎉 所有测试通过！AI备用密钥机制正常工作。');
    process.exit(0);
  } else {
    console.log('\n❌ 测试失败！AI备用密钥机制存在问题。');
    process.exit(1);
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
