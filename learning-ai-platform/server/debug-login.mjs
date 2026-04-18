import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

await mongoose.connect('mongodb://localhost:27017/learning-ai-platform');
console.log('Connected to MongoDB');

// 读取.env
const envContent = readFileSync('.env', 'utf-8');
const jwtSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1] || 'default-secret';
console.log('JWT_SECRET from .env:', jwtSecret);

const email = 'student1@test.com';
const password = 'Test123@';

// 查找用户
const user = await User.findOne({ email: email }).select('+password');
console.log('\n=== 用户信息 ===');
console.log('User found:', !!user);
if (user) {
  console.log('Email:', user.email);
  console.log('Password hash:', user.password);
  console.log('Hash length:', user.password?.length);
  
  // 测试bcrypt
  const match = await bcrypt.compare(password, user.password);
  console.log('bcrypt.compare result:', match);
  
  // 测试matchPassword方法
  const matchMethod = await user.matchPassword(password);
  console.log('user.matchPassword result:', matchMethod);
  
  // 生成JWT
  const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '30d' });
  console.log('Generated JWT:', token.substring(0, 50) + '...');
}

await mongoose.disconnect();
