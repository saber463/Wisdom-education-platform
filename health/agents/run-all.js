#!/usr/bin/env node
/**
 * Agent 协调器 — 串联所有 Agent，完成后发微信通知
 * Token 从根目录 .env 读取（WECHAT_NOTIFY_TOKEN）
 * 用法: node health/agents/run-all.js
 *
 * 执行顺序：
 *   Agent3（测试合并）→ Agent2（健康检查）→ Agent4（CI/CD）→ Agent5（前端测试）
 *   → 微信通知
 *   Agent1（守护进程）需单独启动，不在此流程内
 */

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT   = path.resolve(__dirname, '../..');
const HEALTH = path.resolve(__dirname, '..');
const AGENTS = __dirname;

const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .reduce((acc, l) => {
      const [k, ...v] = l.split('=');
      acc[k.trim()] = v.join('=').trim();
      return acc;
    }, {});
}

function log(msg) {
  console.log(`[Orchestrator] ${msg}`);
}

function runAgent(scriptPath) {
  const result = spawnSync('node', [scriptPath], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
    timeout: 600000, // 10分钟超时
  });
  return result.status === 0;
}

function readResult(file) {
  const p = path.join(HEALTH, file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

async function sendWechat(title, content) {
  const env = loadEnv();
  const token = env.WECHAT_NOTIFY_TOKEN;
  if (!token || token.startsWith('在此填入')) {
    log('⚠️  未配置微信 Token，跳过通知（在 .env 填写 WECHAT_NOTIFY_TOKEN）');
    return;
  }
  // 正确接口：https://wx.xtuis.cn/TOKEN.send?text=标题&desp=内容
  return new Promise((resolve) => {
    const encodedTitle   = encodeURIComponent(title);
    const encodedContent = encodeURIComponent(content);
    const reqPath = `/${token}.send?text=${encodedTitle}&desp=${encodedContent}`;
    const req = https.request(
      { hostname: 'wx.xtuis.cn', path: reqPath, method: 'GET' },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          if (d.includes('success')) log('📱 微信通知已发送');
          else log(`⚠️  微信通知响应异常: ${d.slice(0, 100)}`);
          resolve();
        });
      }
    );
    req.on('error', () => { log('⚠️  微信通知发送失败（网络问题）'); resolve(); });
    req.end();
  });
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  log('='.repeat(60));
  log(`多 Agent 自动化体系启动  ${NOW}`);
  log('='.repeat(60));

  const timeline = [];

  // Agent 3 — 测试合并（最快，先跑）
  log('\n▶ [1/4] Agent3 测试合并...');
  const a3ok = runAgent(path.join(AGENTS, 'agent3-merge-tests.js'));
  const a3   = readResult('.agent3-result.json');
  timeline.push({ name: 'Agent3 测试合并', ok: a3ok, detail: a3 ? `${a3.count} 个文件` : '见报告' });

  // Agent 2 — 健康检查
  log('\n▶ [2/4] Agent2 健康检查...');
  const a2ok = runAgent(path.join(AGENTS, 'agent2-health.js'));
  const a2   = readResult('.agent2-result.json');
  timeline.push({ name: 'Agent2 健康检查', ok: a2ok, detail: a2 ? JSON.stringify(a2.checks) : '见报告' });

  // Agent 4 — CI/CD（构建+测试，失败不阻断通知）
  log('\n▶ [3/4] Agent4 CI/CD 流水线...');
  const a4ok = runAgent(path.join(AGENTS, 'agent4-cicd.js'));
  const a4   = readResult('.agent4-result.json');
  timeline.push({ name: 'Agent4 CI/CD', ok: a4ok, detail: a4 ? `${a4.steps?.filter(s=>s.ok).length}/${a4.steps?.length} 步骤通过` : '见报告' });

  // Agent 5 — 前端 E2E（需前端服务已启动）
  log('\n▶ [4/4] Agent5 前端 E2E 测试...');
  const a5ok = runAgent(path.join(AGENTS, 'agent5-frontend-test.js'));
  const a5   = readResult('.agent5-result.json');
  timeline.push({ name: 'Agent5 前端测试', ok: a5ok || (a5?.skipped), detail: a5?.skipped ? '前端未启动，已跳过' : `访问 ${a5?.roles?.map(r=>r.visited).reduce((a,b)=>a+b,0)} 页面` });

  // ── 汇总 ──────────────────────────────────────────────────────────────────
  const allOk  = [a2ok, a4ok].every(Boolean); // Agent5 跳过不计入整体
  const summary = timeline.map(t => `${t.ok ? '✅' : '❌'} ${t.name}：${t.detail}`).join('\n');

  log('\n' + '='.repeat(60));
  log('执行摘要：');
  timeline.forEach(t => log(`  ${t.ok ? '✅' : '❌'} ${t.name}`));
  log('='.repeat(60));
  log(allOk ? '🎉 全部核心检查通过！' : '⚠️  存在失败项，请查看 health/health-report.md');

  // ── 微信通知 ──────────────────────────────────────────────────────────────
  const notifyTitle = allOk
    ? '✅ 智慧教育平台 全部检查通过'
    : '❌ 智慧教育平台 CI/CD 发现问题';

  const notifyContent = [
    `检查时间：${NOW}（UTC+8）`,
    `总体状态：${allOk ? '✅ 全部通过' : '❌ 存在问题'}`,
    '',
    summary,
    '',
    '报告位置：health/health-report.md',
    allOk ? '\n代码已就绪，如需上传请手动执行 git push。' : '\n请先修复问题再提交代码。',
  ].join('\n');

  await sendWechat(notifyTitle, notifyContent);
  log('');

  process.exit(allOk ? 0 : 1);
}

main().catch(e => {
  log(`运行出错: ${e.message}`);
  process.exit(1);
});
