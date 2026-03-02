import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';

export const joinGroup = async (groupId, userId, joinCode) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  if (group.status !== 'active') {
    throw new Error('该小组已关闭');
  }

  const existingMember = await GroupMember.findOne({
    group: groupId,
    user: userId,
  });

  if (existingMember) {
    throw new Error('您已经是该小组的成员');
  }

  if (group.visibility === 'private') {
    if (!joinCode || joinCode !== group.joinCode) {
      throw new Error('加入码错误');
    }
  }

  await GroupMember.create({
    group: groupId,
    user: userId,
    role: 'member',
  });

  await Group.findByIdAndUpdate(groupId, {
    $inc: { memberCount: 1 },
  });

  return { message: '成功加入小组' };
};

export const leaveGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new Error('小组不存在');
  }

  if (group.creator.toString() === userId) {
    throw new Error('创建者不能退出小组，请先转让小组');
  }

  const result = await GroupMember.findOneAndDelete({
    group: groupId,
    user: userId,
  });

  if (!result) {
    throw new Error('您不是该小组的成员');
  }

  await Group.findByIdAndUpdate(groupId, {
    $inc: { memberCount: -1 },
    $pull: { admins: userId },
  });

  return { message: '成功退出小组' };
};

export const getUserGroups = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const startIndex = (page - 1) * limit;

  const memberGroups = await GroupMember.find({ user: userId, status: 'active' })
    .populate('group', 'name avatar memberCount description tags')
    .sort({ joinDate: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await GroupMember.countDocuments({ user: userId, status: 'active' });

  const groups = memberGroups.map(item => item.group);

  return {
    groups,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
  };
};

export const checkMembership = async (groupId, userId) => {
  return await GroupMember.exists({
    group: groupId,
    user: userId,
    status: 'active',
  });
};

export default {
  joinGroup,
  leaveGroup,
  getUserGroups,
  checkMembership,
};
