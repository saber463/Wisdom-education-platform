const http = require('http');

// 测试后端API连接
const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/users/preset-avatars',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

req.end();