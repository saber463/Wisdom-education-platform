#!/usr/bin/env node
/**
 * 健康报告生成器
 * 运行方式：node health/generate.js
 * 输出（追加模式，不覆盖旧内容）：
 *   health/tests-merged.txt   — 所有测试文件内容合并（按时间追加）
 *   health/report.md          — 项目健康度总报告（按时间追加）
 * 通知：检查完成后发微信推送（需在根目录 .env 填写 WECHAT_NOTIFY_TOKEN）
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const HEALTH = __dirname;

// 读取 .env（简单解析，不引入依赖）
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

// 微信推送（xtuis.cn），失败静默
async function sendWechatNotify(title, content) {
  const env = loadEnv();
  const token = env.WECHAT_NOTIFY_TOKEN;
  if (!token || token.startsWith('在此填入')) {
    console.log('  ⚠️  未配置微信 Token，跳过通知（在 .env 填写 WECHAT_NOTIFY_TOKEN）');
    return;
  }
  try {
    const https = require('https');
    const encodedTitle   = encodeURIComponent(title);
    const encodedContent = encodeURIComponent(content);
    await new Promise((resolve) => {
      const req = https.request(
        { hostname: 'wx.xtuis.cn', path: `/${token}.send?text=${encodedTitle}&desp=${encodedContent}`, method: 'GET' },
        res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            if (d.includes('success')) console.log('  📱 微信通知已发送');
            else console.log(`  ⚠️  微信通知响应异常: ${d.slice(0,100)}`);
            resolve();
          });
        }
      );
      req.on('error', resolve); // 失败静默
      req.end();
    });
    console.log('  📱 微信通知已发送');
  } catch {
    console.log('  ⚠️  微信通知发送失败（网络问题），继续执行');
  }
}

// UTC+8 时间戳
const NOW = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function run(cmd, cwd = ROOT) {
  try {
    return { ok: true, out: execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function badge(ok) { return ok ? '✅ 通过' : '❌ 失败'; }

function findFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(entry.name)) walk(full);
      } else if (exts.some(e => entry.name.endsWith(e))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results.sort();
}

// 追加写入（在文件末尾添加内容）
function appendToFile(filePath, content) {
  fs.appendFileSync(filePath, content, { encoding: 'utf8' });
}

// ─── 1. 合并所有测试文件（追加） ─────────────────────────────────────────────

console.log('📁 收集测试文件...');
const testFiles = findFiles(ROOT, ['.test.ts', '.test.js', '.spec.ts', '.spec.js'])
  .filter(f => !f.includes(path.join(ROOT, 'health')));

const testSeparator = `\n${'█'.repeat(80)}\n█  测试快照时间：${NOW}（UTC+8）  共 ${testFiles.length} 个文件\n${'█'.repeat(80)}\n\n`;

let mergedBlock = testSeparator;
for (const file of testFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  mergedBlock += `${'─'.repeat(80)}\n`;
  mergedBlock += `文件：${rel}\n`;
  mergedBlock += `${'─'.repeat(80)}\n`;
  mergedBlock += content + '\n\n';
}

appendToFile(path.join(HEALTH, 'tests-merged.txt'), mergedBlock);
console.log(`  → ${testFiles.length} 个测试文件已追加到 health/tests-merged.txt`);

// ─── 2. 执行各项检查 ──────────────────────────────────────────────────────────

console.log('\n🔍 执行健康检查...');

console.log('  [1/5] 后端 TypeScript...');
const beTsc = run('npx tsc --noEmit', path.join(ROOT, 'backend'));

console.log('  [2/5] 前端 TypeScript...');
const feTsc = run('npx tsc --noEmit', path.join(ROOT, 'frontend'));

console.log('  [3/5] 前端 ESLint...');
const feLint = run('npm run lint 2>&1', path.join(ROOT, 'frontend'));

console.log('  [4/5] 后端构建...');
const beBuild = run('npm run build 2>&1', path.join(ROOT, 'backend'));

console.log('  [5/5] 前端构建...');
const feBuild = run('npm run build 2>&1', path.join(ROOT, 'frontend'));

// ─── 3. 收集现有历史报告 ──────────────────────────────────────────────────────

const reportFiles = findFiles(ROOT, ['.md'])
  .filter(f => {
    const rel = f.replace(/\\/g, '/');
    return /health|report|test/i.test(path.basename(f))
      && !rel.includes('/health/')
      && !rel.includes('node_modules');
  });

let historySection = '';
for (const rf of reportFiles) {
  const rel = path.relative(ROOT, rf).replace(/\\/g, '/');
  const raw = fs.readFileSync(rf, 'utf8');
  const content = raw.slice(0, 3000);
  const truncated = raw.length > 3000 ? '\n…（内容过长，已截断）\n' : '';
  historySection += `\n### ${rel}\n\n\`\`\`\n${content}${truncated}\`\`\`\n`;
}

// ─── 4. 汇总结果 ──────────────────────────────────────────────────────────────

const allOk = [beTsc, feTsc, feLint, beBuild, feBuild].every(r => r.ok);
const lintWarnings = (feLint.out.match(/(\d+) problems/)?.[1]) ?? '0';
const lintErrors   = feLint.ok ? '0' : (feLint.out.match(/(\d+) errors/)?.[1] ?? '?');

// ─── 5. 追加到 report.md ──────────────────────────────────────────────────────

const reportBlock = `
${'═'.repeat(80)}
## 检查时间：${NOW}（UTC+8）
## 总体状态：${allOk ? '✅ 全部通过' : '❌ 存在问题'}
${'═'.repeat(80)}

### 检查汇总

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端 TypeScript 编译 | ${badge(beTsc.ok)} | ${beTsc.ok ? '无类型错误' : '有编译错误'} |
| 前端 TypeScript 编译 | ${badge(feTsc.ok)} | ${feTsc.ok ? '无类型错误' : '有编译错误'} |
| 前端 ESLint | ${badge(feLint.ok)} | 错误 ${lintErrors} 个，警告 ${lintWarnings} 个 |
| 后端生产构建 | ${badge(beBuild.ok)} | ${beBuild.ok ? '构建成功' : '构建失败'} |
| 前端生产构建 | ${badge(feBuild.ok)} | ${feBuild.ok ? '构建成功' : '构建失败'} |

### 测试文件统计

- 共发现测试文件：**${testFiles.length} 个**
- 合并快照已追加至：\`health/tests-merged.txt\`

<details>
<summary>测试文件列表（点击展开）</summary>

${testFiles.map(f => '- `' + path.relative(ROOT, f).replace(/\\/g, '/') + '`').join('\n')}

</details>

### 详细输出

#### 后端 TypeScript \`tsc --noEmit\`
\`\`\`
${beTsc.out || '(无输出，检查通过)'}
\`\`\`

#### 前端 TypeScript \`tsc --noEmit\`
\`\`\`
${feTsc.out || '(无输出，检查通过)'}
\`\`\`

#### 前端 ESLint
\`\`\`
${feLint.out.slice(0, 3000) || '(无输出)'}
\`\`\`

#### 后端构建
\`\`\`
${beBuild.out.slice(0, 2000) || '(无输出)'}
\`\`\`

#### 前端构建
\`\`\`
${feBuild.out.slice(0, 2000) || '(无输出)'}
\`\`\`

### 历史报告合并

${historySection || '（未找到历史报告文件）'}

`;

const reportPath = path.join(HEALTH, 'report.md');
// 首次运行时写入文件头
if (!fs.existsSync(reportPath)) {
  fs.writeFileSync(reportPath, '# 项目健康度总报告（历史记录）\n\n> 每次运行追加一条，旧记录保留在上方\n', 'utf8');
}

appendToFile(reportPath, reportBlock);
console.log('\n📄 健康报告已追加：health/report.md');

// ─── 6. 控制台摘要 + 微信通知 ────────────────────────────────────────────────

console.log('\n─────────────────────── 健康度摘要 ───────────────────────');
console.log(`时间           ${NOW}`);
console.log(`后端 TS 编译   ${badge(beTsc.ok)}`);
console.log(`前端 TS 编译   ${badge(feTsc.ok)}`);
console.log(`前端 ESLint    ${badge(feLint.ok)}  (警告 ${lintWarnings} 个)`);
console.log(`后端构建       ${badge(beBuild.ok)}`);
console.log(`前端构建       ${badge(feBuild.ok)}`);
console.log('───────────────────────────────────────────────────────────');
console.log(allOk ? '🎉 全部通过！' : '⚠️  存在问题，详见 health/report.md');

// 微信通知
const notifyTitle = allOk
  ? '✅ 智慧教育平台 健康检查通过'
  : '❌ 智慧教育平台 健康检查发现问题';

const notifyContent = [
  `检查时间：${NOW}`,
  `总体状态：${allOk ? '全部通过' : '存在问题'}`,
  '',
  `后端 TS 编译：${badge(beTsc.ok)}`,
  `前端 TS 编译：${badge(feTsc.ok)}`,
  `前端 ESLint ：${badge(feLint.ok)}（警告 ${lintWarnings} 个）`,
  `后端构建    ：${badge(beBuild.ok)}`,
  `前端构建    ：${badge(feBuild.ok)}`,
  '',
  allOk ? '无需处理。' : '请查看 health/report.md 获取详情。',
].join('\n');

console.log('\n📱 发送微信通知...');
sendWechatNotify(notifyTitle, notifyContent).then(() => {
  console.log('');
  process.exit(allOk ? 0 : 1);
});

