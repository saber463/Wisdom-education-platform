import {
  createGroup as createGroupService,
  getGroups as getGroupsService,
  getGroupDetail as getGroupDetailService,
  updateGroup as updateGroupService,
  deleteGroup as deleteGroupService,
} from '../services/groupService.js';

import {
  joinGroup as joinGroupService,
  leaveGroup as leaveGroupService,
  getUserGroups as getUserGroupsService,
} from '../services/groupMemberService.js';

import {
  createGroupPost as createGroupPostService,
  getGroupPosts as getGroupPostsService,
  addGroupPostComment as addGroupPostCommentService,
  getGroupPostComments as getGroupPostCommentsService,
  likeGroupPost as likeGroupPostService,
} from '../services/groupPostService.js';

export const createGroup = async (req, res, _next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: '用户未登录',
      });
    }

    const group = await createGroupService(req.body, req.user._id);

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('创建小组失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '创建小组失败，请稍后重试',
    });
  }
};

export const getGroups = async (req, res, _next) => {
  try {
    const result = await getGroupsService(req.query);

    res.status(200).json(result);
  } catch (error) {
    console.error('获取小组列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取小组列表失败，请稍后重试',
    });
  }
};

export const getGroupDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await getGroupDetailService(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === '小组不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '没有权限查看该小组') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('获取小组详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取小组详情失败，请稍后重试',
    });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const group = await updateGroupService(req.params.id, userId, req.body);

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    if (error.message === '小组不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '没有权限修改小组信息') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('更新小组失败:', error);
    res.status(500).json({
      success: false,
      error: '更新小组失败，请稍后重试',
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteGroupService(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: '小组已成功删除',
    });
  } catch (error) {
    if (error.message === '小组不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '只有创建者可以删除小组') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('删除小组失败:', error);
    res.status(500).json({
      success: false,
      error: '删除小组失败，请稍后重试',
    });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await joinGroupService(req.params.id, userId, req.body.joinCode);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (
      error.message === '小组不存在' ||
      error.message === '该小组已关闭' ||
      error.message === '您已经是该小组的成员' ||
      error.message === '加入码错误'
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error('加入小组失败:', error);
    res.status(500).json({
      success: false,
      error: '加入小组失败，请稍后重试',
    });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await leaveGroupService(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.message === '小组不存在' || error.message === '您不是该小组的成员') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '创建者不能退出小组，请先转让小组') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error('退出小组失败:', error);
    res.status(500).json({
      success: false,
      error: '退出小组失败，请稍后重试',
    });
  }
};

export const getGroupPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getGroupPostsService(req.params.id, userId, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === '小组不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '没有权限查看该小组帖子') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('获取小组帖子失败:', error);
    res.status(500).json({
      success: false,
      error: '获取小组帖子失败，请稍后重试',
    });
  }
};

export const createGroupPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const post = await createGroupPostService(req.params.id, userId, req.body);

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error.message === '您不是该小组的成员，无法发布帖子') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error('发布小组帖子失败:', error);
    res.status(500).json({
      success: false,
      error: '发布小组帖子失败，请稍后重试',
    });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getUserGroupsService(userId, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取用户小组失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户小组失败，请稍后重试',
    });
  }
};

export const likeGroupPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await likeGroupPostService(
      req.params.id,
      req.params.postId,
      req.body.liked,
      userId,
      req.user.username
    );

    res.status(200).json({
      success: true,
      code: 200,
      data: result,
      message: req.body.liked ? '点赞帖子成功' : '取消点赞帖子成功',
    });
  } catch (error) {
    if (error.message === '小组不存在' || error.message === '帖子不存在') {
      return res.status(404).json({
        success: false,
        code: 404,
        message: error.message,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '小组或帖子ID格式错误',
      });
    }

    res.status(500).json({
      success: false,
      code: 500,
      message: '操作失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const addGroupPostComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await addGroupPostCommentService(
      req.params.id,
      req.params.postId,
      userId,
      req.user.username,
      req.body.content,
      req.hasSensitive || false
    );

    res.status(201).json({
      success: true,
      data: result,
      message: '评论成功',
    });
  } catch (error) {
    if (error.message === '您不是该小组的成员，无法评论帖子') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '帖子不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error('添加小组帖子评论失败:', error);
    res.status(500).json({
      success: false,
      error: '添加评论失败，请稍后重试',
    });
  }
};

export const getGroupPostComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getGroupPostCommentsService(
      req.params.id,
      req.params.postId,
      userId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === '您不是该小组的成员，无法查看评论') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === '帖子不存在') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error('获取小组帖子评论失败:', error);
    res.status(500).json({
      success: false,
      error: '获取评论失败，请稍后重试',
    });
  }
};

export default {
  createGroup,
  getGroups,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
  getUserGroups,
  likeGroupPost,
  addGroupPostComment,
  getGroupPostComments,
};
