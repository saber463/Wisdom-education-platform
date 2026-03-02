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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllNotificationFeatures() {
  try {
    console.log('=== 综合测试所有通知功能 ===');

    // 1. 获取初始通知列表
    console.log('\n1. 获取初始通知列表...');
    const initialNotificationsResponse = await api.get('/notifications');
    const initialNotifications = initialNotificationsResponse.data.notifications;
    console.log('初始通知数量:', initialNotifications.length);

    // 2. 获取未读通知数量
    console.log('\n2. 获取未读通知数量...');
    const unreadCountResponse = await api.get('/notifications/unread-count');
    const initialUnreadCount = unreadCountResponse.data.unreadCount;
    console.log('初始未读通知数量:', initialUnreadCount);

    // 3. 标记所有通知为已读（如果存在未读通知）
    if (initialUnreadCount > 0) {
      console.log('\n3. 标记所有通知为已读...');
      const markAllReadResponse = await api.put('/notifications/mark-all-read');
      console.log('✓ 标记所有通知为已读成功');
      await delay(500); // 等待数据库更新

      // 验证所有通知已标记为已读
      const unreadCountAfterMarkAll = await api.get('/notifications/unread-count');
      if (unreadCountAfterMarkAll.data.unreadCount === 0) {
        console.log('✓ 验证成功：所有通知均已标记为已读');
      } else {
        console.log('❌ 验证失败：仍有未读通知');
        return false;
      }
    } else {
      console.log('\n3. 跳过标记所有为已读（没有未读通知）');
    }

    // 4. 添加新通知
    console.log('\n4. 添加新通知...');
    const newNotificationData = {
      title: '综合测试通知',
      content: '这是用于测试添加通知功能的通知',
      type: 'system',
    };

    const addNotificationResponse = await api.post('/notifications', newNotificationData);
    console.log('✓ 添加新通知成功');
    const addedNotification = addNotificationResponse.data.notification;
    console.log('新通知ID:', addedNotification._id);
    await delay(500); // 等待数据库更新

    // 5. 验证新通知已添加
    console.log('\n5. 验证新通知已添加...');
    const notificationsAfterAdd = await api.get('/notifications');
    const notificationExists = notificationsAfterAdd.data.notifications.some(
      n => n._id === addedNotification._id
    );
    if (notificationExists) {
      console.log('✓ 验证成功：新通知已添加到列表中');
    } else {
      console.log('❌ 验证失败：新通知未找到');
      return false;
    }

    // 6. 删除刚才添加的通知
    console.log('\n6. 删除刚才添加的通知...');
    const deleteResponse = await api.delete(`/notifications/${addedNotification._id}`);
    console.log('✓ 删除通知成功');
    await delay(500); // 等待数据库更新

    // 7. 验证通知已删除
    console.log('\n7. 验证通知已删除...');
    const notificationsAfterDelete = await api.get('/notifications');
    const notificationDeleted = !notificationsAfterDelete.data.notifications.some(
      n => n._id === addedNotification._id
    );
    if (notificationDeleted) {
      console.log('✓ 验证成功：通知已从列表中移除');
    } else {
      console.log('❌ 验证失败：通知仍存在于列表中');
      return false;
    }

    console.log('\n🎉 所有通知功能测试通过！');
    console.log('\n测试总结:');
    console.log('- 获取通知列表: ✓');
    console.log('- 获取未读通知数量: ✓');
    console.log('- 标记所有通知为已读: ✓');
    console.log('- 添加新通知: ✓');
    console.log('- 删除通知: ✓');

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

testAllNotificationFeatures();
