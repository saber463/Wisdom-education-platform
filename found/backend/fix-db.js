const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// 数据库连接配置
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning-ai-platform';

async function fixDatabase() {
  console.log('=== 修复数据库用户密码 ===\n');

  try {
    // 连接数据库
    console.log('1. 连接数据库...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ 数据库连接成功\n');

    // 查找所有用户
    console.log('2. 查找所有用户...');
    const users = await User.find({}).select('+password');
    console.log(`✓ 找到 ${users.length} 个用户\n`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`用户 ${i + 1}: ${user.username} (${user.email})`);
      console.log(`  密码字段: ${user.password ? '存在' : '不存在'}`);
      console.log(
        `  密码值: ${user.password ? user.password.substring(0, 20) + '...' : 'undefined'}`
      );

      // 如果密码不存在或为空，设置默认密码
      if (!user.password) {
        console.log('  ⚠ 密码字段缺失，设置默认密码...');
        const defaultPassword = 'Test123@';
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(defaultPassword, salt);
        await user.save();
        console.log('  ✓ 默认密码已设置: Test123@');
      }

      // 验证密码
      const testPassword = 'Test123@';
      const isMatch = await user.matchPassword(testPassword);
      console.log(`  密码验证: ${isMatch ? '成功' : '失败'}`);
      console.log('');
    }

    console.log('=== 数据库修复完成 ===');
    console.log('\n所有用户密码已验证/修复');
    console.log('默认密码: Test123@\n');
  } catch (error) {
    console.error('✗ 数据库修复失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 运行修复
fixDatabase();
