#!/usr/bin/env node
/**
 * Agent 2 — 健康检查
 * 语法/依赖/lint/构建检查，结果追加到 health/health-report.md
 * 用法: node health/agents/agent2-health.js
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const HEALTH = path.resolve(__dirname, '..');
const REPORT = path.join(HEALTH, 'health-report.md');

const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

function run(cmd, cwd = ROOT) {
  try {
    return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'], timeout: 180000 }).trim() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).trim() };
  }
}

function badge(ok) { return ok ? '✅ 通过' : '❌ 失败'; }

function appendReport(content) {
  if (!fs.existsSync(REPORT)) {
    fs.writeFileSync(REPORT, '# 项目健康度报告（历史追加）\n\n', 'utf8');
  }
  fs.appendFileSync(REPORT, content, 'utf8');
}

console.log('[Agent2] 开始健康检查...');

// ── 依赖完整性检查 ────────────────────────────────────────────────────────────
console.log('[Agent2] [1/6] 检查后端依赖...');
const beDeps = run('npm ls --depth=0 2>&1 | grep -i "missing\\|ERR" | head -20 || echo OK', path.join(ROOT, 'backend'));

console.log('[Agent2] [2/6] 检查前端依赖...');
const feDeps = run('npm ls --depth=0 2>&1 | grep -i "missing\\|ERR" | head -20 || echo OK', path.join(ROOT, 'frontend'));

// ── TypeScript 语法检查 ───────────────────────────────────────────────────────
console.log('[Agent2] [3/6] 后端 TypeScript...');
const beTsc = run('npx tsc --noEmit', path.join(ROOT, 'backend'));

console.log('[Agent2] [4/6] 前端 TypeScript...');
const feTsc = run('npx tsc --noEmit', path.join(ROOT, 'frontend'));

// ── ESLint 代码规范 ───────────────────────────────────────────────────────────
console.log('[Agent2] [5/6] 前端 ESLint...');
const feLint = run('npm run lint 2>&1', path.join(ROOT, 'frontend'));

// ── 构建检查 ──────────────────────────────────────────────────────────────────
console.log('[Agent2] [6/6] 前端构建...');
const feBuild = run('npm run build 2>&1', path.join(ROOT, 'frontend'));

// ── 汇总 ──────────────────────────────────────────────────────────────────────
const checks = { beTsc, feTsc, feLint, feBuild };
const allOk  = Object.values(checks).every(r => r.ok);
const lintW  = (feLint.out.match(/(\d+) problems/)?.[1]) ?? '0';
const lintE  = feLint.ok ? '0' : (feLint.out.match(/(\d+) errors/)?.[1] ?? '?');

const block = `
${'═'.repeat(80)}
## [Agent2] 健康检查  ${NOW}（UTC+8）
## 总体状态：${allOk ? '✅ 全部通过' : '❌ 存在问题'}
${'═'.repeat(80)}

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端依赖完整性 | ${beDeps.out.includes('OK') ? '✅ 通过' : '⚠️ 有警告'} | npm ls 检查 |
| 前端依赖完整性 | ${feDeps.out.includes('OK') ? '✅ 通过' : '⚠️ 有警告'} | npm ls 检查 |
| 后端 TypeScript | ${badge(beTsc.ok)} | ${beTsc.ok ? '无类型错误' : '有编译错误'} |
| 前端 TypeScript | ${badge(feTsc.ok)} | ${feTsc.ok ? '无类型错误' : '有编译错误'} |
| 前端 ESLint | ${badge(feLint.ok)} | 错误 ${lintE} 个，警告 ${lintW} 个 |
| 前端生产构建 | ${badge(feBuild.ok)} | ${feBuild.ok ? '构建成功' : '构建失败'} |

### 详细输出

<details><summary>后端 TypeScript</summary>

\`\`\`
${beTsc.out || '(通过，无输出)'}
\`\`\`
</details>

<details><summary>前端 TypeScript</summary>

\`\`\`
${feTsc.out || '(通过，无输出)'}
\`\`\`
</details>

<details><summary>前端 ESLint</summary>

\`\`\`
${feLint.out.slice(0, 2000) || '(通过，无输出)'}
\`\`\`
</details>

<details><summary>前端构建</summary>

\`\`\`
${feBuild.out.slice(0, 1500) || '(通过，无输出)'}
\`\`\`
</details>

`;

appendReport(block);
console.log(`[Agent2] 报告已追加到 health/health-report.md`);

// 输出结果供协调器读取
const result = { ok: allOk, time: NOW, checks: { beTsc: beTsc.ok, feTsc: feTsc.ok, feLint: feLint.ok, feBuild: feBuild.ok } };
fs.writeFileSync(path.join(HEALTH, '.agent2-result.json'), JSON.stringify(result, null, 2), 'utf8');

console.log(`[Agent2] ${allOk ? '✅ 全部通过' : '❌ 存在问题'}`);
process.exit(allOk ? 0 : 1);
