import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入小组名称'],
    unique: true,
    trim: true,
    maxlength: [50, '小组名称不能超过50个字符'],
  },
  description: {
    type: String,
    required: [true, '请输入小组描述'],
    trim: true,
    maxlength: [500, '小组描述不能超过500个字符'],
  },
  avatar: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请指定创建者'],
  },
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  memberCount: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  joinCode: {
    type: String,
    unique: true,
    sparse: true,
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

GroupSchema.index({ creator: 1 });
GroupSchema.index({ tags: 1 });

export default mongoose.model('Group', GroupSchema);
