import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入分类名称'],
    unique: true,
    trim: true,
    maxlength: [50, '分类名称不能超过50个字符'],
  },
  slug: {
    type: String,
    required: [true, '请输入分类别名'],
    unique: true,
    trim: true,
    maxlength: [50, '分类别名不能超过50个字符'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '分类描述不能超过200个字符'],
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null, // null表示顶级分类
  },
  level: {
    type: Number,
    default: 0, // 0表示顶级分类
    min: [0, '分类层级不能为负数'],
  },
  icon: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0, // 排序权重，值越大越靠前
    min: [0, '排序权重不能为负数'],
  },
  resourceCount: {
    type: Number,
    default: 0, // 该分类下的资源数量
    min: [0, '资源数量不能为负数'],
  },
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

// 索引：按层级和排序权重查询
CategorySchema.index({ level: 1, order: -1 });

// 索引：按父分类查询子分类
CategorySchema.index({ parent: 1, order: -1 });

// 中间件：更新时自动更新updatedAt
CategorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Category', CategorySchema);
