#!/usr/bin/env node
/**
 * Agent 3 — 测试合并
 * 收集所有 .test.ts/.test.js/.spec.ts/.spec.js 文件，
 * 合并为 health/combined-tests.js（追加模式，含时间戳分隔）
 * 用法: node health/agents/agent3-merge-tests.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const HEALTH = path.resolve(__dirname, '..');
const OUTPUT = path.join(HEALTH, 'combined-tests.js');

const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

function findFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'health'].includes(entry.name)) walk(full);
      } else if (exts.some(e => entry.name.endsWith(e))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results.sort();
}

console.log('[Agent3] 开始收集测试文件...');

const TEST_EXTS = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
const files = findFiles(ROOT, TEST_EXTS);

console.log(`[Agent3] 发现 ${files.length} 个测试文件`);

// ── 构建追加块 ────────────────────────────────────────────────────────────────
const divider = '█'.repeat(80);
let block = `\n${divider}\n// 测试合并快照时间：${NOW}（UTC+8）\n// 共 ${files.length} 个测试文件\n${divider}\n\n`;

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  block += `${'─'.repeat(80)}\n// 文件: ${rel}\n${'─'.repeat(80)}\n`;
  block += content + '\n\n';
}

fs.appendFileSync(OUTPUT, block, 'utf8');

const sizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(`[Agent3] ✅ 已追加到 health/combined-tests.js（当前共 ${sizeKB} KB）`);

// 写结果供协调器读取
fs.writeFileSync(
  path.join(HEALTH, '.agent3-result.json'),
  JSON.stringify({ ok: true, count: files.length, time: NOW }, null, 2),
  'utf8'
);

process.exit(0);
