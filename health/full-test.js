#!/usr/bin/env node
/**
 * 全量功能自动化测试
 * 模拟教师/学生/家长三角色登录，遍历所有页面，点击所有按钮，填写表单
 * 运行：node health/full-test.js
 * 结果追加到：health/full-test-report.md
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const FRONTEND = 'http://localhost:5173';
const BACKEND  = 'http://localhost:3000';
const REPORT   = path.join(__dirname, 'full-test-report.md');

// UTC+8 时间戳
function ts8() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

// ANSI 颜色
const C = {
  reset:   '\x1b[0m', bold: '\x1b[1m',
  red:     '\x1b[31m', green: '\x1b[32m',
  yellow:  '\x1b[33m', cyan: '\x1b[36m',
  gray:    '\x1b[90m', magenta: '\x1b[35m',
};

const log = (icon, color, msg) =>
  console.log(`${C.gray}${ts8()}${C.reset} ${color}${icon}${C.reset} ${msg}`);

// 测试账号
const ACCOUNTS = [
  { role: 'teacher', username: 'teacher001', password: 'teacher123', label: '教师' },
  { role: 'student', username: 'student001', password: 'student123', label: '学生' },
  { role: 'parent',  username: 'parent001',  password: 'parent123',  label: '家长' },
];

// 各角色的关键页面路由
const ROUTES = {
  teacher: [
    '/teacher/dashboard',
    '/teacher/courses',
    '/teacher/assignments',
    '/teacher/students',
    '/teacher/analytics',
    '/teacher/grading',
  ],
  student: [
    '/student/dashboard',
    '/student/courses',
    '/student/assignments',
    '/student/learning-path',
    '/student/virtual-partner',
    '/student/wrong-book',
    '/student/code-editor',
    '/student/community',
  ],
  parent: [
    '/parent/dashboard',
    '/parent/learning-path',
    '/parent/wrong-book',
    '/parent/reports',
  ],
};

// 测试结果收集
const results = {
  startTime: ts8(),
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

function record(category, name, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.details.push({ category, name, status, detail });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
  const color = status === 'PASS' ? C.green : status === 'FAIL' ? C.red : C.yellow;
  log(icon, color, `[${category}] ${name}${detail ? ': ' + detail : ''}`);
}

// ─── 后端 API 预检 ────────────────────────────────────────────────────────────
async function checkBackendAPIs(token, role) {
  const http = require('http');
  const apis = [
    { method: 'GET', path: '/api/auth/me' },
    { method: 'GET', path: '/api/courses?page=1&limit=5' },
    { method: 'GET', path: '/api/assignments?page=1&pageSize=5' },
  ];
  if (role === 'teacher') {
    apis.push(
      { method: 'GET', path: '/api/teacher/dashboard' },
      { method: 'GET', path: '/api/classes' },
      { method: 'GET', path: '/api/analytics/weak-points?class_id=1' },
    );
  }
  if (role === 'student') {
    apis.push(
      { method: 'GET', path: '/api/ai-learning-path/knowledge-mastery' },
      { method: 'GET', path: '/api/video-quiz/wrong-book' },
    );
  }

  for (const api of apis) {
    await new Promise(resolve => {
      const opts = {
        host: 'localhost', port: 3000,
        path: api.path, method: api.method,
        headers: { Authorization: `Bearer ${token}` },
      };
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          const ok = res.statusCode < 400;
          record('API', `${api.method} ${api.path}`,
            ok ? 'PASS' : 'FAIL',
            `HTTP ${res.statusCode}`);
          resolve();
        });
      });
      req.on('error', e => { record('API', api.path, 'FAIL', e.message); resolve(); });
      req.setTimeout(5000, () => { req.destroy(); record('API', api.path, 'WARN', '超时'); resolve(); });
      req.end();
    });
  }
}

// ─── 页面测试 ─────────────────────────────────────────────────────────────────
async function testPage(page, url, label) {
  const errors = [];
  const consoleErrors = [];

  // 收集控制台错误
  const handler = msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 120));
  };
  page.on('console', handler);

  try {
    const resp = await page.goto(FRONTEND + url, {
      waitUntil: 'domcontentloaded', timeout: 15000,
    });
    await page.waitForTimeout(1500); // 等待异步请求

    const finalUrl = page.url();
    const redirected = !finalUrl.includes(url);

    if (redirected) {
      record('页面', label || url, 'WARN', `重定向 → ${finalUrl.replace(FRONTEND, '')}`);
    } else {
      record('页面', label || url, 'PASS', `HTTP ${resp?.status() || '?'}`);
    }

    // 点击页面内所有可见按钮（跳过危险操作）
    const SKIP_TEXT = ['删除', '注销', '退出', '清空', '重置', '取消订单', '退款'];
    const buttons = await page.locator('button:visible, .el-button:visible').all();
    let clicked = 0;
    for (const btn of buttons.slice(0, 15)) {
      try {
        const txt = (await btn.textContent() || '').trim();
        if (SKIP_TEXT.some(s => txt.includes(s))) continue;
        if (!txt || txt.length > 20) continue;
        await btn.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(300);
        clicked++;
      } catch { /* ignore */ }
    }
    if (clicked > 0) log('🖱️', C.gray, `  点击了 ${clicked} 个按钮`);

    // 填写可见的搜索框/输入框（只填，不提交）
    const inputs = await page.locator('input[type="text"]:visible, input[placeholder]:visible').all();
    for (const inp of inputs.slice(0, 3)) {
      try {
        const ph = await inp.getAttribute('placeholder') || '';
        if (ph.includes('搜索') || ph.includes('查询')) {
          await inp.fill('测试', { timeout: 1000 });
          await page.waitForTimeout(300);
        }
      } catch { /* ignore */ }
    }

    if (consoleErrors.length) {
      consoleErrors.slice(0, 3).forEach(e => {
        record('控制台', url, 'WARN', e.slice(0, 100));
      });
    }
  } catch (e) {
    record('页面', label || url, 'FAIL', e.message.slice(0, 80));
  } finally {
    page.off('console', handler);
  }
}

