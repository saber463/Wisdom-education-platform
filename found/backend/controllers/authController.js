// 用户认证控制器
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
// 导入自定义错误类
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  InternalServerError,
} from '../utils/errorResponse.js';

// 生成JWT令牌
const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { username, email, password, confirmPassword, learningInterests } = req.body;

  try {
    // 检查邮箱是否已存在（转为小写比较）
    const lowercaseEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowercaseEmail });

    if (existingUser) {
      return next(new ConflictError('User already exists with this email'));
    }

    // 检查密码是否匹配
    if (password !== confirmPassword) {
      return next(new BadRequestError('Passwords do not match'));
    }

    // 验证密码长度
    if (password.length < 6) {
      return next(new BadRequestError('Password must be at least 6 characters'));
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new BadRequestError('Invalid email format'));
    }

    // 创建用户
    const user = await User.create({
      username,
      email: lowercaseEmail, // 存储为小写
      password,
      learningInterests,
    });

    // 生成JWT令牌
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        learningInterests: user.learningInterests,
        learningStats: user.learningStats,
      },
    });
  } catch (error) {
    console.error('注册错误:', error); // 记录详细错误信息
    next(new InternalServerError('服务器错误'));
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    console.log('=== 登录请求 ===');
    console.log('邮箱:', email);
    console.log('密码长度:', password ? password.length : 0);

    // 检查邮箱和密码是否提供
    if (!email || !password) {
      return next(new BadRequestError('请提供邮箱和密码'));
    }

    // 查找用户（转为小写比较）
    const lowercaseEmail = email.toLowerCase();
    console.log('查找用户，邮箱:', lowercaseEmail);
    const user = await User.findOne({ email: lowercaseEmail }).select('+password');
    console.log('查找用户结果:', user ? '找到用户' : '未找到用户');

    if (!user) {
      console.log('用户不存在');
      return next(new UnauthorizedError('Invalid credentials'));
    }

    console.log('用户ID:', user._id);
    console.log('用户名:', user.username);
    console.log('开始验证密码...');

    // 验证密码
    const isMatch = await user.matchPassword(password);
    console.log('密码验证结果:', isMatch);

    if (!isMatch) {
      console.log('密码不匹配');
      return next(new UnauthorizedError('Invalid credentials'));
    }

    // 生成JWT令牌
    console.log('生成JWT令牌...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    const token = generateToken(user._id);
    console.log('JWT令牌生成成功，长度:', token.length);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        learningInterests: user.learningInterests,
        learningStats: user.learningStats,
      },
    });
  } catch (error) {
    console.error('登录错误:', error); // 记录详细错误信息
    next(new InternalServerError('服务器错误'));
  }
};

// @desc    检查邮箱是否已存在
// @route   GET /api/auth/check-email
// @access  Public
const checkEmailExists = async (req, res, _next) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: '请提供邮箱' });
    }

    const lowercaseEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowercaseEmail });

    res.status(200).json({
      success: true,
      exists: !!existingUser,
    });
  } catch {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 导出控制器
export { register, login, checkEmailExists };
