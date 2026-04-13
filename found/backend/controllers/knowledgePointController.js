import { BadRequestError, NotFoundError, InternalServerError } from '../utils/errorResponse.js';
import KnowledgePoint from '../models/KnowledgePoint.js';
import UserKnowledgePoint from '../models/UserKnowledgePoint.js';

export const createKnowledgePoint = async (req, res, next) => {
  try {
    const { name, description, category, parent, keywords } = req.body;

    let level = 0;
    if (parent) {
      const parentPoint = await KnowledgePoint.findById(parent);
      if (!parentPoint) {
        return next(new NotFoundError('父知识点不存在'));
      }
      level = parentPoint.level + 1;
    }

    const knowledgePoint = await KnowledgePoint.create({
      name,
      description,
      category,
      parent,
      level,
      keywords,
    });

    res.status(201).json({
      success: true,
      data: knowledgePoint,
      message: '知识点创建成功',
    });
  } catch (error) {
    console.error('创建知识点失败:', error);
    return next(new InternalServerError('创建知识点失败，请稍后重试'));
  }
};

export const getAllKnowledgePoints = async (req, res, next) => {
  try {
    const { category, level, parent } = req.query;

    const queryObj = {};
    if (category) queryObj.category = category;
    if (level !== undefined) queryObj.level = parseInt(level);
    if (parent !== undefined) queryObj.parent = parent;

    const knowledgePoints = await KnowledgePoint.find(queryObj)
      .populate('category', 'name slug')
      .populate('parent', 'name')
      .sort({ level: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: knowledgePoints,
    });
  } catch (error) {
    console.error('获取知识点失败:', error);
    return next(new InternalServerError('获取知识点失败，请稍后重试'));
  }
};

export const getKnowledgePointTree = async (req, res, next) => {
  try {
    const { category } = req.query;

    const queryObj = { isActive: true };
    if (category) queryObj.category = category;

    const knowledgePoints = await KnowledgePoint.find(queryObj)
      .populate('category', 'name slug')
      .sort({ level: 1, name: 1 });

    const pointTree = buildKnowledgePointTree(knowledgePoints);

    res.status(200).json({
      success: true,
      data: pointTree,
    });
  } catch (error) {
    console.error('获取知识点树结构失败:', error);
    return next(new InternalServerError('获取知识点树结构失败，请稍后重试'));
  }
};

export const getKnowledgePointById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const knowledgePoint = await KnowledgePoint.findById(id)
      .populate('category', 'name slug')
      .populate('parent', 'name');

    if (!knowledgePoint) {
      return next(new NotFoundError('知识点不存在'));
    }

    res.status(200).json({
      success: true,
      data: knowledgePoint,
    });
  } catch (error) {
    console.error('获取知识点详情失败:', error);
    return next(new InternalServerError('获取知识点详情失败，请稍后重试'));
  }
};

export const updateKnowledgePoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, parent, keywords, isActive } = req.body;

    const knowledgePoint = await KnowledgePoint.findById(id);

    if (!knowledgePoint) {
      return next(new NotFoundError('知识点不存在'));
    }

    let level = knowledgePoint.level;
    if (parent !== undefined && parent !== knowledgePoint.parent?.toString()) {
      if (parent === null) {
        level = 0;
      } else {
        const parentPoint = await KnowledgePoint.findById(parent);
        if (!parentPoint) {
          return next(new NotFoundError('父知识点不存在'));
        }
        level = parentPoint.level + 1;
      }
    }

    knowledgePoint.name = name || knowledgePoint.name;
    knowledgePoint.description = description || knowledgePoint.description;
    knowledgePoint.category = category || knowledgePoint.category;
    knowledgePoint.parent = parent !== undefined ? parent : knowledgePoint.parent;
    knowledgePoint.level = level;
    knowledgePoint.keywords = keywords || knowledgePoint.keywords;
    knowledgePoint.isActive = isActive !== undefined ? isActive : knowledgePoint.isActive;

    await knowledgePoint.save();

    res.status(200).json({
      success: true,
      data: knowledgePoint,
      message: '知识点更新成功',
    });
  } catch (error) {
    console.error('更新知识点失败:', error);
    return next(new InternalServerError('更新知识点失败，请稍后重试'));
  }
};

export const deleteKnowledgePoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const knowledgePoint = await KnowledgePoint.findById(id);

    if (!knowledgePoint) {
      return next(new NotFoundError('知识点不存在'));
    }

    const hasChildren = await KnowledgePoint.exists({ parent: id });
    if (hasChildren) {
      return next(new BadRequestError('该知识点下存在子知识点，无法删除'));
    }

    await UserKnowledgePoint.deleteMany({ knowledgePoint: id });

    await knowledgePoint.deleteOne();

    res.status(200).json({
      success: true,
      message: '知识点删除成功',
    });
  } catch (error) {
    console.error('删除知识点失败:', error);
    return next(new InternalServerError('删除知识点失败，请稍后重试'));
  }
};

