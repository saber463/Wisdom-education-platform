# 蓝屏恢复系统集成示例

## 概述

本文档展示如何将蓝屏恢复系统集成到应用的启动流程中。

## 集成方式

### 方式1：在主入口文件中集成（推荐）

修改 `backend/src/index.ts`：

```typescript
import express from 'express';
import { initializeRecoverySystem } from './startup-recovery-check';

async function startApplication() {
  console.log('========================================');
  console.log('  智慧教育学习平台');
  console.log('  Smart Education Platform');
  console.log('========================================');
  console.log('');

  // 1. 初始化恢复系统（检查蓝屏、注册关机处理）
  const recoverySuccess = await initializeRecoverySystem();
  
  if (!recoverySuccess) {
    console.warn('⚠️ 恢复系统初始化失败，但继续启动应用');
  }

  // 2. 创建Express应用
  const app = express();
  
  // 3. 配置中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 4. 配置路由
  // ... 路由配置 ...
  
  // 5. 启动服务器
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✓ 服务器已启动: http://localhost:${PORT}`);
    console.log('');
  });
}

// 启动应用
startApplication().catch((error) => {
  console.error('✗ 应用启动失败:', error);
  process.exit(1);
});
```

### 方式2：独立的恢复检查脚本

创建 `backend/scripts/check-recovery.cjs`：

```javascript
const { checkAndRecoverOnStartup } = require('../dist/startup-recovery-check');

console.log('执行启动恢复检查...');
console.log('');

