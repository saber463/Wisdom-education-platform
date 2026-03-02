const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// 数据库连接配置
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning-ai-platform';

async function resetAllPasswords() {
  console.log('=== 重置所有用户密码 ===\n');

  try {
    // 连接数据库
    console.log('1. 连接数据库...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ 数据库连接成功\n');

    // 查找所有用户
    console.log('2. 查找所有用户...');
    const users = await User.find({});
    console.log(`✓ 找到 ${users.length} 个用户\n`);

    const defaultPassword = 'Test123@';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    console.log(`默认密码: ${defaultPassword}`);
    console.log(`加密后: ${hashedPassword}\n`);

    // 使用updateOne直接更新密码，绕过验证
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`用户 ${i + 1}: ${user.username} (${user.email})`);

      // 直接更新数据库，绕过Mongoose验证
      await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

      console.log('  ✓ 密码已重置\n');
    }

    // 验证密码是否正确
    console.log('3. 验证密码...');
    const testUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    const isMatch = await bcrypt.compare(defaultPassword, testUser.password);
    console.log(`✓ 密码验证: ${isMatch ? '成功' : '失败'}\n`);

    if (isMatch) {
      console.log('=== 密码重置完成 ===');
      console.log('\n所有用户密码已重置为: Test123@');
      console.log('\n测试账号:');
      console.log('  邮箱: test@example.com');
      console.log('  密码: Test123@\n');
    }
  } catch (error) {
    console.error('✗ 密码重置失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 运行重置
resetAllPasswords();
