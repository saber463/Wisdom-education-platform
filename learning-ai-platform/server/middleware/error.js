import { ErrorResponse } from '../utils/errorResponse.js';

const errorHandler = (err, req, res, _next) => {
  // 克隆错误对象，避免直接修改原始错误
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;
  error.statusCode = err.statusCode;

  // 开发环境下打印详细错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error('\n📋 错误详情：');
    console.error('   名称：', error.name || 'Error');
    console.error('   代码：', error.code);
    console.error('   状态码：', error.statusCode);
    console.error('   消息：', error.message);
    console.error('   堆栈：', error.stack);
    console.error('\n🔍 请求信息：');
    console.error('   方法：', req.method);
    console.error('   URL：', req.originalUrl);
    console.error('   IP：', req.ip);
    console.error('   用户代理：', req.get('User-Agent'));
    console.error('\n--- 错误日志结束 --\n');
  } else {
    // 生产环境只打印基本错误信息
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${error.name || 'Error'}: ${error.message}`
    );
  }

  // 初始化响应状态和消息
  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';
  let errorDetails = {};

  // 1. MongoDB 验证错误
  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = '请求参数验证失败';
    errorDetails = Object.keys(error.errors).reduce((acc, key) => {
      acc[key] = error.errors[key].message;
      return acc;
    }, {});
  }

  // 2. MongoDB 重复键错误
  if (error.name === 'MongoError' && error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    message = `资源已存在：${field}`;
    errorDetails = { [field]: `${field} 字段值已存在` };
  }

  // 3. MongoDB ID 格式错误
  if (error.name === 'CastError') {
    statusCode = 400;
    message = '资源ID格式错误';
    errorDetails = { id: '提供的ID格式无效' };
  }

  // 4. JWT 认证错误
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的认证令牌';
    errorDetails = { token: '令牌格式错误或已损坏' };
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '认证令牌已过期';
    errorDetails = { token: '令牌已超过有效期' };
  }

  if (error.name === 'NotBeforeError') {
    statusCode = 401;
    message = '认证令牌尚未生效';
    errorDetails = { token: '令牌尚未到生效时间' };
  }

  // 5. 文件系统错误
  if (error.code === 'ENOENT') {
    statusCode = 404;
    message = '请求的资源不存在';
    errorDetails = { file: '文件或目录不存在' };
  }

  // 6. 数据库连接错误
  if (error.name === 'MongoNetworkError' || error.name === 'MongooseError') {
    statusCode = 503;
    message = '数据库连接失败';
    errorDetails = { database: '无法连接到数据库服务' };
  }

  // 7. 网络请求错误
  if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = '无法连接到外部服务';
    errorDetails = { service: '外部服务连接被拒绝' };
  }

  if (error.code === 'ECONNABORTED') {
    statusCode = 504;
    message = '外部服务请求超时';
    errorDetails = { service: '外部服务响应超时' };
  }

  // 8. 安全相关错误
  if (error.code === 'FORBIDDEN') {
    statusCode = 403;
    message = '禁止访问';
    errorDetails = { security: '操作违反安全策略' };
  }

  // 9. 请求方法不允许
  if (error.code === 'METHOD_NOT_ALLOWED') {
    statusCode = 405;
    message = '不允许的请求方法';
    errorDetails = { method: '该接口不支持当前请求方法' };
  }

  // 10. 请求大小限制错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = '文件大小超过限制';
    errorDetails = { file: '上传的文件大小超过了服务器限制' };
  }

  // 11. 自定义错误类型
  if (error instanceof ErrorResponse) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // 构建统一的错误响应格式
  const response = {
    success: false,
    code: statusCode,
    message: message,
  };

  // 开发环境下添加详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.error = errorDetails;
    response.stack = error.stack;
  }

  // 生产环境下只在非500错误时添加错误详情
  if (process.env.NODE_ENV === 'production' && statusCode < 500) {
    response.error = errorDetails;
  }

  // 返回错误响应
  res.status(statusCode).json(response);
};

export default errorHandler;
