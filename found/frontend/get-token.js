// 这个脚本用于帮助获取localStorage中的token
// 请在浏览器控制台中运行这部分代码

(function () {
  const config = {
    storagePrefix: 'learning_ai_',
  };

  const tokenKey = `${config.storagePrefix}token`;
  console.log('正在查找token，键名为:', tokenKey);

  // 检查localStorage
  const token = localStorage.getItem(tokenKey);

  if (token) {
    console.log('找到token:', token);
    console.log('Token前50个字符:', token.substring(0, 50) + (token.length > 50 ? '...' : ''));
  } else {
    console.log('未找到token，请确保您已经登录系统');

    // 检查所有localStorage项
    console.log('检查所有localStorage项:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}:`, localStorage.getItem(key).substring(0, 50) + '...');
    }
  }
})();
