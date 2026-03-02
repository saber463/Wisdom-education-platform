/**
 * 图片懒加载指令
 * 优化页面加载速度
 */

import { Directive } from 'vue';

const lazyLoadDirective: Directive = {
  mounted(el: HTMLImageElement) {
    // 如果浏览器支持原生懒加载，使用原生
    if ('loading' in HTMLImageElement.prototype) {
      el.loading = 'lazy';
      return;
    }

    // 否则使用Intersection Observer
    const observer = new IntersectionObserver((entries) => {
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
      rootMargin: '50px'
    });

    observer.observe(el);
  }
};

export default lazyLoadDirective;

