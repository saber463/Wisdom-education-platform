import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import crypto from 'crypto';

export const createGroup = async (groupData, userId) => {
  const { name, description, tags, visibility, avatar, coverImage } = groupData;

  const joinCode =
    visibility === 'private' ? crypto.randomBytes(3).toString('hex').toUpperCase() : null;

  const group = await Group.create({
    name,
    description,
    tags,
    visibility,
    avatar,
    coverImage,
    creator: userId,
    admins: [userId],
    joinCode,
  });

  await GroupMember.create({
    group: group._id,
    user: userId,
    role: 'creator',
  });

  return group;
};

export const getGroups = async query => {
  const { page = 1, limit = 10, search = '', tags = [] } = query;

  const dbQuery = {
    status: 'active',
  };

  dbQuery.$or = [{ visibility: 'public' }];

  if (search) {
    dbQuery.$or.push({
      name: { $regex: search, $options: 'i' },
      description: { $regex: search, $options: 'i' },
    });
  }

  if (tags && tags.length > 0) {
    dbQuery.tags = { $in: tags };
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const total = await Group.countDocuments(dbQuery);

  const groups = await Group.find(dbQuery)
    .populate('creator', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const result = {
    groups,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };

  if (startIndex > 0) {
    result.previousPage = parseInt(page) - 1;
  }

  if (endIndex < total) {
    result.nextPage = parseInt(page) + 1;
  }

  return result;
};

export const getGroupDetail = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .populate('creator', 'username avatar')
    .populate('admins', 'username avatar');

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
      throw new Error('没有权限查看该小组');
    }
  }

  const memberInfo = await GroupMember.findOne({
    group: groupId,
    user: userId,
  });

  return {
    group,
    memberInfo: memberInfo || null,
  };
};

export const updateGroup = async (groupId, userId, updateData) => {
  const { name, description, tags, visibility, avatar, coverImage } = updateData;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  const isCreatorOrAdmin = group.creator.toString() === userId || group.admins.includes(userId);

  if (!isCreatorOrAdmin) {
    throw new Error('没有权限修改小组信息');
  }

  group.name = name || group.name;
  group.description = description || group.description;
  group.tags = tags || group.tags;
  group.visibility = visibility || group.visibility;
  group.avatar = avatar || group.avatar;
  group.coverImage = coverImage || group.coverImage;
  group.updatedAt = Date.now();

  if (group.visibility === 'private' && !group.joinCode) {
    group.joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  if (group.visibility === 'public' && group.joinCode) {
    group.joinCode = null;
  }

  await group.save();

  return group;
};

export const deleteGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  if (group.creator.toString() !== userId) {
    throw new Error('只有创建者可以删除小组');
  }

  group.status = 'closed';
  await group.save();

  return { message: '小组已成功删除' };
};

export default {
  createGroup,
  getGroups,
  getGroupDetail,
  updateGroup,
  deleteGroup,
};
