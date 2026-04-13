import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入成就名称'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, '请输入成就描述'],
    trim: true,
  },
  icon: {
    type: String,
    required: [true, '请输入成就图标'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['learning', 'social', 'milestone', 'special'],
    default: 'learning',
    required: true,
  },
  condition: {
    type: String,
    enum: [
      'study_time',
      'completed_courses',
      'daily_streak',
      'points_earned',
      'social_interactions',
    ],
    required: true,
  },
  targetValue: {
    type: Number,
    required: [true, '请输入成就目标值'],
    min: [1, '目标值不能小于1'],
  },
  pointsReward: {
    type: Number,
    default: 0,
    min: [0, '奖励积分不能为负数'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：按分类和激活状态查询
AchievementSchema.index({ category: 1, isActive: 1 });

export default mongoose.model('Achievement', AchievementSchema);
