import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const RootPath = path.resolve(__dirname, '..');
const HealthReport = path.join(RootPath, 'PROJECT-HEALTH-REPORT.md');
const Timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

interface CheckResult {
  status: '✅' | '⚠️' | '❌';
  message: string;
}

let totalChecks = 0;
let passedChecks = 0;
let warningChecks = 0;
let failedChecks = 0;

function testCheck(name: string, test: () => boolean | string): CheckResult {
  totalChecks++;
  process.stdout.write(`[检测] ${name}...`);
  
  try {
    const result = test();
    if (result === true) {
      console.log(' ✅');
      passedChecks++;
      return { status: '✅', message: '通过' };
    } else if (result === false) {
      console.log(' ❌');
      failedChecks++;
      return { status: '❌', message: '失败' };
    } else {
      console.log(' ⚠️');
      warningChecks++;
      return { status: '⚠️', message: result as string };
    }
  } catch (error: any) {
    console.log(' ❌');
    failedChecks++;
    return { status: '❌', message: error.message || '错误' };
  }
}

function appendReport(content: string) {
  fs.appendFileSync(HealthReport, content, 'utf8');
}

// 初始化报告
const reportHeader = `# 项目健康度检测报告

**检测时间**: ${Timestamp}
**项目路径**: ${RootPath}

---

## 📊 检测概览

`;
fs.writeFileSync(HealthReport, reportHeader, 'utf8');

console.log('');
console.log('========================================');
console.log('🔍 项目深度健康度检测');
console.log('========================================');
console.log(`检测时间: ${Timestamp}`);
console.log('');

// ========== 1. 代码质量检测 ==========
console.log('');
console.log('## 1. 代码质量检测');
console.log('========================================');

appendReport('## 1. 代码质量检测\n\n');

// 1.1 TypeScript编译检查
const tsResult = testCheck('TypeScript编译检查', () => {
  try {
    const backendPath = path.join(RootPath, 'backend');
    process.chdir(backendPath);
    execSync('npm run build', { stdio: 'pipe', encoding: 'utf8' });
    process.chdir(RootPath);
    return true;
  } catch (error: any) {
    const output = error.stdout?.toString() || error.message || '';
    if (output.includes('error TS')) {
      return false;
    }
    return true;
  }
});
appendReport(`### 1.1 TypeScript编译检查\n${tsResult.status} ${tsResult.message}\n\n`);

// 1.2 ESLint配置检查
const eslintResult = testCheck('ESLint配置检查', () => {
  return fs.existsSync(path.join(RootPath, 'backend', '.eslintrc.js'));
});
appendReport(`### 1.2 ESLint配置检查\n${eslintResult.status} ${eslintResult.message}\n\n`);

// 1.3 前端构建检查
const frontendBuildResult = testCheck('前端构建检查', () => {
  try {
    const frontendPath = path.join(RootPath, 'frontend');
    process.chdir(frontendPath);
    execSync('npm run build', { stdio: 'pipe', encoding: 'utf8', timeout: 120000 });
    process.chdir(RootPath);
    return true;
  } catch (error: any) {
    const output = error.stdout?.toString() || error.message || '';
    if (output.includes('error') && !output.includes('warning')) {
      return false;
    }
    return '构建有警告';
  }
});
appendReport(`### 1.3 前端构建检查\n${frontendBuildResult.status} ${frontendBuildResult.message}\n\n`);

// ========== 2. 依赖管理检测 ==========
console.log('');
console.log('## 2. 依赖管理检测');
console.log('========================================');

appendReport('## 2. 依赖管理检测\n\n');

// 2.1 后端依赖完整性
const backendDepsResult = testCheck('后端依赖完整性', () => {
  const nodeModulesPath = path.join(RootPath, 'backend', 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const packageJsonPath = path.join(RootPath, 'backend', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const depsCount = Object.keys(packageJson.dependencies || {}).length + 
                       Object.keys(packageJson.devDependencies || {}).length;
      return depsCount > 0;
    }
  }
  return false;
});
appendReport(`### 2.1 后端依赖完整性\n${backendDepsResult.status} ${backendDepsResult.message}\n\n`);

