const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// 数据库连接配置
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning-ai-platform';

async function diagnosePassword() {
  console.log('=== 密码问题诊断 ===\n');

  try {
    // 连接数据库
    console.log('1. 连接数据库...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ 数据库连接成功\n');

    // 查找测试用户
    console.log('2. 查找测试用户...');
    const user = await User.findOne({ email: 'test@example.com' }).select('+password');

    if (!user) {
      console.log('✗ 用户不存在');
      return;
    }

    console.log('✓ 找到用户');
    console.log(`  用户名: ${user.username}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  密码字段类型: ${typeof user.password}`);
    console.log(`  密码字段值: ${user.password}`);
    console.log(`  密码长度: ${user.password ? user.password.length : 0}\n`);

    // 测试bcrypt.compare
    console.log('3. 测试bcrypt.compare...');
    const testPassword = 'Test123@';
    console.log(`  测试密码: ${testPassword}`);
    console.log(`  测试密码类型: ${typeof testPassword}`);
    console.log(`  数据库密码: ${user.password}`);
    console.log(`  数据库密码类型: ${typeof user.password}\n`);

    try {
      const result1 = await bcrypt.compare(testPassword, user.password);
      console.log(`  ✓ bcrypt.compare结果: ${result1}\n`);
    } catch (error) {
      console.log(`  ✗ bcrypt.compare失败: ${error.message}\n`);
    }

    // 测试直接使用User.matchPassword方法
    console.log('4. 测试User.matchPassword方法...');
    try {
      const result2 = await user.matchPassword(testPassword);
      console.log(`  ✓ User.matchPassword结果: ${result2}\n`);
    } catch (error) {
      console.log(`  ✗ User.matchPassword失败: ${error.message}\n`);
    }

    // 重新设置密码
    console.log('5. 重新设置密码...');
    const newPassword = 'Test123@';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log(`  新密码: ${newPassword}`);
    console.log(`  加密后密码: ${hashedPassword}`);

    user.password = hashedPassword;
    await user.save();
    console.log('  ✓ 密码已重新设置\n');

    // 再次测试密码验证
    console.log('6. 再次测试密码验证...');
    const result3 = await bcrypt.compare(newPassword, user.password);
    console.log(`  ✓ bcrypt.compare结果: ${result3}\n`);

    // 测试登录
    console.log('7. 测试登录流程...');
    const loginPassword = 'Test123@';
    const isMatch = await user.matchPassword(loginPassword);
    console.log(`  ✓ 登录密码验证: ${isMatch ? '成功' : '失败'}\n`);

    if (isMatch) {
      console.log('=== 诊断完成 - 密码问题已解决 ===');
      console.log('\n测试账号信息:');
      console.log('  邮箱: test@example.com');
      console.log('  密码: Test123@');
      console.log('\n现在可以正常登录了！\n');
    } else {
      console.log('=== 诊断完成 - 密码问题仍未解决 ===\n');
    }
  } catch (error) {
    console.error('✗ 诊断失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 运行诊断
diagnosePassword();
