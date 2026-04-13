const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KnowledgePoint = require('../models/KnowledgePoint');
const Category = require('../models/Category');

// 加载环境变量
dotenv.config({ path: '../.env' });

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 补充知识库脚本 - 直接关联知识点到分类
const additionalKnowledgePoints = [
  // 前端开发
  {
    categorySlug: 'frontend',
    name: 'HTML5 新特性',
    description: 'HTML5引入的新元素、属性和API',
    content:
      '<h2>HTML5 新特性</h2><p>HTML5引入了许多新特性，使网页开发更加灵活和强大。</p><h3>主要新特性</h3><ul><li>语义化标签（&lt;header&gt;, &lt;nav&gt;, &lt;section&gt;, &lt;footer&gt; 等）</li><li>媒体标签（&lt;video&gt;, &lt;audio&gt;）</li><li>Canvas绘图API</li><li>表单增强（date, time, email等类型）</li><li>本地存储（localStorage, sessionStorage）</li><li>Web Workers</li><li>WebSocket</li></ul>',
    keywords: ['html5', '新特性', '语义化', 'canvas'],
    level: 0,
  },
  {
    categorySlug: 'frontend',
    name: 'CSS Grid 布局',
    description: 'CSS Grid是一个二维布局系统，用于创建复杂的网页布局',
    content:
      '<h2>CSS Grid 布局</h2><p>CSS Grid是一个强大的二维布局系统，允许同时在行列两个维度上排列元素。</p><h3>主要特性</h3><ul><li>二维布局（同时控制行和列）</li><li>精确控制元素位置和大小</li><li>响应式设计支持</li><li>嵌套网格</li></ul><h3>基本语法</h3><pre><code>.container { display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 20px; }</code></pre>',
    keywords: ['css', 'grid', '布局', '响应式'],
    level: 0,
  },
  {
    categorySlug: 'frontend',
    name: 'Flexbox 布局',
    description: 'CSS Flexbox是一维布局模型，用于创建灵活的布局结构',
    content:
      '<h2>Flexbox 布局</h2><p>CSS Flexbox是一个一维布局模型，适用于创建灵活的行或列布局。</p><h3>主要特性</h3><ul><li>一维布局（行或列）</li><li>灵活的元素大小和间距</li><li>对齐和分布控制</li><li>响应式设计支持</li></ul><h3>基本语法</h3><pre><code>.container { display: flex; justify-content: space-between; align-items: center; }</code></pre>',
    keywords: ['css', 'flexbox', '布局', '响应式'],
    level: 0,
  },
  // 后端开发
  {
    categorySlug: 'backend',
    name: 'RESTful API 设计',
    description: 'RESTful API的设计原则和最佳实践',
    content:
      '<h2>RESTful API 设计</h2><p>RESTful API是基于REST架构风格的API设计方法。</p><h3>核心原则</h3><ul><li>使用HTTP方法（GET, POST, PUT, DELETE）</li><li>资源导向的URL设计</li><li>状态码的正确使用</li><li>无状态通信</li><li>支持HATEOAS</li></ul>',
    keywords: ['restful', 'api', '设计', '后端'],
    level: 0,
  },
  {
    categorySlug: 'backend',
    name: '中间件设计模式',
    description: '中间件是处理HTTP请求的函数，用于扩展应用功能',
    content:
      '<h2>中间件设计模式</h2><p>中间件是处理HTTP请求的函数，允许在请求到达路由处理程序之前或之后执行代码。</p><h3>常见用途</h3><ul><li>日志记录</li><li>身份验证和授权</li><li>错误处理</li><li>数据解析</li></ul>',
    keywords: ['middleware', '设计模式', '后端', 'express'],
    level: 0,
  },
  // 数据库
  {
    categorySlug: 'database',
    name: '数据库索引优化',
    description: '数据库索引的设计原则和优化技巧',
    content:
      '<h2>数据库索引优化</h2><p>索引是提高数据库查询性能的关键技术。</p><h3>索引优化原则</h3><ul><li>选择合适的列创建索引</li><li>避免过度索引</li><li>使用复合索引</li><li>考虑索引顺序</li><li>定期维护索引</li></ul>',
    keywords: ['database', 'index', 'optimization', 'performance'],
    level: 0,
  },
  {
    categorySlug: 'database',
    name: '事务管理',
    description: '数据库事务的ACID特性和管理方法',
    content:
      '<h2>事务管理</h2><p>事务是一组数据库操作，要么全部成功，要么全部失败。</p><h3>ACID特性</h3><ul><li>原子性（Atomicity）</li><li>一致性（Consistency）</li><li>隔离性（Isolation）</li><li>持久性（Durability）</li></ul>',
    keywords: ['transaction', 'acid', 'database', 'concurrency'],
    level: 0,
  },
  // 计算机基础
  {
    categorySlug: 'computer-basics',
    name: '数据结构与算法',
    description: '计算机科学中核心的数据结构和算法',
    content:
      '<h2>数据结构与算法</h2><p>数据结构是组织和存储数据的方式，算法是解决问题的步骤。</p><h3>常见数据结构</h3><ul><li>数组（Array）</li><li>链表（Linked List）</li><li>栈（Stack）</li><li>队列（Queue）</li><li>树（Tree）</li><li>图（Graph）</li></ul><h3>常见算法</h3><ul><li>排序算法（冒泡、选择、插入、快速、归并等）</li><li>搜索算法（线性搜索、二分搜索）</li><li>图算法（BFS、DFS、最短路径）</li></ul>',
    keywords: ['data structure', 'algorithm', 'sorting', 'searching'],
    level: 0,
  },
  {
    categorySlug: 'computer-basics',
    name: '计算机网络基础',
    description: '计算机网络的基本概念和协议',
    content:
      '<h2>计算机网络基础</h2><p>计算机网络是连接计算机的系统，用于数据通信。</p><h3>网络模型</h3><ul><li>OSI七层模型</li><li>TCP/IP四层模型</li></ul><h3>常见协议</h3><ul><li>TCP/UDP</li><li>HTTP/HTTPS</li><li>FTP/SMTP/POP3</li></ul>',
    keywords: ['network', 'protocol', 'osi', 'tcp/ip'],
    level: 0,
  },
  // 人工智能
  {
    categorySlug: 'ai',
    name: '机器学习基础',
    description: '机器学习的基本概念和算法',
    content:
      '<h2>机器学习基础</h2><p>机器学习是人工智能的一个分支，使计算机能够从数据中学习。</p><h3>主要类型</h3><ul><li>监督学习</li><li>无监督学习</li><li>半监督学习</li><li>强化学习</li></ul><h3>常见算法</h3><ul><li>线性回归</li><li>逻辑回归</li><li>决策树</li><li>支持向量机</li><li>神经网络</li></ul>',
    keywords: ['machine learning', 'ai', 'algorithm', 'supervised learning'],
    level: 0,
  },
  {
    categorySlug: 'ai',
    name: '深度学习框架',
    description: '深度学习常用的开发框架',
    content:
      '<h2>深度学习框架</h2><p>深度学习框架简化了神经网络的设计、训练和部署。</p><h3>主流框架</h3><ul><li>TensorFlow</li><li>PyTorch</li><li>Keras</li><li>Caffe</li></ul><h3>框架特点</h3><ul><li>自动微分</li><li>GPU加速</li><li>预训练模型</li><li>分布式训练支持</li></ul>',
    keywords: ['deep learning', 'framework', 'tensorflow', 'pytorch'],
    level: 0,
  },
  // Python
  {
    categorySlug: 'python',
    name: 'Python 数据处理',
    description: '使用Python进行数据处理和分析的库和技术',
    content:
      '<h2>Python 数据处理</h2><p>Python是数据处理和分析的强大工具。</p><h3>常用库</h3><ul><li>Numpy：数值计算</li><li>Pandas：数据分析</li><li>Matplotlib/Seaborn：数据可视化</li><li>Scipy：科学计算</li></ul>',
    keywords: ['python', 'data processing', 'numpy', 'pandas'],
    level: 0,
  },
  // JavaScript
  {
    categorySlug: 'javascript',
    name: 'ES6+ 新特性',
    description: 'JavaScript ES6及以上版本引入的新特性',
    content:
      '<h2>ES6+ 新特性</h2><p>ES6（ECMAScript 2015）及后续版本引入了许多新特性，使JavaScript更强大和易于使用。</p><h3>主要新特性</h3><ul><li>let/const声明</li><li>箭头函数</li><li>模板字符串</li><li>解构赋值</li><li>类和模块</li><li>Promise和async/await</li><li>扩展运算符</li></ul>',
    keywords: ['javascript', 'es6', '新特性', '箭头函数', 'promise'],
    level: 0,
  },
];

