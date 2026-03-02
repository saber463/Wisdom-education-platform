const axios = require('axios');

// 使用我们刚刚获取的有效token
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDE3Zjc2OTM2ZTJkYmQ4OWI2OGFkYyIsInVzZXJuYW1lIjoidGVzdHVzZXJfbm90aWYiLCJpYXQiOjE3NjU5MDAxNTAsImV4cCI6MTc2NjUwNDk1MH0.hCimSTFJY2jMr6UPIgowx68-v-5RVwVLJzEdNWQi6Sw';

// 创建带token的API实例
const api = axios.create({
  baseURL: 'http://localhost:4001/api',
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`,
  },
});

async function testAllNotificationAPIs() {
  try {
    console.log('=== 测试通知相关API ===');

    // 1. 获取通知列表
    console.log('\n1. 测试获取通知列表...');
    const notificationsResponse = await api.get('/notifications');
    console.log('✓ 获取通知列表成功');
    console.log('通知数量:', notificationsResponse.data.notifications.length);

    // 显示所有通知的状态
    console.log('\n当前通知状态:');
    notificationsResponse.data.notifications.forEach((notification, index) => {
      console.log(
        `  ${index + 1}. ${notification.title} - 已读: ${notification.read ? '是' : '否'}`
      );
    });

    // 2. 获取未读通知数量
    console.log('\n2. 测试获取未读通知数量...');
    const unreadCountResponse = await api.get('/notifications/unread-count');
    console.log('✓ 获取未读通知数量成功');
    console.log('未读通知数量:', unreadCountResponse.data.unreadCount);

    // 3. 标记通知为已读 (如果有未读通知的话)
    const unreadNotification = notificationsResponse.data.notifications.find(n => !n.read);
    if (unreadNotification) {
      const notificationId = unreadNotification._id;
      console.log(`\n3. 测试标记通知为已读 (ID: ${notificationId})...`);
      const markReadResponse = await api.put(`/notifications/${notificationId}/read`);
      console.log('✓ 标记通知为已读成功');
      console.log('更新后的通知:', JSON.stringify(markReadResponse.data, null, 2));
    } else {
      console.log('\n3. 跳过标记通知为已读测试 (没有未读通知)');
    }

    console.log('\n✅ 所有通知API测试通过！');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误详情:', error.message);
    }
    return false;
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const shouldTestAll = args.includes('--all');

if (shouldTestAll) {
  testAllNotificationAPIs();
} else {
  console.log('请使用 --all 参数运行此脚本以测试所有API');
  console.log('例如: node test-notification-improved.cjs --all');
}
