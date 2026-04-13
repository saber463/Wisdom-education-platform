import axios from 'axios';
import User from '../models/User.js';

const GENERATION_LIMITS = {
  free: 3,
  silver: 10,
  gold: Infinity,
};

const checkDailyLimit = async userId => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!user.learningStats.lastResetDate || user.learningStats.lastResetDate < today) {
    user.learningStats.dailyGenerationCount = 0;
    user.learningStats.lastResetDate = today;
    await user.save();
  }

  const limit = GENERATION_LIMITS[user.membership.level];
  if (user.learningStats.dailyGenerationCount >= limit) {
    throw new Error(`今日生成次数已达上限 (${limit}次)，请明天再试`);
  }

  return user;
};

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请输入图片描述',
      });
    }

    const user = await checkDailyLimit(req.user._id);

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('未配置智谱AI API密钥');
    }

    const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

    const response = await axios.post(
      apiUrl,
      {
        model: 'cogview-3',
        prompt: prompt.trim(),
        size: '1024x1024',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;

      user.learningStats.dailyGenerationCount += 1;
      await user.save();

      res.status(200).json({
        success: true,
        imageUrl: imageUrl,
        remainingCount:
          GENERATION_LIMITS[user.membership.level] - user.learningStats.dailyGenerationCount,
        message: '图片生成成功',
      });
    } else {
      throw new Error('AI返回数据格式异常');
    }
  } catch (error) {
    console.error('图片生成错误:', error.message);

    if (error.response) {
      console.error('API响应状态:', error.response.status);
      console.error('API响应数据:', error.response.data);
    }

    res.status(500).json({
      success: false,
      message: error.message || '图片生成失败，请稍后重试',
      error: error.response?.data || error.message,
    });
  }
};

const getGenerationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!user.learningStats.lastResetDate || user.learningStats.lastResetDate < today) {
      user.learningStats.dailyGenerationCount = 0;
      user.learningStats.lastResetDate = today;
      await user.save();
    }

    const limit = GENERATION_LIMITS[user.membership.level];
    const remainingCount =
      limit === Infinity ? Infinity : limit - user.learningStats.dailyGenerationCount;

    res.status(200).json({
      success: true,
      membershipLevel: user.membership.level,
      dailyLimit: limit,
      usedCount: user.learningStats.dailyGenerationCount,
      remainingCount: remainingCount,
    });
  } catch (error) {
    console.error('获取生成状态错误:', error.message);
    res.status(500).json({
      success: false,
      message: '获取生成状态失败',
      error: error.message,
    });
  }
};

export { generateImage, getGenerationStatus };
