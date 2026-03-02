import mongoose from 'mongoose';

const WrongQuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户'],
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, '请关联题目'],
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, '请关联测试'],
  },
  selectedAnswer: {
    type: String,
    required: [true, '请记录用户选择的答案'],
  },
  testResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestResult',
    required: [true, '请关联测试结果'],
  },
  isMarked: {
    type: Boolean,
    default: false,
    description: '是否标记为重点关注',
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, '笔记内容不能超过500个字符'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastReviewedAt: {
    type: Date,
    default: null,
  },
  reviewCount: {
    type: Number,
    default: 0,
    description: '复习次数',
  },
});

// 索引：按用户查询
WrongQuestionSchema.index({ user: 1 });

// 索引：按用户和题目查询，避免重复添加同一道错题
WrongQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

// 索引：按创建时间排序
WrongQuestionSchema.index({ createdAt: -1 });

export default mongoose.model('WrongQuestion', WrongQuestionSchema);
