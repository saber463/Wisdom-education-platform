import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
// import { VitePWA } from 'vite-plugin-pwa'; // 临时禁用PWA

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    vue(),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
    }),
    // VitePWA({  // 临时禁用PWA
    //   registerType: 'autoUpdate',
    // }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 配置 @ 指向 src 目录
    },
    extensions: ['.vue', '.js', '.json', '.mjs'], // 自动解析的文件扩展名
  },
  server: {
    open: true, // 启动后自动打开浏览器（可选，方便快捷）
    port: 3000, // 指定开发服务器端口
    strictPort: false, // 不严格使用指定端口，若被占用则自动寻找可用端口
    hmr: {
      overlay: true, // 热更新错误覆盖层
    },
    proxy: {
      // API 代理配置
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
        // 添加调试日志
        logLevel: 'debug',
      },
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vue-vendor';
            }
            if (id.includes('axios') || id.includes('dayjs')) {
              return 'utils';
            }
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'element-ui';
            }
            return 'vendor';
          }
        },
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `static/media/[name]-[hash].[ext]`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return `static/img/[name]-[hash].[ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `static/fonts/[name]-[hash].[ext]`;
          }
          return `static/[ext]/[name]-[hash].[ext]`;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    assetsDir: 'static',
    sourcemap: false,
    reportCompressedSize: true,
    cssCodeSplit: true,
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
    modules: {
      localsConvention: 'camelCase',
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
    exclude: [],
  },
  preview: {
    port: 4173,
    headers: {
      'Cache-Control': 'max-age=31536000, immutable',
    },
  },
}));