// ─── 登录流程 ─────────────────────────────────────────────────────────────────
async function testLogin(page, account) {
  log('🔐', C.cyan, `登录 ${account.label} 账号: ${account.username}`);
  try {
    await page.goto(FRONTEND + '/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(800);

    // 点击对应角色 Tab
    const tabs = {
      teacher: ['教师', 'teacher', '老师'],
      student: ['学生', 'student'],
      parent:  ['家长', 'parent'],
    };
    for (const kw of tabs[account.role]) {
      const tab = page.locator(`text="${kw}"`).first();
      if (await tab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
        break;
      }
    }

    // 填写用户名密码
    const userInput = page.locator('input[placeholder*="用户名"], input[name="username"], input[type="text"]').first();
    const passInput = page.locator('input[type="password"]').first();
    await userInput.fill(account.username, { timeout: 3000 });
    await passInput.fill(account.password, { timeout: 3000 });
    await page.waitForTimeout(300);

    // 点击登录按钮
    const loginBtn = page.locator('button:has-text("登录"), .el-button:has-text("登录")').first();
    await loginBtn.click({ timeout: 3000 });
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 });

    const finalUrl = page.url();
    record('登录', `${account.label}登录`, 'PASS', `→ ${finalUrl.replace(FRONTEND, '')}`);
    return true;
  } catch (e) {
    record('登录', `${account.label}登录`, 'FAIL', e.message.slice(0, 80));
    return false;
  }
}

