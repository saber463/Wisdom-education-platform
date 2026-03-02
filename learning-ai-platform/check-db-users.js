const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// 连接数据库
const connectDB = require('./server/config/db');

// 导入用户模型
const User = require('./server/models/User');

async function checkDbUsers() {
  try {
    console.log('=== 检查数据库用户信息 ===');
    
    // 连接数据库
    await connectDB();
    console.log('✓ 数据库连接成功');
    
    // 查询所有用户
    const users = await User.find().select('username email password role');
    console.log(`\n✓ 找到 ${users.length} 个用户`);
    
    // 显示用户信息
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`  用户名: ${user.username}`);
      console.log(`  邮箱: ${user.email}`);
      console.log(`  密码哈希: ${user.password}`);
      console.log(`  角色: ${user.role}`);
    });
    
    // 测试密码验证
    if (users.length > 0) {
      const testUser = users[0];
      const testPassword = 'Test@1234';
      console.log(`\n=== 测试密码验证 (${testUser.username}) ===`);
      console.log(`测试密码: ${testPassword}`);
      
      // 使用 bcrypt 直接验证
      const isMatch = await bcrypt.compare(testPassword, testUser.password);
      console.log(`密码匹配结果: ${isMatch}`);
      
      // 使用用户模型的方法验证
      if (testUser.matchPassword) {
        const modelMatch = await testUser.matchPassword(testPassword);
        console.log(`模型方法验证结果: ${modelMatch}`);
      }
    }
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n✓ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 检查用户信息失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 运行脚本
checkDbUsers();