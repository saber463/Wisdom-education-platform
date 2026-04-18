/**
 * 测试账号生成脚本
 * 运行: node scripts/create-test-users.js
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-ai-platform'
    );
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

const testUsers = [
  {
    username: 'student1',
    email: 'student1@test.com',
    password: 'Test123@',
    role: 'student',
    learningInterests: ['JavaScript', 'Vue', 'React'],
  },
  {
    username: 'student2',
    email: 'student2@test.com',
    password: 'Test123@',
    role: 'student',
    learningInterests: ['Python', 'AI', '机器学习'],
  },
  {
    username: 'student3',
    email: 'student3@test.com',
    password: 'Test123@',
    role: 'student',
    learningInterests: ['Java', 'Spring Boot', '数据库'],
  },
  {
    username: 'teacher1',
    email: 'teacher1@test.com',
    password: 'Test123@',
    role: 'teacher',
    learningInterests: ['前端开发', '全栈', '项目管理'],
  },
  {
    username: 'teacher2',
    email: 'teacher2@test.com',
    password: 'Test123@',
    role: 'teacher',
    learningInterests: ['算法', '数据结构', 'Python'],
  },
  {
    username: 'parent1',
    email: 'parent1@test.com',
    password: 'Test123@',
    role: 'parent',
    learningInterests: ['教育', '学习方法'],
  },
  {
    username: 'parent2',
    email: 'parent2@test.com',
    password: 'Test123@',
    role: 'parent',
    learningInterests: ['职业规划', '升学指导'],
  },
  {
    username: 'admin',
    email: 'admin@test.com',
    password: 'Admin123@',
    role: 'admin',
    learningInterests: ['全栈', 'AI', 'DevOps'],
  },
];

const createTestUsers = async () => {
  await connectDB();

  console.log('\n开始创建测试账号...\n');

  for (const userData of testUsers) {
    try {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

      if (existingUser) {
        console.log(`⚠️  用户已存在: ${userData.username} (${userData.email})`);
        // 更新已有用户
        existingUser.username = userData.username;
        existingUser.password = userData.password; // 会触发hash
        existingUser.learningInterests = userData.learningInterests;
        await existingUser.save();
        console.log(`✅  已更新: ${userData.username}`);
      } else {
        // 创建新用户
        const user = await User.create({
          username: userData.username,
          email: userData.email.toLowerCase(),
          password: userData.password,
          learningInterests: userData.learningInterests,
        });
        console.log(`✅  已创建: ${userData.username} (${userData.email})`);
      }
    } catch (error) {
      console.error(`❌  创建失败 ${userData.username}:`, error.message);
    }
  }

  console.log('\n========== 测试账号列表 ==========\n');
  for (const user of testUsers) {
    console.log(`📧 ${user.email.padEnd(25)} 🔑 ${user.password.padEnd(12)} 👤 ${user.role}`);
  }
  console.log('\n==================================\n');

  await mongoose.connection.close();
  console.log('数据库连接已关闭');
  process.exit(0);
};

createTestUsers();
