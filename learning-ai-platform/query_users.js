// 查询数据库中的用户记录
const mongoose = require('mongoose');
const User = require('./server/models/user');

// 连接数据库 - 使用正确的数据库名
mongoose.connect('mongodb://localhost:27017/learning-platform-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 查询所有用户
User.find({}, 'email username createdAt').then(users => {
  console.log('数据库中的用户列表:');
  users.forEach(user => {
    console.log('- 邮箱:', user.email, '用户名:', user.username, '创建时间:', user.createdAt);
  });
}).catch(err => {
  console.error('查询用户失败:', err);
}).finally(() => {
  // 关闭数据库连接
  mongoose.connection.close();
});