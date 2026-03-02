/**
 * 资源预加载工具
 * 预加载关键资源，提升页面加载速度
 */

/**
 * 预加载关键CSS
 */
export function preloadCriticalCSS(href: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = href;
    document.head.appendChild(styleLink);
  };
  document.head.appendChild(link);
}

/**
 * 预加载关键JS
 */
export function preloadCriticalJS(src: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
  
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * 预加载字体
 */
export function preloadFonts(fonts: Array<{ href: string; type: string }>): void {
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = font.type;
    link.href = font.href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * 预加载API数据（关键数据）
 */
export async function preloadCriticalData(apiUrl: string): Promise<unknown> {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('edu_token') || ''}`
      }
    });
    return await response.json();
  } catch (error) {
    console.warn('预加载数据失败:', error);
    return null;
  }
}

