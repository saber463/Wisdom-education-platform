import crypto from 'crypto';

const csrfTokens = new Map();

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getCsrfToken = (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.ip;
    const token = generateToken();
    const secret = generateToken();

    csrfTokens.set(userId, {
      token,
      secret,
      createdAt: Date.now(),
    });

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.setHeader('X-CSRF-Token', token);

    next();
  } catch (error) {
    console.error('CSRF Token生成错误:', error);
    next();
  }
};

const verifyCsrfToken = (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.ip;
    const csrfData = csrfTokens.get(userId);

    if (!csrfData) {
      return res.status(403).json({
        success: false,
        message: 'CSRF Token无效或已过期',
      });
    }

    const tokenFromHeader = req.headers['x-csrf-token'];
    const tokenFromBody = req.body?._csrf;

    // 安全漏洞修复：CSRF令牌不应从Cookie中读取进行验证，因为浏览器会自动发送Cookie
    // 令牌必须从自定义头部或请求体中获取
    const providedToken = tokenFromHeader || tokenFromBody;

    if (!providedToken || providedToken !== csrfData.token) {
      return res.status(403).json({
        success: false,
        message: 'CSRF Token验证失败',
      });
    }

    const tokenAge = Date.now() - csrfData.createdAt;
    if (tokenAge > 3600000) {
      csrfTokens.delete(userId);
      return res.status(403).json({
        success: false,
        message: 'CSRF Token已过期，请重新获取',
      });
    }

    next();
  } catch (error) {
    console.error('CSRF Token验证错误:', error);
    return res.status(403).json({
      success: false,
      message: 'CSRF Token验证失败',
    });
  }
};

const clearCsrfToken = (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.ip;
    csrfTokens.delete(userId);

    res.clearCookie('XSRF-TOKEN');

    next();
  } catch (error) {
    console.error('CSRF Token清除错误:', error);
    next();
  }
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now - value.createdAt > 3600000) {
      csrfTokens.delete(key);
    }
  }
}, 300000);

export { getCsrfToken, verifyCsrfToken, clearCsrfToken };
