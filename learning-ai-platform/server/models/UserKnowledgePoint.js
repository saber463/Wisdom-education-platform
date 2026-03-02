import mongoose from 'mongoose';

const UserKnowledgePointSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户'],
  },
  knowledgePoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgePoint',
    required: [true, '请关联知识点'],
  },
  masteryLevel: {
    type: Number,
    default: 0,
    min: [0, '掌握程度不能为负数'],
    max: [100, '掌握程度不能超过100分'],
  },
  correctAttempts: {
    type: Number,
    default: 0,
    min: [0, '正确尝试次数不能为负数'],
  },
  totalAttempts: {
    type: Number,
    default: 0,
    min: [0, '总尝试次数不能为负数'],
  },
  lastPracticedAt: {
    type: Date,
    default: Date.now,
  },
  confidenceLevel: {
    type: Number,
    default: 50,
    min: [0, '自信程度不能为负数'],
    max: [100, '自信程度不能超过100分'],
  },
  progressTrend: [
    {
      timestamp: {
        type: Date,
        required: true,
      },
      masteryLevel: {
        type: Number,
        required: true,
      },
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

UserKnowledgePointSchema.index({ user: 1, knowledgePoint: 1 }, { unique: true });

UserKnowledgePointSchema.index({ user: 1, masteryLevel: 1 });

UserKnowledgePointSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.lastPracticedAt = Date.now();
  next();
});

UserKnowledgePointSchema.methods.updateMastery = function (correct, newConfidence = null) {
  this.totalAttempts += 1;
  if (correct) {
    this.correctAttempts += 1;
  }

  this.masteryLevel = Math.round((this.correctAttempts / this.totalAttempts) * 100);

  if (newConfidence !== null) {
    this.confidenceLevel = newConfidence;
  }

  this.progressTrend.push({
    timestamp: new Date(),
    masteryLevel: this.masteryLevel,
  });

  if (this.progressTrend.length > 10) {
    this.progressTrend.shift();
  }

  return this;
};

export default mongoose.model('UserKnowledgePoint', UserKnowledgePointSchema);