// ─── 获取 JWT Token ───────────────────────────────────────────────────────────
async function getToken(username, password) {
  return new Promise(resolve => {
    const http = require('http');
    const body = JSON.stringify({ username, password });
    const req = http.request({
      host: 'localhost', port: 3000, path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).token || null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ─── 写入报告 ─────────────────────────────────────────────────────────────────
function writeReport() {
  const total = results.passed + results.failed + results.warnings;
  const passRate = total ? Math.round(results.passed / total * 100) : 0;
  const endTime = ts8();

  const divider = `\n${'█'.repeat(70)}\n`;
  const header = `${divider}## 全量功能测试报告
**开始时间**: ${results.startTime}
**结束时间**: ${endTime}
**测试总数**: ${total}  |  ✅ 通过: ${results.passed}  |  ❌ 失败: ${results.failed}  |  ⚠️ 警告: ${results.warnings}
**通过率**: ${passRate}%

`;

  const rows = results.details.map(d => {
    const icon = d.status === 'PASS' ? '✅' : d.status === 'FAIL' ? '❌' : '⚠️';
    return `| ${icon} | ${d.category} | ${d.name} | ${d.detail || '-'} |`;
  }).join('\n');

  const table = `| 状态 | 分类 | 名称 | 详情 |\n|------|------|------|------|\n${rows}\n`;

  const content = header + table + divider;
  fs.appendFileSync(REPORT, content, 'utf8');
  log('📄', C.green, `报告已追加到 health/full-test-report.md`);
}

// ─── 主函数 ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}  智慧教育平台 全量功能自动化测试${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}\n`);

  // 服务可用性检查
  log('🔍', C.cyan, '检查服务可用性...');
  const http = require('http');
  const checkService = (host, port) => new Promise(resolve => {
    const req = http.get({ host, port, path: '/', timeout: 3000 }, r => resolve(r.statusCode < 500));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });

  const [backendOk, frontendOk] = await Promise.all([
    checkService('localhost', 3000),
    checkService('localhost', 5173),
  ]);
  record('服务', '后端 :3000', backendOk ? 'PASS' : 'FAIL');
  record('服务', '前端 :5173', frontendOk ? 'PASS' : 'FAIL');
  if (!backendOk || !frontendOk) {
    log('❌', C.red, '前后端服务不可用，终止测试');
    writeReport();
    process.exit(1);
  }

  // 启动 Playwright（有头模式，可观察）
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
  });

  for (const account of ACCOUNTS) {
    console.log(`\n${C.bold}${C.magenta}${'─'.repeat(60)}${C.reset}`);
    console.log(`${C.bold}  测试角色: ${account.label} (${account.username})${C.reset}`);
    console.log(`${C.bold}${C.magenta}${'─'.repeat(60)}${C.reset}\n`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 监听控制台错误
    page.on('pageerror', e => record('JS异常', account.label, 'FAIL', e.message.slice(0, 100)));

    // 1. 获取 API Token 并检查后端接口
    const token = await getToken(account.username, account.password);
    if (token) {
      record('认证', `${account.label} JWT`, 'PASS', '登录成功');
      await checkBackendAPIs(token, account.role);
    } else {
      record('认证', `${account.label} JWT`, 'FAIL', '无法获取 Token');
    }

    // 2. 浏览器登录
    const loggedIn = await testLogin(page, account);
    if (!loggedIn) {
      await context.close();
      continue;
    }
    await page.waitForTimeout(1000);

    // 3. 遍历所有路由
    const routes = ROUTES[account.role] || [];
    for (const route of routes) {
      await testPage(page, route, route);
      await page.waitForTimeout(600);
    }

    // 4. 角色专项测试
    if (account.role === 'student') {
      // 测试代码编辑器提交
      log('💻', C.cyan, '  测试代码编辑器...');
      await page.goto(FRONTEND + '/student/code-editor', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      const codeArea = page.locator('textarea, .monaco-editor').first();
      if (await codeArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        record('功能', '代码编辑器加载', 'PASS');
      } else {
        record('功能', '代码编辑器加载', 'WARN', '编辑器未找到');
      }

      // 测试社区页面
      log('💬', C.cyan, '  测试社区页面...');
      await page.goto(FRONTEND + '/student/community', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      const communityContent = await page.locator('.el-card, .post-card, article').count();
      record('功能', '社区内容加载', communityContent > 0 ? 'PASS' : 'WARN',
        communityContent > 0 ? `${communityContent} 条内容` : '未找到内容卡片');
    }

    if (account.role === 'teacher') {
      // 测试课程管理
      log('📚', C.cyan, '  测试课程管理页面...');
      await page.goto(FRONTEND + '/teacher/courses', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      const courseCards = await page.locator('.el-card, .course-card').count();
      record('功能', '教师课程列表', courseCards > 0 ? 'PASS' : 'WARN',
        `${courseCards} 个课程卡片`);

      // 测试学情分析
      log('📊', C.cyan, '  测试学情分析页面...');
      await page.goto(FRONTEND + '/teacher/analytics', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      const charts = await page.locator('canvas, .echarts').count();
      record('功能', '学情分析图表', charts > 0 ? 'PASS' : 'WARN',
        `${charts} 个图表`);
    }

    // 5. 截图存档
    try {
      const screenshotDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotDir, `${account.role}-final.png`),
        fullPage: false,
      });
      log('📸', C.gray, `  截图已保存: health/screenshots/${account.role}-final.png`);
    } catch { /* ignore */ }

    await context.close();
    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();

  // 输出汇总
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}  测试完成${C.reset}`);
  const total = results.passed + results.failed + results.warnings;
  const passRate = total ? Math.round(results.passed / total * 100) : 0;
  console.log(`  ✅ 通过: ${C.green}${results.passed}${C.reset}  ❌ 失败: ${C.red}${results.failed}${C.reset}  ⚠️ 警告: ${C.yellow}${results.warnings}${C.reset}  通过率: ${C.bold}${passRate}%${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}\n`);

  writeReport();
}

main().catch(e => {
  console.error(C.red + '[测试崩溃]' + C.reset, e.message);
  writeReport();
  process.exit(1);
});
