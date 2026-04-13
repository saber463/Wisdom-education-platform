// 重置用户密码脚本
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

// 配置
const DB_URI = 'mongodb://localhost:27017/learning-platform-db';
const NEW_PASSWORD = 'Test@123'; // 要重置的新密码

async function resetPasswords() {
  console.log('开始重置用户密码...');

  try {
    // 连接数据库
    await mongoose.connect(DB_URI);
    console.log('数据库连接成功');

    // 查询所有用户
    const users = await User.find({}, 'email username');
    console.log('\n数据库中的用户列表:');
    users.forEach(user => {
      console.log('- 邮箱:', user.email, '用户名:', user.username);
    });

    // 重置所有用户的密码
    for (const user of users) {
      console.log('\n重置用户密码:', user.email);

      try {
        // 直接更新用户密码
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log('密码重置成功');

        // 验证密码是否正确
        const updatedUser = await User.findById(user._id).select('+password');
        const isMatch = await bcrypt.compare(NEW_PASSWORD, updatedUser.password);
        console.log('密码验证结果:', isMatch);
      } catch (error) {
        console.error('密码重置失败:', error);
      }
    }
  } catch (error) {
    console.error('重置过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行重置
resetPasswords();
