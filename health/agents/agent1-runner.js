#!/usr/bin/env node
/**
 * Agent 1 — 项目运行守护进程
 * 监听 backend/src 和 frontend/src 变化，自动重启对应服务
 * 用法: node health/agents/agent1-runner.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '../..');

function timestamp() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

function log(tag, msg) {
  console.log(`[${timestamp()}] [${tag}] ${msg}`);
}

function startProcess(name, cmd, args, cwd, color) {
  const colors = { backend: '\x1b[36m', frontend: '\x1b[35m', reset: '\x1b[0m' };
  const c = colors[color] || '';

  let proc = null;
  let restarting = false;

  function start() {
    log(name, `启动: ${cmd} ${args.join(' ')}`);
    proc = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    proc.stdout.on('data', d => process.stdout.write(`${c}[${name}]${colors.reset} ${d}`));
    proc.stderr.on('data', d => process.stderr.write(`${c}[${name}]${colors.reset} ${d}`));

    proc.on('exit', (code) => {
      if (restarting) return;
      if (code !== 0) {
        log(name, `进程退出(code=${code})，3秒后自动重启...`);
        setTimeout(start, 3000);
      }
    });
  }

  function restart() {
    if (!proc) { start(); return; }
    restarting = true;
    log(name, '检测到文件变更，重启中...');
    proc.kill('SIGTERM');
    setTimeout(() => {
      restarting = false;
      start();
    }, 1500);
  }

  start();

  return { restart, kill: () => proc && proc.kill('SIGTERM') };
}

// 简易文件监听（不依赖 chokidar）
function watchDir(dir, onChange, debounceMs = 1000) {
  if (!fs.existsSync(dir)) return;
  let timer = null;
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    if (/node_modules|\.git|dist/.test(filename)) return;
    clearTimeout(timer);
    timer = setTimeout(() => onChange(filename), debounceMs);
  });
}

log('RUNNER', '=== Agent 1 项目运行守护进程启动 ===');
log('RUNNER', `项目根目录: ${ROOT}`);

// 启动后端（tsx watch 已内置热重载，这里用 spawn 包装保证自动重启）
const backend = startProcess(
  'BACKEND', 'npm', ['run', 'dev'],
  path.join(ROOT, 'backend'), 'backend'
);

// 启动前端（vite 自带 HMR，同样包装自动重启）
const frontend = startProcess(
  'FRONTEND', 'npm', ['run', 'dev'],
  path.join(ROOT, 'frontend'), 'frontend'
);

// 监听源码变更（仅用于额外通知，vite/tsx 自身会处理热重载）
watchDir(path.join(ROOT, 'backend', 'src'), (f) => {
  log('RUNNER', `后端文件变更: ${f}`);
});
watchDir(path.join(ROOT, 'frontend', 'src'), (f) => {
  log('RUNNER', `前端文件变更: ${f}`);
});

// 优雅退出
process.on('SIGINT', () => {
  log('RUNNER', '收到退出信号，关闭所有服务...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

log('RUNNER', '后端 http://localhost:3000 | 前端 http://localhost:5173');
log('RUNNER', 'Ctrl+C 退出');
