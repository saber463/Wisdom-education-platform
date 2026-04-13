const User = require('../models/User');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const GroupPost = require('../models/GroupPost');
const connectDB = require('../config/db');

// 连接数据库
connectDB();

/**
 * 学习小组种子数据
 */
const groups = [
  {
    name: '前端开发学习小组',
    description:
      '专注于前端开发技术交流与学习，涵盖HTML、CSS、JavaScript、Vue、React等技术栈。欢迎所有对前端开发感兴趣的同学加入！',
    avatar: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=200&h=200&fit=crop',
    tags: ['前端开发', 'JavaScript', 'Vue', 'React'],
    visibility: 'public',
    joinType: 'free',
    maxMembers: 500,
  },
  {
    name: 'Java后端技术社区',
    description:
      '分享Java后端开发经验，讨论Spring Boot、Spring Cloud、微服务架构等技术话题，共同提升后端开发能力。',
    avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop',
    tags: ['后端开发', 'Java', 'Spring Boot', '微服务'],
    visibility: 'public',
    joinType: 'free',
    maxMembers: 1000,
  },
  {
    name: '数据科学与人工智能',
    description:
      '探索数据科学、机器学习、深度学习等前沿技术，分享实践经验和学习资源，打造AI学习社区。',
    avatar: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop',
    tags: ['数据科学', '机器学习', '人工智能', 'Python'],
    visibility: 'public',
    joinType: 'approval',
    maxMembers: 300,
  },
  {
    name: '移动应用开发联盟',
    description:
      '交流iOS、Android、Flutter等移动应用开发技术，分享开发经验和项目案例，助力移动开发者成长。',
    avatar: 'https://images.unsplash.com/photo-1591337676105-8b8571b93882?w=200&h=200&fit=crop',
    tags: ['移动开发', 'iOS', 'Android', 'Flutter'],
    visibility: 'public',
    joinType: 'free',
    maxMembers: 400,
  },
];

/**
 * 插入学习小组种子数据
 */
const seedGroups = async () => {
  try {
    // 获取系统中的用户（假设至少有几个用户存在）
    const users = await User.find().limit(5);

    if (users.length === 0) {
      console.log('❌ 系统中没有用户数据，请先创建用户');
      process.exit(1);
    }

    console.log(`✅ 找到${users.length}个用户，将用于创建学习小组`);

    // 检查是否已存在种子数据
    const existingCount = await Group.countDocuments({
      name: { $in: groups.map(group => group.name) },
    });

    if (existingCount > 0) {
      console.log(`ℹ️  已存在${existingCount}个学习小组种子数据，无需重复插入`);
      process.exit();
    }

    // 创建学习小组
    const createdGroups = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const creator = users[i % users.length];

      // 创建小组
      const newGroup = await Group.create({
        ...group,
        creator: creator._id,
        memberCount: 1, // 初始只有创建者
      });

      // 创建小组创建者关系
      await GroupMember.create({
        group: newGroup._id,
        user: creator._id,
        role: 'creator',
        joinDate: Date.now(),
        status: 'active',
        lastActiveAt: Date.now(),
      });

      createdGroups.push({
        group: newGroup,
        creator: creator,
      });

      console.log(`✅ 创建学习小组: ${newGroup.name}`);
    }

    // 为每个小组添加一些成员
    for (const { group, creator } of createdGroups) {
      // 选择2-3个随机用户加入小组
      const memberCount = Math.floor(Math.random() * 3) + 2;
      const shuffledUsers = users.filter(u => u._id.toString() !== creator._id.toString());

      for (let i = 0; i < memberCount && i < shuffledUsers.length; i++) {
        const user = shuffledUsers[i];

        // 随机分配角色
        const role = i === 0 ? 'admin' : 'member';

        await GroupMember.create({
          group: group._id,
          user: user._id,
          role,
          joinDate: Date.now(),
          status: 'active',
          lastActiveAt: Date.now(),
        });

        // 更新小组成员数
        await Group.findByIdAndUpdate(group._id, { $inc: { memberCount: 1 } });
      }

      console.log(`✅ 为学习小组: ${group.name} 添加了成员`);
    }

    // 为每个小组添加一些帖子
    for (const { group, creator: _creator } of createdGroups) {
      // 获取小组的所有成员
      const groupMembers = await GroupMember.find({ group: group._id }).populate('user');

      // 每个小组发布2-4个帖子
      const postCount = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < postCount; i++) {
        // 随机选择发帖用户
        const randomUser = groupMembers[Math.floor(Math.random() * groupMembers.length)].user;

        // 帖子内容
        const postContent = [
          `大家好，我是${randomUser.username}，今天想和大家分享一下关于${group.tags[0]}的学习心得...`,
          `最近学习了${group.tags[1]}的新特性，感觉非常实用，分享给大家！`,
          `有没有同学对${group.tags[2]}比较熟悉的，想请教一些问题。`,
          `推荐一个学习${group.tags[0]}的好资源，链接是：xxx`,
          `小组里有没有正在做${group.tags[1]}项目的同学，想交流一下经验。`,
        ];

        const content = postContent[i % postContent.length];

        // 创建帖子
        await GroupPost.create({
          group: group._id,
          user: randomUser._id,
          content,
          likeCount: Math.floor(Math.random() * 10),
          commentCount: Math.floor(Math.random() * 5),
          viewCount: Math.floor(Math.random() * 50),
        });
      }

      console.log(`✅ 为学习小组: ${group.name} 添加了帖子`);
    }

    console.log('✅ 学习小组种子数据插入成功');
    process.exit();
  } catch (error) {
    console.error('❌ 学习小组种子数据插入失败：', error.message);
    console.error('详细错误：', error);
    process.exit(1);
  }
};

// 执行种子数据插入
seedGroups();
