import mongoose from 'mongoose';

const TweetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // 优化按用户查询推文
    },
    content: {
      type: String,
      required: [true, '请输入推文内容'],
      trim: true,
      maxlength: [500, '推文内容不能超过500个字符'],
    },
    // 新增：推文图片（支持多张）
    images: [
      {
        filename: { type: String, required: true },
        path: { type: String, required: true },
        originalname: { type: String, required: true },
      },
    ],
    // 新增：话题标签（如#技术分享）
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true, // 统一转为小写，避免大小写差异导致的查询问题
      },
    ],
    // 新增：提及的用户（如@张三）
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true, // 优化查询被提及的推文
      },
    ],
    // 新增：地理位置信息（可选）
    location: {
      type: {
        type: String,
        enum: ['Point'], // 仅支持点坐标
        required: false,
      },
      coordinates: {
        type: [Number], // [经度, 纬度]
        required: false,
      },
    },
    hasSensitiveWord: {
      type: Boolean,
      default: false,
      index: true, // 优化敏感内容过滤
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, '点赞数不能为负数'],
    },
    // 新增：点赞用户列表
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    // 新增：转发相关
    reposts: {
      type: Number,
      default: 0,
      min: [0, '转发数不能为负数'],
    },
    repostFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet',
      index: true, // 优化查询转发来源
      default: null, // 为null表示不是转发
    },
    // 评论优化：支持评论回复和点赞功能
    comments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        username: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          required: [true, '请输入评论内容'],
          trim: true,
          maxlength: [200, '评论内容不能超过200个字符'],
        },
        hasSensitiveWord: {
          type: Boolean,
          default: false,
        },
        // 评论点赞数
        commentLikes: {
          type: Number,
          default: 0,
          min: [0, '评论点赞数不能为负数'],
        },
        // 新增：评论点赞用户列表
        likedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        // 回复列表
        replies: [
          {
            _id: {
              type: mongoose.Schema.Types.ObjectId,
              auto: true,
            },
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            username: {
              type: String,
              required: true,
              trim: true,
            },
            content: {
              type: String,
              required: [true, '请输入回复内容'],
              trim: true,
              maxlength: [200, '回复内容不能超过200个字符'],
            },
            hasSensitiveWord: {
              type: Boolean,
              default: false,
            },
            // 回复点赞数
            replyLikes: {
              type: Number,
              default: 0,
              min: [0, '回复点赞数不能为负数'],
            },
            // 新增：回复点赞用户列表
            likedBy: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
              },
            ],
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // 新增：软删除标记（避免物理删除数据）
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // 优化过滤已删除内容
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // 优化按时间排序查询
    },
    // 新增：更新时间（用于记录内容修改时间）
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // 启用时间戳自动更新（会自动维护updatedAt字段）
    timestamps: { updatedAt: true, createdAt: false },
  }
);

// 索引优化
// 1. 按创建时间降序（查询最新推文）
TweetSchema.index({ createdAt: -1 });
// 2. 按话题标签查询（如搜索#前端技术的推文）
TweetSchema.index({ hashtags: 1 });
// 3. 地理位置索引（支持附近推文查询）
TweetSchema.index({ location: '2dsphere' });
// 4. 复合索引：按用户+创建时间（查询用户的历史推文，按时间排序）
TweetSchema.index({ user: 1, createdAt: -1 });
// 复合索引：过滤未删除+按时间（查询有效最新推文）
TweetSchema.index({ isDeleted: 1, createdAt: -1 });

export default mongoose.model('Tweet', TweetSchema);