// 2.2 前端依赖完整性
const frontendDepsResult = testCheck('前端依赖完整性', () => {
  const nodeModulesPath = path.join(RootPath, 'frontend', 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const packageJsonPath = path.join(RootPath, 'frontend', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const depsCount = Object.keys(packageJson.dependencies || {}).length + 
                       Object.keys(packageJson.devDependencies || {}).length;
      return depsCount > 0;
    }
  }
  return false;
});
appendReport(`### 2.2 前端依赖完整性\n${frontendDepsResult.status} ${frontendDepsResult.message}\n\n`);

// 2.3 Python依赖检查
const pythonDepsResult = testCheck('Python依赖检查', () => {
  const requirementsPath = path.join(RootPath, 'python-ai', 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    const venvPath = path.join(RootPath, 'python-ai', 'venv');
    if (fs.existsSync(venvPath)) {
      return true;
    }
    return '虚拟环境未创建';
  }
  return false;
});
appendReport(`### 2.3 Python依赖检查\n${pythonDepsResult.status} ${pythonDepsResult.message}\n\n`);

// ========== 3. 测试覆盖检测 ==========
console.log('');
console.log('## 3. 测试覆盖检测');
console.log('========================================');

appendReport('## 3. 测试覆盖检测\n\n');

// 3.1 后端测试文件
const backendTestsResult = testCheck('后端测试文件', () => {
  const testFiles: string[] = [];
  function findTestFiles(dir: string) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory() && file.name !== 'node_modules') {
        findTestFiles(fullPath);
      } else if (file.name.endsWith('.test.ts')) {
        testFiles.push(fullPath);
      }
    }
  }
  try {
    findTestFiles(path.join(RootPath, 'backend'));
    if (testFiles.length > 0) {
      return `找到 ${testFiles.length} 个测试文件`;
    }
  } catch (error) {
    // ignore
  }
  return false;
});
appendReport(`### 3.1 后端测试文件\n${backendTestsResult.status} ${backendTestsResult.message}\n\n`);

// 3.2 前端测试文件
const frontendTestsResult = testCheck('前端测试文件', () => {
  const testFiles: string[] = [];
  function findTestFiles(dir: string) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory() && file.name !== 'node_modules') {
          findTestFiles(fullPath);
        } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.tsx')) {
          testFiles.push(fullPath);
        }
      }
    } catch (error) {
      // ignore
    }
  }
  findTestFiles(path.join(RootPath, 'frontend'));
  if (testFiles.length > 0) {
    return `找到 ${testFiles.length} 个测试文件`;
  }
  return false;
});
appendReport(`### 3.2 前端测试文件\n${frontendTestsResult.status} ${frontendTestsResult.message}\n\n`);

// 3.3 Python测试文件
const pythonTestsResult = testCheck('Python测试文件', () => {
  const testsDir = path.join(RootPath, 'python-ai', 'tests');
  if (fs.existsSync(testsDir)) {
    const files = fs.readdirSync(testsDir);
    const testFiles = files.filter(f => f.startsWith('test_') && f.endsWith('.py'));
    if (testFiles.length > 0) {
      return `找到 ${testFiles.length} 个测试文件`;
    }
    return '测试目录存在但无测试文件';
  }
  return '测试目录不存在';
});
appendReport(`### 3.3 Python测试文件\n${pythonTestsResult.status} ${pythonTestsResult.message}\n\n`);

// ========== 4. 配置文件检测 ==========
console.log('');
console.log('## 4. 配置文件检测');
console.log('========================================');

appendReport('## 4. 配置文件检测\n\n');

// 4.1 环境变量文件
const envFilesResult = testCheck('环境变量文件', () => {
  const envFiles = [
    path.join(RootPath, 'backend', '.env'),
    path.join(RootPath, 'frontend', '.env')
  ];
  const found = envFiles.filter(f => fs.existsSync(f)).length;
  if (found > 0) {
    return `找到 ${found} 个环境变量文件`;
  }
  return '未找到环境变量文件（可能需要创建）';
});
appendReport(`### 4.1 环境变量文件\n${envFilesResult.status} ${envFilesResult.message}\n\n`);

// 4.2 TypeScript配置
const tsConfigResult = testCheck('TypeScript配置', () => {
  const tsConfigs = [
    path.join(RootPath, 'backend', 'tsconfig.json'),
    path.join(RootPath, 'frontend', 'tsconfig.json')
  ];
  const found = tsConfigs.filter(f => fs.existsSync(f)).length;
  if (found === tsConfigs.length) {
    return true;
  }
  return `缺少 ${tsConfigs.length - found} 个配置文件`;
});
appendReport(`### 4.2 TypeScript配置\n${tsConfigResult.status} ${tsConfigResult.message}\n\n`);

