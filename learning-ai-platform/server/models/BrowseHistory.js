import mongoose from 'mongoose';

const BrowseHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['product', 'tweet', 'course', 'learning-path'],
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type',
  },
  targetTitle: {
    type: String,
    required: true,
    trim: true,
  },
  targetCover: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    index: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  browseTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastAccessTime: {
    type: Date,
    default: Date.now,
  },
});

BrowseHistorySchema.index({ user: 1, type: 1, targetId: 1 }, { unique: true });

BrowseHistorySchema.pre('save', async function (next) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await this.constructor.deleteMany({
    user: this.user,
    browseTime: { $lt: thirtyDaysAgo },
  });
  next();
});

export default mongoose.model('BrowseHistory', BrowseHistorySchema);
