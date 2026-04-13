const mongoose = require('mongoose');
const Category = require('../models/Category');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '../.env' });

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });
    console.log(`MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB连接失败: ${error.message}`);
    process.exit(1);
  }
};

// 默认分类数据
const defaultCategories = [
  {
    name: '前端开发',
    slug: 'frontend',
    description: '前端开发相关课程',
    parent: null,
    level: 0,
    icon: '🖥️',
    order: 10,
  },
  {
    name: '后端开发',
    slug: 'backend',
    description: '后端开发相关课程',
    parent: null,
    level: 0,
    icon: '⚙️',
    order: 9,
  },
  {
    name: '数据库',
    slug: 'database',
    description: '数据库相关课程',
    parent: null,
    level: 0,
    icon: '🗄️',
    order: 8,
  },
  {
    name: '计算机基础',
    slug: 'computer-basics',
    description: '计算机基础相关课程',
    parent: null,
    level: 0,
    icon: '💻',
    order: 7,
  },
  {
    name: '移动开发',
    slug: 'mobile-dev',
    description: '移动开发相关课程',
    parent: null,
    level: 0,
    icon: '📱',
    order: 6,
  },
  {
    name: '人工智能',
    slug: 'ai',
    description: '人工智能相关课程',
    parent: null,
    level: 0,
    icon: '🤖',
    order: 5,
  },
  {
    name: '开发工具',
    slug: 'dev-tools',
    description: '开发工具相关课程',
    parent: null,
    level: 0,
    icon: '🔧',
    order: 4,
  },
  {
    name: '设计模式',
    slug: 'design-patterns',
    description: '设计模式相关课程',
    parent: null,
    level: 0,
    icon: '🎨',
    order: 3,
  },
  {
    name: '计算机等级考试',
    slug: 'computer-exam',
    description: '计算机等级考试相关课程',
    parent: null,
    level: 0,
    icon: '📚',
    order: 2,
  },
  {
    name: '办公软件',
    slug: 'office',
    description: '办公软件相关课程',
    parent: null,
    level: 0,
    icon: '💼',
    order: 1,
  },
];

// 导入分类数据
const importCategories = async () => {
  try {
    await connectDB();

    // 清空现有分类
    await Category.deleteMany();

    // 导入顶级分类
    const topLevelCategories = defaultCategories.filter(cat => cat.level === 0);
    const importedTopCategories = await Category.insertMany(topLevelCategories);

    // 构建顶级分类的映射
    const categoryMap = {};
    importedTopCategories.forEach(category => {
      categoryMap[category.slug] = category._id;
    });

    // 更新子分类的父分类ID
    const subCategories = defaultCategories.filter(cat => cat.level > 0);
    const updatedSubCategories = subCategories.map(cat => {
      // 根据需要设置父分类
      if (cat.slug === 'html-css' || cat.slug === 'javascript') {
        cat.parent = categoryMap['frontend'];
      } else if (cat.slug === 'python') {
        cat.parent = categoryMap['backend'];
      }
      return cat;
    });

    // 导入子分类
    await Category.insertMany(updatedSubCategories);

    console.log('分类数据导入成功!');
    process.exit();
  } catch (error) {
    console.error(`分类数据导入失败: ${error.message}`);
    process.exit(1);
  }
};

importCategories();
