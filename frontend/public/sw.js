/**
 * Service Worker for Push Notifications
 * 智慧教育学习平台推送服务
 */

// Service Worker版本
const CACHE_VERSION = 'v1';

// 监听推送事件
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let notificationData = {
    title: '智慧教育学习平台',
    body: '您有新的通知',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: {}
  };
  
  // 解析推送数据
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {}
      };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }
  
  // 显示通知
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      requireInteraction: false,
      vibrate: [200, 100, 200]
    })
  );
});

// 监听通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  // 打开应用
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已有窗口打开，则聚焦
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// 监听Service Worker安装事件
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// 监听Service Worker激活事件
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});
