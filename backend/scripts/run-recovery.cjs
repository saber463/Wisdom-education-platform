/**
 * 蓝屏恢复CLI工具
 * Blue Screen Recovery CLI Tool
 * 用于从命令行执行蓝屏恢复流程
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('  蓝屏恢复工具');
console.log('  Blue Screen Recovery Tool');
console.log('========================================');
console.log('');

// 检查是否在Windows平台
if (process.platform !== 'win32') {
  console.log('⚠️ 此工具主要为Windows平台设计');
  console.log('   但仍将尝试执行恢复流程...');
  console.log('');
}

// 获取脚本路径
const scriptPath = path.join(__dirname, '../../scripts/blue-screen-recovery.bat');

// 检查脚本是否存在
if (!fs.existsSync(scriptPath)) {
  console.error('✗ 恢复脚本不存在:', scriptPath);
  console.error('  请确保项目结构完整');
  process.exit(1);
}

console.log('正在启动恢复脚本...');
console.log('脚本路径:', scriptPath);
console.log('');

// 执行恢复脚本
const recovery = spawn('cmd.exe', ['/c', scriptPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../..')
});

recovery.on('error', (error) => {
  console.error('✗ 恢复脚本执行失败:', error.message);
  process.exit(1);
});

recovery.on('exit', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✓ 恢复流程已完成');
  } else {
    console.error('');
    console.error('✗ 恢复流程失败，退出码:', code);
    process.exit(code);
  }
});

// 处理中断信号
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️ 恢复流程被中断');
  recovery.kill();
  process.exit(130);
});
