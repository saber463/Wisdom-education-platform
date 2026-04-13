import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { decrypt } from '../utils/cryptoUtils.js';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请输入用户名'],
    unique: true,
    trim: true,
    maxlength: [20, '用户名不能超过20个字符'],
  },
  email: {
    type: String,
    required: [true, '请输入邮箱'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  password: {
    type: String,
    required: [true, '请输入密码'],
    minlength: [8, '密码不能少于8个字符'],
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
    ],
    select: false,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet',
    },
  ],
  coupons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
  ],
  learningInterests: [
    {
      type: String,
      trim: true,
      index: true,
    },
  ],
  learningPreferences: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
      default: 'mixed',
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'flexible'],
      default: 'flexible',
    },
    preferredPlatforms: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  membership: {
    level: {
      type: String,
      enum: ['free', 'silver', 'gold'],
      default: 'free',
    },
    expireDate: {
      type: Date,
      default: null,
    },
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['recharge', 'purchase', 'refund', 'reward'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  learningStats: {
    totalStudyTime: {
      type: Number,
      default: 0,
    },
    completedCourses: {
      type: Number,
      default: 0,
    },
    currentCourses: {
      type: Number,
      default: 0,
    },
    dailyGenerationCount: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: null,
    },
    pathGenerationHistory: [
      {
        type: Date,
        default: Date.now,
      },
    ],
  },
  socialStats: {
    receivedLikes: {
      type: Number,
      default: 0,
    },
    receivedComments: {
      type: Number,
      default: 0,
    },
    createdTweets: {
      type: Number,
      default: 0,
    },
  },
  dailyQuizCompleted: {
    type: Boolean,
    default: false,
  },
  quizCompletedDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, username: this.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    const result = await bcrypt.compare(enteredPassword, this.password);
    return result;
  } catch (error) {
    console.error('密码验证失败：', error.message);
    return false;
  }
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.resetPasswordExpire = Date.now() + 3600000;

  return resetToken;
};

UserSchema.methods.getDecryptedEmail = function () {
  return decrypt(this.email);
};

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

UserSchema.set('toObject', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', UserSchema);