// 4.3 CI/CD配置
const cicdResult = testCheck('CI/CD配置', () => {
  const workflowsDir = path.join(RootPath, '.github', 'workflows');
  if (fs.existsSync(workflowsDir)) {
    const files = fs.readdirSync(workflowsDir);
    const workflows = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    if (workflows.length > 0) {
      return `找到 ${workflows.length} 个工作流文件`;
    }
  }
  return false;
});
appendReport(`### 4.3 CI/CD配置\n${cicdResult.status} ${cicdResult.message}\n\n`);

// ========== 5. 文档完整性检测 ==========
console.log('');
console.log('## 5. 文档完整性检测');
console.log('========================================');

appendReport('## 5. 文档完整性检测\n\n');

// 5.1 README文件
const readmeResult = testCheck('README文件', () => {
  const readmePath = path.join(RootPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    if (content.length > 1000) {
      return true;
    }
    return 'README文件存在但内容较少';
  }
  return false;
});
appendReport(`### 5.1 README文件\n${readmeResult.status} ${readmeResult.message}\n\n`);

// 5.2 API文档
const apiDocResult = testCheck('API文档', () => {
  return fs.existsSync(path.join(RootPath, 'docs', 'API-DOCUMENTATION.md'));
});
appendReport(`### 5.2 API文档\n${apiDocResult.status} ${apiDocResult.message}\n\n`);

// 5.3 部署文档
const deployDocResult = testCheck('部署文档', () => {
  const deployDocs = [
    path.join(RootPath, 'docs', 'DEPLOYMENT-GUIDE.md'),
    path.join(RootPath, 'QUICK-START.md')
  ];
  const found = deployDocs.filter(f => fs.existsSync(f)).length;
  if (found > 0) {
    return `找到 ${found} 个部署相关文档`;
  }
  return false;
});
appendReport(`### 5.3 部署文档\n${deployDocResult.status} ${deployDocResult.message}\n\n`);

// ========== 6. 安全性检测 ==========
console.log('');
console.log('## 6. 安全性检测');
console.log('========================================');

appendReport('## 6. 安全性检测\n\n');

// 6.1 .gitignore配置
const gitignoreResult = testCheck('.gitignore配置', () => {
  const gitignorePath = path.join(RootPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const sensitivePatterns = ['node_modules', '.env', 'dist', '*.log'];
    const found = sensitivePatterns.filter(p => content.includes(p)).length;
    if (found >= 2) {
      return true;
    }
    return '缺少部分敏感文件忽略规则';
  }
  return false;
});
appendReport(`### 6.1 .gitignore配置\n${gitignoreResult.status} ${gitignoreResult.message}\n\n`);

// ========== 7. 性能优化检测 ==========
console.log('');
console.log('## 7. 性能优化检测');
console.log('========================================');

appendReport('## 7. 性能优化检测\n\n');

// 7.1 数据库连接池配置
const dbPoolResult = testCheck('数据库连接池配置', () => {
  const dbConfigPath = path.join(RootPath, 'backend', 'src', 'config', 'database.ts');
  if (fs.existsSync(dbConfigPath)) {
    const content = fs.readFileSync(dbConfigPath, 'utf8');
    return content.includes('connectionLimit') || content.includes('createPool');
  }
  return false;
});
appendReport(`### 7.1 数据库连接池配置\n${dbPoolResult.status} ${dbPoolResult.message}\n\n`);

// 7.2 前端代码分割
const codeSplitResult = testCheck('前端代码分割', () => {
  const viteConfigPath = path.join(RootPath, 'frontend', 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    return content.includes('rollupOptions') || content.includes('chunkSizeWarningLimit');
  }
  return '未检测到代码分割配置';
});
appendReport(`### 7.2 前端代码分割\n${codeSplitResult.status} ${codeSplitResult.message}\n\n`);

// ========== 8. 项目结构检测 ==========
console.log('');
console.log('## 8. 项目结构检测');
console.log('========================================');

appendReport('## 8. 项目结构检测\n\n');

