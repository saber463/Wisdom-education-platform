const axios = require('axios');

async function login() {
  try {
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    console.log('Login response:', response.data);
    if (response.data.success && response.data.token) {
      console.log('\nNew Token:', response.data.token);
      console.log('\nYou can now use this token in your test scripts.');
    }
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
  }
}

login();