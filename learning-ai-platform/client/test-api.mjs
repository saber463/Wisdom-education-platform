/**
 * 后端API快速测试 - 测试主要接口是否可访问
 */
const BASE = 'http://[::1]:4001/api';

const tests = [
  // 不需要认证的
  { name: '登录接口 POST', method: 'POST', path: '/auth/login', body: { email: 'student1@test.com', password: 'Student123!' } },
  // 需要认证的 (用token测试)
  { name: '获取用户信息', method: 'GET', path: '/users/profile', auth: true },
  { name: '获取课程列表', method: 'GET', path: '/categories/courses' },
  { name: '获取帖子列表', method: 'GET', path: '/tweets' },
  { name: '获取小组列表', method: 'GET', path: '/groups' },
  { name: '获取测试列表', method: 'GET', path: '/tests' },
  { name: '获取成就列表', method: 'GET', path: '/achievements', auth: true },
  { name: '获取知识库分类', method: 'GET', path: '/knowledge-points/categories' },
  { name: '获取路线图', method: 'GET', path: '/ai/roadmaps' },
  { name: '获取通知', method: 'GET', path: '/notifications', auth: true },
];

let token = null;

async function run() {
  console.log('='.repeat(60));
  console.log('后端API测试');
  console.log('='.repeat(60));

  // 1. 登录获取token
  try {
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@test.com', password: 'Student123!' })
    });
    const loginData = await loginRes.json();
    if (loginData.success && loginData.token) {
      token = loginData.token;
      console.log(`✅ 登录成功, token获取成功 (${token.slice(0, 20)}...)`);
    } else {
      console.log(`⚠️  登录返回: ${JSON.stringify(loginData).slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`❌ 登录请求失败: ${err.message}`);
  }

  // 2. 测试各接口
  let passed = 0, failed = 0;
  for (const test of tests) {
    if (test.auth && !token) {
      console.log(`⏭️  [SKIP] ${test.name} (无token)`);
      continue;
    }

    try {
      const opts = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (token) opts.headers['Authorization'] = `Bearer ${token}`;
      if (test.body) opts.body = JSON.stringify(test.body);

      const res = await fetch(`${BASE}${test.path}`, opts);
      const data = await res.json().catch(() => ({}));
      const isOk = res.status >= 200 && res.status < 500;

      if (res.status === 200 || res.status === 201) {
        passed++;
        console.log(`✅ [${res.status}] ${test.name} - ${test.path}`);
      } else if (res.status === 401) {
        console.log(`⚠️  [401] ${test.name} - 需要认证`);
      } else if (res.status === 404) {
        failed++;
        console.log(`❌ [404] ${test.name} - 接口不存在！${test.path}`);
      } else {
        console.log(`⚠️  [${res.status}] ${test.name} - ${JSON.stringify(data).slice(0, 80)}`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ [ERR] ${test.name} - ${err.message}`);
    }
  }

  // 3. 测试学习路径生成 (需要认证)
  if (token) {
    console.log('\n--- 学习路径生成API测试 ---');
    try {
      const res = await fetch(`${BASE}/ai/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goal: '学习Vue3', daysNum: 3, intensity: 'low' })
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        passed++;
        console.log(`✅ [200] 学习路径生成 - 返回${data.plan?.modules?.length || 0}个模块`);
      } else {
        console.log(`⚠️  [${res.status}] 学习路径生成 - ${JSON.stringify(data).slice(0, 120)}`);
      }
    } catch (err) {
      console.log(`❌ 学习路径生成请求失败: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`结果: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(60));
}

run().catch(console.error);
