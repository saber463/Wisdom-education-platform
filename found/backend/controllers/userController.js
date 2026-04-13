import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '../utils/errorResponse.js';

export const getUserInfo = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return next(new NotFoundError('用户不存在'));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    next(err);
  }
};

export const getPresetAvatars = async (req, res, next) => {
  try {
    const presetAvatarsDir = path.join(__dirname, '../uploads/avatars/preset');

    if (!fs.existsSync(presetAvatarsDir)) {
      fs.mkdirSync(presetAvatarsDir, { recursive: true });
      return res.status(200).json({ success: true, data: { 默认: [] } });
    }

    const files = fs.readdirSync(presetAvatarsDir);

    const svgFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.svg';
    });

    const categorizedAvatars = {};

    svgFiles.forEach(file => {
      const fileName = path.basename(file, path.extname(file));

      let category;
      if (fileName.includes('-')) {
        category = fileName.split('-')[0];
      } else {
        category = fileName;
      }

      category = category.charAt(0).toUpperCase() + category.slice(1);

      if (!categorizedAvatars[category]) {
        categorizedAvatars[category] = [];
      }

      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/preset/${file}`;
      categorizedAvatars[category].push(avatarUrl);
    });

    console.log('📊 分类结果:', Object.keys(categorizedAvatars));

    const { interests } = req.query;
    if (interests) {
      try {
        let userInterests = [];

        if (typeof interests === 'string') {
          userInterests = JSON.parse(interests);
        } else {
          userInterests = interests;
        }

        if (!Array.isArray(userInterests)) {
          userInterests = [];
        }
        if (Array.isArray(userInterests) && userInterests.length > 0) {
          const predictedAvatars = [];

          Object.entries(categorizedAvatars).forEach(([category, categoryAvatars]) => {
            categoryAvatars.forEach(avatar => {
              const avatarLower = avatar.toLowerCase();
              const matchesInterest = userInterests.some(interest => {
                const interestLower = interest.toLowerCase();
                return (
                  avatarLower.includes(interestLower) ||
                  category.toLowerCase().includes(interestLower)
                );
              });

              if (matchesInterest && !predictedAvatars.includes(avatar)) {
                predictedAvatars.push(avatar);
              }
            });
          });

          categorizedAvatars['预测'] = predictedAvatars;
        }
      } catch (error) {
        console.error('解析兴趣参数错误:', error);
      }
    }

    res.status(200).json({ success: true, data: categorizedAvatars });
  } catch (err) {
    console.error('获取预设头像列表错误:', err);
    return next(new InternalServerError('获取预设头像列表失败，请稍后重试'));
  }
};



export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    if (!req.file) {
      return next(new BadRequestError('请选择要上传的头像文件'));
    }

    const avatarUrl = `http://localhost:4001/uploads/avatars/custom/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, select: '-password' }
    );

    if (!user) {
      return next(new NotFoundError('用户不存在'));
    }

    res.status(200).json({
      success: true,
      data: { avatar: avatarUrl },
      message: '头像上传成功',
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    return next(new InternalServerError('上传头像失败'));
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (req.hasSensitive) {
      return res.status(400).json({ success: false, message: '内容包含敏感词，请修改后再提交' });
    }

    const { username, email, intro, avatar, learningInterests } = req.body;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: '该邮箱已被注册' });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (intro) updateData.intro = intro;
    if (avatar) updateData.avatar = avatar;
    if (learningInterests) updateData.learningInterests = learningInterests;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      select: '-password',
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('更新用户资料错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: '旧密码、新密码和确认密码是必填项' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: '两次输入的新密码不一致' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ success: false, message: '新密码不能与旧密码相同' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: '密码更新成功' });
  } catch (err) {
    console.error('更新密码错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

export const checkDailyQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = user.quizCompletedDate ? new Date(user.quizCompletedDate) : null;
    if (lastCompleted) {
      lastCompleted.setHours(0, 0, 0, 0);
    }

    const completed = lastCompleted && lastCompleted.getTime() === today.getTime();

    res.status(200).json({
      success: true,
      data: {
        completed,
        date: completed ? today : null,
      },
    });
  } catch (err) {
    console.error('检查每日任务完成情况错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

export const completeDailyQuiz = async (req, res) => {
  try {
    const { amount } = req.body;
    const dailyPoints = amount || 10;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = user.quizCompletedDate ? new Date(user.quizCompletedDate) : null;
    if (lastCompleted) {
      lastCompleted.setHours(0, 0, 0, 0);
    }

    if (lastCompleted && lastCompleted.getTime() === today.getTime()) {
      return res.status(400).json({ success: false, message: '今日已完成每日任务' });
    }

    user.points += dailyPoints;
    user.dailyQuizCompleted = true;
    user.quizCompletedDate = today;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        points: user.points,
        date: today,
        dailyQuizCompleted: true,
      },
    });
  } catch (err) {
    console.error('完成每日任务错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' });
    }

    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error('获取所有用户列表错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' });
    }

    const totalUsers = await User.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({ createdAt: { $gte: today } });

    const roleStats = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

    const pointsStats = await User.aggregate([
      {
        $bucket: {
          groupBy: '$points',
          boundaries: [0, 100, 500, 1000, 5000, Infinity],
          default: '其他',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    const stats = {
      totalUsers,
      todayUsers,
      roleStats: roleStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      pointsStats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error('获取系统统计信息错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
};
