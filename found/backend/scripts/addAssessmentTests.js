const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Category = require('../models/Category');

// 加载环境变量
dotenv.config();

// 连接到数据库
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.log('MongoDB连接失败:', err));

// 添加测试和题目
const addAssessmentTests = async () => {
  try {
    // 获取分类（假设已有"前端开发"和"后端开发"分类）
    let frontendCategory = await Category.findOne({ name: '前端开发' });
    let backendCategory = await Category.findOne({ name: '后端开发' });

    // 如果分类不存在，创建它们
    if (!frontendCategory) {
      frontendCategory = new Category({
        name: '前端开发',
        slug: 'frontend',
        description: '前端开发相关内容',
        parent: null,
        level: 1,
      });
      await frontendCategory.save();
    }

    if (!backendCategory) {
      backendCategory = new Category({
        name: '后端开发',
        slug: 'backend',
        description: '后端开发相关内容',
        parent: null,
        level: 1,
      });
      await backendCategory.save();
    }

    // 模拟管理员用户ID（用于createdBy字段）
    const adminUserId = new mongoose.Types.ObjectId();

    // 前端开发测试
    const frontendTest = new Test({
      title: '前端开发基础知识评估',
      description: '测试您对前端开发基础知识的掌握程度',
      category: frontendCategory._id,
      difficulty: 'medium',
      duration: 30,
      totalQuestions: 10,
      passingScore: 60,
      isPublished: true,
      createdBy: adminUserId,
    });

    await frontendTest.save();

    // 前端开发测试题目
    const frontendQuestions = [
      {
        test: frontendTest._id,
        questionText: 'HTML5中哪个标签用于定义文档的主要内容？',
        questionType: 'single',
        options: [
          { text: '<main>', isCorrect: true },
          { text: '<content>', isCorrect: false },
          { text: '<primary>', isCorrect: false },
          { text: '<main-content>', isCorrect: false },
        ],
        correctAnswer: '<main>',
        difficulty: 'easy',
        points: 10,
        explanation:
          'HTML5的<main>标签用于定义文档的主要内容区域，它应该包含与文档主要内容直接相关的内容。',
        keywords: ['HTML5', '标签', 'main'],
      },
      {
        test: frontendTest._id,
        questionText: 'CSS中哪个属性用于设置元素的外边距？',
        questionType: 'single',
        options: [
          { text: 'margin', isCorrect: true },
          { text: 'padding', isCorrect: false },
          { text: 'border', isCorrect: false },
          { text: 'space', isCorrect: false },
        ],
        correctAnswer: 'margin',
        difficulty: 'easy',
        points: 10,
        explanation: 'CSS的margin属性用于设置元素的外边距，控制元素与其他元素之间的距离。',
        keywords: ['CSS', 'margin', '外边距'],
      },
      {
        test: frontendTest._id,
        questionText: 'JavaScript中哪个方法用于添加或删除CSS类？',
        questionType: 'single',
        options: [
          { text: 'classList.add()/remove()', isCorrect: true },
          { text: 'setAttribute()/removeAttribute()', isCorrect: false },
          { text: 'addClass()/removeClass()', isCorrect: false },
          { text: 'toggleClass()', isCorrect: false },
        ],
        correctAnswer: 'classList.add()/remove()',
        difficulty: 'medium',
        points: 10,
        explanation:
          'JavaScript的classList属性提供了add()和remove()方法，用于添加和删除元素的CSS类。',
        keywords: ['JavaScript', 'classList', 'CSS类'],
      },
      {
        test: frontendTest._id,
        questionText: 'React中哪个钩子用于管理组件状态？',
        questionType: 'single',
        options: [
          { text: 'useState', isCorrect: true },
          { text: 'useEffect', isCorrect: false },
          { text: 'useContext', isCorrect: false },
          { text: 'useReducer', isCorrect: false },
        ],
        correctAnswer: 'useState',
        difficulty: 'medium',
        points: 10,
        explanation: 'React的useState钩子用于在函数组件中管理状态。',
        keywords: ['React', 'useState', '状态管理'],
      },
      {
        test: frontendTest._id,
        questionText: 'Vue.js中哪个指令用于条件渲染？',
        questionType: 'single',
        options: [
          { text: 'v-if', isCorrect: true },
          { text: 'v-for', isCorrect: false },
          { text: 'v-bind', isCorrect: false },
          { text: 'v-on', isCorrect: false },
        ],
        correctAnswer: 'v-if',
        difficulty: 'medium',
        points: 10,
        explanation: 'Vue.js的v-if指令用于根据条件渲染元素。',
        keywords: ['Vue.js', 'v-if', '条件渲染'],
      },
      {
        test: frontendTest._id,
        questionText: 'CSS中哪个布局方式使用Flexbox模型？',
        questionType: 'single',
        options: [
          { text: 'display: flex', isCorrect: true },
          { text: 'display: grid', isCorrect: false },
          { text: 'display: table', isCorrect: false },
          { text: 'display: block', isCorrect: false },
        ],
        correctAnswer: 'display: flex',
        difficulty: 'medium',
        points: 10,
        explanation: 'CSS的display: flex属性用于启用Flexbox布局模型，方便实现灵活的布局。',
        keywords: ['CSS', 'Flexbox', '布局'],
      },
      {
        test: frontendTest._id,
        questionText: 'JavaScript中哪个数据类型不是原始类型？',
        questionType: 'single',
        options: [
          { text: 'Object', isCorrect: true },
          { text: 'String', isCorrect: false },
          { text: 'Number', isCorrect: false },
          { text: 'Boolean', isCorrect: false },
        ],
        correctAnswer: 'Object',
        difficulty: 'medium',
        points: 10,
        explanation:
          'JavaScript的原始数据类型包括String、Number、Boolean、Null、Undefined、Symbol和BigInt，Object是引用类型。',
        keywords: ['JavaScript', '数据类型', '原始类型'],
      },
      {
        test: frontendTest._id,
        questionText: 'HTML5中哪个API用于在浏览器中存储数据？',
        questionType: 'single',
        options: [
          { text: 'localStorage', isCorrect: true },
          { text: 'sessionStorage', isCorrect: false },
          { text: 'IndexedDB', isCorrect: false },
          { text: 'Web Storage API', isCorrect: false },
        ],
        correctAnswer: 'localStorage',
        difficulty: 'medium',
        points: 10,
        explanation: 'localStorage是HTML5 Web Storage API的一部分，用于在浏览器中持久化存储数据。',
        keywords: ['HTML5', 'localStorage', '存储API'],
      },
      {
        test: frontendTest._id,
        questionText: 'CSS中哪个属性用于设置文本颜色？',
        questionType: 'single',
        options: [
          { text: 'color', isCorrect: true },
          { text: 'text-color', isCorrect: false },
          { text: 'font-color', isCorrect: false },
          { text: 'text-style', isCorrect: false },
        ],
        correctAnswer: 'color',
        difficulty: 'easy',
        points: 10,
        explanation: 'CSS的color属性用于设置文本颜色。',
        keywords: ['CSS', 'color', '文本颜色'],
      },
      {
        test: frontendTest._id,
        questionText: 'JavaScript中哪个方法用于遍历数组？',
        questionType: 'single',
        options: [
          { text: 'forEach()', isCorrect: true },
          { text: 'map()', isCorrect: false },
          { text: 'filter()', isCorrect: false },
          { text: 'reduce()', isCorrect: false },
        ],
        correctAnswer: 'forEach()',
        difficulty: 'medium',
        points: 10,
        explanation: 'JavaScript的forEach()方法用于遍历数组中的每个元素。',
        keywords: ['JavaScript', '数组', '遍历'],
      },
    ];

    await Question.insertMany(frontendQuestions);

    // 后端开发测试
    const backendTest = new Test({
      title: '后端开发基础知识评估',
      description: '测试您对后端开发基础知识的掌握程度',
      category: backendCategory._id,
      difficulty: 'medium',
      duration: 30,
      totalQuestions: 10,
      passingScore: 60,
      isPublished: true,
      createdBy: adminUserId,
    });

    await backendTest.save();

    // 后端开发测试题目
    const backendQuestions = [
      {
        test: backendTest._id,
        questionText: 'Node.js使用哪个引擎执行JavaScript？',
        questionType: 'single',
        options: [
          { text: 'V8', isCorrect: true },
          { text: 'SpiderMonkey', isCorrect: false },
          { text: 'Chakra', isCorrect: false },
          { text: 'JavaScriptCore', isCorrect: false },
        ],
        correctAnswer: 'V8',
        difficulty: 'medium',
        points: 10,
        explanation: 'Node.js使用Google的V8引擎执行JavaScript代码。',
        keywords: ['Node.js', 'V8', 'JavaScript引擎'],
      },
      {
        test: backendTest._id,
        questionText: 'Express.js中哪个方法用于处理GET请求？',
        questionType: 'single',
        options: [
          { text: 'app.get()', isCorrect: true },
          { text: 'app.post()', isCorrect: false },
          { text: 'app.put()', isCorrect: false },
          { text: 'app.delete()', isCorrect: false },
        ],
        correctAnswer: 'app.get()',
        difficulty: 'medium',
        points: 10,
        explanation: 'Express.js的app.get()方法用于处理GET请求。',
        keywords: ['Express.js', 'app.get()', 'GET请求'],
      },
      {
        test: backendTest._id,
        questionText: 'MongoDB中哪个命令用于查询文档？',
        questionType: 'single',
        options: [
          { text: 'find()', isCorrect: true },
          { text: 'get()', isCorrect: false },
          { text: 'query()', isCorrect: false },
          { text: 'search()', isCorrect: false },
        ],
        correctAnswer: 'find()',
        difficulty: 'medium',
        points: 10,
        explanation: 'MongoDB的find()命令用于查询文档。',
        keywords: ['MongoDB', 'find()', '查询'],
      },
      {
        test: backendTest._id,
        questionText: 'SQL中哪个命令用于从表中查询数据？',
        questionType: 'single',
        options: [
          { text: 'SELECT', isCorrect: true },
          { text: 'INSERT', isCorrect: false },
          { text: 'UPDATE', isCorrect: false },
          { text: 'DELETE', isCorrect: false },
        ],
        correctAnswer: 'SELECT',
        difficulty: 'easy',
        points: 10,
        explanation: 'SQL的SELECT命令用于从表中查询数据。',
        keywords: ['SQL', 'SELECT', '查询'],
      },
      {
        test: backendTest._id,
        questionText: 'REST API中哪个HTTP方法用于更新资源？',
        questionType: 'single',
        options: [
          { text: 'PUT', isCorrect: true },
          { text: 'GET', isCorrect: false },
          { text: 'POST', isCorrect: false },
          { text: 'DELETE', isCorrect: false },
        ],
        correctAnswer: 'PUT',
        difficulty: 'medium',
        points: 10,
        explanation: 'REST API中，PUT方法用于更新资源。',
        keywords: ['REST API', 'HTTP方法', 'PUT'],
      },
      {
        test: backendTest._id,
        questionText: 'JavaScript中哪个模块系统使用require()和module.exports？',
        questionType: 'single',
        options: [
          { text: 'CommonJS', isCorrect: true },
          { text: 'ES Modules', isCorrect: false },
          { text: 'AMD', isCorrect: false },
          { text: 'UMD', isCorrect: false },
        ],
        correctAnswer: 'CommonJS',
        difficulty: 'medium',
        points: 10,
        explanation: 'CommonJS是Node.js使用的模块系统，使用require()和module.exports。',
        keywords: ['JavaScript', 'CommonJS', '模块系统'],
      },
      {
        test: backendTest._id,
        questionText: 'Redis是什么类型的数据库？',
        questionType: 'single',
        options: [
          { text: '内存数据库', isCorrect: true },
          { text: '关系型数据库', isCorrect: false },
          { text: '文档数据库', isCorrect: false },
          { text: '图形数据库', isCorrect: false },
        ],
        correctAnswer: '内存数据库',
        difficulty: 'medium',
        points: 10,
        explanation: 'Redis是一个高性能的内存数据库，常用于缓存、会话存储等场景。',
        keywords: ['Redis', '内存数据库', '缓存'],
      },
      {
        test: backendTest._id,
        questionText: 'JWT是什么的缩写？',
        questionType: 'single',
        options: [
          { text: 'JSON Web Token', isCorrect: true },
          { text: 'JavaScript Web Token', isCorrect: false },
          { text: 'Java Web Token', isCorrect: false },
          { text: 'JSON Web Tool', isCorrect: false },
        ],
        correctAnswer: 'JSON Web Token',
        difficulty: 'medium',
        points: 10,
        explanation: 'JWT是JSON Web Token的缩写，是一种用于身份验证和信息交换的开放标准。',
        keywords: ['JWT', 'JSON Web Token', '身份验证'],
      },
      {
        test: backendTest._id,
        questionText: 'Express.js中哪个中间件用于解析JSON请求体？',
        questionType: 'single',
        options: [
          { text: 'express.json()', isCorrect: true },
          { text: 'body-parser', isCorrect: false },
          { text: 'express.urlencoded()', isCorrect: false },
          { text: 'multer', isCorrect: false },
        ],
        correctAnswer: 'express.json()',
        difficulty: 'medium',
        points: 10,
        explanation: 'Express.js的express.json()中间件用于解析JSON格式的请求体。',
        keywords: ['Express.js', '中间件', 'JSON解析'],
      },
      {
        test: backendTest._id,
        questionText: 'MongoDB中哪个数据结构用于存储数组？',
        questionType: 'single',
        options: [
          { text: 'Array', isCorrect: true },
          { text: 'List', isCorrect: false },
          { text: 'Collection', isCorrect: false },
          { text: 'Set', isCorrect: false },
        ],
        correctAnswer: 'Array',
        difficulty: 'easy',
        points: 10,
        explanation: 'MongoDB使用Array数据结构来存储数组。',
        keywords: ['MongoDB', 'Array', '数据结构'],
      },
    ];

    await Question.insertMany(backendQuestions);

    console.log('学习评估测试添加成功！');
  } catch (error) {
    console.error('添加学习评估测试失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
};

// 执行脚本
addAssessmentTests();
