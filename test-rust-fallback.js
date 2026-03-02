// 测试Rust降级服务功能
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testRustFallback() {
  console.log('========================================');
  console.log('  测试Rust降级服务功能');
  console.log('========================================\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查:', healthRes.data.message);
    console.log('');

    // 2. 测试加密/解密
    console.log('2. 测试AES-256-GCM加密/解密...');
    const testData = '这是一段测试数据 - 智慧教育平台';
    const testKey = 'my-secret-key-2024';

    const encryptRes = await axios.post(`${BASE_URL}/api/encrypt`, {
      data: testData,
      key: testKey
    });
    console.log('✅ 加密成功');
    console.log('   原始数据:', testData);
    console.log('   加密数据:', encryptRes.data.encrypted_data.substring(0, 50) + '...');

    const decryptRes = await axios.post(`${BASE_URL}/api/decrypt`, {
      encrypted_data: encryptRes.data.encrypted_data,
      key: testKey
    });
    console.log('✅ 解密成功');
    console.log('   解密数据:', decryptRes.data.data);
    console.log('   数据匹配:', testData === decryptRes.data.data ? '✅ 是' : '❌ 否');
    console.log('');

    // 3. 测试密码哈希
    console.log('3. 测试bcrypt密码哈希...');
    const testPassword = 'MySecurePassword123!';
    const hashRes = await axios.post(`${BASE_URL}/api/hash`, {
      password: testPassword
    });
    console.log('✅ 哈希成功');
    console.log('   原始密码:', testPassword);
    console.log('   哈希值:', hashRes.data.hash);
    console.log('');

    // 4. 测试文本相似度
    console.log('4. 测试文本相似度计算...');
    const text1 = '智慧教育学习平台';
    const text2 = '智慧教育平台';
    const similarityRes = await axios.post(`${BASE_URL}/api/similarity`, {
      text1,
      text2
    });
    console.log('✅ 相似度计算成功');
    console.log('   文本1:', text1);
    console.log('   文本2:', text2);
    console.log('   相似度:', (similarityRes.data.similarity * 100).toFixed(2) + '%');
    console.log('');

    console.log('========================================');
    console.log('  ✅ 所有功能测试通过！');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

testRustFallback();
