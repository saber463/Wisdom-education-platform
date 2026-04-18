import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/learning-ai-platform').then(async () => {
  const users = mongoose.connection.db.collection('users');
  await users.updateOne({email: 'student1@test.com'}, {$set: {username: '林晓宇'}});
  await users.updateOne({email: 'parent1@test.com'}, {$set: {username: '王建国'}});
  await users.updateOne({email: 'teacher1@test.com'}, {$set: {username: '张明哲'}});
  await users.updateOne({email: 'vip1@test.com'}, {$set: {username: '赵小悦'}});
  console.log('Names updated successfully');
}).catch(console.error).finally(() => mongoose.disconnect());
