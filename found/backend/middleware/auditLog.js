import AuditLog from '../models/AuditLog.js';

const getResourceType = path => {
  const resourceMap = {
    '/users': 'user',
    '/products': 'product',
    '/orders': 'order',
    '/tweets': 'tweet',
    '/categories': 'category',
    '/tests': 'test',
    '/knowledge-points': 'knowledgePoint',
    '/groups': 'group',
    '/wallet': 'wallet',
    '/learning-progress': 'learningProgress',
    '/notifications': 'notification',
    '/theme': 'theme',
  };

  for (const [route, type] of Object.entries(resourceMap)) {
    if (path.startsWith(route)) {
      return type;
    }
  }

  return 'unknown';
};

const getAction = (method, _path) => {
  switch (method) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'read';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
};

const getResourceId = (path, resourceType) => {
  if (resourceType === 'unknown') return null;

  const regex = new RegExp(`/${resourceType}s/([0-9a-fA-F]{24})`);
  const match = path.match(regex);
  return match ? match[1] : null;
};

export const auditLog = async (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  res.send = async function (body) {
    res.send = originalSend;

    try {
      const duration = Date.now() - startTime;

      let responseBody;
      try {
        responseBody = typeof body === 'string' ? JSON.parse(body) : body;
      } catch {
        responseBody = body;
      }

      const logData = {
        action: getAction(req.method),
        userId: req.user ? req.user._id : null,
        username: req.user ? req.user.username : 'anonymous',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        resourceType: getResourceType(req.path.replace('/api/v1', '')),
        resourceId: getResourceId(
          req.path.replace('/api/v1', ''),
          getResourceType(req.path.replace('/api/v1', ''))
        ),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        result: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed',
        duration,
      };

      if (logData.result === 'failed') {
        logData.errorMessage = responseBody.message || '操作失败';
      }

      if (req.path.includes('/login')) {
        logData.action = 'login';
        logData.result = res.statusCode === 200 ? 'success' : 'failed';
      }

      if (req.path.includes('/logout')) {
        logData.action = 'logout';
      }

      await AuditLog.create(logData);
    } catch (logError) {
      console.error('审计日志记录失败:', logError);
    }

    return res.send(body);
  };

  next();
};

export const logAudit = async logData => {
  try {
    await AuditLog.create(logData);
    return true;
  } catch (error) {
    console.error('手动审计日志记录失败:', error);
    return false;
  }
};

export default {
  auditLog,
  logAudit,
};
