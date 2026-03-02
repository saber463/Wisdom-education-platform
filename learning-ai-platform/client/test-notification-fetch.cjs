const axios = require('axios');
const fs = require('fs');

// 从配置文件中读取基础URL
const config = require('./src/config/index.js').default;

console.log('API Base URL:', config.api.baseUrl);
console.log('Storage Prefix:', config.storagePrefix);

// 手动设置一个测试token（你需要替换为有效的token）
const TEST_TOKEN = 'your-valid-jwt-token-here'; // 请替换为实际的有效token

// 或者如果你在Node.js环境中能访问模拟的localStorage，可以从配置构造键名
const TOKEN_KEY = `${config.storagePrefix}token`;
console.log('Expected token key in localStorage:', TOKEN_KEY);

// 如果你想从文件中读取token，可以取消下面的注释并提供正确的文件路径
// const tokenFilePath = './path/to/token-file.txt';
// const TEST_TOKEN = fs.readFileSync(tokenFilePath, 'utf8').trim();

if (!TEST_TOKEN || TEST_TOKEN === 'your-valid-jwt-token-here') {
  console.log('请设置有效的认证token');
  console.log('你可以:');
  console.log('1. 在浏览器中登录后，打开开发者工具，在Console中运行:');
  console.log('   localStorage.getItem("learning_ai_token")');
  console.log('2. 将获得的token值替换上面代码中的TEST_TOKEN变量');
  process.exit(1);
}

// 创建axios实例
const api = axios.create({
  baseURL: config.api.baseUrl,
});

// 添加请求拦截器
api.interceptors.request.use(
  axiosConfig => {
    if (TEST_TOKEN) {
      axiosConfig.headers.Authorization = `Bearer ${TEST_TOKEN}`;
    }
    return axiosConfig;
  },
  error => Promise.reject(error)
);

// 测试获取通知列表
async function testFetchNotifications() {
  try {
    console.log('\n=== 测试获取通知列表 ===');
    const response = await api.get('/notifications');
    console.log('状态码:', response.status);
    console.log('响应数据结构:');
    console.log('  - 数据类型:', typeof response.data);
    console.log('  - 是否有notifications字段:', 'notifications' in response.data);
    console.log('  - 是否有unreadCount字段:', 'unreadCount' in response.data);

    if (response.data.notifications) {
      console.log('  - 通知数量:', response.data.notifications.length);
      if (response.data.notifications.length > 0) {
        console.log('  - 第一条通知示例:');
        console.log('    ', JSON.stringify(response.data.notifications[0], null, 2));
      }
    }

    if (response.data.unreadCount !== undefined) {
      console.log('  - 未读数量:', response.data.unreadCount);
    }

    return response.data;
  } catch (error) {
    console.error('获取通知列表失败:');
    if (error.response) {
      console.error('  - 状态码:', error.response.status);
      console.error('  - 响应数据:', error.response.data);
      console.error('  - 响应头:', error.response.headers);
    } else if (error.request) {
      console.error('  - 请求信息:', error.request);
    } else {
      console.error('  - 错误信息:', error.message);
    }
    return null;
  }
}

// 测试获取未读数量
async function testFetchUnreadCount() {
  try {
    console.log('\n=== 测试获取未读数量 ===');
    const response = await api.get('/notifications/unread-count');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    console.log('  - 是否有unreadCount字段:', 'unreadCount' in response.data);
    if (response.data.unreadCount !== undefined) {
      console.log('  - 未读数量:', response.data.unreadCount);
    }
    return response.data;
  } catch (error) {
    console.error('获取未读数量失败:');
    if (error.response) {
      console.error('  - 状态码:', error.response.status);
      console.error('  - 响应数据:', error.response.data);
    } else if (error.request) {
      console.error('  - 请求信息:', error.request);
    } else {
      console.error('  - 错误信息:', error.message);
    }
    return null;
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试通知API...');

  // 测试获取通知列表
  await testFetchNotifications();

  // 测试获取未读数量
  await testFetchUnreadCount();

  console.log('\n测试完成');
}

runTests();
