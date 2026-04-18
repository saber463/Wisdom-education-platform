import mongoose from 'mongoose';
import User from './models/User.js';

await mongoose.connect('mongodb://localhost:27017/learning-ai-platform');
console.log('Connected to MongoDB');

const user = await User.findOne({email: 'student1@test.com'}).lean();
if (user) {
  console.log('User found:', user.email);
  console.log('Password hash:', user.password);
  console.log('User object:', JSON.stringify(user, null, 2));
} else {
  console.log('User NOT found');
}

await mongoose.disconnect();
