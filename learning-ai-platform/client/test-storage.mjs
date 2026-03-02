import config from './src/config/index.js';
import { safeLocalStorage } from './src/utils/storage.js';

// 模拟存储一些数据
const tokenKey = `${config.storagePrefix}token`;
const userKey = `${config.storagePrefix}user`;

console.log('Storage prefix:', config.storagePrefix);
console.log('Expected token key:', tokenKey);
console.log('Expected user key:', userKey);

// 设置一些测试数据
safeLocalStorage.set(tokenKey, 'test-jwt-token-12345');
safeLocalStorage.set(userKey, JSON.stringify({ id: '123', username: 'testuser' }));

// 检查存储的内容
console.log('\nStored values:');
console.log('Token:', safeLocalStorage.get(tokenKey));
console.log('User:', safeLocalStorage.get(userKey));

// 列出所有localStorage项
console.log('\nAll localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`${key}: ${localStorage.getItem(key)}`);
}