// 运行脚本
const runScript = async () => {
  try {
    // 连接数据库
    await connectDB();

    // 获取所有分类
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.slug] = category._id;
    });

    // 输出可用分类
    console.log('可用分类:');
    Object.keys(categoryMap).forEach(slug => {
      console.log(`- ${slug}`);
    });

    let importedCount = 0;
    let skippedCount = 0;

    // 导入知识点
    for (const point of additionalKnowledgePoints) {
      // 检查分类是否存在
      if (!categoryMap[point.categorySlug]) {
        console.log(`❌ 分类 ${point.categorySlug} 不存在，跳过知识点 ${point.name}`);
        continue;
      }

      // 检查知识点是否已存在
      const existing = await KnowledgePoint.findOne({ name: point.name });
      if (existing) {
        console.log(`⚠️  知识点 ${point.name} 已存在，跳过`);
        skippedCount++;
        continue;
      }

      // 创建新知识点
      const newPoint = new KnowledgePoint({
        category: categoryMap[point.categorySlug],
        name: point.name,
        description: point.description,
        content: point.content,
        keywords: point.keywords,
        level: point.level || 0,
      });

      await newPoint.save();
      console.log(`✅ 成功导入知识点: ${point.name}`);
      importedCount++;
    }

    // 导入完成
    console.log(`\n📊 知识点补充完成:`);
    console.log(`- 成功导入: ${importedCount} 个`);
    console.log(`- 已存在跳过: ${skippedCount} 个`);
  } catch (error) {
    console.error('❌ 执行脚本时出错:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
};

// 执行脚本
runScript();
