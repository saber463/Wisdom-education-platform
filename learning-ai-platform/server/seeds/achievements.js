const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Achievement = require('../models/Achievement');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 默认成就数据
const achievements = [
  {
    name: '学习新手',
    description: '累计学习时间达到30分钟',
    icon: '📚',
    category: 'learning',
    condition: 'study_time',
    targetValue: 30,
    pointsReward: 50,
  },
  {
    name: '学习达人',
    description: '累计学习时间达到10小时',
    icon: '🎓',
    category: 'learning',
    condition: 'study_time',
    targetValue: 600,
    pointsReward: 200,
  },
  {
    name: '学习大师',
    description: '累计学习时间达到100小时',
    icon: '🏆',
    category: 'learning',
    condition: 'study_time',
    targetValue: 6000,
    pointsReward: 1000,
  },
  {
    name: '课程探索者',
    description: '完成1门课程',
    icon: '🗺️',
    category: 'learning',
    condition: 'completed_courses',
    targetValue: 1,
    pointsReward: 100,
  },
  {
    name: '课程收藏家',
    description: '完成5门课程',
    icon: '📖',
    category: 'learning',
    condition: 'completed_courses',
    targetValue: 5,
    pointsReward: 300,
  },
  {
    name: '积分富翁',
    description: '累计获得1000积分',
    icon: '💰',
    category: 'milestone',
    condition: 'points_earned',
    targetValue: 1000,
    pointsReward: 200,
  },
  {
    name: '积分传奇',
    description: '累计获得10000积分',
    icon: '💎',
    category: 'milestone',
    condition: 'points_earned',
    targetValue: 10000,
    pointsReward: 2000,
  },
];

// 导入成就数据
const importData = async () => {
  try {
    console.log('正在导入成就数据...');
    await Achievement.deleteMany(); // 清空现有数据
    await Achievement.insertMany(achievements);
    console.log('成就数据导入成功！');
    process.exit();
  } catch (error) {
    console.error('导入失败：', error);
    process.exit(1);
  }
};

// 执行导入
importData();
