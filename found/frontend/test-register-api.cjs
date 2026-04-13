const axios = require('axios');

// 测试注册API
async function testRegister() {
  try {
    const response = await axios.post('http://localhost:4001/api/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123456',
      confirmPassword: 'Test@123456',
    });

    console.log('Registration Response:', response.data);
  } catch (error) {
    console.log('Registration Error Status:', error.response?.status);
    console.log('Registration Error Data:', error.response?.data);
  }
}

testRegister();
