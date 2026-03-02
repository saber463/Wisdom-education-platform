/**
 * 属性测试：鸿蒙设备自动适配
 * Property Test: HarmonyOS Device Auto-Adaptation
 * 
 * Feature: smart-education-platform, Property 59: 鸿蒙设备自动适配
 * Validates: Requirements 14.1
 * 
 * 测试属性：
 * - 对于任何鸿蒙设备访问，前端应自动适配鸿蒙浏览器的屏幕尺寸和交互方式
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { 
  detectHarmonyOS, 
  getHarmonyOSInfo,
  isHarmonyOS,
  getHarmonyOSVersion,
  getDeviceType
} from '../harmonyos-detector';
import {
  getScreenSize,
  getResponsiveClass,
  applyHarmonyOSStyles,
  HARMONYOS_TOUCH_CONFIG
} from '../harmonyos-layout';

describe('Property 59: 鸿蒙设备自动适配', () => {
  beforeEach(() => {
    // 重置navigator.userAgent mock
    vi.clearAllMocks();
  });

  describe('鸿蒙设备检测', () => {
    it('应正确识别包含HarmonyOS标识的User-Agent', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasHarmonyOS: fc.boolean(),
            version: fc.option(fc.stringMatching(/^\d+\.\d+(\.\d+)?$/), { nil: undefined }),
            deviceType: fc.constantFrom('Mobile', 'Tablet', 'TV', 'Watch', ''),
            extraInfo: fc.string()
          }),
          (config) => {
            // 构造User-Agent字符串
            let userAgent = config.extraInfo;
            
            if (config.hasHarmonyOS) {
              userAgent = `Mozilla/5.0 (Linux; HarmonyOS ${config.version || '2.0'}; ${config.deviceType}) ${config.extraInfo}`;
            }
            
            // Mock navigator.userAgent
            Object.defineProperty(window.navigator, 'userAgent', {
              value: userAgent,
              configurable: true
            });
            
            const info = detectHarmonyOS();
            
            // 验证检测结果
            if (config.hasHarmonyOS) {
              expect(info.isHarmonyOS).toBe(true);
              if (config.version) {
                expect(info.version).toBeDefined();
              }
            } else {
              // 如果不包含HarmonyOS标识，应返回false
              expect(info.isHarmonyOS).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('应正确识别OpenHarmony设备', () => {
      const userAgent = 'Mozilla/5.0 (Linux; OpenHarmony 3.0; Mobile)';
      Object.defineProperty(window.navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });
      
      const info = detectHarmonyOS();
      expect(info.isHarmonyOS).toBe(true);
    });

    it('应正确识别华为HMS设备', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 10; HUAWEI Mate 40 Pro) HMSCore 6.0';
      Object.defineProperty(window.navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });
      
      const info = detectHarmonyOS();
      expect(info.isHarmonyOS).toBe(true);
    });
  });

  describe('响应式布局适配', () => {
    it('应根据屏幕尺寸返回正确的响应式类名', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.integer({ min: 320, max: 2560 }),
            height: fc.integer({ min: 480, max: 1440 })
          }),
          (screen) => {
            // Mock window.innerWidth 和 window.innerHeight
            Object.defineProperty(window, 'innerWidth', {
              value: screen.width,
              configurable: true
            });
            Object.defineProperty(window, 'innerHeight', {
              value: screen.height,
              configurable: true
            });
            
            const screenSize = getScreenSize();
            const responsiveClass = getResponsiveClass();
            
            // 验证屏幕尺寸
            expect(screenSize.width).toBe(screen.width);
            expect(screenSize.height).toBe(screen.height);
            
            // 验证屏幕方向
            if (screen.height > screen.width) {
              expect(screenSize.isPortrait).toBe(true);
              expect(responsiveClass).toContain('portrait');
            } else {
              expect(screenSize.isLandscape).toBe(true);
              expect(responsiveClass).toContain('landscape');
            }
            
            // 验证屏幕尺寸类名
            if (screen.width < 600) {
              expect(responsiveClass).toContain('screen-small');
            } else if (screen.width < 960) {
              expect(responsiveClass).toContain('screen-medium');
            } else {
              expect(responsiveClass).toContain('screen-large');
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('鸿蒙设备应包含harmonyos-device类名', () => {
      // Mock鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      const responsiveClass = getResponsiveClass();
      expect(responsiveClass).toContain('harmonyos-device');
    });
  });

  describe('触摸交互优化', () => {
    it('鸿蒙设备应应用触摸优化配置', () => {
      // 验证触摸配置符合鸿蒙设计规范
      expect(HARMONYOS_TOUCH_CONFIG.minTouchTarget).toBeGreaterThanOrEqual(48);
      expect(HARMONYOS_TOUCH_CONFIG.touchPadding).toBeGreaterThan(0);
      expect(HARMONYOS_TOUCH_CONFIG.swipeThreshold).toBeGreaterThan(0);
    });

    it('应为鸿蒙设备应用CSS变量', () => {
      // Mock鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      applyHarmonyOSStyles();
      
      const root = document.documentElement;
      const touchTargetSize = root.style.getPropertyValue('--touch-target-size');
      const touchPadding = root.style.getPropertyValue('--touch-padding');
      
      expect(touchTargetSize).toBe('48px');
      expect(touchPadding).toBe('12px');
      expect(root.classList.contains('harmonyos-optimized')).toBe(true);
    });
  });

  describe('设备类型识别', () => {
    it('应正确识别不同类型的鸿蒙设备', () => {
      const testCases = [
        { ua: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)', expected: 'phone' },
        { ua: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Tablet)', expected: 'tablet' },
        { ua: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; TV)', expected: 'tv' },
        { ua: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Watch)', expected: 'watch' }
      ];
      
      testCases.forEach(testCase => {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: testCase.ua,
          configurable: true
        });
        
        const info = detectHarmonyOS();
        expect(info.deviceType).toBe(testCase.expected);
      });
    });
  });

  describe('版本号提取', () => {
    it('应正确提取鸿蒙OS版本号', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d+\.\d+(\.\d+)?$/),
          (version) => {
            const userAgent = `Mozilla/5.0 (Linux; HarmonyOS ${version}; Mobile)`;
            Object.defineProperty(window.navigator, 'userAgent', {
              value: userAgent,
              configurable: true
            });
            
            const info = detectHarmonyOS();
            expect(info.version).toBe(version);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('辅助函数', () => {
    it('isHarmonyOS应返回布尔值', () => {
      const result = isHarmonyOS();
      expect(typeof result).toBe('boolean');
    });

    it('getHarmonyOSVersion应返回字符串或undefined', () => {
      const version = getHarmonyOSVersion();
      expect(version === undefined || typeof version === 'string').toBe(true);
    });

    it('getDeviceType应返回有效的设备类型', () => {
      const deviceType = getDeviceType();
      expect(['phone', 'tablet', 'tv', 'watch', 'unknown', undefined]).toContain(deviceType);
    });
  });

  describe('缓存机制', () => {
    it('多次调用getHarmonyOSInfo应返回相同的缓存结果', () => {
      const info1 = getHarmonyOSInfo();
      const info2 = getHarmonyOSInfo();
      
      expect(info1).toBe(info2); // 应该是同一个对象引用
    });
  });
});
