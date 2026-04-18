import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/edu_platform';

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  role: String,
  isVip: Boolean,
  vipLevel: Number
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, 'email username role isVip vipLevel');
    console.log('\n=== Database Users ===');
    users.forEach(u => {
      console.log(`- ${u.email} | ${u.username} | role: ${u.role} | VIP: ${u.isVip ? `Level ${u.vipLevel}` : 'No'}`);
    });
    console.log(`\nTotal: ${users.length} users`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
