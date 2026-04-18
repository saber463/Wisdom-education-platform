import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/edu_platform';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, default: 'student' },
  avatar: String,
  isVip: { type: Boolean, default: false },
  vipLevel: { type: Number, default: 0 },
  learningInterests: [String],
  learningStats: {
    totalStudyTime: { type: Number, default: 0 },
    completedCourses: { type: Number, default: 0 },
    currentCourses: { type: Number, default: 0 }
  }
}, { collection: 'users' });

// 导入 bcrypt 用于 pre hook
import bcrypt from 'bcryptjs';

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`密码已hash: ${this.email}`);
  }
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

async function createUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 清除现有用户
    await User.deleteMany({});
    console.log('已清除现有用户\n');
    
    const users = [
      {
        email: 'student1@test.com',
        password: 'Student123!',  // pre('save') 会自动hash
        username: '林晓宇',
        role: 'student',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'teacher1@test.com',
        password: 'Teacher123!',  // pre('save') 会自动hash
        username: '张明哲',
        role: 'teacher',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'parent1@test.com',
        password: 'Parent123!',  // pre('save') 会自动hash
        username: '王建国',
        role: 'parent',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'vip1@test.com',
        password: 'Vip12345!',  // pre('save') 会自动hash
        username: '赵小悦',
        role: 'student',
        isVip: true,
        vipLevel: 1
      }
    ];
    
    for (const u of users) {
      const user = new User(u);
      await user.save();  // 这会触发 pre('save') hook
      console.log(`创建用户: ${u.email}`);
    }
    
    console.log('\n=== 验证创建的用户 ===');
    const allUsers = await User.find({});
    for (const u of allUsers) {
      console.log(`- ${u.email} | ${u.username} | role: ${u.role} | VIP: ${u.isVip ? `Level ${u.vipLevel}` : 'No'}`);
      console.log(`  密码hash前20字符: ${u.password.substring(0, 20)}...`);
    }
    
    console.log('\n=== 验证密码匹配 ===');
    const testUser = await User.findOne({ email: 'student1@test.com' }).select('+password');
    const isMatch = await testUser.matchPassword('Student123!');
    console.log(`student1@test.com 密码验证: ${isMatch ? '✓ 成功' : '✗ 失败'}`);
    
    await mongoose.disconnect();
    console.log('\n完成！');
  } catch (err) {
    console.error('错误:', err);
    process.exit(1);
  }
}

createUsers();
