import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://localhost:27017/learning-ai-platform';

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
    console.log('Connected to MongoDB: learning-ai-platform');

    // 清除现有用户
    await User.deleteMany({});
    console.log('已清除现有用户\n');

    const users = [
      {
        email: 'student1@test.com',
        password: 'Student123!',
        username: '林晓宇',
        role: 'student',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'teacher1@test.com',
        password: 'Teacher123!',
        username: '张明哲',
        role: 'teacher',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'parent1@test.com',
        password: 'Parent123!',
        username: '王建国',
        role: 'parent',
        isVip: false,
        vipLevel: 0
      },
      {
        email: 'vip1@test.com',
        password: 'Vip12345!',
        username: '赵小悦',
        role: 'student',
        isVip: true,
        vipLevel: 1
      }
    ];

    for (const u of users) {
      const user = new User(u);
      await user.save();
      console.log(`创建用户: ${u.email} (${u.role})`);
    }

    console.log('\n=== 验证密码匹配 ===');
    for (const u of users) {
      const user = await User.findOne({ email: u.email.toLowerCase() });
      const isMatch = await user.matchPassword(u.password);
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