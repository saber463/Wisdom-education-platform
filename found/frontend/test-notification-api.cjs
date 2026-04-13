const axios = require('axios');
const fs = require('fs');

// 由于在Node.js环境中无法访问浏览器的localStorage，
// 我们需要手动提供一个有效的token来进行测试

// 请将下面的TOKEN替换为实际的有效token
const TOKEN = 'YOUR_VALID_TOKEN_HERE'; // 替换为实际的token

// API基础URL
const BASE_URL = 'http://localhost:4001/api';

async function testNotificationAPI() {
  if (!TOKEN || TOKEN === 'YOUR_VALID_TOKEN_HERE') {
    console.log('请提供有效的认证token');
    console.log('您可以通过以下方式获取token：');
    console.log('1. 登录系统后，在浏览器开发者工具的Application/Storage标签中查看localStorage');
    console.log('2. 查找键名为"learning_ai_token"的条目');
    console.log('3. 将其值复制并替换此脚本中的TOKEN变量');
    return;
  }

  try {
    console.log('测试通知API...');

    // 测试获取通知列表
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('通知API响应结构:');
    console.log(JSON.stringify(response.data, null, 2));

    // 检查响应数据结构
    if (response.data && response.data.notifications) {
      console.log('\n✓ 响应包含notifications数组');
      console.log(`  通知数量: ${response.data.notifications.length}`);
    } else {
      console.log('\n✗ 响应不包含notifications数组');
    }

    if (response.data && response.data.unreadCount !== undefined) {
      console.log('✓ 响应包含unreadCount字段');
      console.log(`  未读通知数量: ${response.data.unreadCount}`);
    } else {
      console.log('✗ 响应不包含unreadCount字段');
    }

    // 测试获取未读通知数量
    console.log('\n测试获取未读通知数量...');
    const unreadResponse = await axios.get(`${BASE_URL}/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('未读通知数量响应:');
    console.log(JSON.stringify(unreadResponse.data, null, 2));
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testNotificationAPI();
