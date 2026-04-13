const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'test@example.com',
      password: 'Test@123456',
    });
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLogin();
