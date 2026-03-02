// test-token.mjs
import config from './src/config/index.js';

// 模拟浏览器localStorage
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

// 模拟safeLocalStorage实现（从user.js复制）
const safeLocalStorage = {
  get(key) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Failed to read ${key} from localStorage:`, e);
      return null;
    }
  },
  set(key, value) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }

      // 检查数据大小，避免localStorage溢出
      const dataSize = new Blob([JSON.stringify(value)]).size;
      if (dataSize > 5 * 1024 * 1024) {
        // 5MB限制
        throw new Error('Data size exceeds localStorage limit (5MB)');
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write ${key} to localStorage:`, e);
    }
  },
  remove(key) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  },
  // 清除所有相关存储数据
  clearAll(prefix) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }

      // 获取所有key并筛选出匹配前缀的
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  },
};

// 测试storagePrefix和token存储
console.log('Storage prefix:', config.storagePrefix);

const tokenKey = `${config.storagePrefix}token`;
const userKey = `${config.storagePrefix}user`;

console.log('Expected token key:', tokenKey);
console.log('Expected user key:', userKey);

// 模拟登录后存储token和用户信息
safeLocalStorage.set(
  tokenKey,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDE0ZjMyMzg4NjEzZDc3ZjI5N2NiZiIsInVzZXJuYW1lIjoidGVzdHVzZXI2ODg5IiwiaWF0IjoxNzY1ODk4NzcyLCJleHAiOjE3NjY1MDM1NzJ9.6oQwbYXoXjpU9ezhSpz_3s0Seid0_aLpIjndJG7H0eo'
);
safeLocalStorage.set(userKey, { id: '69414f32388613d77f297cbf', username: 'testuser6889' });

console.log('\nStored values:');
console.log('Token:', safeLocalStorage.get(tokenKey));
console.log('User:', safeLocalStorage.get(userKey));

console.log('\nAll localStorage items:');
for (const key in localStorage.store) {
  console.log(`${key}: ${localStorage.store[key]}`);
}
