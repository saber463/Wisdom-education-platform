const fs = require('fs');
const path = require('path');

// 读取配置文件
let config = {};
try {
  const configPath = path.resolve(__dirname, 'src/config/index.js');
  // 注意：这里我们需要特殊处理ES模块导入
  console.log('=== 自动通知API测试脚本 ===');

  // 默认配置
  const defaultConfig = {
    baseUrl: 'http://localhost:4001/api',
    storagePrefix: 'learning_ai_',
  };

  console.log('Base URL:', defaultConfig.baseUrl);
  console.log('Storage Prefix:', defaultConfig.storagePrefix);

  // 尝试从环境变量获取token
  let token = process.env.LEARNING_AI_TOKEN;

  if (!token) {
    console.log('\n⚠️  未找到环境变量LEARNING_AI_TOKEN');
    console.log('\n请按以下步骤操作：');
    console.log('1. 在浏览器中登录系统');
    console.log('2. 打开开发者工具(F12)');
    console.log('3. 切换到Console标签');
    console.log('4. 运行以下代码获取token:');
    console.log("   localStorage.getItem('learning_ai_token')");
    console.log('5. 设置环境变量:');
    console.log('   Windows: set LEARNING_AI_TOKEN=your_token_here');
    console.log('   Mac/Linux: export LEARNING_AI_TOKEN=your_token_here');
    console.log('\n或者直接运行HTML工具获取token:');
    console.log('   http://localhost:63079/get-token.html');

    process.exit(1);
  }

  console.log('\n✓ 成功获取Token');

  // 动态导入axios
  import('axios')
    .then(({ default: axios }) => {
      // 创建axios实例
      const apiClient = axios.create({
        baseURL: defaultConfig.baseUrl,
        timeout: 10000,
      });

      // 添加请求拦截器
      apiClient.interceptors.request.use(
        config => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        },
        error => {
          return Promise.reject(error);
        }
      );

      // 添加响应拦截器
      apiClient.interceptors.response.use(
        response => response,
        error => {
          if (error.response) {
            console.error('❌ API错误响应:');
            console.error('  状态码:', error.response.status);
            console.error('  数据:', error.response.data);
          } else if (error.request) {
            console.error('❌ 网络错误:', error.message);
          } else {
            console.error('❌ 请求配置错误:', error.message);
          }
          return Promise.reject(error);
        }
      );

      // 测试函数
      async function testNotificationAPI() {
        try {
          console.log('\n=== 开始测试通知API ===');

          // 1. 获取未读通知数量
          console.log('\n1. 测试获取未读通知数量...');
          const unreadResponse = await apiClient.get('/notifications/unread-count');
          console.log('✓ 成功获取未读通知数量');
          console.log('  响应数据:', JSON.stringify(unreadResponse.data, null, 2));

          // 验证响应结构
          if (typeof unreadResponse.data !== 'object') {
            throw new Error('未读通知数量响应格式错误');
          }

          // 2. 获取通知列表
          console.log('\n2. 测试获取通知列表...');
          const listResponse = await apiClient.get('/notifications');
          console.log('✓ 成功获取通知列表');
          console.log('  通知总数:', listResponse.data.notifications?.length || 0);
          console.log('  响应数据:', JSON.stringify(listResponse.data, null, 2));

          // 验证响应结构
          if (!Array.isArray(listResponse.data.notifications)) {
            throw new Error('通知列表响应格式错误');
          }

          console.log('\n✅ 所有测试通过！');
          console.log('\n📋 测试摘要:');
          console.log(`  - 未读通知数量: ${unreadResponse.data.count}`);
          console.log(`  - 通知列表项数: ${listResponse.data.notifications.length}`);
        } catch (error) {
          console.error('\n❌ 测试失败:');
          if (error.response) {
            console.error('  状态码:', error.response.status);
            console.error('  错误信息:', error.response.data);
          } else {
            console.error('  错误详情:', error.message);
          }
          process.exit(1);
        }
      }

      // 运行测试
      testNotificationAPI();
    })
    .catch(err => {
      console.error('❌ 导入axios失败:', err.message);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ 配置加载失败:', error.message);
  process.exit(1);
}
