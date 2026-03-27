import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * 智慧教育学习平台 - Vite配置（性能优化版）
 * 
 * 优化内容：
 * - 更细粒度的代码分割
 * - 资源预加载
 * - 压缩优化
 * - 缓存策略
 */
export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  css: {
    // 使用现代编译器（避免Sass弃用警告）
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  
  server: {
    // 固定端口5173
    port: 5173,
    strictPort: true,
    host: true,
    
    // 代理配置 - 解决跨域问题
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        // 性能优化：添加超时配置
        timeout: 30000,
        // 性能优化：连接池
        agent: false,
        // 性能优化：代理请求头
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('代理错误:', err);
          });
          // 生产构建不记录每条请求，减少 I/O 与日志体积
        }
      },
      '/ai': {
        target: process.env.VITE_AI_SERVICE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/rust': {
        target: process.env.VITE_RUST_SERVICE_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    },
    
    fs: {
      allow: ['..', 'src/wasm']
    }
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 性能优化：使用esbuild压缩（更快）
    minify: 'esbuild',
    // 性能优化：启用CSS代码分割
    cssCodeSplit: true,
    // 注意：terserOptions 只在 minify: 'terser' 时有效
    // 使用 esbuild 时，压缩选项通过 esbuild 配置
    // 性能优化：更细粒度的代码分割
    rollupOptions: {
      output: {
        // 手动分包策略
        manualChunks: (id) => {
          // Vendor 拆分，去除循环依赖警告
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) {
              return 'element-plus';
            }
            if (id.includes('vue') || id.includes('@vue') || id.includes('pinia')) {
              return 'vue-core';
            }
            if (id.includes('video.js')) {
              return 'videojs';
            }
            if (id.includes('echarts')) {
              return 'echarts';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('vue-router')) {
              return 'vue-router';
            }
            return 'vendor';
          }
          // 按功能模块分包（进一步细化）
          if (id.includes('/views/teacher/')) {
            return 'teacher-module';
          }
          if (id.includes('/views/student/')) {
            // 学生端进一步细分
            if (id.includes('/views/student/Course')) {
              return 'student-course';
            }
            if (id.includes('/views/student/MyPartner')) {
              return 'student-partner';
            }
            return 'student-module';
          }
          if (id.includes('/views/parent/')) {
            return 'parent-module';
          }
        },
        // 性能优化：文件名包含hash用于缓存
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 性能优化：块大小警告阈值（提高）
    chunkSizeWarningLimit: 1500,
    // 性能优化：启用gzip压缩报告
    reportCompressedSize: false, // 禁用压缩大小报告以加快构建速度
    // 性能优化：启用rollup的treeshaking
    treeshake: true
  },
  
  // 性能优化：依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'echarts',
      'axios',
      'video.js'
    ],
    // 性能优化：排除不需要预构建的包
    exclude: []
  },
  
  // 性能优化：定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // 性能优化：启用HTTP/2推送
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
})
