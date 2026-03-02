const axios = require('axios');

// 服务器基础URL
const BASE_URL = 'http://localhost:4001/api';

// 测试用户信息 (修改用户名长度以符合要求)
const testUser = {
  username: 'testuser_notif', // 缩短用户名以满足20字符限制
  email: 'testuser_notification@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
};

async function registerAndLogin() {
  try {
    console.log('=== 用户注册测试 ===');

    // 1. 注册用户
    console.log('\n1. 正在注册用户...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✓ 注册成功');
    console.log('注册响应:', JSON.stringify(registerResponse.data, null, 2));

    // 2. 登录获取token
    console.log('\n2. 正在登录获取token...');
    const loginData = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✓ 登录成功');
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.token;
    console.log('\n=== 获取到的有效Token ===');
    console.log(token);
    console.log('========================');

    // 3. 使用token测试通知API
    console.log('\n3. 使用获取的token测试通知API...');
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 测试获取未读通知数量
    console.log('\n  测试获取未读通知数量...');
    const unreadResponse = await api.get('/notifications/unread-count');
    console.log('  ✓ 获取未读通知数量成功');
    console.log('  响应数据:', JSON.stringify(unreadResponse.data, null, 2));

    // 测试获取通知列表
    console.log('\n  测试获取通知列表...');
    const notificationsResponse = await api.get('/notifications');
    console.log('  ✓ 获取通知列表成功');
    console.log('  响应数据:', JSON.stringify(notificationsResponse.data, null, 2));

    console.log('\n✅ 所有测试通过！');
    console.log('\n📋 测试摘要:');
    console.log(`  - 用户注册: 成功`);
    console.log(`  - 用户登录: 成功`);
    console.log(`  - 获取Token: 成功`);
    console.log(`  - 未读通知数量: ${unreadResponse.data.unreadCount}`);
    console.log(`  - 通知列表项数: ${notificationsResponse.data.notifications.length}`);

    return token;
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('  状态码:', error.response.status);
      console.error('  错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('  错误详情:', error.message);
    }

    // 如果是注册失败，可能是用户已存在，直接尝试登录
    if (error.response && error.response.status === 400) {
      console.log('\n⚠️  注册失败，尝试直接登录...');
      try {
        const loginData = {
          email: testUser.email,
          password: testUser.password,
        };

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✓ 登录成功');
        const token = loginResponse.data.token;
        console.log('\n=== 获取到的有效Token ===');
        console.log(token);
        console.log('========================');
        return token;
      } catch (loginError) {
        console.error('❌ 登录也失败了:');
        if (loginError.response) {
          console.error('  状态码:', loginError.response.status);
          console.error('  错误信息:', JSON.stringify(loginError.response.data, null, 2));
        } else {
          console.error('  错误详情:', loginError.message);
        }
      }
    }

    process.exit(1);
  }
}

// 运行测试
registerAndLogin()
  .then(token => {
    console.log('\n🎉 测试完成，获取到有效token');
  })
  .catch(err => {
    console.error('❌ 测试过程中发生错误:', err.message);
    process.exit(1);
  });
