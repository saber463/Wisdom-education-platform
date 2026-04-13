import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, '请关联测试'],
  },
  questionText: {
    type: String,
    required: [true, '请输入题目内容'],
    trim: true,
    maxlength: [1000, '题目内容不能超过1000个字符'],
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'truefalse', 'shortanswer'],
    default: 'single',
    required: true,
  },
  options: [
    {
      text: {
        type: String,
        required: [true, '请输入选项内容'],
        trim: true,
      },
      isCorrect: {
        type: Boolean,
        default: false,
      },
    },
  ],
  correctAnswer: {
    type: String,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    required: true,
  },
  points: {
    type: Number,
    default: 10,
    min: [1, '题目分值不能少于1分'],
    max: [100, '题目分值不能超过100分'],
    required: true,
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, '解析内容不能超过1000个字符'],
  },
  keywords: [
    {
      type: String,
      trim: true,
      index: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：按测试和难度查询
QuestionSchema.index({ test: 1, difficulty: 1 });

// 中间件：更新时自动更新updatedAt
QuestionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Question', QuestionSchema);
