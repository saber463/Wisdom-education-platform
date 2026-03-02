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

async function testMarkAllAsRead() {
  try {
    console.log('=== 测试标记所有通知为已读 ===');

    // 先获取当前未读通知数量
    console.log('\n1. 获取当前未读通知数量...');
    const unreadCountBefore = await api.get('/notifications/unread-count');
    console.log('当前未读通知数量:', unreadCountBefore.data.unreadCount);

    // 如果有未读通知，则测试标记所有为已读
    if (unreadCountBefore.data.unreadCount > 0) {
      console.log('\n2. 标记所有通知为已读...');
      const markAllReadResponse = await api.put('/notifications/mark-all-read');
      console.log('✓ 标记所有通知为已读成功');
      console.log('响应消息:', markAllReadResponse.data.message);

      // 再次获取未读通知数量，验证是否为0
      console.log('\n3. 验证所有通知已标记为已读...');
      const unreadCountAfter = await api.get('/notifications/unread-count');
      console.log('标记后未读通知数量:', unreadCountAfter.data.unreadCount);

      if (unreadCountAfter.data.unreadCount === 0) {
        console.log('✓ 验证成功：所有通知均已标记为已读');
      } else {
        console.log('❌ 验证失败：仍有未读通知');
        return false;
      }
    } else {
      console.log('\n没有未读通知，跳过标记所有为已读测试');
    }

    console.log('\n✅ 标记所有通知为已读功能测试通过！');
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

testMarkAllAsRead();
