// 导入自定义错误类
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} from '../utils/errorResponse.js';

import UserFavorite from '../models/UserFavorite.js';
import Tweet from '../models/Tweet.js';

// 获取用户收藏夹列表
export const getUserCollections = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;

    // 获取所有收藏夹名称
    const collections = await UserFavorite.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$collectionName', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // 转换为前端需要的格式
    const result = collections.map(collection => ({
      name: collection._id,
      count: collection.count,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取用户收藏夹列表失败:', error);
    return next(new InternalServerError('获取收藏夹列表失败，请稍后重试'));
  }
};

// 获取指定收藏夹内的资源
export const getCollectionResources = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { collectionName } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 计算分页
    const startIndex = (page - 1) * limit;

    // 查询收藏的资源
    const favorites = await UserFavorite.find({
      user: userId,
      collectionName,
    })
      .populate('resource') // 自动根据resourceType填充资源详情
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // 获取总数
    const total = await UserFavorite.countDocuments({
      user: userId,
      collectionName,
    });

    res.status(200).json({
      success: true,
      data: {
        resources: favorites,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取收藏夹资源失败:', error);
    return next(new InternalServerError('获取收藏夹资源失败，请稍后重试'));
  }
};

// 添加资源到收藏夹
export const addToFavorite = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { resourceId, resourceType = 'Product', collectionName = '默认收藏夹' } = req.body;

    // 验证资源类型
    if (resourceType !== 'Tweet') {
      return next(new BadRequestError('不支持的资源类型'));
    }

    // 验证资源是否存在
    let resource;
    if (resourceType === 'Tweet') {
      resource = await Tweet.findById(resourceId);
    }

    if (!resource) {
      return next(new NotFoundError('资源不存在'));
    }

    // 创建或更新收藏
    const favorite = await UserFavorite.findOneAndUpdate(
      {
        user: userId,
        resource: resourceId,
        resourceType,
      },
      {
        collectionName,
        updatedAt: Date.now(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      data: favorite,
      message: '添加到收藏夹成功',
    });
  } catch (error) {
    console.error('添加到收藏夹失败:', error);
    return next(new InternalServerError('添加到收藏夹失败，请稍后重试'));
  }
};

// 从收藏夹中移除资源
export const removeFromFavorite = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { resourceId, resourceType = 'Product' } = req.params;

    // 验证资源类型
    if (resourceType !== 'Tweet') {
      return next(new BadRequestError('不支持的资源类型'));
    }

    // 删除收藏
    const favorite = await UserFavorite.findOneAndDelete({
      user: userId,
      resource: resourceId,
      resourceType,
    });

    if (!favorite) {
      return next(new NotFoundError('收藏记录不存在'));
    }

    res.status(200).json({
      success: true,
      message: '从收藏夹中移除成功',
    });
  } catch (error) {
    console.error('从收藏夹中移除失败:', error);
    return next(new InternalServerError('从收藏夹中移除失败，请稍后重试'));
  }
};

// 检查资源是否已收藏
export const checkIsFavorite = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { resourceId, resourceType = 'Product' } = req.params;

    // 验证资源类型
    if (resourceType !== 'Tweet') {
      return next(new BadRequestError('不支持的资源类型'));
    }

    // 查询收藏记录
    const favorite = await UserFavorite.findOne({
      user: userId,
      resource: resourceId,
      resourceType,
    });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite,
        collectionName: favorite?.collectionName,
      },
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return next(new InternalServerError('检查收藏状态失败，请稍后重试'));
  }
};

// 重命名收藏夹
export const renameCollection = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { oldName, newName } = req.body;

    if (oldName === newName) {
      return next(new BadRequestError('新名称与原名称相同'));
    }

    // 更新收藏夹名称
    const result = await UserFavorite.updateMany(
      {
        user: userId,
        collectionName: oldName,
      },
      {
        collectionName: newName,
      }
    );

    if (result.modifiedCount === 0) {
      return next(new NotFoundError('收藏夹不存在'));
    }

    res.status(200).json({
      success: true,
      message: '收藏夹重命名成功',
    });
  } catch (error) {
    console.error('重命名收藏夹失败:', error);
    return next(new InternalServerError('重命名收藏夹失败，请稍后重试'));
  }
};

// 删除收藏夹
export const deleteCollection = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const userId = req.user._id;
    const { collectionName } = req.params;

    // 删除收藏夹内的所有资源
    const result = await UserFavorite.deleteMany({
      user: userId,
      collectionName,
    });

    if (result.deletedCount === 0) {
      return next(new NotFoundError('收藏夹不存在'));
    }

    res.status(200).json({
      success: true,
      message: '收藏夹删除成功',
    });
  } catch (error) {
    console.error('删除收藏夹失败:', error);
    return next(new InternalServerError('删除收藏夹失败，请稍后重试'));
  }
};
