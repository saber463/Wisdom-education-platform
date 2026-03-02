/**
 * 鸿蒙设备检测工具
 * HarmonyOS Device Detection Utility
 * 
 * 功能：
 * - 检测User-Agent识别鸿蒙设备
 * - 提供设备信息查询接口
 * - 支持鸿蒙OS 2.0+版本检测
 */

export interface HarmonyOSInfo {
  isHarmonyOS: boolean;
  version?: string;
  deviceType?: 'phone' | 'tablet' | 'tv' | 'watch' | 'unknown';
  userAgent: string;
}

/**
 * 检测是否为鸿蒙设备
 * @returns 鸿蒙设备信息
 */
export function detectHarmonyOS(): HarmonyOSInfo {
  const userAgent = navigator.userAgent || '';
  
  // 鸿蒙OS的User-Agent特征
  // HarmonyOS设备通常包含以下标识：
  // - "HarmonyOS" 或 "OpenHarmony"
  // - "HUAWEI" 或 "HONOR"
  const isHarmonyOS = 
    /HarmonyOS/i.test(userAgent) || 
    /OpenHarmony/i.test(userAgent) ||
    (/HUAWEI/i.test(userAgent) && /HMSCore/i.test(userAgent));
  
  if (!isHarmonyOS) {
    return {
      isHarmonyOS: false,
      userAgent
    };
  }
  
  // 提取鸿蒙OS版本号
  let version: string | undefined;
  const versionMatch = userAgent.match(/HarmonyOS[/\s]+([\d.]+)/i);
  if (versionMatch) {
    version = versionMatch[1];
  }
  
  // 检测设备类型
  let deviceType: HarmonyOSInfo['deviceType'] = 'unknown';
  if (/Mobile/i.test(userAgent)) {
    deviceType = 'phone';
  } else if (/Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/TV/i.test(userAgent)) {
    deviceType = 'tv';
  } else if (/Watch/i.test(userAgent)) {
    deviceType = 'watch';
  }
  
  return {
    isHarmonyOS: true,
    version,
    deviceType,
    userAgent
  };
}

/**
 * 获取鸿蒙设备信息（单例模式）
 */
let cachedInfo: HarmonyOSInfo | null = null;

export function getHarmonyOSInfo(): HarmonyOSInfo {
  if (!cachedInfo) {
    cachedInfo = detectHarmonyOS();
  }
  return cachedInfo;
}

/**
 * 重置缓存（仅用于测试）
 * @internal
 */
export function resetHarmonyOSCache(): void {
  cachedInfo = null;
}

/**
 * 判断是否为鸿蒙设备（快捷方法）
 */
export function isHarmonyOS(): boolean {
  return getHarmonyOSInfo().isHarmonyOS;
}

/**
 * 获取鸿蒙OS版本号
 */
export function getHarmonyOSVersion(): string | undefined {
  return getHarmonyOSInfo().version;
}

/**
 * 获取设备类型
 */
export function getDeviceType(): HarmonyOSInfo['deviceType'] {
  return getHarmonyOSInfo().deviceType;
}
