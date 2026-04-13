import mongoose from 'mongoose';

const LearningProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户'],
    unique: true,
    index: true,
  },
  currentPath: {
    type: String,
    trim: true,
    maxlength: [500, '当前学习路径不能超过500个字符'],
    validate: {
      validator: function (v) {
        return !v || v.length > 0;
      },
      message: '当前学习路径不能为空字符串',
    },
  },
  progress: {
    type: Map,
    of: {
      type: Boolean,
      validate: {
        validator: function (v) {
          return typeof v === 'boolean';
        },
        message: '进度值必须是布尔类型',
      },
    },
    default: {},
    validate: {
      validator: function (v) {
        if (v && v.size > 1000) {
          return false;
        }
        return true;
      },
      message: '进度记录不能超过1000条',
    },
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

LearningProgressSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('LearningProgress', LearningProgressSchema);
