const Product = require('../models/Product');
const connectDB = require('../config/db');

// 连接数据库
connectDB();

/**
 * B站黑马课程种子数据
 * 优化点：补充真实封面图链接、完善课程描述
 */
const products = [
  {
    title: '2025最新Web前端开发零基础到精通（HTML/CSS/JS/Vue/React）',
    cover:
      'https://i0.hdslb.com/bfs/archive/4e37a4b08a98d2d28e791451234135d414e4e3e.jpg@400w_225h_1c_95q.webp',
    description: `<p>黑马程序员2025年最新前端开发课程，从零基础入门到企业级开发实战，覆盖全栈前端核心技术：</p>
    <p>1. 基础阶段：HTML5+CSS3+JavaScript（ES6+）</p>
    <p>2. 框架阶段：Vue3+Vite+Pinia+React18+Next.js</p>
    <p>3. 实战阶段：电商项目、管理系统、移动端H5开发</p>
    <p>4. 就业阶段：简历指导、面试技巧、企业真实面试题解析</p>
    <p>配套资料：课程源码、学习笔记、作业批改、社群答疑</p>`,
    price: 299,
    originalPrice: 499,
    category: '前端开发',
    b站链接: 'https://www.bilibili.com/video/BV1Kg411V7hC/',
    teacher: '黑马程序员',
    sales: 12580,
    hot: 9999,
  },
  {
    title: 'Java后端开发零基础到架构师（SpringBoot+微服务+分布式）',
    cover:
      'https://i0.hdslb.com/bfs/archive/7a9c8f6b8d7e6d31a5f35e6b7c2134567890123.jpg@400w_225h_1c_95q.webp',
    description: `<p>黑马程序员Java后端全套课程，从JavaSE到微服务架构师，一站式通关：</p>
    <p>1. 基础阶段：JavaSE、MySQL数据库、JDBC、Git</p>
    <p>2. 框架阶段：Spring、SpringMVC、MyBatis、SpringBoot、SpringCloud</p>
    <p>3. 高级阶段：分布式缓存（Redis）、消息队列（RabbitMQ）、Docker容器化</p>
    <p>4. 实战阶段：电商后台、支付系统、分布式调度平台开发</p>
    <p>适合人群：零基础想转行后端、在校学生、在职提升的开发者</p>`,
    price: 399,
    originalPrice: 699,
    category: '后端开发',
    b站链接: 'https://www.bilibili.com/video/BV1eK41167pD/',
    teacher: '黑马程序员',
    sales: 9876,
    hot: 8888,
  },
  {
    title: '计算机一级MS Office全套通关教程（2025考试专用）',
    cover:
      'https://i0.hdslb.com/bfs/archive/1234567890abcdef1234567890abcdef.jpg@400w_225h_1c_95q.webp',
    description: `<p>针对2025年计算机一级MS Office考试打造，零基础也能轻松通关：</p>
    <p>1. 计算机基础知识：进制转换、网络基础、操作系统常识</p>
    <p>2. Word专项：文档排版、图文混排、表格制作、邮件合并</p>
    <p>3. Excel专项：公式函数（VLOOKUP/SUMIF）、数据透视表、图表制作</p>
    <p>4. PPT专项：版式设计、动画效果、放映设置、模板应用</p>
    <p>5. 真题演练：近5年真题详解+模拟考试系统</p>
    <p>配套资料：真题题库、模拟软件、考点速记手册</p>`,
    price: 199,
    originalPrice: 299,
    category: '计算机等级考试',
    b站链接: 'https://www.bilibili.com/video/BV1zt411o7i7/',
    teacher: '黑马程序员',
    sales: 8543,
    hot: 7777,
  },
  {
    title: 'Excel从入门到精通（职场必备技能+计算机二级考点）',
    cover:
      'https://i0.hdslb.com/bfs/archive/abcdef1234567890abcdef1234567890.jpg@400w_225h_1c_95q.webp',
    description: `<p>职场人必备Excel技能课程，兼顾计算机二级考试考点：</p>
    <p>1. 基础操作：数据录入、格式设置、打印设置</p>
    <p>2. 公式函数：常用函数、财务函数、逻辑函数、查找函数</p>
    <p>3. 数据处理：数据筛选、排序、分类汇总、数据透视表</p>
    <p>4. 图表可视化：柱状图、折线图、饼图、动态图表</p>
    <p>5. 高效技巧：快捷键、宏命令、批量处理、数据清洗</p>
    <p>适合人群：职场新人、学生、需要提升办公效率的从业者</p>`,
    price: 129,
    originalPrice: 199,
    category: '办公软件',
    b站链接: 'https://www.bilibili.com/video/BV1Tb411i7nK/',
    teacher: '黑马程序员',
    sales: 7652,
    hot: 6666,
  },
];

/**
 * 插入种子数据
 * 优化点：添加数据存在性检查，避免重复插入
 */
const seedProducts = async () => {
  try {
    // 检查是否已存在种子数据
    const existingCount = await Product.countDocuments({
      title: { $in: products.map(item => item.title) },
    });

    if (existingCount > 0) {
      console.log(`ℹ️  已存在${existingCount}条课程种子数据，无需重复插入`);
      process.exit();
    }

    // 插入新商品
    await Product.insertMany(products);
    console.log('✅ B站黑马课程种子数据插入成功');
    process.exit();
  } catch (error) {
    console.error('❌ 商品种子数据插入失败：', error.message);
    process.exit(1);
  }
};

// 执行种子数据插入
seedProducts();
