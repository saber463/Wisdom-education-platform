// 使用server目录下的mongoose模块
const mongoose = require('./server/node_modules/mongoose');

// 连接到MongoDB
mongoose.connect('mongodb://localhost:27017/learning-platform-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 获取数据库连接
const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
  process.exit(1);
});

db.once('open', async () => {
  console.log('MongoDB连接成功');
  
  try {
    // 获取users集合
    const User = require('./server/models/User');
    const collection = db.collection('users');
    
    // 列出所有索引
    console.log('当前索引:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log('-', index.name, ':', index.key);
    });
    
    // 删除_email_1索引
    console.log('\n删除索引: _email_1');
    await collection.dropIndex('_email_1');
    console.log('索引删除成功');
    
    // 再次列出所有索引
    console.log('\n删除后的索引:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log('-', index.name, ':', index.key);
    });
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    // 关闭连接
    mongoose.connection.close();
    process.exit(0);
  }
});