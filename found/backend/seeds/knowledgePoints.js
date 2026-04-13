const mongoose = require('mongoose');
const KnowledgePoint = require('../models/KnowledgePoint');
const Category = require('../models/Category');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

// 默认知识点数据
const knowledgePointsData = [
  // 前端开发
  {
    name: 'HTML 基础',
    description: 'HTML 基本概念和标签',
    categoryName: '前端开发',
    parentName: null,
    keywords: ['HTML', '网页结构', '标签'],
  },
  {
    name: 'HTML 语义化标签',
    description: '使用语义化标签构建网页结构',
    categoryName: '前端开发',
    parentName: 'HTML 基础',
    keywords: ['语义化', 'header', 'nav', 'footer'],
  },
  {
    name: 'HTML 表单',
    description: '创建和处理 HTML 表单',
    categoryName: '前端开发',
    parentName: 'HTML 基础',
    keywords: ['form', 'input', 'textarea', 'submit'],
  },
  {
    name: 'CSS 基础',
    description: 'CSS 基本概念和选择器',
    categoryName: '前端开发',
    parentName: null,
    keywords: ['CSS', '样式', '选择器'],
  },
  {
    name: 'CSS Flexbox',
    description: '使用 Flexbox 布局网页',
    categoryName: '前端开发',
    parentName: 'CSS 基础',
    keywords: ['Flexbox', '布局', '弹性盒模型'],
  },
  {
    name: 'CSS Grid',
    description: '使用 CSS Grid 实现复杂布局',
    categoryName: '前端开发',
    parentName: 'CSS 基础',
    keywords: ['CSS Grid', '网格布局', '二维布局'],
  },
  {
    name: 'JavaScript 基础',
    description: 'JavaScript 基本语法和数据类型',
    categoryName: '前端开发',
    parentName: null,
    keywords: ['JavaScript', '语法', '数据类型'],
  },
  {
    name: 'JavaScript 函数',
    description: '函数定义和调用',
    categoryName: '前端开发',
    parentName: 'JavaScript 基础',
    keywords: ['函数', '参数', '返回值'],
  },
  {
    name: 'JavaScript 异步编程',
    description: 'Promise, async/await 等异步编程概念',
    categoryName: '前端开发',
    parentName: 'JavaScript 基础',
    keywords: ['异步', 'Promise', 'async/await', '回调函数'],
  },
  {
    name: 'JavaScript DOM 操作',
    description: '操作网页元素和事件处理',
    categoryName: '前端开发',
    parentName: 'JavaScript 基础',
    keywords: ['DOM', '事件', '网页交互'],
  },
  {
    name: 'React 基础',
    description: 'React 框架的基本概念和使用',
    categoryName: '前端开发',
    parentName: null,
    keywords: ['React', '组件', 'JSX'],
  },
  {
    name: 'Vue.js 基础',
    description: 'Vue.js 框架的基本概念和使用',
    categoryName: '前端开发',
    parentName: null,
    keywords: ['Vue.js', '组件', '响应式'],
  },

  // 后端开发
  {
    name: 'Node.js 基础',
    description: 'Node.js 基本概念和使用',
    categoryName: '后端开发',
    parentName: null,
    keywords: ['Node.js', '服务器', 'JavaScript'],
  },
  {
    name: 'Express.js 框架',
    description: '使用 Express.js 构建 Web 应用',
    categoryName: '后端开发',
    parentName: 'Node.js 基础',
    keywords: ['Express', '路由', '中间件'],
  },
  {
    name: 'MongoDB 基础',
    description: 'MongoDB 数据库基本操作',
    categoryName: '后端开发',
    parentName: null,
    keywords: ['MongoDB', 'NoSQL', '数据库'],
  },
  {
    name: 'MySQL 基础',
    description: 'MySQL 数据库基本操作和 SQL 查询',
    categoryName: '后端开发',
    parentName: null,
    keywords: ['MySQL', 'SQL', '数据库'],
  },
  {
    name: 'RESTful API 设计',
    description: '设计和实现 RESTful API',
    categoryName: '后端开发',
    parentName: null,
    keywords: ['API', 'RESTful', '接口设计'],
  },
  {
    name: 'JWT 认证',
    description: '使用 JWT 进行用户认证',
    categoryName: '后端开发',
    parentName: null,
    keywords: ['JWT', '认证', '安全'],
  },

  // 数据库
  {
    name: '数据库基本概念',
    description: '数据库的基本概念和分类',
    categoryName: '数据库',
    parentName: null,
    keywords: ['数据库', '概念', '分类'],
  },
  {
    name: 'SQL 查询优化',
    description: '优化 SQL 查询性能的方法',
    categoryName: '数据库',
    parentName: null,
    keywords: ['SQL', '查询优化', '性能'],
  },
  {
    name: '数据库索引',
    description: '数据库索引的原理和使用',
    categoryName: '数据库',
    parentName: null,
    keywords: ['索引', '性能', '查询'],
  },

  // 计算机基础
  {
    name: '计算机网络基础',
    description: '计算机网络的基本概念和协议',
    categoryName: '计算机基础',
    parentName: null,
    keywords: ['网络', 'TCP/IP', 'HTTP'],
  },
  {
    name: '操作系统基础',
    description: '操作系统的基本概念和功能',
    categoryName: '计算机基础',
    parentName: null,
    keywords: ['操作系统', '进程', '线程'],
  },
  {
    name: '数据结构与算法',
    description: '常用数据结构和算法的原理',
    categoryName: '计算机基础',
    parentName: null,
    keywords: ['数据结构', '算法', '排序', '查找'],
  },
  {
    name: '数据结构与算法 - 数组',
    description: '数组的基本操作和应用',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['数组', '数据结构', '排序'],
  },
  {
    name: '数据结构与算法 - 链表',
    description: '链表的基本操作和应用',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['链表', '数据结构', '指针'],
  },
  {
    name: '数据结构与算法 - 栈',
    description: '栈的基本操作和应用',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['栈', '数据结构', 'LIFO'],
  },
  {
    name: '数据结构与算法 - 队列',
    description: '队列的基本操作和应用',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['队列', '数据结构', 'FIFO'],
  },
  {
    name: '数据结构与算法 - 二叉树',
    description: '二叉树的基本概念和遍历方法',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['二叉树', '数据结构', '遍历'],
  },
  {
    name: '数据结构与算法 - 排序算法',
    description: '常用排序算法的原理和实现',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['排序算法', '冒泡排序', '快速排序', '归并排序'],
  },
  {
    name: '数据结构与算法 - 查找算法',
    description: '常用查找算法的原理和实现',
    categoryName: '计算机基础',
    parentName: '数据结构与算法',
    keywords: ['查找算法', '二分查找', '哈希表'],
  },

  // 移动开发
  {
    name: 'React Native 基础',
    description: '使用 React Native 开发跨平台移动应用',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['React Native', '移动开发', '跨平台'],
  },
  {
    name: 'Flutter 基础',
    description: '使用 Flutter 开发跨平台移动应用',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['Flutter', 'Dart', '移动开发'],
  },
  {
    name: 'React Native 组件',
    description: 'React Native 核心组件的使用',
    categoryName: '移动开发',
    parentName: 'React Native 基础',
    keywords: ['React Native', '组件', 'View', 'Text', 'Image'],
  },
  {
    name: 'React Native 导航',
    description: 'React Native 应用的导航实现',
    categoryName: '移动开发',
    parentName: 'React Native 基础',
    keywords: ['导航', 'React Navigation', 'Stack Navigator', 'Tab Navigator'],
  },
  {
    name: 'Flutter 布局',
    description: 'Flutter 应用的布局系统',
    categoryName: '移动开发',
    parentName: 'Flutter 基础',
    keywords: ['Flutter', '布局', 'Container', 'Row', 'Column'],
  },
  {
    name: 'Flutter 状态管理',
    description: 'Flutter 应用的状态管理方案',
    categoryName: '移动开发',
    parentName: 'Flutter 基础',
    keywords: ['状态管理', 'Provider', 'Bloc', 'Riverpod'],
  },
  {
    name: '移动应用 UI/UX 设计',
    description: '移动应用的用户界面和用户体验设计',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['UI/UX', '设计原则', '用户体验', '界面设计'],
  },
  {
    name: '移动应用性能优化',
    description: '提升移动应用性能的方法',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['性能优化', '内存管理', '渲染优化', '启动速度'],
  },
  {
    name: '移动应用安全',
    description: '移动应用的安全防护措施',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['安全', '加密', '权限管理', '数据保护'],
  },
  {
    name: 'iOS 开发基础',
    description: 'iOS 应用开发的基本概念和工具',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['iOS', 'Swift', 'Xcode', 'UIKit'],
  },
  {
    name: 'Android 开发基础',
    description: 'Android 应用开发的基本概念和工具',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['Android', 'Kotlin', 'Java', 'Android Studio'],
  },
  {
    name: '移动应用发布',
    description: '移动应用的打包和发布流程',
    categoryName: '移动开发',
    parentName: null,
    keywords: ['应用发布', 'App Store', 'Google Play', '打包'],
  },

  // 人工智能
  {
    name: '人工智能基础',
    description: '人工智能的基本概念和应用',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['人工智能', 'AI', '机器学习'],
  },
  {
    name: '机器学习基础',
    description: '机器学习的基本概念和算法',
    categoryName: '人工智能',
    parentName: '人工智能基础',
    keywords: ['机器学习', '算法', '模型'],
  },
  {
    name: '深度学习基础',
    description: '深度学习的基本概念和神经网络',
    categoryName: '人工智能',
    parentName: '人工智能基础',
    keywords: ['深度学习', '神经网络', 'TensorFlow'],
  },
  {
    name: 'Python 基础',
    description: 'Python 编程语言的基本语法和使用',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['Python', '编程语言', '语法'],
  },
  {
    name: 'Python 数据分析',
    description: '使用 Python 进行数据分析和可视化',
    categoryName: '人工智能',
    parentName: 'Python 基础',
    keywords: ['Python', '数据分析', 'Pandas', 'NumPy', 'Matplotlib'],
  },
  {
    name: '机器学习算法 - 线性回归',
    description: '线性回归算法的原理和应用',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['线性回归', '监督学习', '回归分析', '预测'],
  },
  {
    name: '机器学习算法 - 逻辑回归',
    description: '逻辑回归算法的原理和应用',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['逻辑回归', '分类', '概率', '监督学习'],
  },
  {
    name: '机器学习算法 - 决策树',
    description: '决策树算法的原理和应用',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['决策树', '分类', '回归', 'ID3', 'C4.5'],
  },
  {
    name: '机器学习算法 - 随机森林',
    description: '随机森林算法的原理和应用',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['随机森林', '集成学习', '分类', '回归'],
  },
  {
    name: '机器学习算法 - SVM',
    description: '支持向量机算法的原理和应用',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['SVM', '支持向量机', '分类', '核函数'],
  },
  {
    name: '深度学习 - 卷积神经网络',
    description: 'CNN 卷积神经网络的原理和应用',
    categoryName: '人工智能',
    parentName: '深度学习基础',
    keywords: ['CNN', '卷积神经网络', '图像识别', '特征提取'],
  },
  {
    name: '深度学习 - 循环神经网络',
    description: 'RNN 循环神经网络的原理和应用',
    categoryName: '人工智能',
    parentName: '深度学习基础',
    keywords: ['RNN', '循环神经网络', '序列数据', '自然语言处理'],
  },
  {
    name: '深度学习 - Transformer',
    description: 'Transformer 模型的原理和应用',
    categoryName: '人工智能',
    parentName: '深度学习基础',
    keywords: ['Transformer', '自注意力', 'BERT', 'GPT'],
  },
  {
    name: '深度学习框架 - TensorFlow',
    description: '使用 TensorFlow 构建深度学习模型',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['TensorFlow', '深度学习', '框架', '模型构建'],
  },
  {
    name: '深度学习框架 - PyTorch',
    description: '使用 PyTorch 构建深度学习模型',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['PyTorch', '深度学习', '框架', '动态图'],
  },
  {
    name: '自然语言处理',
    description: '让计算机理解和生成人类语言',
    categoryName: '人工智能',
    parentName: '人工智能基础',
    keywords: ['NLP', '自然语言处理', '文本分析', '语言模型'],
  },
  {
    name: '计算机视觉',
    description: '让计算机理解和分析图像',
    categoryName: '人工智能',
    parentName: '人工智能基础',
    keywords: ['计算机视觉', '图像识别', '目标检测', '图像处理'],
  },
  {
    name: '数据预处理',
    description: '机器学习数据的清洗和准备',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['数据预处理', '清洗', '标准化', '特征工程'],
  },
  {
    name: '模型评估与选择',
    description: '机器学习模型的评估和选择方法',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['模型评估', '交叉验证', '准确率', '召回率', 'F1 值'],
  },
  {
    name: '过拟合与欠拟合',
    description: '机器学习模型的泛化能力问题',
    categoryName: '人工智能',
    parentName: '机器学习基础',
    keywords: ['过拟合', '欠拟合', '正则化', '泛化能力'],
  },
  {
    name: '强化学习',
    description: '通过试错学习的人工智能方法',
    categoryName: '人工智能',
    parentName: '人工智能基础',
    keywords: ['强化学习', '代理', '环境', '奖励', '策略'],
  },
  {
    name: '大数据与人工智能',
    description: '大数据技术在人工智能中的应用',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['大数据', 'AI', '数据驱动', '分布式计算'],
  },
  {
    name: '人工智能伦理',
    description: '人工智能的伦理问题和社会影响',
    categoryName: '人工智能',
    parentName: null,
    keywords: ['AI 伦理', '隐私', '偏见', '社会责任'],
  },

  // 开发工具
  {
    name: 'Git 基础',
    description: 'Git 版本控制工具的基本使用',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Git', '版本控制', '代码管理'],
  },
  {
    name: 'Docker 基础',
    description: 'Docker 容器化技术的基本使用',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Docker', '容器', '虚拟化'],
  },
  {
    name: 'VS Code 高级技巧',
    description: 'Visual Studio Code 的高级使用技巧',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['VS Code', '编辑器', '开发工具'],
  },
  {
    name: 'Webpack 高级配置',
    description: 'Webpack 的高级配置和优化',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Webpack', '配置', '优化', '性能'],
  },
  {
    name: 'Babel 转译器',
    description: 'JavaScript 代码的转译和兼容性处理',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Babel', '转译', '兼容性', 'ES6+'],
  },
  {
    name: 'ESLint 代码检查',
    description: 'JavaScript/TypeScript 代码的质量检查',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['ESLint', '代码检查', '质量', '规范'],
  },
  {
    name: 'Prettier 代码格式化',
    description: '代码自动格式化工具',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Prettier', '格式化', '代码风格', '一致性'],
  },
  {
    name: 'Git 高级技巧',
    description: 'Git 版本控制的高级使用技巧',
    categoryName: '开发工具',
    parentName: 'Git 基础',
    keywords: ['Git', '高级', '分支管理', '冲突解决'],
  },
  {
    name: 'CI/CD 流水线',
    description: '持续集成和持续部署的实现',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['CI/CD', '持续集成', '持续部署', '自动化'],
  },
  {
    name: 'Jenkins 自动化',
    description: '使用 Jenkins 实现自动化构建和部署',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['Jenkins', '自动化', 'CI/CD', '构建'],
  },
  {
    name: 'GitHub Actions',
    description: 'GitHub 提供的自动化工作流',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['GitHub Actions', '自动化', 'CI/CD', '工作流'],
  },
  {
    name: '开发环境配置',
    description: '搭建和配置开发环境的最佳实践',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['开发环境', '配置', '工具链', '一致性'],
  },
  {
    name: '调试技巧',
    description: '代码调试的方法和工具',
    categoryName: '开发工具',
    parentName: null,
    keywords: ['调试', '断点', '日志', '调试工具'],
  },

  // 设计模式
  {
    name: '设计模式基础',
    description: '软件设计模式的基本概念和原则',
    categoryName: '设计模式',
    parentName: null,
    keywords: ['设计模式', '软件设计', 'SOLID'],
  },
  {
    name: '单例模式',
    description: '确保一个类只有一个实例的设计模式',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['单例模式', '设计模式', '创建型模式'],
  },
  {
    name: '工厂模式',
    description: '创建对象的设计模式',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['工厂模式', '设计模式', '创建型模式'],
  },
  {
    name: '观察者模式',
    description: '对象之间的一对多依赖关系设计模式',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['观察者模式', '设计模式', '行为型模式'],
  },
  {
    name: '装饰器模式',
    description: '动态扩展对象功能的设计模式',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['装饰器模式', '设计模式', '结构型模式'],
  },
  {
    name: '策略模式',
    description: '定义一系列算法，将它们封装起来，并使它们可以相互替换',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['策略模式', '算法', '封装', '行为型模式'],
  },
  {
    name: '模板方法模式',
    description: '定义算法的骨架，允许子类重定义某些步骤',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['模板方法', '算法骨架', '继承', '行为型模式'],
  },
  {
    name: '适配器模式',
    description: '将一个类的接口转换成客户希望的另一个接口',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['适配器模式', '接口转换', '兼容性', '结构型模式'],
  },
  {
    name: '桥接模式',
    description: '将抽象部分与它的实现部分分离，使它们都可以独立地变化',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['桥接模式', '抽象与实现分离', '结构型模式'],
  },
  {
    name: '组合模式',
    description: '将对象组合成树形结构以表示"部分-整体"的层次结构',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['组合模式', '树形结构', '部分-整体', '结构型模式'],
  },
  {
    name: '责任链模式',
    description: '为请求创建一个接收者对象的链',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['责任链模式', '请求处理', '行为型模式'],
  },
  {
    name: '工厂方法模式',
    description: '定义创建对象的接口，让子类决定实例化哪一个类',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['工厂方法', '创建型模式', '接口'],
  },
  {
    name: '抽象工厂模式',
    description: '提供一个创建一系列相关或相互依赖对象的接口',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['抽象工厂', '创建型模式', '系列对象'],
  },
  {
    name: '建造者模式',
    description: '将一个复杂对象的构建与它的表示分离',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['建造者模式', '复杂对象', '创建型模式'],
  },
  {
    name: '原型模式',
    description: '用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['原型模式', '拷贝', '创建型模式'],
  },
  {
    name: '外观模式',
    description: '为子系统中的一组接口提供一个一致的界面',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['外观模式', '接口统一', '结构型模式'],
  },
  {
    name: '代理模式',
    description: '为其他对象提供一种代理以控制对这个对象的访问',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['代理模式', '控制访问', '结构型模式'],
  },
  {
    name: '享元模式',
    description: '运用共享技术有效地支持大量细粒度的对象',
    categoryName: '设计模式',
    parentName: '设计模式基础',
    keywords: ['享元模式', '共享', '结构型模式'],
  },
];

