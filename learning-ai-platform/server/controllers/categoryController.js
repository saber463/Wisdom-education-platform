import Category from '../models/Category.js';
import redisCache from '../config/redis.js';
import { ConflictError, NotFoundError, InternalServerError } from '../utils/errorResponse.js';

// 获取所有分类
export const getAllCategories = async (req, res, next) => {
  try {
    const { level = null } = req.query;

    // 构建查询条件
    const query = {};
    if (level !== null) {
      query.level = parseInt(level);
    }

    // 查询分类
    const categories = await Category.find(query).sort({ order: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('获取所有分类失败:', error);
    next(new InternalServerError('获取分类失败，请稍后重试'));
  }
};

// 获取分类树结构
export const getCategoryTree = async (req, res, next) => {
  try {
    // 获取所有分类
    const categories = await Category.find({ isActive: true }).sort({ order: -1, createdAt: 1 });

    // 构建分类树
    const categoryTree = buildCategoryTree(categories);

    res.status(200).json({
      success: true,
      data: categoryTree,
    });
  } catch (error) {
    console.error('获取分类树结构失败:', error);
    next(new InternalServerError('获取分类树失败，请稍后重试'));
  }
};

// 创建分类
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parent, icon, order } = req.body;

    // 检查分类名称是否已存在
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(new ConflictError('分类名称已存在'));
    }

    // 检查分类别名是否已存在
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
      return next(new ConflictError('分类别名已存在'));
    }

    // 计算分类层级
    let level = 0;
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return next(new NotFoundError('父分类不存在'));
      }
      level = parentCategory.level + 1;
    }

    // 创建分类
    const category = await Category.create({
      name,
      slug,
      description,
      parent,
      level,
      icon,
      order,
    });

    // 清除分类相关缓存
    await redisCache.clearCacheByPattern('*/api/categories*');

    res.status(201).json({
      success: true,
      data: category,
      message: '分类创建成功',
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      error: '创建分类失败，请稍后重试',
    });
  }
};

// 更新分类
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parent, icon, order, isActive } = req.body;

    // 检查分类是否存在
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在',
      });
    }

    // 检查分类名称是否已存在（排除当前分类）
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: '分类名称已存在',
        });
      }
    }

    // 检查分类别名是否已存在（排除当前分类）
    if (slug && slug !== category.slug) {
      const existingSlug = await Category.findOne({ slug });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: '分类别名已存在',
        });
      }
    }

    // 计算分类层级
    let level = 0;
    if (parent && parent !== category.parent.toString()) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: '父分类不存在',
        });
      }
      level = parentCategory.level + 1;
    } else {
      level = category.level;
    }

    // 更新分类
    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description = description || category.description;
    category.parent = parent || category.parent;
    category.level = level;
    category.icon = icon || category.icon;
    category.order = order !== undefined ? order : category.order;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    await category.save();

    // 清除分类相关缓存
    await redisCache.clearCacheByPattern('*/api/categories*');

    res.status(200).json({
      success: true,
      data: category,
      message: '分类更新成功',
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      error: '更新分类失败，请稍后重试',
    });
  }
};

// 删除分类
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类是否存在
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在',
      });
    }

    // 检查是否有子分类
    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        error: '该分类下存在子分类，无法删除',
      });
    }

    // 由于产品功能已移除，不再检查分类下的资源

    // 删除分类
    await category.deleteOne();

    // 清除分类相关缓存
    await redisCache.clearCacheByPattern('*/api/categories*');

    res.status(200).json({
      success: true,
      message: '分类删除成功',
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      error: '删除分类失败，请稍后重试',
    });
  }
};

// 获取分类详情
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询分类
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分类不存在',
      });
    }

    // 直接返回分类信息，不计算资源数量
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类详情失败，请稍后重试',
    });
  }
};

// 构建分类树的辅助函数
function buildCategoryTree(categories) {
  const categoryMap = {};
  const tree = [];

  // 先将所有分类放入map
  categories.forEach(category => {
    categoryMap[category._id] = { ...category.toObject(), children: [] };
  });

  // 构建树结构
  categories.forEach(category => {
    const currentCategory = categoryMap[category._id];

    if (category.parent) {
      // 如果有父分类，添加到父分类的children中
      if (categoryMap[category.parent]) {
        categoryMap[category.parent].children.push(currentCategory);
      }
    } else {
      // 如果没有父分类，添加到根节点
      tree.push(currentCategory);
    }
  });

  return tree;
}
