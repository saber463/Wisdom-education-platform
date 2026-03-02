import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

// 检查必要环境变量
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`❌ 缺少必要环境变量：${missingEnv.join(', ')}`);
  process.exit(1);
}

// 连接数据库
connectDB();

const PORT = process.env.PORT || 4001;

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功`);
  console.log(`📡 服务地址：http://localhost:${PORT}`);
  console.log(`🔗 API前缀：/api`);
  console.log(`🌐 环境：${process.env.NODE_ENV || 'development'}`);
});

// 优雅退出（处理未捕获的错误）
process.on('unhandledRejection', err => {
  console.error(`⚠️  未处理的错误：${err.message}`);
  console.error(err.stack);
  // 不要立即退出，而是继续运行
});

// 监听SIGINT信号（Ctrl+C）
process.on('SIGINT', () => {
  console.log(`📤 服务正在关闭...`);
  console.log(`✅ 服务已正常关闭`);
  process.exit(0);
});
