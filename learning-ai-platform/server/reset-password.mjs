import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

await mongoose.connect('mongodb://localhost:27017/learning-ai-platform');
console.log('Connected to MongoDB');

const email = 'student1@test.com';
const newPassword = 'Test123@';

// 生成哈希密码
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(newPassword, salt);

// 直接更新 password 字段
const result = await User.updateOne(
  { email: email },
  { $set: { password: hashedPassword } }
);

console.log('Update result:', result);

// 验证
const user = await User.findOne({ email: email }).select('+password');
console.log('Password hash after update:', user?.password);
console.log('Password match:', bcrypt.compareSync(newPassword, user?.password));

await mongoose.disconnect();
console.log('Done!');
