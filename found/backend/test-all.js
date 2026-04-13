const axios = require('axios');
const jwt = require('jsonwebtoken');

// API基础URL
const API_BASE_URL = 'http://localhost:4001/api';

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// 记录测试结果
function logTest(testName, passed, message = '') {
  const result = {
    name: testName,
    passed,
    message,
    timestamp: new Date().toISOString(),
  };

  testResults.tests.push(result);

  if (passed) {
    testResults.passed++;
    console.log(`✓ ${testName}`);
    if (message) console.log(`  ${message}`);
  } else {
    testResults.failed++;
    console.log(`✗ ${testName}`);
    if (message) console.log(`  ${message}`);
  }
  console.log('');
}

// 测试服务器连接
async function testServerConnection() {
  try {
    // 健康检查路由是 /health 而不是 /api/health
    const response = await axios.get(`http://localhost:4001/health`);
    logTest('服务器连接测试', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    logTest('服务器连接测试', false, `错误: ${error.message}`);
  }
}

// 测试用户登录
async function testUserLogin(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    // 后端返回格式: { success: true, token: "...", user: {...} }
    if (response.data.success && response.data.token) {
      logTest('用户登录测试', true, `用户: ${email}`);
      return { token: response.data.token, user: response.data.user };
    } else {
      logTest('用户登录测试', false, '登录失败');
      return null;
    }
  } catch (error) {
    logTest('用户登录测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试JWT验证
async function testJWTVerification(token) {
  console.log('\n--- JWT验证测试 ---');
  try {
    const decoded = jwt.verify(token, 'learning_ai_platform_jwt_secret_key_2025');
    console.log('✓ JWT验证测试');
    console.log(`  用户ID: ${decoded.id}`);
    console.log(`  用户名: ${decoded.username}`);
    return decoded;
  } catch (error) {
    console.log('✗ JWT验证测试');
    console.log(`  错误: ${error.message}`);
    return null;
  }
}

// 测试获取用户信息
async function testGetUserInfo(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 后端返回格式: { success: true, data: user }
    if (response.data.success && response.data.data) {
      logTest('获取用户信息测试', true, `用户: ${response.data.data.username}`);
      return response.data.data;
    } else {
      logTest('获取用户信息测试', false, '获取失败');
      return null;
    }
  } catch (error) {
    logTest('获取用户信息测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试更新用户资料
async function testUpdateProfile(token, _userId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/update-profile`,
      {
        learningInterests: ['编程', '测试', '自动化'],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      logTest('更新用户资料测试', true, '兴趣已更新');
      return true;
    } else {
      logTest('更新用户资料测试', false, '更新失败');
      return false;
    }
  } catch (error) {
    logTest('更新用户资料测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试获取预设头像
async function testGetPresetAvatars(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/preset-avatars`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 后端返回格式: { success: true, data: { category: [...], ... } }
    if (response.data.success && response.data.data) {
      const categories = Object.keys(response.data.data);
      logTest('获取预设头像测试', true, `分类数量: ${categories.length}`);
      return response.data.data;
    } else {
      logTest('获取预设头像测试', false, '获取失败');
      return null;
    }
  } catch (error) {
    logTest('获取预设头像测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试获取浏览历史
async function testGetBrowseHistory(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/browse-history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 后端返回格式: { success: true, data: { list: [...], pagination: {...} } }
    if (response.data.success && response.data.data) {
      const history = response.data.data.list || [];
      logTest('获取浏览历史测试', true, `历史记录数量: ${history.length}`);
      return response.data.data;
    } else {
      logTest('获取浏览历史测试', false, '获取失败');
      return null;
    }
  } catch (error) {
    logTest('获取浏览历史测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试用户登出
async function testUserLogout(token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      logTest('用户登出测试', true, '登出成功');
      return true;
    } else {
      logTest('用户登出测试', false, '登出失败');
      return false;
    }
  } catch (error) {
    logTest('用户登出测试', false, `错误: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('========================================');
  console.log('   学习AI平台 - 功能测试');
  console.log('========================================\n');

  // 测试服务器连接
  console.log('--- 基础连接测试 ---');
  await testServerConnection();

  // 测试登录
  console.log('--- 用户登录测试 ---');
  const loginResult = await testUserLogin('test@example.com', 'Test123@');

  if (!loginResult || !loginResult.token) {
    console.log('\n✗ 登录失败，无法继续后续测试');
    printSummary();
    return;
  }

  const { token, user } = loginResult;

  // 测试JWT验证
  console.log('--- JWT验证测试 ---');
  await testJWTVerification(token);

  // 测试获取用户信息
  console.log('--- 用户信息测试 ---');
  await testGetUserInfo(token);

  // 测试更新用户资料
  console.log('--- 用户资料更新测试 ---');
  await testUpdateProfile(token, user._id);

  // 测试获取预设头像
  console.log('--- 预设头像测试 ---');
  await testGetPresetAvatars(token);

  // 测试获取浏览历史
  console.log('--- 浏览历史测试 ---');
  await testGetBrowseHistory(token);

  // 测试登出
  console.log('--- 用户登出测试 ---');
  await testUserLogout(token);

  // 打印测试摘要
  printSummary();
}

// 打印测试摘要
function printSummary() {
  console.log('\n========================================');
  console.log('   测试摘要');
  console.log('========================================');
  console.log(`总测试数: ${testResults.passed + testResults.failed}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log(
    `成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`
  );
  console.log('========================================\n');

  if (testResults.failed > 0) {
    console.log('失败的测试:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ✗ ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
    console.log('');
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
