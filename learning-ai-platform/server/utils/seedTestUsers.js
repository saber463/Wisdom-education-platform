/**
 * 测试账号种子数据
 * 用法: node utils/seedTestUsers.js
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

await connectDB();

const testUsers = [
  {
    username: '林晓宇',
    email: 'student1@test.com',
    password: 'Student123!', // 符合后端密码规则：8位+大小写+数字+特殊字符
    avatar: 'https://picsum.photos/seed/student/200/200',
    role: 'student',
    level: '入门',
    learningInterests: ['前端开发', 'Vue', 'React'],
    learningStats: { totalStudyTime: 120, completedCourses: 3 },
    socialStats: { receivedLikes: 56, createdTweets: 8 },
  },
  {
    username: '张明哲',
    email: 'teacher1@test.com',
    password: 'Teacher123!',
    avatar: 'https://picsum.photos/seed/teacher/200/200',
    role: 'teacher',
    level: '高级',
    learningInterests: ['全栈开发', '架构设计', 'AI教育'],
    learningStats: { totalStudyTime: 2000, completedCourses: 50 },
    socialStats: { receivedLikes: 1200, createdTweets: 45, receivedComments: 320 },
  },
  {
    username: '王建国',
    email: 'parent1@test.com',
    password: 'Parent123!',
    avatar: 'https://picsum.photos/seed/parent/200/200',
    role: 'parent',
    level: '中级',
    learningInterests: ['家庭教育', '学习监督'],
    socialStats: { receivedLikes: 20, createdTweets: 2 },
  },
  {
    username: '赵小悦',
    email: 'vip1@test.com',
    password: 'VipTest123!',
    avatar: 'https://picsum.photos/seed/vip/200/200',
    role: 'student',
    isVIP: true,
    level: '高级',
    learningInterests: ['算法', '竞赛', 'AI'],
    socialStats: { receivedLikes: 100, createdTweets: 10 },
  },
];

try {
  for (const userData of testUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⏭️ 用户 ${userData.email} 已存在，跳过`);
      continue;
    }

    const user = await User.create(userData);
    console.log(`✅ 创建用户成功: ${user.email} (${user.username})`);
  }

  console.log('\n📋 测试账号列表:');
  console.log('┌─────────────────────┬───────────┬────────────────┐');
  console.log('│ 邮箱                │ 用户名     │ 密码            │');
  console.log('├─────────────────────┼───────────┼────────────────┤');
  for (const u of testUsers) {
    console.log(
      `│ ${u.email.padEnd(19)} │ ${(u.username || '').padEnd(9)} │ ${u.password.padEnd(14)} │`
    );
  }
  console.log('└─────────────────────┴───────────┴────────────────┘');

  process.exit(0);
} catch (err) {
  console.error('❌ 创建测试用户失败:', err.message);
  process.exit(1);
}
