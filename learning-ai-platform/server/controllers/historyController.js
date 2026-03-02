// 导入自定义错误类
import { BadRequestError, UnauthorizedError, InternalServerError } from '../utils/errorResponse.js';
import BrowseHistory from '../models/BrowseHistory.js';

/**
 * 添加浏览记录（需登录）
 */
export const addBrowseHistory = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const { type, targetId, targetTitle, targetCover } = req.body;

    // 验证必填参数
    if (!type || !targetId || !targetTitle) {
      return next(new BadRequestError('类型、目标ID、标题为必填项'));
    }

    try {
      // 尝试创建记录（已存在则更新浏览时间）
      const history = await BrowseHistory.findOneAndUpdate(
        { user: req.user._id, type, targetId },
        { browseTime: Date.now(), targetTitle, targetCover },
        { new: true, upsert: true } // upsert=true：不存在则创建
      );

      res.status(200).json({
        success: true,
        data: history,
        message: '浏览记录已保存',
      });
    } catch (error) {
      console.error('添加浏览记录失败:', error);
      return next(new BadRequestError('添加浏览记录失败'));
    }
  } catch (error) {
    console.error('添加浏览记录失败:', error);
    return next(new InternalServerError('添加浏览记录失败'));
  }
};

/**
 * 获取用户浏览记录（需登录，支持分页）
 */
export const getBrowseHistory = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryObj = { user: req.user._id };
    if (type) queryObj.type = type;

    // 查询浏览记录
    const history = await BrowseHistory.find(queryObj)
      .sort({ browseTime: -1 }) // 按浏览时间倒序
      .skip(skip)
      .limit(Number(limit))
      .populate('targetId', 'title cover price teacher'); // 关联查询目标数据

    // 查询总数
    const total = await BrowseHistory.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      data: {
        list: history,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取浏览记录失败:', error);
    return next(new InternalServerError('获取浏览记录失败'));
  }
};

/**
 * 清除所有浏览记录（需登录）
 */
export const clearBrowseHistory = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    // 删除该用户的所有浏览记录
    await BrowseHistory.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: '浏览记录已清空',
    });
  } catch (error) {
    console.error('清空浏览记录失败:', error);
    return next(new InternalServerError('清空浏览记录失败'));
  }
};

/**
 * 删除单条浏览记录（需登录）
 */
export const removeBrowseHistoryItem = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const { id } = req.query;

    // 验证参数
    if (!id) {
      return next(new BadRequestError('记录ID为必填项'));
    }

    // 删除指定的浏览记录
    const deletedHistory = await BrowseHistory.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    // 检查是否找到并删除了记录
    if (!deletedHistory) {
      return next(new BadRequestError('未找到指定的浏览记录'));
    }

    res.status(200).json({
      success: true,
      message: '浏览记录已删除',
    });
  } catch (error) {
    console.error('删除浏览记录失败:', error);
    return next(new InternalServerError('删除浏览记录失败'));
  }
};
