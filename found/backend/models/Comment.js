import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ['tweet', 'product', 'groupPost'],
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
    index: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export default mongoose.model('Comment', CommentSchema);