checkAndRecoverOnStartup()
  .then((success) => {
    if (success) {
      console.log('✓ 恢复检查完成，可以启动应用');
      process.exit(0);
    } else {
      console.error('✗ 恢复检查失败');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('✗ 恢复检查错误:', error);
    process.exit(1);
  });
```

然后在 `package.json` 中添加启动脚本：

```json
{
  "scripts": {
    "prestart": "node scripts/check-recovery.cjs",
    "start": "node dist/index.js",
    "dev": "npm run prestart && nodemon src/index.ts"
  }
}
```

### 方式3：Windows任务计划程序集成

1. 打开任务计划程序
2. 创建基本任务
3. 配置触发器：系统启动时
4. 配置操作：
   - 程序：`cmd.exe`
   - 参数：`/c "cd /d F:\edu-ai-platform-web && node backend\scripts\check-recovery.cjs"`
5. 保存任务

## 使用示例

### 示例1：正常启动（无蓝屏痕迹）

```
========================================
  启动时蓝屏恢复检查
========================================

✓ 未检测到蓝屏痕迹，系统正常

✓ 异常关机检测已启用

========================================
  智慧教育学习平台
  Smart Education Platform
========================================

✓ 服务器已启动: http://localhost:3000
```

### 示例2：检测到蓝屏并自动恢复

```
========================================
  启动时蓝屏恢复检查
========================================

⚠️ 检测到异常关机或蓝屏痕迹
   开始自动恢复流程...

开始检测蓝屏痕迹...
✓ 检测到系统崩溃事件
✓ 发现内存转储文件: C:\Windows\Minidump
✓ 发现异常关机标记
⚠️ 检测到 3 个蓝屏痕迹

开始恢复代码到最新状态...
✓ 当前更改已暂存
✓ 代码已更新到最新版本
✓ 暂存的更改已恢复
✓ 清理缓存: .cache
✓ 清理缓存: debug
✓ 清理缓存: __pycache__

开始修复数据库完整性...
✓ MySQL服务已启动
✓ 数据库连接正常
✓ 数据库表修复完成
✓ 数据库表优化完成
✓ 数据库权限已刷新
✓ 字符集配置正确

开始重启所有服务（低资源模式）...
✓ 停止端口 3000 上的进程 (PID: 12345)
✓ 停止端口 5000 上的进程 (PID: 12346)
✓ 停止端口 8080 上的进程 (PID: 12347)
✓ 低资源模式已配置
  - Node.js内存限制: 2048MB
  - Rust编译单核模式
  - Python优化模式

✅ 蓝屏恢复成功！
   耗时: 45678ms

恢复步骤:
  1. ✓ detection: 检测到 3 个蓝屏痕迹
  2. ✓ code_recovery: 代码恢复完成
  3. ✓ database_repair: 数据库修复完成
  4. ✓ service_restart: 服务重启配置完成

系统已恢复正常，继续启动...

✓ 异常关机检测已启用

========================================
  智慧教育学习平台
  Smart Education Platform
========================================

✓ 服务器已启动: http://localhost:3000
```

### 示例3：恢复失败

```
========================================
  启动时蓝屏恢复检查
========================================

⚠️ 检测到异常关机或蓝屏痕迹
   开始自动恢复流程...

开始检测蓝屏痕迹...
✓ 发现异常关机标记

开始恢复代码到最新状态...
✓ 代码恢复完成

开始修复数据库完整性...
✗ MySQL启动失败

✗ 蓝屏恢复失败
   请检查日志文件: logs/blue-screen-recovery.log

失败步骤:
  3. ✗ database_repair: MySQL启动失败

建议手动运行恢复脚本: scripts/blue-screen-recovery.bat

⚠️ 恢复系统初始化失败，但继续启动应用

✓ 异常关机检测已启用

========================================
  智慧教育学习平台
  Smart Education Platform
========================================

✓ 服务器已启动: http://localhost:3000
```

## 关机处理

应用会自动处理以下关闭信号：

- `SIGTERM`: 正常终止信号
- `SIGINT`: 中断信号（Ctrl+C）
- `SIGHUP`: 挂起信号

当收到这些信号时，应用会：
1. 删除异常关机标记
2. 正常退出

如果应用异常崩溃（未捕获的异常），异常关机标记会保留，下次启动时会触发恢复流程。

## 测试恢复流程

### 测试1：模拟异常关机

```bash
# 1. 启动应用
npm start

# 2. 强制终止进程（模拟崩溃）
taskkill /F /IM node.exe

# 3. 再次启动应用
npm start

# 应该看到恢复流程自动执行
```

### 测试2：手动创建标记

```bash
# 1. 创建异常关机标记
echo test > %TEMP%\abnormal_shutdown.flag

# 2. 启动应用
npm start

# 应该看到恢复流程自动执行
```

### 测试3：使用测试脚本

```bash
# 运行测试脚本
scripts\test-recovery-detection.bat
```

## 配置选项

可以通过环境变量配置恢复行为：

```bash
# 禁用自动恢复
set DISABLE_AUTO_RECOVERY=true

# 设置恢复超时（毫秒）
set RECOVERY_TIMEOUT=60000

# 设置低资源模式内存限制（MB）
set LOW_RESOURCE_MEMORY=2048
```

在代码中使用：

```typescript
const config = {
  autoRecovery: process.env.DISABLE_AUTO_RECOVERY !== 'true',
  timeout: parseInt(process.env.RECOVERY_TIMEOUT || '60000'),
  memoryLimit: parseInt(process.env.LOW_RESOURCE_MEMORY || '2048')
};
```

## 日志文件

恢复过程会生成以下日志：

```
logs/
├── blue-screen-recovery.log    # 恢复流程详细日志
├── recovery.log                # 恢复完成记录
└── crash.log                   # 崩溃记录（如果有）
```

查看日志：

```bash
# 查看恢复日志
type logs\blue-screen-recovery.log

# 查看最近10行
powershell "Get-Content logs\blue-screen-recovery.log -Tail 10"
```

## 监控和告警

可以集成监控系统来跟踪恢复事件：

```typescript
import { performBlueScreenRecovery } from './services/blue-screen-recovery';

async function monitoredRecovery() {
  const startTime = Date.now();
  
  try {
    const result = await performBlueScreenRecovery();
    const duration = Date.now() - startTime;
    
    // 发送监控指标
    sendMetric('recovery.success', result.success ? 1 : 0);
    sendMetric('recovery.duration', duration);
    
    // 如果恢复失败，发送告警
    if (!result.success) {
      sendAlert('蓝屏恢复失败', {
        steps: result.steps,
        duration: duration
      });
    }
    
    return result;
  } catch (error) {
    sendAlert('蓝屏恢复异常', { error: error.message });
    throw error;
  }
}
```

## 最佳实践

1. **定期备份数据库**
   ```bash
   # 每天自动备份
   scripts\backup-database.bat
   ```

2. **监控系统资源**
   - 启用资源监控模块
   - 设置CPU/内存阈值告警

3. **保持代码同步**
   - 定期提交代码到Git
   - 确保远程仓库是最新的

4. **测试恢复流程**
   - 定期测试恢复脚本
   - 验证备份可用性

5. **记录恢复事件**
   - 保存恢复日志
   - 分析恢复原因

## 故障排查

### 问题1：恢复检查失败

**症状**: 启动时报错 "恢复检查错误"

**解决方案**:
```bash
# 检查TypeScript编译
cd backend
npm run build

# 手动运行恢复检查
node dist/startup-recovery-check.js
```

### 问题2：数据库恢复失败

**症状**: 恢复日志显示 "MySQL启动失败"

**解决方案**:
```bash
# 手动启动MySQL
net start MySQL80

# 或使用便携版
C:\mysql\bin\mysqld.exe --console
```

### 问题3：服务重启失败

**症状**: 恢复后服务未启动

**解决方案**:
```bash
# 手动启动所有服务
scripts\start-all-services.bat

# 或使用一键启动
scripts\one-click-start.bat
```

## 相关文档

- [蓝屏恢复使用指南](../scripts/BLUE-SCREEN-RECOVERY-README.md)
- [任务23.8实现总结](../TASK-23.8-SUMMARY.md)
- [需求文档](../.kiro/specs/smart-education-platform/requirements.md)

---

**版本**: 1.0.0  
**最后更新**: 2025-01-15  
**维护者**: 智慧教育平台开发团队
