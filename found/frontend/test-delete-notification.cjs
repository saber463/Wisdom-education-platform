const axios = require('axios');

// 使用我们之前获取的有效token
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDE3Zjc2OTM2ZTJkYmQ4OWI2OGFkYyIsInVzZXJuYW1lIjoidGVzdHVzZXJfbm90aWYiLCJpYXQiOjE3NjU5MDAxNTAsImV4cCI6MTc2NjUwNDk1MH0.hCimSTFJY2jMr6UPIgowx68-v-5RVwVLJzEdNWQi6Sw';

// 创建带token的API实例
const api = axios.create({
  baseURL: 'http://localhost:4001/api',
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`,
  },
});

async function testDeleteNotification() {
  try {
    console.log('=== 测试删除通知功能 ===');

    // 先获取当前通知列表
    console.log('\n1. 获取当前通知列表...');
    const notificationsResponse = await api.get('/notifications');
    const notifications = notificationsResponse.data.notifications;
    console.log('当前通知数量:', notifications.length);

    // 显示所有通知
    console.log('\n当前通知列表:');
    notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title} (ID: ${notification._id})`);
    });

    // 如果有通知，则删除第一条
    if (notifications.length > 0) {
      const notificationToDelete = notifications[0];
      console.log(
        `\n2. 删除通知: ${notificationToDelete.title} (ID: ${notificationToDelete._id})...`
      );
      const deleteResponse = await api.delete(`/notifications/${notificationToDelete._id}`);
      console.log('✓ 删除通知成功');
      console.log('响应消息:', deleteResponse.data.message);

      // 再次获取通知列表，验证是否已删除
      console.log('\n3. 验证通知已删除...');
      const notificationsAfterDelete = await api.get('/notifications');
      const remainingNotifications = notificationsAfterDelete.data.notifications;
      console.log('删除后通知数量:', remainingNotifications.length);

      const isDeleted = !remainingNotifications.some(n => n._id === notificationToDelete._id);
      if (isDeleted) {
        console.log('✓ 验证成功：通知已从列表中移除');
      } else {
        console.log('❌ 验证失败：通知仍存在于列表中');
        return false;
      }
    } else {
      console.log('\n没有通知可删除');
    }

    console.log('\n✅ 删除通知功能测试通过！');
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

testDeleteNotification();
