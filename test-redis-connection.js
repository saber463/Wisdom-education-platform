// 测试Redis连接
const redis = require('redis');

async function testRedis() {
  console.log('正在测试Redis连接...');
  console.log('地址: 127.0.0.1:6379');
  console.log('密码: 000000');
  
  const client = redis.createClient({
    url: 'redis://:000000@127.0.0.1:6379',
    socket: {
      reconnectStrategy: false
    }
  });

  client.on('error', (err) => {
    console.error('❌ Redis连接错误:', err.message);
    process.exit(1);
  });

  client.on('connect', () => {
    console.log('✅ Redis连接成功');
  });

  client.on('ready', () => {
    console.log('✅ Redis客户端就绪');
  });

  try {
    await client.connect();
    
    // 测试PING
    const pong = await client.ping();
    console.log('✅ PING测试:', pong);
    
    // 测试SET/GET
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('✅ SET/GET测试:', value);
    
    // 删除测试键
    await client.del('test_key');
    
    await client.quit();
    console.log('\n✅ Redis连接测试成功！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis连接测试失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. Redis服务未启动');
    console.error('2. 端口6379未监听');
    console.error('3. 密码配置错误');
    console.error('4. 防火墙阻止连接');
    process.exit(1);
  }
}

testRedis();
