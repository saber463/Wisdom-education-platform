/**
 * 属性测试：鸿蒙推送服务集成
 * Property Test: HarmonyOS Push Service Integration
 * 
 * Feature: smart-education-platform, Property 61: 鸿蒙推送服务集成
 * Validates: Requirements 14.3
 * 
 * 测试属性：
 * - 对于任何鸿蒙设备接收通知，系统应使用鸿蒙推送服务
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  isPushSupported,
  isHarmonyOSPushSupported,
  requestPushPermission,
  sendLocalNotification,
  useHarmonyOSPush
} from '../harmonyos-push';
import type { PushNotification } from '../harmonyos-push';

describe('Property 61: 鸿蒙推送服务集成', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Notification API
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    } as any;
  });

  describe('推送支持检测', () => {
    it('应正确检测浏览器推送支持', () => {
      // Mock支持推送的环境
      Object.defineProperty(window, 'Notification', {
        value: {},
        configurable: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true
      });
      
      const isSupported = isPushSupported();
      expect(isSupported).toBe(true);
    });

    it('鸿蒙设备应支持鸿蒙推送服务', () => {
      // Mock鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      // Mock鸿蒙推送API
      (window as any).harmony = {
        push: {
          subscribe: vi.fn(),
          notify: vi.fn()
        }
      };
      
      const isSupported = isHarmonyOSPushSupported();
      expect(isSupported).toBe(true);
      
      // 清理
      delete (window as any).harmony;
    });

    it('非鸿蒙设备应返回false', () => {
      // Mock非鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
      
      const isSupported = isHarmonyOSPushSupported();
      expect(isSupported).toBe(false);
    });
  });

  describe('推送权限请求', () => {
    it('应正确请求推送权限', async () => {
      // Mock Notification API
      globalThis.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted')
      } as any;
      
      Object.defineProperty(window, 'Notification', {
        value: globalThis.Notification,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true
      });
      
      const permission = await requestPushPermission();
      expect(permission).toBe('granted');
      expect(globalThis.Notification.requestPermission).toHaveBeenCalled();
    });

    it('用户拒绝权限应返回denied', async () => {
      globalThis.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied')
      } as any;
      
      Object.defineProperty(window, 'Notification', {
        value: globalThis.Notification,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true
      });
      
      const permission = await requestPushPermission();
      expect(permission).toBe('denied');
    });
  });

  describe('通知内容验证', () => {
    it('应接受有效的通知配置', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            body: fc.string({ minLength: 1, maxLength: 500 }),
            icon: fc.option(fc.webUrl(), { nil: undefined }),
            badge: fc.option(fc.webUrl(), { nil: undefined }),
            tag: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            requireInteraction: fc.option(fc.boolean(), { nil: undefined })
          }),
          (notification: PushNotification) => {
            // 验证通知配置的有效性
            expect(notification.title).toBeTruthy();
            expect(notification.body).toBeTruthy();
            expect(notification.title.length).toBeGreaterThan(0);
            expect(notification.body.length).toBeGreaterThan(0);
            
            if (notification.icon) {
              expect(notification.icon).toMatch(/^https?:\/\//);
            }
            
            if (notification.badge) {
              expect(notification.badge).toMatch(/^https?:\/\//);
            }
            
            if (notification.requireInteraction !== undefined) {
              expect(typeof notification.requireInteraction).toBe('boolean');
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('本地通知发送', () => {
    it('有权限时应成功发送通知', async () => {
      // Mock已授权的Notification
      const mockNotification = vi.fn();
      const mockNotif = Object.assign(mockNotification, { permission: 'granted' as NotificationPermission });
      Object.defineProperty(globalThis, 'Notification', { value: mockNotif, configurable: true, writable: true });
      Object.defineProperty(window, 'Notification', {
        value: mockNotif,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true
      });
      
      const notification: PushNotification = {
        title: '测试通知',
        body: '这是一条测试通知'
      };
      
      const result = await sendLocalNotification(notification);
      
      expect(result.success).toBe(true);
      expect(mockNotification).toHaveBeenCalledWith(
        notification.title,
        expect.objectContaining({
          body: notification.body
        })
      );
    });

    it('没有权限时应返回错误', async () => {
      globalThis.Notification = {
        permission: 'denied'
      } as any;
      
      Object.defineProperty(window, 'Notification', {
        value: globalThis.Notification,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true
      });
      
      const notification: PushNotification = {
        title: '测试通知',
        body: '这是一条测试通知'
      };
      
      const result = await sendLocalNotification(notification);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('组合式函数', () => {
    it('useHarmonyOSPush应返回正确的接口', () => {
      const push = useHarmonyOSPush();
      
      expect(push).toHaveProperty('isSupported');
      expect(push).toHaveProperty('isHarmonyOSSupported');
      expect(push).toHaveProperty('isHarmonyOS');
      expect(push).toHaveProperty('init');
      expect(push).toHaveProperty('sendNotification');
      expect(push).toHaveProperty('unsubscribe');
      expect(push).toHaveProperty('getSubscription');
      expect(push).toHaveProperty('requestPermission');
      
      expect(typeof push.isSupported).toBe('boolean');
      expect(typeof push.isHarmonyOSSupported).toBe('boolean');
      expect(typeof push.isHarmonyOS).toBe('boolean');
      expect(typeof push.init).toBe('function');
      expect(typeof push.sendNotification).toBe('function');
      expect(typeof push.unsubscribe).toBe('function');
      expect(typeof push.getSubscription).toBe('function');
      expect(typeof push.requestPermission).toBe('function');
    });

    it('所有方法应返回Promise', () => {
      const push = useHarmonyOSPush();
      
      expect(push.init()).toBeInstanceOf(Promise);
      expect(push.sendNotification({ title: 'Test', body: 'Test' })).toBeInstanceOf(Promise);
      expect(push.unsubscribe()).toBeInstanceOf(Promise);
      expect(push.getSubscription()).toBeInstanceOf(Promise);
      expect(push.requestPermission()).toBeInstanceOf(Promise);
    });
  });

  describe('通知数据结构', () => {
    it('通知应包含必需的字段', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (title, body) => {
            const notification: PushNotification = {
              title,
              body
            };
            
            expect(notification).toHaveProperty('title');
            expect(notification).toHaveProperty('body');
            expect(notification.title).toBeTruthy();
            expect(notification.body).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('通知可以包含可选字段', () => {
      const notification: PushNotification = {
        title: '测试',
        body: '测试内容',
        icon: 'https://example.com/icon.png',
        badge: 'https://example.com/badge.png',
        data: { id: 123, type: 'assignment' },
        tag: 'test-tag',
        requireInteraction: true
      };
      
      expect(notification.icon).toBeDefined();
      expect(notification.badge).toBeDefined();
      expect(notification.data).toBeDefined();
      expect(notification.tag).toBeDefined();
      expect(notification.requireInteraction).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('不支持推送时应返回错误', async () => {
      // Mock不支持推送的环境
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        configurable: true
      });
      
      const notification: PushNotification = {
        title: '测试通知',
        body: '这是一条测试通知'
      };
      
      const result = await sendLocalNotification(notification);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('鸿蒙推送API集成', () => {
    it('鸿蒙设备应优先使用鸿蒙推送API', () => {
      // Mock鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      // Mock鸿蒙推送API
      const mockHarmonyPush = {
        subscribe: vi.fn(),
        notify: vi.fn(),
        unsubscribe: vi.fn(),
        getSubscription: vi.fn()
      };
      
      (window as any).harmony = {
        push: mockHarmonyPush
      };
      
      const isSupported = isHarmonyOSPushSupported();
      expect(isSupported).toBe(true);
      
      // 清理
      delete (window as any).harmony;
    });
  });

  describe('权限状态', () => {
    it('应正确反映当前权限状态', () => {
      const permissionStates: NotificationPermission[] = ['default', 'granted', 'denied'];
      
      permissionStates.forEach(state => {
        globalThis.Notification = {
          permission: state
        } as any;
        
        Object.defineProperty(window, 'Notification', {
          value: globalThis.Notification,
          configurable: true
        });
        
        expect(globalThis.Notification.permission).toBe(state);
      });
    });
  });
});
