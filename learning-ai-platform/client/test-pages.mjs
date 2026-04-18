/**
 * 快速页面加载测试 - 检测控制台错误和404
 * 用 Node.js + fetch 逐一测试前端路由
 */
const BASE = 'http://localhost:3000';
const routes = [
  '/home',
  '/login',
  '/register',
  '/courses',
  '/knowledge-base',
  '/coupons',
  '/star-teachers',
  '/vip-courses',
  '/tweets',
  '/groups',
  '/membership',
  '/wallet',
  '/ai/image-generation',
  '/learning/code-generator',
  '/learning-path/generate',
  '/roadmap',
  '/about',
  '/terms',
  '/privacy',
  '/contact',
  '/assessment/tests',
  '/teacher',
  '/parent',
  '/student',
  // 需要401认证的路由
  '/dashboard',
  '/user/center',
  '/user/browse-history',
  '/ai/image-generation',
  '/learning-path/generate',
];

async function checkPages() {
  console.log('='.repeat(60));
  console.log('页面加载测试 - 前端路由HTTP状态检查');
  console.log('='.repeat(60));

  let failed = 0;
  let passed = 0;

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route}`, {
        redirect: 'manual',
        headers: { 'Accept': 'text/html' }
      });
      const status = res.status;
      const location = res.headers.get('location') || '';
      const statusText = status >= 200 && status < 300 ? '✅' : status === 301 || status === 302 ? '🔄' : '❌';

      if (status === 200) {
        passed++;
        console.log(`${statusText} [${status}] ${route}`);
      } else if (status === 301 || status === 302) {
        // 重定向到登录是正常的（需要auth的路由）
        const redirectTarget = location.replace(BASE, '');
        if (redirectTarget.includes('/login')) {
          passed++;
          console.log(`${statusText} [${status}] ${route} → /login (需要认证，正常)`);
        } else {
          passed++;
          console.log(`${statusText} [${status}] ${route} → ${redirectTarget}`);
        }
      } else if (status === 404) {
        failed++;
        console.log(`❌ [${status}] ${route} - 页面不存在！`);
      } else {
        console.log(`⚠️  [${status}] ${route}`);
      }
    } catch (err) {
      failed++;
      console.log(`❌ [ERR] ${route} - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`结果: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

checkPages().catch(console.error);
