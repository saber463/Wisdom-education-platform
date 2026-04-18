const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  vipLevel: Number,
  vipExpireAt: Date
});

const User = mongoose.model('User', UserSchema);

async function createVipUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai_learning');
    
    // 检查是否已存在
    let vip = await User.findOne({ email: 'vip1@test.com' });
    if (vip) {
      console.log('VIP账号已存在:', vip.email, 'role:', vip.role, 'vipLevel:', vip.vipLevel);
    } else {
      // 创建新的VIP用户
      const hashedPassword = await bcrypt.hash('Vip123!', 10);
      vip = await User.create({
        username: 'VIP用户',
        email: 'vip1@test.com',
        password: hashedPassword,
        role: 'student',
        vipLevel: 1,
        vipExpireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1年后过期
      });
      console.log('创建VIP账号成功:', vip.email, 'vipLevel:', vip.vipLevel);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('错误:', err);
    process.exit(1);
  }
}

createVipUser();
