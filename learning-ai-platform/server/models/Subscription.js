import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '请输入邮箱地址'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // 可以关联用户，也可以只是匿名订阅
  },
  subscriptions: {
    // 订阅类型
    newCourse: {
      type: Boolean,
      default: true, // 新课程上线
    },
    courseUpdate: {
      type: Boolean,
      default: true, // 课程更新
    },
    learningReport: {
      type: Boolean,
      default: false, // 学习报告（周报/月报）
    },
    systemNotice: {
      type: Boolean,
      default: true, // 系统通知
    },
    teacherNews: {
      type: Boolean,
      default: true, // 明星老师动态
    },
    vipNews: {
      type: Boolean,
      default: true, // VIP专属内容
    },
  },
  verifyCode: {
    type: String,
    default: null,
  },
  verifyExpire: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastSentAt: {
    type: Date,
    default: null, // 上次发送时间
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true, // 允许null且唯一
  },
});

// 更新时设置 updatedAt
SubscriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// 获取未过期的订阅者
SubscriptionSchema.statics.getActiveSubscriptions = async function (type) {
  const query = {
    isVerified: true,
    [`subscriptions.${type}`]: true,
  };
  return this.find(query);
};

export default mongoose.model('Subscription', SubscriptionSchema);
