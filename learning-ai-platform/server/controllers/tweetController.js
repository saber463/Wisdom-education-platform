// 导入所需模块
import Tweet from '../models/Tweet.js';
import User from '../models/User.js';
import { BadRequestError, NotFoundError } from '../utils/errorResponse.js';

// 发布推文
export const publishTweet = async (req, res, next) => {
  try {
    // 提取请求数据
    const { content, hashtags, mentions, location } = req.body;
    const userId = req.user._id;

    // 验证请求数据
    if (!content) {
      return next(new BadRequestError('推文内容不能为空'));
    }

    if (content && content.length > 500) {
      return next(new BadRequestError('推文内容不能超过500个字符'));
    }

    // 处理上传的图片
    const images = req.files
      ? req.files.map(file => ({
          filename: file.filename,
          path: file.path,
          originalname: file.originalname,
        }))
      : [];

    // 创建推文对象
    const tweet = new Tweet({
      user: userId,
      content,
      images,
      hashtags: hashtags || [],
      mentions: mentions || [],
      location,
      hasSensitiveWord: req.hasSensitive || false,
    });

    // 保存推文
    await tweet.save();

    // 更新用户的推文计数
    await User.findByIdAndUpdate(userId, { $inc: { 'socialStats.createdTweets': 1 } });

    // 返回响应
    res.status(201).json({
      success: true,
      data: tweet,
    });
  } catch (err) {
    next(err);
  }
};

// 获取推文列表
export const getTweets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, topic, userId, recommended } = req.query;
    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    // 根据条件过滤
    if (topic) query.hashtags = topic;
    if (userId) query.user = userId;

    // 推荐算法逻辑：如果设置了 recommended=true 且用户已登录
    if (recommended === 'true' && req.user) {
      const user = await User.findById(req.user._id).select('learningInterests');
      if (user && user.learningInterests && user.learningInterests.length > 0) {
        // 匹配用户感兴趣的任意一个标签
        query.hashtags = { $in: user.learningInterests };
      }
    }

    // 获取推文列表
    const tweets = await Tweet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username avatar')
      .populate('likedBy', 'username avatar')
      .lean();

    const total = await Tweet.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tweets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// 获取单个推文详情
export const getSingleTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findOne({ _id: req.params.id, isDeleted: false })
      .populate('user', 'username avatar')
      .populate('likedBy', 'username avatar')
      .populate('mentions', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.likedBy', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .lean();

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    res.status(200).json({ success: true, data: tweet });
  } catch (err) {
    next(err);
  }
};

// 删除推文
export const deleteTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findOne({ _id: req.params.id, isDeleted: false });

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 验证用户权限
    if (tweet.user.toString() !== req.user._id.toString()) {
      return next(new BadRequestError('没有权限删除该推文'));
    }

    // 软删除推文
    tweet.isDeleted = true;
    await tweet.save();

    // 更新用户的推文数量
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'socialStats.createdTweets': -1 },
    });

    res.status(200).json({ success: true, message: '推文删除成功' });
  } catch (err) {
    next(err);
  }
};

// 点赞推文
export const likeTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 检查是否已经点赞
    if (tweet.likedBy.includes(req.user._id)) {
      return next(new BadRequestError('已经点赞过该推文'));
    }

    // 添加点赞
    tweet.likedBy.push(req.user._id);
    tweet.likes = tweet.likedBy.length;
    await tweet.save();

    res.status(200).json({ success: true, data: tweet });
  } catch (err) {
    next(err);
  }
};

// 分享推文
export const shareTweet = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 更新分享计数
    tweet.reposts += 1;
    await tweet.save();

    // 创建分享记录
    const sharedTweet = await Tweet.create({
      user: req.user._id,
      content: tweet.content,
      images: tweet.images,
      hashtags: tweet.hashtags,
      mentions: tweet.mentions,
      repostFrom: tweet._id,
      hasSensitiveWord: tweet.hasSensitiveWord,
    });

    // 更新用户的分享计数
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'socialStats.sharedTweets': 1 },
    });

    res.status(201).json({ success: true, data: sharedTweet });
  } catch (err) {
    next(err);
  }
};

// 添加评论
export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    if (!content) {
      return next(new BadRequestError('评论内容不能为空'));
    }

    if (content.length > 200) {
      return next(new BadRequestError('评论内容不能超过200个字符'));
    }

    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 创建评论
    const comment = {
      user: userId,
      username: username,
      content: content,
      hasSensitiveWord: req.hasSensitive || false,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: new Date(),
    };

    // 添加到推文的评论数组
    tweet.comments.push(comment);
    await tweet.save();

    // 更新用户的评论计数
    await User.findByIdAndUpdate(userId, {
      $inc: { 'socialStats.comments': 1 },
    });

    res.status(201).json({ success: true, data: tweet });
  } catch (err) {
    next(err);
  }
};

// 回复评论
export const replyComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    if (!content) {
      return next(new BadRequestError('回复内容不能为空'));
    }

    if (content.length > 200) {
      return next(new BadRequestError('回复内容不能超过200个字符'));
    }

    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 找到对应的评论
    const comment = tweet.comments.id(req.params.commentId);

    if (!comment) {
      return next(new NotFoundError('评论不存在'));
    }

    // 创建回复
    const reply = {
      user: userId,
      username: username,
      content: content,
      hasSensitiveWord: req.hasSensitive || false,
      replyLikes: 0,
      likedBy: [],
      createdAt: new Date(),
    };

    // 添加到评论的回复数组
    comment.replies.push(reply);
    await tweet.save();

    res.status(201).json({ success: true, data: tweet });
  } catch (err) {
    next(err);
  }
};

// 评论点赞
export const likeComment = async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return next(new NotFoundError('推文不存在'));
    }

    // 找到对应的评论
    const comment = tweet.comments.id(req.params.commentId);

    if (!comment) {
      return next(new NotFoundError('评论不存在'));
    }

    // 检查是否已经点赞
    if (comment.likedBy.includes(req.user._id)) {
      return next(new BadRequestError('已经点赞过该评论'));
    }

    // 添加点赞
    comment.likedBy.push(req.user._id);
    comment.commentLikes += 1;
    await tweet.save();

    res.status(200).json({ success: true, data: tweet });
  } catch (err) {
    next(err);
  }
};

// 获取用户的推文
export const getUserTweets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // 获取用户的推文
    const tweets = await Tweet.find({ user: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username avatar')
      .populate('likedBy', 'username avatar')
      .lean();

    const total = await Tweet.countDocuments({ user: userId, isDeleted: false });

    res.status(200).json({
      success: true,
      data: tweets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
