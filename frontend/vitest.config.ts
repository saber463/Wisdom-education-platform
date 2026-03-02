import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    setupFiles: ['./src/utils/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/utils/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/wasm/'
      ]
    },
    // WASM测试配置
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
