import mongoose from 'mongoose';
// 注意：dotenv 已在 server.js 入口通过 import 'dotenv/config' 加载
// 此处不再重复加载，避免路径错误导致覆盖正确的环境变量

/**
 * 连接MongoDB数据库
 * 优化点：添加连接超时、重试机制，日志区分开发/生产环境
 */
const connectDB = async () => {
  try {
    // 数据库连接配置（添加超时和重试）
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 连接超时5秒
      retryWrites: true,
      w: 'majority',
    });

    // 区分环境输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ MongoDB 连接成功 [${conn.connection.host}]:${conn.connection.port}`);
      console.log(`   数据库名: ${conn.connection.name}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB 连接失败：${error.message}`);
    // 连接失败退出进程（确保进程正常终止）
    process.exit(1);
  }
};

export default connectDB;
