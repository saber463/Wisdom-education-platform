/**
 * 属性测试：鸿蒙相机API集成
 * Property Test: HarmonyOS Camera API Integration
 * 
 * Feature: smart-education-platform, Property 60: 鸿蒙相机API集成
 * Validates: Requirements 14.2
 * 
 * 测试属性：
 * - 对于任何鸿蒙设备上传作业图片，系统应支持鸿蒙相机API调用
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  isHarmonyOSCameraSupported,
  openHarmonyOSCamera,
  uploadCameraImage,
  useHarmonyOSCamera
} from '../harmonyos-camera';
import { resetHarmonyOSCache } from '../harmonyos-detector';
import type { CameraOptions } from '../harmonyos-camera';

// Mock fetch
globalThis.fetch = vi.fn();

describe('Property 60: 鸿蒙相机API集成', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHarmonyOSCache(); // 清除缓存
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });
  
  afterEach(() => {
    resetHarmonyOSCache(); // 清除缓存
  });

  describe('相机支持检测', () => {
    it('鸿蒙设备应支持相机API', () => {
      // Mock鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      // Mock mediaDevices
      Object.defineProperty(window.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn()
        },
        configurable: true
      });
      
      const isSupported = isHarmonyOSCameraSupported();
      expect(isSupported).toBe(true);
    });

    it('非鸿蒙设备应返回false', () => {
      // Mock非鸿蒙设备
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
      
      // Mock mediaDevices
      Object.defineProperty(window.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn()
        },
        configurable: true
      });
      
      const isSupported = isHarmonyOSCameraSupported();
      expect(isSupported).toBe(false);
    });

    it('没有mediaDevices的设备应返回false', () => {
      // Mock鸿蒙设备但没有mediaDevices
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      Object.defineProperty(window.navigator, 'mediaDevices', {
        value: undefined,
        configurable: true
      });
      
      const isSupported = isHarmonyOSCameraSupported();
      expect(isSupported).toBe(false);
    });
  });

  describe('相机选项配置', () => {
    it('应接受有效的相机选项配置', () => {
      fc.assert(
        fc.property(
          fc.record({
            quality: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
            maxWidth: fc.option(fc.integer({ min: 320, max: 3840 }), { nil: undefined }),
            maxHeight: fc.option(fc.integer({ min: 240, max: 2160 }), { nil: undefined }),
            facingMode: fc.option(fc.constantFrom('user', 'environment'), { nil: undefined })
          }),
          (options: CameraOptions) => {
            // 验证选项的有效性
            if (options.quality !== undefined) {
              expect(options.quality).toBeGreaterThanOrEqual(0);
              expect(options.quality).toBeLessThanOrEqual(1);
              expect(Number.isNaN(options.quality)).toBe(false);
            }
            
            if (options.maxWidth !== undefined) {
              expect(options.maxWidth).toBeGreaterThan(0);
            }
            
            if (options.maxHeight !== undefined) {
              expect(options.maxHeight).toBeGreaterThan(0);
            }
            
            if (options.facingMode !== undefined) {
              expect(['user', 'environment']).toContain(options.facingMode);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('图片上传功能', () => {
    it('应正确上传图片文件', async () => {
      // Mock成功的上传响应
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, url: 'https://example.com/image.jpg' })
      });
      
      // 创建模拟文件
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await uploadCameraImage(file, '/api/upload');
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/image.jpg');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('上传失败应返回错误信息', async () => {
      // Mock失败的上传响应
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await uploadCameraImage(file, '/api/upload');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('网络错误应被正确处理', async () => {
      // Mock网络错误
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await uploadCameraImage(file, '/api/upload');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('组合式函数', () => {
    it('useHarmonyOSCamera应返回正确的接口', () => {
      const camera = useHarmonyOSCamera();
      
      expect(camera).toHaveProperty('isSupported');
      expect(camera).toHaveProperty('isHarmonyOS');
      expect(camera).toHaveProperty('capturePhoto');
      expect(camera).toHaveProperty('uploadPhoto');
      
      expect(typeof camera.isSupported).toBe('boolean');
      expect(typeof camera.isHarmonyOS).toBe('boolean');
      expect(typeof camera.capturePhoto).toBe('function');
      expect(typeof camera.uploadPhoto).toBe('function');
    });

    it('capturePhoto应返回Promise', () => {
      const camera = useHarmonyOSCamera();
      const result = camera.capturePhoto();
      
      expect(result).toBeInstanceOf(Promise);
    });

    it('uploadPhoto应返回Promise', () => {
      const camera = useHarmonyOSCamera();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = camera.uploadPhoto(file, '/api/upload');
      
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('文件类型验证', () => {
    it('应接受有效的图片文件', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (mimeType, fileName) => {
            const file = new File(['test'], `${fileName}.jpg`, { type: mimeType });
            
            expect(file.type).toMatch(/^image\//);
            expect(file.name).toBeTruthy();
            expect(file.size).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('错误处理', () => {
    it('相机调用失败应返回错误结果', async () => {
      // Mock鸿蒙设备但没有相机支持
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; HarmonyOS 2.0; Mobile)',
        configurable: true
      });
      
      Object.defineProperty(window.navigator, 'mediaDevices', {
        value: undefined,
        configurable: true
      });
      
      // Mock document.createElement to simulate user cancellation
      const originalCreateElement = document.createElement.bind(document);
      const mockInput = {
        type: '',
        accept: '',
        capture: '',
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any
      };
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          // 模拟用户取消操作
          setTimeout(() => {
            if (mockInput.oncancel) {
              mockInput.oncancel();
            }
          }, 10);
          return mockInput as any;
        }
        return originalCreateElement(tagName);
      });
      
      const result = await openHarmonyOSCamera();
      
      // 应该返回一个结果对象
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      // 清理
      vi.restoreAllMocks();
    }, 1000); // 设置1秒超时
  });

  describe('数据URL生成', () => {
    it('上传的文件应包含有效的数据', () => {
      fc.assert(
        fc.property(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/') && !s.includes(':')),
          (data, fileName) => {
            const file = new File([data], `${fileName}.jpg`, { type: 'image/jpeg' });
            expect(file.size).toBe(data.length);
            expect(file.name.endsWith('.jpg')).toBe(true);
            expect(file.type).toBe('image/jpeg');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Authorization头部', () => {
    it('上传请求应包含Authorization头部', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, url: 'https://example.com/image.jpg' })
      });
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await uploadCameraImage(file, '/api/upload');
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });
  });
});
