/**
 * 彻底修复登录密码问题
 * 
 * 问题根源分析：
 * 1. User模型有 pre('save') hook 自动 bcrypt.hash 密码
 * 2. resetTestUsers.mjs 先手动hash，再用 new User().save() → 双重hash！
 * 3. 或者用 updateOne 但之前可能已经被双hash污染过
 * 
 * 本脚本方案：
 * - 使用 mongoose.connection.db.collection() 直接操作原生MongoDB
 * - 完全绕过 Mongoose schema 和 hooks
 * - 先查出现有hash，测试比较结果
 * - 然后写入正确的单次bcrypt hash
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learning-ai-platform';

// 测试账号定义
const TEST_ACCOUNTS = [
  { email: 'student@edu.com', username: 'student1', password: 'Student123!', displayName: '学生账号' },
  { email: 'teacher@edu.com', username: 'teacher_zhang', password: 'Teacher123!', displayName: '导师账号' },
  { email: 'parent@edu.com', username: 'parent_wang', password: 'Parent123!', displayName: '家长账号' },
];

async function main() {
  console.log('🔧 连接数据库...');
  await mongoose.connect(MONGODB_URI);
  
  // 获取原生 collection（绕过 Mongoose schema/hooks）
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  
  console.log('\n=== 开始诊断和修复 ===\n');
  
  for (const acc of TEST_ACCOUNTS) {
    console.log(`\n📋 处理: ${acc.displayName} (${acc.email})`);
    console.log('─'.repeat(50));
    
    // 1. 查找用户（原始文档）
    const user = await usersCollection.findOne({ email: acc.email.toLowerCase() });
    
    if (!user) {
      console.log(`⚠️ 用户 ${acc.email} 不存在！需要创建`);
      
      // 生成正确的单次 hash
      const correctHash = await bcrypt.hash(acc.password, 10);
      
      // 直接插入到 MongoDB（绕过所有 hooks）
      await usersCollection.insertOne({
        username: acc.username,
        email: acc.email.toLowerCase(),
        password: correctHash,
        avatar: `https://picsum.photos/seed/${acc.username}/200/200`,
        learningInterests: [],
        learningStats: { totalStudyTime: 0, completedCourses: 0, currentCourses: 0, dailyGenerationCount: 0 },
        socialStats: { receivedLikes: 0, receivedComments: 0, createdTweets: 0 },
        learningPreferences: { learningStyle: 'mixed', preferredTime: 'flexible', preferredPlatforms: [] },
        membership: { level: 'free', expireDate: null },
        wallet: { balance: 0, transactions: [] },
        dailyQuizCompleted: false,
        createdAt: new Date(),
      });
      console.log(`✅ 已创建用户，密码已设置为单次hash`);
    } else {
      console.log(`✅ 找到用户: ${user.username} (ID: ${user._id})`);
      console.log(`   当前密码hash长度: ${user.password?.length || 0}`);
      
      // 测试当前存储的密码能否匹配
      let matchResult = false;
      try {
        matchResult = await bcrypt.compare(acc.password, user.password);
        console.log(`   当前密码匹配测试: ${matchResult ? '✅ 匹配' : '❌ 不匹配'}`);
      } catch (e) {
        console.log(`   比较失败(可能不是有效hash): ${e.message.substring(0, 60)}`);
      }
      
      if (!matchResult) {
        // 生成新的正确 hash 并直接更新（绕过 hooks）
        const correctHash = await bcrypt.hash(acc.password, 10);
        
        // 用原生 MongoDB update，不经过 Mongoose
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: correctHash } }
        );
        console.log(`🔧 已重置密码为正确的单次bcrypt hash`);
        
        // 验证修复后的密码
        const verifyUser = await usersCollection.findOne({ _id: user._id });
        const verifyMatch = await bcrypt.compare(acc.password, verifyUser.password);
        console.log(`   重置后验证: ${verifyMatch ? '✅ 匹配成功！' : '❌ 仍然不匹配'}`);
      } else {
        console.log(`   ✅ 密码正常，无需修改`);
      }
    }
  }
  
  // 最终验证
  console.log('\n\n=== 最终验证 ===\n');
  for (const acc of TEST_ACCOUNTS) {
    const user = await usersCollection.findOne({ email: acc.email.toLowerCase() });
    if (user) {
      const match = await bcrypt.compare(acc.password, user.password);
      console.log(`${match ? '✅' : '❌'} ${acc.email} | 密码: ${acc.password} | ${match ? '可正常登录' : '仍有问题'}`);
    } else {
      console.log(`❌ ${acc.email} | 用户不存在`);
    }
  }

  await mongoose.disconnect();
  console.log('\n🎉 完成！');
}

main().catch(e => {
  console.error('💥 失败:', e.message);
  process.exit(1);
});
