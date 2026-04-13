const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// 连接数据库
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority',
  })
  .then(() => {
    console.log('MongoDB连接成功');

    // 查询所有分类
    return Category.find();
  })
  .then(categories => {
    console.log('实际分类ID:');
    categories.forEach(cat => {
      console.log('- ' + cat.name + ': ' + cat._id);
    });

    // 断开连接
    return mongoose.disconnect();
  })
  .then(() => {
    console.log('MongoDB连接已断开');
  })
  .catch(err => {
    console.error('操作失败:', err);
    mongoose.disconnect();
  });
