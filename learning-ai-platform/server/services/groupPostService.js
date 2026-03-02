import Group from '../models/Group.js';
import GroupPost from '../models/GroupPost.js';
import GroupMember from '../models/GroupMember.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';

export const createGroupPost = async (groupId, userId, postData) => {
  const { content, images } = postData;

  const post = await GroupPost.create({
    group: groupId,
    user: userId,
    content,
    images,
  });

  await post.populate('user', 'username avatar');

  return post;
};

export const getGroupPosts = async (groupId, userId, query) => {
  const { page = 1, limit = 10 } = query;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  if (group.visibility === 'private') {
    const isMember = await GroupMember.exists({
      group: groupId,
      user: userId,
      status: 'active',
    });

    if (!isMember) {
      throw new Error('没有权限查看该小组帖子');
    }
  }

  const startIndex = (page - 1) * limit;

  const posts = await GroupPost.find({ group: groupId })
    .populate('user', 'username avatar')
    .populate('comments')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await GroupPost.countDocuments({ group: groupId });

  return {
    posts,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

export const likeGroupPost = async (groupId, postId, userId, liked, username) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  const post = group.posts.find(p => p._id.equals(postId));

  if (!post) {
    throw new Error('帖子不存在');
  }

  if (!post.likedBy) {
    post.likedBy = [];
  }

  const isAlreadyLiked = post.likedBy.some(id => id.equals(userId));

  if (liked) {
    if (!isAlreadyLiked) {
      post.likedBy.push(userId);
      post.likes += 1;

      if (!post.user.equals(userId)) {
        await createNotification(
          post.user,
          '帖子获得点赞',
          `${username} 点赞了你的帖子`,
          'postLike',
          `/groups/${group._id}/posts/${post._id}`,
          userId
        );

        await User.findByIdAndUpdate(post.user, {
          $inc: { 'socialStats.receivedLikes': 1 },
        });
      }
    }
  } else {
    if (isAlreadyLiked) {
      post.likedBy = post.likedBy.filter(id => !id.equals(userId));
      post.likes = Math.max(0, post.likes - 1);

      if (!post.user.equals(userId)) {
        await Comment.findOneAndDelete({
          user: post.user,
          type: 'postLike',
          link: `/groups/${group._id}/posts/${post._id}`,
          fromUser: userId,
        });

        await User.findByIdAndUpdate(
          post.user,
          {
            $inc: { 'socialStats.receivedLikes': -1 },
          },
          { new: true }
        ).then(updatedUser => {
          if (updatedUser && updatedUser.socialStats.receivedLikes < 0) {
            updatedUser.socialStats.receivedLikes = 0;
            return updatedUser.save();
          }
        });
      }
    }
  }

  await group.save();

  return {
    postId: post._id,
    likes: post.likes,
    likedBy: post.likedBy,
  };
};

export const addGroupPostComment = async (
  groupId,
  postId,
  userId,
  username,
  content,
  hasSensitive
) => {
  const post = await GroupPost.findById(postId);

  if (!post) {
    throw new Error('帖子不存在');
  }

  const newComment = new Comment({
    user: userId,
    username: username,
    targetType: 'groupPost',
    targetId: postId,
    content,
    hasSensitiveWord: hasSensitive || false,
  });

  await newComment.save();

  await GroupPost.findByIdAndUpdate(postId, {
    $inc: { commentCount: 1 },
  });

  if (!post.user.equals(userId)) {
    await createNotification(
      post.user,
      '小组帖子获得评论',
      `${username} 评论了你的小组帖子: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`,
      'comment',
      `/group/${groupId}/post/${postId}`
    );

    await User.findByIdAndUpdate(post.user, {
      $inc: { 'socialStats.receivedComments': 1 },
    });
  }

  return newComment;
};

export const getGroupPostComments = async (groupId, postId, userId, query) => {
  const { page = 1, pageSize = 10 } = query;

  const post = await GroupPost.findById(postId);

  if (!post) {
    throw new Error('帖子不存在');
  }

  const comments = await Comment.find({
    targetType: 'groupPost',
    targetId: postId,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(parseInt(pageSize));

  const total = await Comment.countDocuments({
    targetType: 'groupPost',
    targetId: postId,
  });

  return {
    comments,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize),
  };
};

export default {
  createGroupPost,
  getGroupPosts,
  likeGroupPost,
  addGroupPostComment,
  getGroupPostComments,
};
