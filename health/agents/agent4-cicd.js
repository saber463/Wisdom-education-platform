#!/usr/bin/env node
/**
 * Agent 4 — CI/CD 流水线
 * 执行：构建 → 单元测试 → 打包
 * 遇到错误自动重试（最多 MAX_RETRY 次），仍失败则写入报告并退出
 * 用法: node health/agents/agent4-cicd.js
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const HEALTH = path.resolve(__dirname, '..');
const REPORT = path.join(HEALTH, 'health-report.md');
const MAX_RETRY = 3;

const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

function run(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'], timeout: 300000 }).trim();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).trim() };
  }
}

function appendReport(content) {
  if (!fs.existsSync(REPORT)) fs.writeFileSync(REPORT, '# 项目健康度报告\n\n', 'utf8');
  fs.appendFileSync(REPORT, content, 'utf8');
}

// 带重试的步骤执行器
function runWithRetry(name, cmd, cwd, maxRetry = MAX_RETRY) {
  let lastResult;
  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    console.log(`[Agent4] [${name}] 第 ${attempt}/${maxRetry} 次尝试...`);
    lastResult = run(cmd, cwd);
    if (lastResult.ok) {
      console.log(`[Agent4] [${name}] ✅ 通过（第 ${attempt} 次）`);
      return { ...lastResult, attempts: attempt };
    }
    console.log(`[Agent4] [${name}] ❌ 失败，输出:\n${lastResult.out.slice(0, 300)}`);
    if (attempt < maxRetry) {
      console.log(`[Agent4] [${name}] 等待 2 秒后重试...`);
      // 同步等待（CI 场景下可接受）
      const end = Date.now() + 2000;
      while (Date.now() < end) { /* 空转等待 */ }
    }
  }
  return { ...lastResult, attempts: maxRetry };
}

console.log('[Agent4] === CI/CD 流水线启动 ===');

// ── Step 1: 后端构建 ──────────────────────────────────────────────────────────
const beBuild = runWithRetry('后端构建', 'npm run build 2>&1', path.join(ROOT, 'backend'));

// ── Step 2: 前端构建（跳过类型检查加速 CI） ───────────────────────────────────
const feBuild = runWithRetry('前端构建', 'npm run build:ci 2>&1', path.join(ROOT, 'frontend'));

// ── Step 3: 后端单元测试 ──────────────────────────────────────────────────────
const beTest = runWithRetry('后端测试', 'npm run test 2>&1', path.join(ROOT, 'backend'));

// ── Step 4: 前端单元测试 ──────────────────────────────────────────────────────
const feTest = runWithRetry('前端测试', 'npm run test 2>&1', path.join(ROOT, 'frontend'));

// ── 汇总 ──────────────────────────────────────────────────────────────────────
const steps = [
  { name: '后端构建', result: beBuild },
  { name: '前端构建', result: feBuild },
  { name: '后端单元测试', result: beTest },
  { name: '前端单元测试', result: feTest },
];
const allOk = steps.every(s => s.result.ok);

const tableRows = steps.map(s =>
  `| ${s.name} | ${s.result.ok ? '✅ 通过' : '❌ 失败'} | ${s.result.attempts} 次尝试 |`
).join('\n');

const block = `
${'═'.repeat(80)}
## [Agent4] CI/CD 流水线  ${NOW}（UTC+8）
## 总体状态：${allOk ? '✅ 全流程通过' : '❌ 流水线失败'}
${'═'.repeat(80)}

| 步骤 | 状态 | 重试次数 |
|------|------|----------|
${tableRows}

${steps.filter(s => !s.result.ok).map(s => `
<details><summary>❌ ${s.name} 错误详情</summary>

\`\`\`
${s.result.out.slice(0, 2000)}
\`\`\`
</details>
`).join('\n')}

`;

appendReport(block);
console.log(`[Agent4] 报告已追加到 health/health-report.md`);

fs.writeFileSync(
  path.join(HEALTH, '.agent4-result.json'),
  JSON.stringify({ ok: allOk, time: NOW, steps: steps.map(s => ({ name: s.name, ok: s.result.ok, attempts: s.result.attempts })) }, null, 2),
  'utf8'
);

console.log(`[Agent4] ${allOk ? '✅ CI/CD 全部通过' : '❌ CI/CD 存在失败步骤'}`);
process.exit(allOk ? 0 : 1);