// 8.1 目录结构完整性
const dirStructureResult = testCheck('目录结构完整性', () => {
  const requiredDirs = [
    path.join(RootPath, 'backend', 'src'),
    path.join(RootPath, 'frontend', 'src'),
    path.join(RootPath, 'docs')
  ];
  const found = requiredDirs.filter(d => fs.existsSync(d)).length;
  if (found === requiredDirs.length) {
    return true;
  }
  return `缺少 ${requiredDirs.length - found} 个必需目录`;
});
appendReport(`### 8.1 目录结构完整性\n${dirStructureResult.status} ${dirStructureResult.message}\n\n`);

// 8.2 模块化程度
const modularityResult = testCheck('模块化程度', () => {
  const routesDir = path.join(RootPath, 'backend', 'src', 'routes');
  const viewsDir = path.join(RootPath, 'frontend', 'src', 'views');
  let routeCount = 0;
  let viewCount = 0;
  
  try {
    if (fs.existsSync(routesDir)) {
      const files = fs.readdirSync(routesDir);
      routeCount = files.filter(f => f.endsWith('.ts')).length;
    }
  } catch (error) {
    // ignore
  }
  
  function countViews(dir: string): number {
    let count = 0;
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          count += countViews(fullPath);
        } else if (file.name.endsWith('.vue')) {
          count++;
        }
      }
    } catch (error) {
      // ignore
    }
    return count;
  }
  
  if (fs.existsSync(viewsDir)) {
    viewCount = countViews(viewsDir);
  }
  
  if (routeCount > 5 && viewCount > 5) {
    return `后端路由: ${routeCount}, 前端视图: ${viewCount}`;
  }
  return '模块化程度较低';
});
appendReport(`### 8.2 模块化程度\n${modularityResult.status} ${modularityResult.message}\n\n`);

// ========== 生成总结报告 ==========
console.log('');
console.log('========================================');
console.log('📊 检测总结');
console.log('========================================');

const healthScore = Math.round((passedChecks / totalChecks) * 100 * 100) / 100;
const grade = healthScore >= 90 ? '优秀' : healthScore >= 75 ? '良好' : healthScore >= 60 ? '一般' : '需要改进';

console.log(`总检测项: ${totalChecks}`);
console.log(`通过: ${passedChecks}`);
console.log(`警告: ${warningChecks}`);
console.log(`失败: ${failedChecks}`);
console.log(`健康度评分: ${healthScore}%`);
console.log(`评级: ${grade}`);
console.log('');

const summary = `
---

## 📊 检测总结

| 项目 | 数量 |
|------|------|
| 总检测项 | ${totalChecks} |
| ✅ 通过 | ${passedChecks} |
| ⚠️ 警告 | ${warningChecks} |
| ❌ 失败 | ${failedChecks} |
| **健康度评分** | **${healthScore}%** |
| **评级** | **${grade}** |

### 健康度分析

${healthScore >= 90 
  ? '项目健康状况优秀！代码质量、测试覆盖、文档完整性都达到了较高水平。继续保持！'
  : healthScore >= 75 
  ? '项目健康状况良好。大部分检测项通过，但仍有改进空间。建议关注警告项和失败项。'
  : healthScore >= 60
  ? '项目健康状况一般。存在一些需要改进的地方，建议优先处理失败项，然后逐步改进警告项。'
  : '项目健康状况需要改进。存在较多问题，建议制定改进计划，优先处理关键问题。'}

### 改进建议

${failedChecks > 0 ? `1. **优先修复失败项** (${failedChecks} 项)\n` : ''}${warningChecks > 0 ? `2. **处理警告项** (${warningChecks} 项)\n` : ''}${healthScore < 90 ? '3. **持续改进代码质量和测试覆盖**\n4. **完善项目文档**\n' : ''}

---

**报告生成时间**: ${Timestamp}
**下次检测建议**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)}

`;

appendReport(summary);

console.log('========================================');
console.log(`📄 详细报告已保存到: ${HealthReport}`);
console.log('========================================');
console.log('');

// 显示报告摘要
const reportContent = fs.readFileSync(HealthReport, 'utf8');
const lines = reportContent.split('\n');
lines.slice(0, 50).forEach(line => console.log(line));

console.log('');
console.log(`查看完整报告: type ${HealthReport}`);


