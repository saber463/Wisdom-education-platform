import mongoose from 'mongoose';

const UserFavoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请关联用户ID'],
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceType', // 动态引用不同的资源模型
    required: [true, '请关联资源ID'],
  },
  resourceType: {
    type: String,
    enum: ['Product', 'Tweet'], // 支持的资源类型
    default: 'Product',
    required: true,
  },
  collectionName: {
    type: String,
    default: '默认收藏夹', // 收藏夹名称
    trim: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：用户+资源类型+资源ID，确保一个用户只能收藏同一资源一次
UserFavoriteSchema.index({ user: 1, resourceType: 1, resource: 1 }, { unique: true });

// 索引：用户+收藏夹名称，方便按收藏夹查询
UserFavoriteSchema.index({ user: 1, collectionName: 1 });

export default mongoose.model('UserFavorite', UserFavoriteSchema);
