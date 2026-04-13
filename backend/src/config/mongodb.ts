import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edu_learning_platform';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 连接到MongoDB
export async function connectMongoDB(retryCount = 0): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      bufferCommands: false,
    });
    
    if (retryCount > 0) {
      console.log(`MongoDB连接成功（重试${retryCount}次后）`);
    } else {
      console.log('MongoDB连接成功');
    }
    
    return connection;
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.warn(`MongoDB连接失败，${RETRY_DELAY_MS}ms后进行第${retryCount + 1}次重试...`);
      await delay(RETRY_DELAY_MS);
      return connectMongoDB(retryCount + 1);
    } else {
      console.error(`MongoDB连接失败，已重试${MAX_RETRY_ATTEMPTS}次:`, error);
      throw new Error(`MongoDB连接失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 测试MongoDB连接
export async function testMongoConnection(): Promise<boolean> {
  try {
    await connectMongoDB();
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('MongoDB连接测试失败:', error);
    return false;
  }
}

// 关闭MongoDB连接
export async function closeMongoConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB连接已关闭');
  }
}

// 获取MongoDB连接状态
export function getMongoConnectionState(): number {
  return mongoose.connection.readyState;
}

export default mongoose;
