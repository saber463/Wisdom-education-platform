const axios = require('axios');

// 配置信息
const CONFIG = {
  BASE_URL: 'http://localhost:4001/api',
  STORAGE_PREFIX: 'learning_ai_',
};

console.log('=== 通知API测试脚本 ===');
console.log('Base URL:', CONFIG.BASE_URL);
console.log('Storage Prefix:', CONFIG.STORAGE_PREFIX);

// 手动设置一个测试token（你需要替换为有效的token）
const TEST_TOKEN = 'your-valid-jwt-token-here'; // 请替换为实际的有效token

if (!TEST_TOKEN || TEST_TOKEN === 'your-valid-jwt-token-here') {
  console.log('\n请设置有效的认证token');
  console.log('获取token的方法：');
  console.log('1. 在浏览器中登录系统');
  console.log('2. 打开开发者工具(F12)');
  console.log('3. 切换到Console标签');
  console.log('4. 运行以下代码获取token:');
  console.log(`   localStorage.getItem('${CONFIG.STORAGE_PREFIX}token')`);
  console.log('5. 将获得的token值替换此脚本中的TEST_TOKEN变量');
  process.exit(1);
}

// 创建axios实例
const api = axios.create({
  baseURL: CONFIG.BASE_URL,
});

// 添加请求拦截器
api.interceptors.request.use(
  config => {
    if (TEST_TOKEN) {
      config.headers.Authorization = `Bearer ${TEST_TOKEN}`;
    }
    console.log('\n--- 发送请求 ---');
    console.log('Method:', config.method?.toUpperCase());
    console.log('URL:', config.baseURL + config.url);
    console.log('Headers:', JSON.stringify(config.headers, null, 2));
    return config;
  },
  error => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.interceptors.response.use(
  response => {
    console.log('\n--- 收到响应 ---');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    return response;
  },
  error => {
    console.log('\n--- 请求失败 ---');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('请求发送失败:', error.message);
    } else {
      console.log('错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 测试获取通知列表
async function testFetchNotifications() {
  try {
    console.log('\n=== 测试获取通知列表 ===');
    const response = await api.get('/notifications');

    console.log('\n--- 响应数据结构分析 ---');
    console.log('数据类型:', typeof response.data);

    // 检查数据结构
    const keys = Object.keys(response.data || {});
    console.log('顶层键:', keys);

    // 检查notifications字段
    if ('notifications' in response.data) {
      console.log('✓ 包含notifications字段');
      console.log(
        '  类型:',
        Array.isArray(response.data.notifications) ? '数组' : typeof response.data.notifications
      );
      if (Array.isArray(response.data.notifications)) {
        console.log('  数量:', response.data.notifications.length);
        if (response.data.notifications.length > 0) {
          console.log('  第一条通知示例:');
          console.log('   ', JSON.stringify(response.data.notifications[0], null, 2));
        }
      }
    } else {
      console.log('✗ 缺少notifications字段');
      console.log('完整响应数据:', JSON.stringify(response.data, null, 2));
    }

    // 检查unreadCount字段
    if ('unreadCount' in response.data) {
      console.log('✓ 包含unreadCount字段');
      console.log('  值:', response.data.unreadCount);
      console.log('  类型:', typeof response.data.unreadCount);
    } else {
      console.log('✗ 缺少unreadCount字段');
    }

    return response.data;
  } catch (error) {
    console.error('获取通知列表失败:', error.message);
    return null;
  }
}

// 测试获取未读数量
async function testFetchUnreadCount() {
  try {
    console.log('\n=== 测试获取未读数量 ===');
    const response = await api.get('/notifications/unread-count');

    console.log('\n--- 响应数据结构分析 ---');
    console.log('数据类型:', typeof response.data);

    // 检查数据结构
    const keys = Object.keys(response.data || {});
    console.log('顶层键:', keys);

    // 检查unreadCount字段
    if ('unreadCount' in response.data) {
      console.log('✓ 包含unreadCount字段');
      console.log('  值:', response.data.unreadCount);
      console.log('  类型:', typeof response.data.unreadCount);
    } else {
      console.log('✗ 缺少unreadCount字段');
      console.log('完整响应数据:', JSON.stringify(response.data, null, 2));
    }

    return response.data;
  } catch (error) {
    console.error('获取未读数量失败:', error.message);
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试通知API...\n');

  // 测试获取通知列表
  const notificationsData = await testFetchNotifications();

  // 测试获取未读数量
  const unreadCountData = await testFetchUnreadCount();

  console.log('\n=== 测试总结 ===');
  if (notificationsData && unreadCountData) {
    console.log('✓ 所有测试完成');
  } else {
    console.log('✗ 部分测试失败');
  }

  console.log('\n测试完成');
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试过程中发生未预期的错误:', error);
});
