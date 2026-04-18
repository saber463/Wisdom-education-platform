import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learning-ai-platform';
  await mongoose.connect(MONGODB_URI);
  
  // 检查现有用户
  const existing = await User.find({ email: { $in: ['student@edu.com', 'teacher@edu.com', 'parent@edu.com'] } });
  console.log('📋 现有用户:', existing.map(u => `${u.email} (${u.username})`));

  // 重置/创建测试账号
  const testAccounts = [
    { email: 'student@edu.com', username: 'student1', password: 'Student123!', role: 'student', avatar: 'https://picsum.photos/seed/student/200/200' },
    { email: 'teacher@edu.com', username: 'teacher_zhang', password: 'Teacher123!', role: 'teacher', avatar: 'https://picsum.photos/seed/teacher/200/200' },
    { email: 'parent@edu.com', username: 'parent_wang', password: 'Parent123!', role: 'parent', avatar: 'https://picsum.photos/seed/parent/200/200' },
  ];

  for (const acc of testAccounts) {
    const hashedPw = await bcrypt.hash(acc.password, 10);
    
    // 直接用 email 查找并只更新密码
    await User.updateOne(
      { email: acc.email },
      { $set: { password: hashedPw } }
    );
    
    const user = await User.findOne({ email: acc.email });
    if (user) {
      console.log(`✅ ${acc.email} (${user.username}) 密码已重置为 ${acc.password}`);
    } else {
      // 如果用户不存在，直接创建（不使用upsert避免冲突）
      try {
        const newUser = new User({ ...acc });
        newUser.password = hashedPw;
        await newUser.save();
        console.log(`✅ 新建用户 ${acc.email} (${acc.username})`);
      } catch (err) {
        console.log(`⚠️ ${acc.email} 创建失败(可能已存在): ${err.message.split('\n')[0]}`);
        // 尝试更新现有用户的密码
        await User.updateOne(
          { $or: [{ email: acc.email }, { username: acc.username }] },
          { $set: { password: hashedPw, avatar: acc.avatar || 'https://picsum.photos/seed/default/200/200' } }
        );
        console.log(`✅ 已更新 ${acc.username} 的密码`);
      }
    }
  }

  console.log('\n📋 测试账号列表:');
  console.log('┌─────────────────────┬──────────────┬────────────────┐');
  console.log('│ 邮箱                │ 用户名        │ 密码            │');
  console.log('├─────────────────────┼──────────────┼────────────────┤');
  for (const a of testAccounts) {
    console.log(`│ ${(a.email + '').padEnd(19)} │ ${(a.username + '').padEnd(12)} │ ${(a.password + '').padEnd(14)} │`);
  }
  console.log('└─────────────────────┴──────────────┴────────────────┘');

  process.exit(0);
}

main().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
