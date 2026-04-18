import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

await mongoose.connect('mongodb://localhost:27017/ai_learnhub');
console.log('Connected to MongoDB: ai_learnhub');

const testUsers = [
  { email: 'student1@test.com', password: 'Test123@' },
  { email: 'student2@test.com', password: 'Test123@' },
  { email: 'student3@test.com', password: 'Test123@' },
  { email: 'teacher1@test.com', password: 'Test123@' },
  { email: 'teacher2@test.com', password: 'Test123@' },
  { email: 'parent1@test.com', password: 'Test123@' },
  { email: 'parent2@test.com', password: 'Test123@' },
  { email: 'admin@test.com', password: 'Admin123@' },
];

const salt = await bcrypt.genSalt(10);

for (const user of testUsers) {
  const hashedPassword = await bcrypt.hash(user.password, salt);
  const result = await User.updateOne(
    { email: user.email },
    { $set: { password: hashedPassword } }
  );
  console.log(`${user.email}: ${result.modifiedCount > 0 ? '✅ Updated' : '⚠️ Not found or not modified'}`);
}

await mongoose.disconnect();
console.log('\nDone!');
