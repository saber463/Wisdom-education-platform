import mongoose from 'mongoose';

const KnowledgePointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入知识点名称'],
    unique: true,
    trim: true,
    maxlength: [50, '知识点名称不能超过50个字符'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '知识点描述不能超过200个字符'],
  },
  content: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '请关联分类'],
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgePoint',
    default: null,
  },
  level: {
    type: Number,
    default: 0,
    min: [0, '知识点层级不能为负数'],
  },
  keywords: [
    {
      type: String,
      trim: true,
      index: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
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

KnowledgePointSchema.index({ category: 1, level: 1 });

KnowledgePointSchema.index({ parent: 1 });

KnowledgePointSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('KnowledgePoint', KnowledgePointSchema);
