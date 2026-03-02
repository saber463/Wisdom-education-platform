// 模拟浏览器localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(n) {
    const keys = Object.keys(this.store);
    return keys[n] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

// 创建localStorage实例
global.localStorage = new LocalStorageMock();

// 模拟存储一些数据
localStorage.setItem('learning_ai_token', 'test-token-value');
localStorage.setItem('learning_ai_user', JSON.stringify({ id: 1, username: 'testuser' }));
localStorage.setItem('other_key', 'other_value');

// 输出所有存储内容
console.log('LocalStorage contents:');
Object.keys(localStorage).forEach(key => {
  console.log(`${key}: ${localStorage.getItem(key)}`);
});

// 检查特定的token键
const tokenKey = 'learning_ai_token';
const tokenValue = localStorage.getItem(tokenKey);
console.log(`\nToken key "${tokenKey}" exists: ${!!tokenValue}`);
if (tokenValue) {
  console.log(`Token value: ${tokenValue.substring(0, 20)}...`);
}
