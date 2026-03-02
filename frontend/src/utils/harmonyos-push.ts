/**
 * 鸿蒙推送服务集成
 * HarmonyOS Push Service Integration
 * 
 * 功能：
 * - 配置鸿蒙推送服务
 * - 发送通知到鸿蒙设备
 * - 支持Web Push API回退
 */

import { getHarmonyOSInfo } from './harmonyos-detector';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushConfig {
  vapidPublicKey?: string;
  serviceWorkerPath?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * 检查是否支持推送通知
 */
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * 检查是否为鸿蒙推送服务
 */
export function isHarmonyOSPushSupported(): boolean {
  const harmonyInfo = getHarmonyOSInfo();
  
  // 检查是否为鸿蒙设备且支持推送
  if (!harmonyInfo.isHarmonyOS) {
    return false;
  }
  
  // 检查是否存在鸿蒙推送API
  // @ts-expect-error - 鸿蒙特定API
  return !!(window.harmony && window.harmony.push);
}

/**
 * 请求推送通知权限
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('浏览器不支持推送通知');
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 初始化鸿蒙推送服务
 */
export async function initHarmonyOSPush(config: PushConfig = {}): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  try {
    // 检查权限
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: '用户拒绝推送通知权限'
      };
    }
    
    const harmonyInfo = getHarmonyOSInfo();
    
    // 如果是鸿蒙设备，尝试使用鸿蒙推送API
    if (harmonyInfo.isHarmonyOS && isHarmonyOSPushSupported()) {
      return await initHarmonyOSNativePush();
    }
    
    // 回退到Web Push API
    return await initWebPush(config);
  } catch (error) {
    console.error('推送服务初始化失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '推送服务初始化失败'
    };
  }
}

/**
 * 使用鸿蒙原生推送API
 */
async function initHarmonyOSNativePush(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  try {
    // @ts-expect-error - 鸿蒙特定API
    if (window.harmony && window.harmony.push) {
      // @ts-expect-error - 鸿蒙推送 subscribe 类型未定义
      const subscription = await window.harmony.push.subscribe();
      
      return {
        success: true,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        }
      };
    }
    
    // 如果没有鸿蒙推送API，回退到Web Push
    return await initWebPush({});
  } catch (error) {
    console.warn('鸿蒙推送API初始化失败，回退到Web Push:', error);
    return await initWebPush({});
  }
}

/**
 * 使用Web Push API
 */
async function initWebPush(config: PushConfig): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  try {
    // 注册Service Worker
    const registration = await navigator.serviceWorker.register(
      config.serviceWorkerPath || '/sw.js'
    );
    
    // 等待Service Worker激活
    await navigator.serviceWorker.ready;
    
    // 订阅推送
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: config.vapidPublicKey
        ? (urlBase64ToUint8Array(config.vapidPublicKey) as BufferSource)
        : undefined
    });
    
    // 转换订阅信息
    const subscriptionJson = subscription.toJSON();
    
    return {
      success: true,
      subscription: {
        endpoint: subscriptionJson.endpoint || '',
        keys: {
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || ''
        }
      }
    };
  } catch (error) {
    console.error('Web Push初始化失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Web Push初始化失败'
    };
  }
}

/**
 * 发送本地推送通知
 */
export async function sendLocalNotification(notification: PushNotification): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isPushSupported()) {
      return {
        success: false,
        error: '浏览器不支持推送通知'
      };
    }
    
    const permission = Notification.permission;
    if (permission !== 'granted') {
      return {
        success: false,
        error: '没有推送通知权限'
      };
    }
    
    const harmonyInfo = getHarmonyOSInfo();
    
    // 如果是鸿蒙设备，尝试使用鸿蒙推送API
    if (harmonyInfo.isHarmonyOS && isHarmonyOSPushSupported()) {
      return await sendHarmonyOSNotification(notification);
    }
    
    // 使用标准Notification API
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction
    });
    
    return { success: true };
  } catch (error) {
    console.error('发送通知失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '发送通知失败'
    };
  }
}

/**
 * 使用鸿蒙推送API发送通知
 */
async function sendHarmonyOSNotification(notification: PushNotification): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // @ts-expect-error - 鸿蒙特定API
    if (window.harmony && window.harmony.push) {
      // @ts-expect-error - 鸿蒙推送 notify 类型未定义
      await window.harmony.push.notify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        data: notification.data,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction
      });
      
      return { success: true };
    }
    
    // 回退到标准API
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction
    });
    
    return { success: true };
  } catch (error) {
    console.error('鸿蒙推送通知失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '推送通知失败'
    };
  }
}

/**
 * 取消订阅推送
 */
export async function unsubscribePush(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const harmonyInfo = getHarmonyOSInfo();
    
    // 如果是鸿蒙设备，尝试使用鸿蒙推送API
    if (harmonyInfo.isHarmonyOS && isHarmonyOSPushSupported()) {
      // @ts-expect-error - 鸿蒙推送 API
      if (window.harmony && window.harmony.push) {
        // @ts-expect-error - 鸿蒙推送 unsubscribe 类型未定义
        await window.harmony.push.unsubscribe();
        return { success: true };
      }
    }
    
    // 使用Web Push API取消订阅
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    return { success: true };
  } catch (error) {
    console.error('取消订阅失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取消订阅失败'
    };
  }
}

/**
 * 获取当前推送订阅状态
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const harmonyInfo = getHarmonyOSInfo();
    
    // 如果是鸿蒙设备，尝试使用鸿蒙推送API
    if (harmonyInfo.isHarmonyOS && isHarmonyOSPushSupported()) {
      // @ts-expect-error - 鸿蒙推送 API
      if (window.harmony && window.harmony.push) {
        // @ts-expect-error - 鸿蒙推送 getSubscription 类型未定义
        const subscription = await window.harmony.push.getSubscription();
        if (subscription) {
          return {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          };
        }
      }
    }
    
    // 使用Web Push API
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const subscriptionJson = subscription.toJSON();
      return {
        endpoint: subscriptionJson.endpoint || '',
        keys: {
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || ''
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取订阅状态失败:', error);
    return null;
  }
}

/**
 * 工具函数：将Base64字符串转换为Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * 鸿蒙推送组合式函数（用于Vue组件）
 */
export function useHarmonyOSPush() {
  const isSupported = isPushSupported();
  const isHarmonyOSSupported = isHarmonyOSPushSupported();
  const harmonyInfo = getHarmonyOSInfo();
  
  const init = async (config?: PushConfig) => {
    return await initHarmonyOSPush(config);
  };
  
  const sendNotification = async (notification: PushNotification) => {
    return await sendLocalNotification(notification);
  };
  
  const unsubscribe = async () => {
    return await unsubscribePush();
  };
  
  const getSubscription = async () => {
    return await getPushSubscription();
  };
  
  const requestPermission = async () => {
    return await requestPushPermission();
  };
  
  return {
    isSupported,
    isHarmonyOSSupported,
    isHarmonyOS: harmonyInfo.isHarmonyOS,
    init,
    sendNotification,
    unsubscribe,
    getSubscription,
    requestPermission
  };
}
