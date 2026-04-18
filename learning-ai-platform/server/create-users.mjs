import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/edu_platform';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, default: 'student' },
  isVip: { type: Boolean, default: false },
  vipLevel: { type: Number, default: 0 },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');
    
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
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        email: u.email,
        password: hashedPassword,
        username: u.username,
        role: u.role,
        isVip: u.isVip,
        vipLevel: u.vipLevel
      });
      console.log(`Created: ${u.email} (${u.role})`);
    }
    
    console.log('\n=== All users created ===');
    const allUsers = await User.find({}, 'email username role isVip vipLevel');
    allUsers.forEach(u => {
      console.log(`- ${u.email} | ${u.username} | role: ${u.role} | VIP: ${u.isVip ? `Level ${u.vipLevel}` : 'No'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createUsers();
