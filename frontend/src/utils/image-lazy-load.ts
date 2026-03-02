/**
 * 图片懒加载工具
 * 优化页面加载速度
 */

/**
 * 图片懒加载指令
 */
export function setupImageLazyLoad() {
  if (typeof window === 'undefined') return;

  // 使用Intersection Observer API实现懒加载
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const dataSrc = img.getAttribute('data-src');
        
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px' // 提前50px开始加载
  });

  // 监听所有带data-src的图片
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  return imageObserver;
}

/**
 * 预加载关键图片
 */
export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${url}`));
        img.src = url;
      });
    })
  );
}

/**
 * 图片占位符
 */
export function getImagePlaceholder(width: number, height: number, text?: string): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
        ${text || '加载中...'}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

