import mongoose from 'mongoose';
import User from './models/User.js';

await mongoose.connect('mongodb://localhost:27017/ai_learnhub');
console.log('Connected to MongoDB: ai_learnhub\n');

const users = await User.find({}).limit(20);
console.log('=== Users in ai_learnhub ===');
console.log('Total users:', users.length);
users.forEach(u => console.log('-', u.email, '(', u.username, ')'));

await mongoose.disconnect();
