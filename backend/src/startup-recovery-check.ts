/**
 * 启动时蓝屏恢复检查
 * Startup Blue Screen Recovery Check
 * 
 * 在应用启动时自动检查是否需要执行蓝屏恢复
 * 如果检测到蓝屏痕迹，自动执行恢复流程
 */

import {
  shouldPerformRecovery,
  performBlueScreenRecovery,
  createAbnormalShutdownFlag,
  removeAbnormalShutdownFlag
} from './services/blue-screen-recovery';

/**
 * 启动时检查并执行恢复（如果需要）
 */
export async function checkAndRecoverOnStartup(): Promise<boolean> {
  console.log('========================================');
  console.log('  启动时蓝屏恢复检查');
  console.log('========================================');
  console.log('');

  try {
    // 检查是否需要恢复
    const needsRecovery = await shouldPerformRecovery();

    if (needsRecovery) {
      console.log('⚠️ 检测到异常关机或蓝屏痕迹');
      console.log('   开始自动恢复流程...');
      console.log('');

      // 执行恢复
      const result = await performBlueScreenRecovery();

      if (result.success) {
        console.log('');
        console.log('✅ 蓝屏恢复成功！');
        console.log(`   耗时: ${result.duration}ms`);
        console.log('');
        console.log('恢复步骤:');
        result.steps.forEach((step, index) => {
          const status = step.success ? '✓' : '✗';
          console.log(`  ${index + 1}. ${status} ${step.step}: ${step.message}`);
        });
        console.log('');
        console.log('系统已恢复正常，继续启动...');
        console.log('');
        return true;
      } else {
        console.error('');
        console.error('✗ 蓝屏恢复失败');
        console.error('   请检查日志文件: logs/blue-screen-recovery.log');
        console.error('');
        console.error('失败步骤:');
        result.steps.forEach((step, index) => {
          if (!step.success) {
            console.error(`  ${index + 1}. ✗ ${step.step}: ${step.message}`);
          }
        });
        console.error('');
        console.error('建议手动运行恢复脚本: scripts/blue-screen-recovery.bat');
        console.error('');
        return false;
      }
    } else {
      console.log('✓ 未检测到蓝屏痕迹，系统正常');
      console.log('');
      return true;
    }
  } catch (error) {
    console.error('✗ 恢复检查过程出错:', error);
    console.error('   继续正常启动流程...');
    console.error('');
    return false;
  }
}

/**
 * 注册正常关机处理
 * 在应用正常关闭时删除异常关机标记
 */
export function registerShutdownHandlers(): void {
  // 创建异常关机标记（启动时）
  createAbnormalShutdownFlag();
  console.log('✓ 异常关机检测已启用');
  console.log('');

  // 注册正常关机处理
  const shutdownHandler = () => {
    console.log('');
    console.log('正在正常关闭应用...');
    removeAbnormalShutdownFlag();
    console.log('✓ 异常关机标记已清除');
    process.exit(0);
  };

  // 监听各种关闭信号
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
  process.on('SIGHUP', shutdownHandler);

  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('');
    console.error('✗ 未捕获的异常:', error);
    console.error('   保留异常关机标记以便下次启动时恢复');
    console.error('');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('');
    console.error('✗ 未处理的Promise拒绝:', reason);
    console.error('   保留异常关机标记以便下次启动时恢复');
    console.error('');
    process.exit(1);
  });
}

/**
 * 完整的启动恢复流程
 * 包含检查、恢复和关机处理注册
 */
export async function initializeRecoverySystem(): Promise<boolean> {
  // 1. 检查并执行恢复（如果需要）
  const recoverySuccess = await checkAndRecoverOnStartup();

  // 2. 注册关机处理
  registerShutdownHandlers();

  return recoverySuccess;
}

// 如果直接运行此文件，执行恢复检查
if (require.main === module) {
  initializeRecoverySystem()
    .then((success) => {
      if (success) {
        console.log('恢复系统初始化成功');
        process.exit(0);
      } else {
        console.error('恢复系统初始化失败');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('恢复系统初始化错误:', error);
      process.exit(1);
    });
}
