import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, '标题不能超过100个字符'],
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, '内容不能超过500个字符'],
  },
  type: {
    type: String,
    required: true,
    enum: [
      'system',
      'learning_path',
      'message',
      'like',
      'comment',
      'follow',
      'achievement',
      'coupon',
      'success',
      'error',
    ],
    index: true,
  },
  link: {
    type: String,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  time: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

NotificationSchema.index({ user: 1, read: 1, time: -1 });

export default mongoose.model('Notification', NotificationSchema);
