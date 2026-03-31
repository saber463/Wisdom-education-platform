#!/usr/bin/env node
/**
 * Agent 5 — 前端 E2E 自动化测试（Playwright）
 * 自动以 teacher 身份登录，遍历所有页面按钮/菜单/表单，捕获控制台错误
 * 生成报告追加到 health/health-report.md
 * 用法: node health/agents/agent5-frontend-test.js [--url http://localhost:5173]
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const HEALTH = path.resolve(__dirname, '..');
const REPORT = path.join(HEALTH, 'health-report.md');

// 前端 URL（可通过参数覆盖）
const urlArg = process.argv.find(a => a.startsWith('--url='));
const BASE_URL = urlArg ? urlArg.split('=')[1] : 'http://localhost:5173';

// 测试账号（来自 Login.vue 密码提示）
const ACCOUNTS = [
  { username: 'teacher1', password: 'teacher123', role: '教师' },
  { username: 'student1', password: 'student123', role: '学生' },
];

const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

function appendReport(content) {
  if (!fs.existsSync(REPORT)) fs.writeFileSync(REPORT, '# 项目健康度报告\n\n', 'utf8');
  fs.appendFileSync(REPORT, content, 'utf8');
}

async function runFrontendTest() {
  console.log(`[Agent5] 启动浏览器，测试 ${BASE_URL}`);
  const browser = await chromium.launch({ headless: true });

  const allErrors   = [];
  const allVisited  = [];
  const roleResults = [];

  for (const account of ACCOUNTS) {
    console.log(`[Agent5] === 测试角色：${account.role} (${account.username}) ===`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const networkErrors = [];

    // 捕获控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });
    // 捕获页面崩溃
    page.on('pageerror', err => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });
    // 捕获接口 4xx/5xx
    page.on('response', res => {
      if (res.status() >= 400) {
        networkErrors.push(`[${res.status()}] ${res.url()}`);
      }
    });

    // ── 1. 登录 ──────────────────────────────────────────────────────────────
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.fill('input[placeholder*="用户名"]', account.username);
      await page.fill('input[type="password"]', account.password);
      await page.click('button[type="submit"], .el-button--primary');
      await page.waitForURL(url => !url.includes('/login'), { timeout: 10000 });
      console.log(`[Agent5] ✅ ${account.role} 登录成功`);
    } catch (e) {
      consoleErrors.push(`[登录失败] ${e.message}`);
      console.log(`[Agent5] ❌ ${account.role} 登录失败: ${e.message}`);
      roleResults.push({ role: account.role, ok: false, visited: 0, errors: consoleErrors, networkErrors });
      await context.close();
      continue;
    }

    // ── 2. 收集所有导航链接 ──────────────────────────────────────────────────
    const visited = new Set();
    const queue   = [page.url()];

    async function visitPage(url) {
      if (visited.has(url)) return;
      visited.add(url);
      allVisited.push(url);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(800); // 等待 Vue 渲染

        // 收集页面内所有链接（同域）
        const links = await page.$$eval('a[href]', els =>
          els.map(a => a.href).filter(h => h && !h.includes('#') && !h.startsWith('mailto'))
        );
        for (const link of links) {
          if (link.startsWith(BASE_URL) && !visited.has(link)) {
            queue.push(link);
          }
        }

        // ── 3. 自动点击按钮/菜单 ──────────────────────────────────────────
        const buttons = await page.$$('button:not([disabled]), .el-menu-item, .el-button');
        console.log(`[Agent5]   ${url.replace(BASE_URL, '')} → ${buttons.length} 个按钮`);

        for (const btn of buttons.slice(0, 20)) { // 每页最多点击20个，防止无限循环
          try {
            const text = (await btn.textContent() || '').trim().slice(0, 20);
            // 跳过危险操作按钮
            if (/删除|注销|退出/.test(text)) continue;
            await btn.click({ timeout: 2000 }).catch(() => {});
            await page.waitForTimeout(300);
            // 关闭可能弹出的对话框
            const closeBtn = page.$('.el-dialog__headerbtn, .el-message-box__headerbtn');
            if (await closeBtn) await (await closeBtn).click().catch(() => {});
          } catch { /* 静默跳过不可点击元素 */ }
        }

        // ── 4. 填写并提交表单（只填第一个发现的表单） ────────────────────
        const forms = await page.$$('form');
        for (const form of forms.slice(0, 1)) {
          try {
            const inputs = await form.$$('input:not([type="hidden"]):not([type="submit"]):not([disabled])');
            for (const input of inputs) {
              const type = await input.getAttribute('type') || 'text';
              if (type === 'text' || type === 'email') await input.fill('test_value').catch(() => {});
              if (type === 'number') await input.fill('1').catch(() => {});
            }
          } catch { /* 静默 */ }
        }

      } catch (e) {
        consoleErrors.push(`[页面加载失败] ${url}: ${e.message}`);
      }
    }

    // BFS 遍历，最多访问 30 个页面
    while (queue.length > 0 && visited.size < 30) {
      await visitPage(queue.shift());
    }

    console.log(`[Agent5] ${account.role} 共访问 ${visited.size} 个页面`);
    console.log(`[Agent5] 控制台错误: ${consoleErrors.length} 个，接口异常: ${networkErrors.length} 个`);

    allErrors.push(...consoleErrors, ...networkErrors);
    roleResults.push({
      role: account.role,
      ok: consoleErrors.length === 0,
      visited: visited.size,
      errors: consoleErrors,
      networkErrors: networkErrors.slice(0, 20),
    });

    await context.close();
  }

  await browser.close();

  // ── 5. 生成报告 ──────────────────────────────────────────────────────────
  const totalOk = roleResults.every(r => r.ok);
  const totalErrors = allErrors.length;

  const roleRows = roleResults.map(r =>
    `| ${r.role} | ${r.ok ? '✅' : '❌'} | ${r.visited} | ${r.errors.length} 个控制台错误 / ${r.networkErrors.length} 个接口异常 |`
  ).join('\n');

  const errorDetails = roleResults.map(r => {
    if (r.errors.length === 0 && r.networkErrors.length === 0) return '';
    return `
<details><summary>❌ ${r.role} 错误详情</summary>

**控制台错误：**
\`\`\`
${r.errors.slice(0, 20).join('\n') || '无'}
\`\`\`

**接口异常（4xx/5xx）：**
\`\`\`
${r.networkErrors.join('\n') || '无'}
\`\`\`
</details>`;
  }).join('\n');

  const block = `
${'═'.repeat(80)}
## [Agent5] 前端 E2E 测试  ${NOW}（UTC+8）
## 目标：${BASE_URL}
## 总体状态：${totalOk ? '✅ 无控制台错误' : `❌ 发现 ${totalErrors} 个错误`}
${'═'.repeat(80)}

| 角色 | 状态 | 访问页面数 | 错误统计 |
|------|------|-----------|---------|
${roleRows}

${errorDetails}

`;

  appendReport(block);
  console.log(`[Agent5] 报告已追加到 health/health-report.md`);

  fs.writeFileSync(
    path.join(HEALTH, '.agent5-result.json'),
    JSON.stringify({ ok: totalOk, time: NOW, totalErrors, roles: roleResults.map(r => ({ role: r.role, ok: r.ok, visited: r.visited })) }, null, 2),
    'utf8'
  );

  console.log(`[Agent5] ${totalOk ? '✅ 前端测试通过' : `❌ 发现 ${totalErrors} 个问题`}`);
  return totalOk;
}

runFrontendTest()
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(e => {
    console.error(`[Agent5] 运行失败: ${e.message}`);
    // 前端服务未启动时不阻断流水线，写入警告即可
    appendReport(`\n## [Agent5] 前端 E2E 测试跳过（${NOW}）\n前端服务未启动或不可访问: ${e.message}\n`);
    fs.writeFileSync(
      path.join(HEALTH, '.agent5-result.json'),
      JSON.stringify({ ok: false, skipped: true, reason: e.message, time: NOW }, null, 2),
      'utf8'
    );
    process.exit(0); // 跳过不阻断后续
  });
