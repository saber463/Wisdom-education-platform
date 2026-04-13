import mongoose from 'mongoose';

const GroupPostSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, '请关联小组ID'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户ID'],
  },
  content: {
    type: String,
    required: [true, '帖子内容不能为空'],
    trim: true,
    maxlength: [1000, '帖子内容不能超过1000个字符'],
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
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

GroupPostSchema.index({ group: 1 });
GroupPostSchema.index({ user: 1 });
GroupPostSchema.index({ createdAt: -1 });

export default mongoose.model('GroupPost', GroupPostSchema);
