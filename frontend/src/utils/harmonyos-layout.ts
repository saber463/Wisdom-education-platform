/**
 * 鸿蒙响应式布局工具
 * HarmonyOS Responsive Layout Utility
 * 
 * 功能：
 * - 适配鸿蒙浏览器屏幕尺寸
 * - 优化触摸交互
 * - 提供响应式布局类名
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { getHarmonyOSInfo } from './harmonyos-detector';

export interface ScreenSize {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export interface TouchConfig {
  minTouchTarget: number; // 最小触摸目标尺寸（px）
  touchPadding: number;   // 触摸区域内边距（px）
  swipeThreshold: number; // 滑动阈值（px）
}

/**
 * 鸿蒙设备触摸配置
 * 根据鸿蒙设计规范，最小触摸目标为48dp（约48px）
 */
export const HARMONYOS_TOUCH_CONFIG: TouchConfig = {
  minTouchTarget: 48,
  touchPadding: 12,
  swipeThreshold: 50
};

/**
 * 获取当前屏幕尺寸信息
 */
export function getScreenSize(): ScreenSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    isPortrait: height > width,
    isLandscape: width > height
  };
}

/**
 * 获取响应式布局类名
 * 根据鸿蒙设备类型和屏幕尺寸返回对应的CSS类名
 */
export function getResponsiveClass(): string {
  const harmonyInfo = getHarmonyOSInfo();
  const screenSize = getScreenSize();
  
  const classes: string[] = [];
  
  // 鸿蒙设备基础类
  if (harmonyInfo.isHarmonyOS) {
    classes.push('harmonyos-device');
    
    // 设备类型类
    if (harmonyInfo.deviceType) {
      classes.push(`harmonyos-${harmonyInfo.deviceType}`);
    }
  }
  
  // 屏幕方向类
  if (screenSize.isPortrait) {
    classes.push('portrait');
  } else {
    classes.push('landscape');
  }
  
  // 屏幕尺寸类
  if (screenSize.width < 600) {
    classes.push('screen-small');
  } else if (screenSize.width < 960) {
    classes.push('screen-medium');
  } else {
    classes.push('screen-large');
  }
  
  return classes.join(' ');
}

/**
 * 响应式布局组合式函数
 * 用于Vue组件中监听屏幕尺寸变化
 */
export function useResponsiveLayout() {
  const screenSize = ref<ScreenSize>(getScreenSize());
  const responsiveClass = ref<string>(getResponsiveClass());
  const isHarmonyOS = ref(getHarmonyOSInfo().isHarmonyOS);
  
  const updateLayout = () => {
    screenSize.value = getScreenSize();
    responsiveClass.value = getResponsiveClass();
  };
  
  onMounted(() => {
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateLayout);
    window.removeEventListener('orientationchange', updateLayout);
  });
  
  return {
    screenSize,
    responsiveClass,
    isHarmonyOS,
    touchConfig: HARMONYOS_TOUCH_CONFIG
  };
}

/**
 * 优化触摸事件处理
 * 为鸿蒙设备提供更好的触摸体验
 */
export interface TouchEventHandler {
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

export function createTouchHandler(handlers: TouchEventHandler) {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    
    if (handlers.onTouchStart) {
      handlers.onTouchStart(e);
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (handlers.onTouchMove) {
      handlers.onTouchMove(e);
    }
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    // 检测滑动手势
    if (deltaTime < 300 && handlers.onSwipe) {
      const threshold = HARMONYOS_TOUCH_CONFIG.swipeThreshold;
      
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑动
          handlers.onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          // 垂直滑动
          handlers.onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    }
    
    if (handlers.onTouchEnd) {
      handlers.onTouchEnd(e);
    }
  };
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

/**
 * 应用鸿蒙响应式样式
 * 动态添加CSS变量和类名到根元素
 */
export function applyHarmonyOSStyles() {
  const harmonyInfo = getHarmonyOSInfo();
  
  if (harmonyInfo.isHarmonyOS) {
    const root = document.documentElement;
    
    // 添加CSS变量
    root.style.setProperty('--touch-target-size', `${HARMONYOS_TOUCH_CONFIG.minTouchTarget}px`);
    root.style.setProperty('--touch-padding', `${HARMONYOS_TOUCH_CONFIG.touchPadding}px`);
    
    // 添加类名
    root.classList.add('harmonyos-optimized');
    
    // 禁用双击缩放（优化触摸体验）
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
  }
}
