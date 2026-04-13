import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '请输入测试标题'],
    trim: true,
    maxlength: [100, '测试标题不能超过100个字符'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '测试描述不能超过500个字符'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '请关联分类'],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    required: true,
  },
  duration: {
    type: Number,
    default: 30, // 默认30分钟
    min: [1, '测试时长不能少于1分钟'],
    max: [120, '测试时长不能超过120分钟'],
    required: true,
  },
  totalQuestions: {
    type: Number,
    default: 10,
    min: [5, '测试题目数量不能少于5题'],
    max: [50, '测试题目数量不能超过50题'],
    required: true,
  },
  passingScore: {
    type: Number,
    default: 60, // 默认60分及格
    min: [0, '及格分数不能为负数'],
    max: [100, '及格分数不能超过100分'],
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联创建者'],
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

// 索引：按分类、难度和发布状态查询
TestSchema.index({ category: 1, difficulty: 1, isPublished: 1 });

// 中间件：更新时自动更新updatedAt
TestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Test', TestSchema);
