const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KnowledgePoint = require('../models/KnowledgePoint');
const Category = require('../models/Category');
const knowledgeBaseData = require('./knowledge-base-data.json');

// 加载环境变量
dotenv.config({ path: '../.env' });

// 连接到数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 导入知识库数据
const importKnowledgeBaseData = async () => {
  try {
    // 首先导入分类
    const categories = await Category.create(knowledgeBaseData.categories);
    console.log(`已导入 ${categories.length} 个分类`);

    // 将分类名称映射到ID
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // 然后导入知识点
    const knowledgePoints = [];
    const pointMap = {};

    // 先导入顶级知识点
    const topLevelPoints = knowledgeBaseData.knowledgePoints.filter(point => point.parent === null);
    for (const point of topLevelPoints) {
      const newPoint = await KnowledgePoint.create({
        ...point,
        category: categoryMap[point.category],
      });
      knowledgePoints.push(newPoint);
      pointMap[point.name] = newPoint._id;
      console.log(`已导入顶级知识点: ${newPoint.name}`);
    }

    // 然后导入子知识点
    const childPoints = knowledgeBaseData.knowledgePoints.filter(point => point.parent !== null);
    for (const point of childPoints) {
      const parentId = pointMap[point.parent];
      if (!parentId) {
        console.error(`无法找到父知识点: ${point.parent}，跳过导入: ${point.name}`);
        continue;
      }

      const newPoint = await KnowledgePoint.create({
        ...point,
        category: categoryMap[point.category],
        parent: parentId,
      });
      knowledgePoints.push(newPoint);
      pointMap[point.name] = newPoint._id;
      console.log(`已导入子知识点: ${newPoint.name}`);
    }

    console.log(`总共导入 ${knowledgePoints.length} 个知识点`);
    process.exit();
  } catch (error) {
    console.error('导入知识库数据失败:', error);
    process.exit(1);
  }
};

// 清空知识库数据
const clearKnowledgeBaseData = async () => {
  try {
    await KnowledgePoint.deleteMany();
    await Category.deleteMany();
    console.log('已清空知识库数据');
    process.exit();
  } catch (error) {
    console.error('清空知识库数据失败:', error);
    process.exit(1);
  }
};

// 执行脚本
if (process.argv[2] === '--import') {
  connectDB().then(importKnowledgeBaseData);
} else if (process.argv[2] === '--clear') {
  connectDB().then(clearKnowledgeBaseData);
} else {
  console.log('请指定操作: --import 或 --clear');
  process.exit(1);
}