// 导入知识点数据
const importKnowledgePoints = async () => {
  try {
    // 连接数据库
    console.log('正在连接数据库...');
    await connectDB();

    // 删除现有知识点
    console.log('正在删除现有知识点...');
    await KnowledgePoint.deleteMany();

    // 获取所有分类
    console.log('正在获取所有分类...');
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });
    console.log(`找到 ${categories.length} 个分类`);

    // 导入顶级知识点（没有父知识点的）
    const topLevelPoints = knowledgePointsData.filter(point => !point.parentName);
    const importedPoints = [];

    // 先导入顶级知识点
    console.log(`正在导入 ${topLevelPoints.length} 个顶级知识点...`);
    for (const pointData of topLevelPoints) {
      const categoryId = categoryMap[pointData.categoryName];
      if (!categoryId) {
        console.warn(`分类 ${pointData.categoryName} 不存在，跳过知识点 ${pointData.name}`);
        continue;
      }

      const point = await KnowledgePoint.create({
        name: pointData.name,
        description: pointData.description,
        category: categoryId,
        parent: null,
        level: 0,
        keywords: pointData.keywords,
      });

      importedPoints.push(point);
    }

    // 导入子知识点
    const pointMap = {};
    importedPoints.forEach(point => {
      pointMap[point.name] = point;
    });

    const childPoints = knowledgePointsData.filter(point => point.parentName);
    console.log(`正在导入 ${childPoints.length} 个子知识点...`);
    let importedChildPoints = 0;
    let skippedChildPoints = 0;

    for (const pointData of childPoints) {
      const categoryId = categoryMap[pointData.categoryName];
      const parentPoint = pointMap[pointData.parentName];

      if (!categoryId) {
        console.warn(`分类 ${pointData.categoryName} 不存在，跳过知识点 ${pointData.name}`);
        skippedChildPoints++;
        continue;
      }

      if (!parentPoint) {
        console.warn(`父知识点 ${pointData.parentName} 不存在，跳过知识点 ${pointData.name}`);
        skippedChildPoints++;
        continue;
      }

      const point = await KnowledgePoint.create({
        name: pointData.name,
        description: pointData.description,
        category: categoryId,
        parent: parentPoint._id,
        level: parentPoint.level + 1,
        keywords: pointData.keywords,
      });

      importedPoints.push(point);
      pointMap[point.name] = point;
      importedChildPoints++;
    }

    console.log(`成功导入 ${importedPoints.length} 个知识点`);
    console.log(
      `其中：顶级知识点 ${topLevelPoints.length} 个，子知识点 ${importedChildPoints} 个（跳过 ${skippedChildPoints} 个）`
    );
    process.exit();
  } catch (error) {
    console.error('知识点数据导入失败:', error);
    process.exit(1);
  }
};

// 执行导入
importKnowledgePoints();
