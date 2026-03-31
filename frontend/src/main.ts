/**
 * 智慧教育学习平台 - 应用入口
 * 
 * 初始化顺序：
 * 1. 创建Vue应用实例
 * 2. 配置Pinia状态管理
 * 3. 配置Vue Router路由
 * 4. 配置Element Plus UI组件库
 * 5. 初始化鸿蒙设备适配
 * 6. 挂载应用
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { applyHarmonyOSStyles } from './utils/harmonyos-layout'
import lazyLoadDirective from './directives/lazy-load'
import './styles/harmonyos.css'
import './styles/tailwind.css'
import './styles/global.css'  // V2.0 全新全局样式（科技青+智慧紫主题）

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia状态管理实例
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册全局指令
app.directive('lazy-load', lazyLoadDirective)

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn, // 中文语言包
  size: 'default'
})

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('[全局错误]', err)
  console.error('[组件实例]', instance)
  console.error('[错误信息]', info)
}

// 初始化鸿蒙设备适配
applyHarmonyOSStyles()

// 性能优化：预加载关键资源
if (typeof window !== 'undefined') {
  // 预加载关键API数据（如果已登录）
  const token = localStorage.getItem('edu_token');
  if (token) {
    // 异步预加载，不阻塞主流程
    import('./utils/resource-preloader.js').then(({ preloadCriticalData }) => {
      // 预加载用户信息
      preloadCriticalData('/api/auth/me').catch(() => {});
    });
  }
  
  // 设置图片懒加载
  import('./utils/image-lazy-load.js').then(({ setupImageLazyLoad }) => {
    setupImageLazyLoad();
  });
}

// 挂载应用
app.mount('#app')

// 开发环境日志
if (import.meta.env.DEV) {
  console.log('[智慧教育学习平台] 应用已启动')
  console.log('[环境]', import.meta.env.MODE)
}
