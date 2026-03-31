#!/usr/bin/env node
/**
 * 实时浏览器控制台监控
 * 用法: node health/console-monitor.js
 * 监控 http://localhost:5173，实时打印控制台日志、错误、网络请求
 */

const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL  = 'http://localhost:3000';

// ANSI 颜色
const C = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
  magenta:'\x1b[35m',
};

function ts() {
  return new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

function tag(label, color) {
  return `${color}[${label}]${C.reset}`;
}

async function main() {
  console.log(`${C.bold}${C.cyan}========================================${C.reset}`);
  console.log(`${C.bold}  浏览器控制台实时监控  ${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================${C.reset}`);
  console.log(`${C.gray}前端: ${FRONTEND_URL}${C.reset}`);
  console.log(`${C.gray}后端: ${BACKEND_URL}${C.reset}`);
  console.log(`${C.gray}按 Ctrl+C 停止监控${C.reset}\n`);

  // Check backend health first
  try {
    const http = require('http');
    await new Promise((res, rej) => {
      const req = http.get(`${BACKEND_URL}/health`, r => { res(r.statusCode); });
      req.on('error', rej);
      req.setTimeout(3000, () => { req.destroy(); rej(new Error('timeout')); });
    });
    console.log(`${tag('后端', C.green)} ✅ 后端服务在线 (${BACKEND_URL})\n`);
  } catch {
    console.log(`${tag('后端', C.yellow)} ⚠️  后端连接失败，继续启动浏览器监控...\n`);
  }

  const browser = await chromium.launch({
    headless: false,   // 显示浏览器窗口，方便手动操作
    args: ['--no-sandbox', '--disable-web-security'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 EduAI-Monitor',
  });

  const page = await context.newPage();

  // ─── 控制台日志 ───────────────────────────────────────────────
  page.on('console', msg => {
    const type = msg.type();
    let color = C.gray;
    let label = type.toUpperCase();
    if (type === 'error')   { color = C.red;    label = 'ERROR'; }
    if (type === 'warn')    { color = C.yellow;  label = 'WARN '; }
    if (type === 'info')    { color = C.cyan;    label = 'INFO '; }
    if (type === 'log')     { color = C.reset;   label = 'LOG  '; }
    if (type === 'debug')   { color = C.gray;    label = 'DEBUG'; }
    const text = msg.text();
    console.log(`${C.gray}${ts()}${C.reset} ${tag(label, color)} ${text}`);
  });

  // ─── JS 未捕获异常 ────────────────────────────────────────────
  page.on('pageerror', err => {
    console.log(`\n${C.gray}${ts()}${C.reset} ${tag('UNCAUGHT', C.red)} ${C.bold}${err.message}${C.reset}`);
    if (err.stack) {
      const lines = err.stack.split('\n').slice(1, 4);
      lines.forEach(l => console.log(`  ${C.gray}${l.trim()}${C.reset}`));
    }
    console.log('');
  });

  // ─── 网络请求 ─────────────────────────────────────────────────
  page.on('request', req => {
    const url = req.url();
    // 只显示 API 请求，过滤静态资源
    if (url.includes('/api/') || url.includes('localhost:3000')) {
      console.log(`${C.gray}${ts()}${C.reset} ${tag('REQ  ', C.magenta)} ${req.method()} ${url}`);
    }
  });

  page.on('response', res => {
    const url = res.url();
    const status = res.status();
    if (url.includes('/api/') || url.includes('localhost:3000')) {
      const color = status >= 400 ? C.red : status >= 300 ? C.yellow : C.green;
      console.log(`${C.gray}${ts()}${C.reset} ${tag('RES  ', color)} ${color}${status}${C.reset} ${url}`);
    }
  });

  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('hot-update') && !url.includes('__vite')) {
      console.log(`${C.gray}${ts()}${C.reset} ${tag('FAIL ', C.red)} ${req.method()} ${url} — ${req.failure()?.errorText}`);
    }
  });

  // ─── 页面导航 ─────────────────────────────────────────────────
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`\n${C.gray}${ts()}${C.reset} ${tag('NAV  ', C.cyan)} 页面跳转 → ${frame.url()}`);
    }
  });

  // ─── 打开前端 ─────────────────────────────────────────────────
  console.log(`${tag('浏览器', C.cyan)} 正在打开 ${FRONTEND_URL}...\n`);
  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`${tag('浏览器', C.green)} 页面加载完成，开始实时监控控制台...\n`);
    console.log(`${C.gray}${'─'.repeat(60)}${C.reset}`);
  } catch (e) {
    console.log(`${tag('浏览器', C.red)} 页面加载失败: ${e.message}`);
  }

  // ─── 保持运行，等待 Ctrl+C ────────────────────────────────────
  process.on('SIGINT', async () => {
    console.log(`\n\n${C.yellow}正在关闭浏览器...${C.reset}`);
    await browser.close();
    process.exit(0);
  });

  // 每30秒打印心跳，证明监控仍在运行
  setInterval(() => {
    console.log(`${C.gray}${ts()} [PING ] 监控中... URL: ${page.url()}${C.reset}`);
  }, 30000);

  // 阻止脚本退出
  await new Promise(() => {});
}

main().catch(e => {
  console.error('监控启动失败:', e.message);
  process.exit(1);
});
