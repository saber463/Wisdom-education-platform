// 使用服务器实际的 User Model 创建测试用户
import mongoose from 'mongoose';

// 加载服务器配置
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-default-encryption-key-please-change-in-production';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learning-ai-platform';

const MONGODB_URI = process.env.MONGODB_URI;

// 直接导入服务器的 User 模型
import User from './models/User.js';

async function createUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 清除现有用户
    await User.deleteMany({});
    console.log('已清除现有用户\n');

    // 创建测试用户 - 传入明文密码，让 pre('save') hook 自动 hash
    const users = [
      {
        email: 'student1@test.com',
        password: 'Student123!',
        username: '林晓宇',
        role: 'student',
      },
      {
        email: 'teacher1@test.com',
        password: 'Teacher123!',
        username: '张明哲',
        role: 'teacher',
      },
      {
        email: 'parent1@test.com',
        password: 'Parent123!',
        username: '王建国',
        role: 'parent',
      },
      {
        email: 'vip1@test.com',
        password: 'Vip12345!',
        username: '赵小悦',
        role: 'student',
      },
    ];

    for (const u of users) {
      const user = new User(u);
      await user.save(); // 这会触发 pre('save') hook 自动 hash 密码
      console.log(`创建用户: ${u.email} (${u.role})`);
    }

    console.log('\n=== 验证用户 ===');
    const allUsers = await User.find({});
    for (const u of allUsers) {
      console.log(`- ${u.email} | ${u.username} | role: ${u.role}`);
      if (u.password) {
        console.log(`  密码hash前20字符: ${u.password.substring(0, 20)}...`);
      } else {
        console.log(`  密码: (已加密，不显示)`);
      }
    }

    console.log('\n=== 验证密码匹配 ===');
    for (const u of users) {
      const testUser = await User.findOne({ email: u.email }).select('+password');
      if (!testUser) {
        console.log(`${u.email}: ✗ 用户不存在`);
        continue;
      }
      const isMatch = await testUser.matchPassword(u.password);
      console.log(`${u.email}: ${isMatch ? '✓ 密码正确' : '✗ 密码错误'}`);
    }

    await mongoose.disconnect();
    console.log('\n完成！');
  } catch (err) {
    console.error('错误:', err);
    process.exit(1);
  }
}

createUsers();