export const getUserKnowledgePoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category: _category, masteryLevel = 0, page = 1, limit = 10 } = req.query;

    const queryObj = {
      user: userId,
      masteryLevel: { $gte: parseInt(masteryLevel) },
    };

    const startIndex = (page - 1) * limit;

    const userKnowledgePoints = await UserKnowledgePoint.find(queryObj)
      .populate('knowledgePoint')
      .skip(startIndex)
      .limit(limit)
      .sort({ masteryLevel: 1 });

    const total = await UserKnowledgePoint.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      data: {
        knowledgePoints: userKnowledgePoints,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户知识点掌握情况失败:', error);
    return next(new InternalServerError('获取知识点掌握情况失败，请稍后重试'));
  }
};

export const getKnowledgePointAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const queryObj = { user: userId };

    const userKnowledgePoints = await UserKnowledgePoint.find(queryObj).populate('knowledgePoint');

    const analysis = {
      totalPoints: userKnowledgePoints.length,
      averageMastery: 0,
      masteryLevels: {
        low: 0,
        medium: 0,
        high: 0,
      },
      categoryBreakdown: {},
      improvementAreas: [],
    };

    if (userKnowledgePoints.length > 0) {
      let totalMastery = 0;

      for (const userPoint of userKnowledgePoints) {
        const mastery = userPoint.masteryLevel;
        totalMastery += mastery;

        if (mastery <= 30) {
          analysis.masteryLevels.low += 1;
        } else if (mastery <= 70) {
          analysis.masteryLevels.medium += 1;
        } else {
          analysis.masteryLevels.high += 1;
        }

        const pointCategory = userPoint.knowledgePoint.category;
        if (!analysis.categoryBreakdown[pointCategory]) {
          analysis.categoryBreakdown[pointCategory] = {
            count: 0,
            totalMastery: 0,
            averageMastery: 0,
          };
        }
        analysis.categoryBreakdown[pointCategory].count += 1;
        analysis.categoryBreakdown[pointCategory].totalMastery += mastery;
      }

      analysis.averageMastery = Math.round(totalMastery / userKnowledgePoints.length);

      for (const categoryId in analysis.categoryBreakdown) {
        const breakdown = analysis.categoryBreakdown[categoryId];
        breakdown.averageMastery = Math.round(breakdown.totalMastery / breakdown.count);
      }

      analysis.improvementAreas = userKnowledgePoints
        .filter(point => point.masteryLevel <= 30)
        .sort((a, b) => a.masteryLevel - b.masteryLevel)
        .slice(0, 10);
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('获取知识点掌握度分析失败:', error);
    return next(new InternalServerError('获取知识点掌握度分析失败，请稍后重试'));
  }
};

export const updateKnowledgePointMastery = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { knowledgePointId, correct, confidence } = req.body;

    let userKnowledgePoint = await UserKnowledgePoint.findOne({
      user: userId,
      knowledgePoint: knowledgePointId,
    });

    if (!userKnowledgePoint) {
      userKnowledgePoint = new UserKnowledgePoint({
        user: userId,
        knowledgePoint: knowledgePointId,
      });
    }

    userKnowledgePoint.updateMastery(correct, confidence);

    await userKnowledgePoint.save();

    res.status(200).json({
      success: true,
      data: userKnowledgePoint,
      message: '知识点掌握度更新成功',
    });
  } catch (error) {
    console.error('更新知识点掌握度失败:', error);
    return next(new InternalServerError('更新知识点掌握度失败，请稍后重试'));
  }
};

export const getRecommendedKnowledgePoints = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const User = await import('../models/User.js');
    const user = await User.default.findById(userId);

    if (!user || !user.learningInterests || user.learningInterests.length === 0) {
      const knowledgePoints = await KnowledgePoint.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('parent', 'name')
        .sort({ level: 1, name: 1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        data: knowledgePoints,
        message: '用户未设置学习兴趣，返回热门知识点',
      });
    }

    const userInterests = user.learningInterests;

    const Category = await import('../models/Category.js');
    const matchedCategories = await Category.default.find({
      name: { $in: userInterests },
      isActive: true,
    });

    const knowledgePoints = await KnowledgePoint.find({
      isActive: true,
      $or: [
        { category: { $in: matchedCategories.map(cat => cat._id) } },
        { keywords: { $in: userInterests } },
      ],
    })
      .populate('category', 'name slug')
      .populate('parent', 'name')
      .sort({ level: 1, name: 1 })
      .limit(15);

    res.status(200).json({
      success: true,
      data: knowledgePoints,
      message: '根据用户兴趣推荐知识点成功',
    });
  } catch (error) {
    console.error('获取推荐知识库失败:', error);
    return next(new InternalServerError('获取推荐知识库失败，请稍后重试'));
  }
};

function buildKnowledgePointTree(points) {
  const pointMap = {};
  const tree = [];

  points.forEach(point => {
    pointMap[point._id] = { ...point.toObject(), children: [] };
  });

  points.forEach(point => {
    const currentPoint = pointMap[point._id];

    if (point.parent) {
      if (pointMap[point.parent]) {
        pointMap[point.parent].children.push(currentPoint);
      }
    } else {
      tree.push(currentPoint);
    }
  });

  return tree;
}

export default {
  createKnowledgePoint,
  getAllKnowledgePoints,
  getKnowledgePointTree,
  getKnowledgePointById,
  updateKnowledgePoint,
  deleteKnowledgePoint,
  getUserKnowledgePoints,
  getKnowledgePointAnalysis,
  updateKnowledgePointMastery,
  getRecommendedKnowledgePoints,
};
