/**
 * 鸿蒙相机API集成
 * HarmonyOS Camera API Integration
 * 
 * 功能：
 * - 调用鸿蒙相机API拍照
 * - 上传作业图片
 * - 支持标准HTML5 Media Capture API回退
 */

import { getHarmonyOSInfo } from './harmonyos-detector';

export interface CameraOptions {
  quality?: number;        // 图片质量 0-1
  maxWidth?: number;       // 最大宽度
  maxHeight?: number;      // 最大高度
  facingMode?: 'user' | 'environment'; // 前置/后置摄像头
}

export interface CameraResult {
  success: boolean;
  file?: File;
  dataUrl?: string;
  error?: string;
}

/**
 * 检查是否支持鸿蒙相机API
 */
export function isHarmonyOSCameraSupported(): boolean {
  const harmonyInfo = getHarmonyOSInfo();
  
  // 检查是否为鸿蒙设备
  if (!harmonyInfo.isHarmonyOS) {
    return false;
  }
  
  // 检查是否支持媒体捕获
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * 打开鸿蒙相机拍照
 * 优先使用鸿蒙原生API，回退到标准HTML5 API
 */
export async function openHarmonyOSCamera(options: CameraOptions = {}): Promise<CameraResult> {
  const harmonyInfo = getHarmonyOSInfo();
  
  try {
    // 如果是鸿蒙设备，尝试使用鸿蒙相机API
    if (harmonyInfo.isHarmonyOS && isHarmonyOSCameraSupported()) {
      return await captureWithHarmonyOSAPI(options);
    }
    
    // 回退到标准HTML5 Media Capture API
    return await captureWithHTML5API(options);
  } catch (error) {
    console.error('相机调用失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '相机调用失败'
    };
  }
}

/**
 * 使用鸿蒙原生相机API拍照
 * 注意：这是模拟实现，实际鸿蒙API需要在真实设备上测试
 */
async function captureWithHarmonyOSAPI(options: CameraOptions): Promise<CameraResult> {
  // 检查是否存在鸿蒙特定的相机API
  // @ts-expect-error - 鸿蒙特定API可能不在TypeScript类型定义中
  if (window.harmony && window.harmony.camera) {
    try {
      // @ts-expect-error - 鸿蒙相机 API 类型未定义
      const result = await window.harmony.camera.capture({
        quality: options.quality || 0.9,
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        facingMode: options.facingMode || 'environment'
      });
      
      return {
        success: true,
        file: result.file,
        dataUrl: result.dataUrl
      };
    } catch (error) {
      console.warn('鸿蒙相机API调用失败，回退到标准API:', error);
      return await captureWithHTML5API(options);
    }
  }
  
  // 如果没有鸿蒙特定API，使用标准API
  return await captureWithHTML5API(options);
}

/**
 * 使用标准HTML5 Media Capture API拍照
 */
async function captureWithHTML5API(options: CameraOptions): Promise<CameraResult> {
  return new Promise((resolve) => {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = options.facingMode === 'user' ? 'user' : 'environment';
    
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) {
        resolve({
          success: false,
          error: '未选择文件'
        });
        return;
      }
      
      // 如果需要压缩图片
      if (options.maxWidth || options.maxHeight || options.quality) {
        try {
          const compressed = await compressImage(file, options);
          resolve({
            success: true,
            file: compressed.file,
            dataUrl: compressed.dataUrl
          });
        } catch (error) {
          resolve({
            success: false,
            error: '图片压缩失败'
          });
        }
      } else {
        // 直接返回原始文件
        const dataUrl = await fileToDataUrl(file);
        resolve({
          success: true,
          file,
          dataUrl
        });
      }
    };
    
    input.oncancel = () => {
      resolve({
        success: false,
        error: '用户取消拍照'
      });
    };
    
    // 触发文件选择
    input.click();
  });
}

/**
 * 压缩图片
 */
async function compressImage(file: File, options: CameraOptions): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let width = img.width;
        let height = img.height;
        
        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }
        
        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }
        
        // 创建canvas进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            const dataUrl = canvas.toDataURL('image/jpeg', options.quality || 0.9);
            
            resolve({
              file: compressedFile,
              dataUrl
            });
          },
          'image/jpeg',
          options.quality || 0.9
        );
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 将File转换为DataURL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 上传图片到服务器
 */
export async function uploadCameraImage(file: File, uploadUrl: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      url: data.url || data.data?.url
    };
  } catch (error) {
    console.error('图片上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片上传失败'
    };
  }
}

/**
 * 鸿蒙相机组合式函数（用于Vue组件）
 */
export function useHarmonyOSCamera() {
  const isSupported = isHarmonyOSCameraSupported();
  const harmonyInfo = getHarmonyOSInfo();
  
  const capturePhoto = async (options?: CameraOptions) => {
    return await openHarmonyOSCamera(options);
  };
  
  const uploadPhoto = async (file: File, uploadUrl: string) => {
    return await uploadCameraImage(file, uploadUrl);
  };
  
  return {
    isSupported,
    isHarmonyOS: harmonyInfo.isHarmonyOS,
    capturePhoto,
    uploadPhoto
  };
}
