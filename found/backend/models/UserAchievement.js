import mongoose from 'mongoose';

const UserAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户ID'],
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: [true, '请关联成就ID'],
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, '进度不能为负数'],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：用户+成就唯一索引，确保一个用户只能有一个成就记录
UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

// 索引：按用户和完成状态查询
UserAchievementSchema.index({ user: 1, isCompleted: 1 });

// 中间件：更新时自动更新updatedAt
UserAchievementSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('UserAchievement', UserAchievementSchema);
