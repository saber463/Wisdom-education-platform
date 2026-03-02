const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// 数据库连接配置
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning-ai-platform';

async function testDatabase() {
  console.log('=== 数据库测试开始 ===\n');

  try {
    // 连接数据库
    console.log('1. 连接数据库...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ 数据库连接成功\n');

    // 检查现有用户
    console.log('2. 检查现有用户...');
    const users = await User.find({});
    console.log(`✓ 找到 ${users.length} 个用户`);

    if (users.length > 0) {
      console.log('\n现有用户列表:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. 用户名: ${user.username}, 邮箱: ${user.email}`);
      });
      console.log('');
    }

    // 创建测试用户
    console.log('3. 创建测试用户...');
    const testUserEmail = 'test@example.com';
    const testUserPassword = 'Test123@';

    // 检查测试用户是否已存在
    let testUser = await User.findOne({ email: testUserEmail });

    if (testUser) {
      console.log('✓ 测试用户已存在');
      console.log(`  用户名: ${testUser.username}`);
      console.log(`  邮箱: ${testUser.email}`);
      console.log(`  ID: ${testUser._id}\n`);

      // 验证密码
      console.log('4. 验证测试用户密码...');
      const isMatch = await testUser.matchPassword(testUserPassword);
      console.log(`✓ 密码验证: ${isMatch ? '成功' : '失败'}\n`);
    } else {
      console.log('创建新的测试用户...');
      testUser = await User.create({
        username: 'testuser',
        email: testUserEmail,
        password: testUserPassword,
        avatar: 'https://via.placeholder.com/150',
        learningInterests: ['编程', '人工智能', 'Web开发'],
        learningStats: {
          totalStudyTime: 0,
          completedCourses: 0,
          currentCourses: 0,
          generatedPaths: 0,
        },
      });
      console.log('✓ 测试用户创建成功');
      console.log(`  用户名: ${testUser.username}`);
      console.log(`  邮箱: ${testUser.email}`);
      console.log(`  密码: ${testUserPassword}`);
      console.log(`  ID: ${testUser._id}\n`);
    }

    // 测试JWT生成
    console.log('5. 测试JWT令牌生成...');
    const token = testUser.getSignedJwtToken();
    console.log('✓ JWT令牌生成成功');
    console.log(`  Token长度: ${token.length}`);
    console.log(`  Token前20字符: ${token.substring(0, 20)}...\n`);

    // 测试JWT验证
    console.log('6. 测试JWT令牌验证...');
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✓ JWT令牌验证成功');
      console.log(`  用户ID: ${decoded.id}`);
      console.log(`  用户名: ${decoded.username}\n`);
    } catch (error) {
      console.log('✗ JWT令牌验证失败:', error.message, '\n');
    }

    console.log('=== 数据库测试完成 ===');
    console.log('\n测试账号信息:');
    console.log('  邮箱: test@example.com');
    console.log('  密码: Test123@');
    console.log('\n您可以使用此账号登录系统进行测试。\n');
  } catch (error) {
    console.error('✗ 数据库测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
testDatabase();
