import mongoose from 'mongoose';

const TestResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户'],
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, '请关联测试'],
  },
  score: {
    type: Number,
    required: [true, '请输入测试分数'],
    min: [0, '分数不能为负数'],
    max: [100, '分数不能超过100分'],
  },
  totalPoints: {
    type: Number,
    required: [true, '请输入总分'],
  },
  correctAnswers: {
    type: Number,
    required: [true, '请输入正确答案数量'],
    min: [0, '正确答案数量不能为负数'],
  },
  totalQuestions: {
    type: Number,
    required: [true, '请输入总题目数量'],
  },
  isPassed: {
    type: Boolean,
    required: [true, '请标记是否通过'],
  },
  startTime: {
    type: Date,
    required: [true, '请输入开始时间'],
  },
  endTime: {
    type: Date,
    required: [true, '请输入结束时间'],
  },
  duration: {
    type: Number, // 测试时长（分钟）
    required: [true, '请输入测试时长'],
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
      selectedAnswer: {
        type: String,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
      pointsEarned: {
        type: Number,
        default: 0,
      },
    },
  ],
  weakKnowledgePoints: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: Object,
    default: {
      resources: [],
      learningPath: [],
      suggestions: [],
      difficultyLevel: 'beginner',
    },
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, '反馈内容不能超过1000个字符'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：按用户和测试查询
TestResultSchema.index({ user: 1, test: 1 });

// 索引：按用户和分数查询
TestResultSchema.index({ user: 1, score: -1 });

export default mongoose.model('TestResult', TestResultSchema);
