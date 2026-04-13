// 批量添加各专业的学习评估测试和题目
const mongoose = require('mongoose');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Category = require('../models/Category');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/learning-ai-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 添加测试和题目
const addProfessionalAssessmentTests = async () => {
  try {
    console.log('开始添加计算机类学习评估测试...');

    // 确保存在所需的分类
    const categories = await createCategories();

    // 模拟管理员用户ID（用于createdBy字段）
    const adminUserId = new mongoose.Types.ObjectId();

    // 只添加计算机基础测试
    await addComputerScienceTests(categories['计算机基础'], adminUserId);

    // 添加更多计算机相关测试
    await addProgrammingTests(categories['计算机基础'], adminUserId);
    await addWebDevelopmentTests(categories['计算机基础'], adminUserId);

    console.log('所有计算机类评估测试添加成功！');
  } catch (error) {
    console.error('添加学习评估测试失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
};

// 创建所需的分类
const createCategories = async () => {
  const categoryNames = ['计算机基础'];
  const categories = {};

  for (const name of categoryNames) {
    let category = await Category.findOne({ name });

    if (!category) {
      category = new Category({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: `${name}相关内容`,
        parent: null,
        level: 1,
      });
      await category.save();
      console.log(`创建分类: ${name}`);
    }

    categories[name] = category;
  }

  return categories;
};

// 添加计算机基础测试
const addComputerScienceTests = async (category, adminUserId) => {
  // 计算机基础理论测试
  const csBasicTest = new Test({
    title: '计算机基础知识评估',
    description: '测试您对计算机基础知识的掌握程度，包括计算机组成、操作系统、网络基础等内容',
    category: category._id,
    difficulty: 'easy',
    duration: 20,
    totalQuestions: 20,
    passingScore: 60,
    isPublished: true,
    createdBy: adminUserId,
  });

  await csBasicTest.save();
  console.log(`创建测试: ${csBasicTest.title}`);

  // 计算机基础理论测试题目
  const csBasicQuestions = [
    {
      test: csBasicTest._id,
      questionText: '计算机中，CPU的主要功能是什么？',
      questionType: 'single',
      options: [
        { text: '存储数据和程序', isCorrect: false },
        { text: '执行算术和逻辑运算', isCorrect: true },
        { text: '处理输入输出设备', isCorrect: false },
        { text: '连接计算机各部件', isCorrect: false },
      ],
      correctAnswer: '执行算术和逻辑运算',
      difficulty: 'easy',
      points: 5,
      keywords: ['CPU', '计算机组成'],
    },
    {
      test: csBasicTest._id,
      questionText: '以下哪个不是操作系统的主要功能？',
      questionType: 'single',
      options: [
        { text: '处理器管理', isCorrect: false },
        { text: '内存管理', isCorrect: false },
        { text: '数据库管理', isCorrect: true },
        { text: '文件管理', isCorrect: false },
      ],
      correctAnswer: '数据库管理',
      difficulty: 'easy',
      points: 5,
      keywords: ['操作系统', '系统功能'],
    },
    {
      test: csBasicTest._id,
      questionText: 'TCP/IP协议中，TCP的主要作用是什么？',
      questionType: 'single',
      options: [
        { text: '地址解析', isCorrect: false },
        { text: '可靠的数据传输', isCorrect: true },
        { text: '路由选择', isCorrect: false },
        { text: '域名解析', isCorrect: false },
      ],
      correctAnswer: '可靠的数据传输',
      difficulty: 'medium',
      points: 5,
      keywords: ['TCP/IP', '网络协议'],
    },
    {
      test: csBasicTest._id,
      questionText: '以下哪些是计算机的存储设备？（多选）',
      questionType: 'multiple',
      options: [
        { text: '硬盘', isCorrect: true },
        { text: '鼠标', isCorrect: false },
        { text: '内存', isCorrect: true },
        { text: '显示器', isCorrect: false },
      ],
      correctAnswer: '硬盘,内存',
      difficulty: 'easy',
      points: 5,
      keywords: ['存储设备', '计算机组成'],
    },
    {
      test: csBasicTest._id,
      questionText: '计算机病毒只能通过网络传播。',
      questionType: 'truefalse',
      options: [
        { text: '正确', isCorrect: false },
        { text: '错误', isCorrect: true },
      ],
      correctAnswer: '错误',
      difficulty: 'easy',
      points: 5,
      keywords: ['计算机病毒', '网络安全'],
    },
    // 可以继续添加更多题目...
  ];

  await Question.insertMany(csBasicQuestions);
  console.log(`添加 ${csBasicQuestions.length} 道计算机基础理论测试题目`);

  // 计算机编程基础测试
  const csProgrammingTest = new Test({
    title: '计算机编程基础知识评估',
    description: '测试您对计算机编程基础知识的掌握程度，包括编程概念、数据结构、算法等内容',
    category: category._id,
    difficulty: 'medium',
    duration: 30,
    totalQuestions: 25,
    passingScore: 60,
    isPublished: true,
    createdBy: adminUserId,
  });

  await csProgrammingTest.save();
  console.log(`创建测试: ${csProgrammingTest.title}`);

  // 计算机编程基础测试题目
  const csProgrammingQuestions = [
    {
      test: csProgrammingTest._id,
      questionText: '以下哪个不是编程语言的基本数据类型？',
      questionType: 'single',
      options: [
        { text: '整数', isCorrect: false },
        { text: '字符串', isCorrect: false },
        { text: '数组', isCorrect: true },
        { text: '布尔值', isCorrect: false },
      ],
      correctAnswer: '数组',
      difficulty: 'easy',
      points: 4,
      keywords: ['编程语言', '数据类型'],
    },
    {
      test: csProgrammingTest._id,
      questionText: '下列哪种数据结构是线性的？',
      questionType: 'single',
      options: [
        { text: '树', isCorrect: false },
        { text: '图', isCorrect: false },
        { text: '链表', isCorrect: true },
        { text: '堆', isCorrect: false },
      ],
      correctAnswer: '链表',
      difficulty: 'medium',
      points: 4,
      keywords: ['数据结构', '链表'],
    },
    {
      test: csProgrammingTest._id,
      questionText: '算法的时间复杂度是指什么？',
      questionType: 'single',
      options: [
        { text: '算法执行的实际时间', isCorrect: false },
        { text: '算法执行的语句次数', isCorrect: true },
        { text: '算法占用的存储空间', isCorrect: false },
        { text: '算法的难易程度', isCorrect: false },
      ],
      correctAnswer: '算法执行的语句次数',
      difficulty: 'medium',
      points: 4,
      keywords: ['算法', '时间复杂度'],
    },
    {
      test: csProgrammingTest._id,
      questionText: '以下哪些是面向对象编程的基本特征？（多选）',
      questionType: 'multiple',
      options: [
        { text: '封装', isCorrect: true },
        { text: '继承', isCorrect: true },
        { text: '多态', isCorrect: true },
        { text: '递归', isCorrect: false },
      ],
      correctAnswer: '封装,继承,多态',
      difficulty: 'medium',
      points: 4,
      keywords: ['面向对象', '编程特征'],
    },
    {
      test: csProgrammingTest._id,
      questionText: '递归算法一定比迭代算法效率高。',
      questionType: 'truefalse',
      options: [
        { text: '正确', isCorrect: false },
        { text: '错误', isCorrect: true },
      ],
      correctAnswer: '错误',
      difficulty: 'medium',
      points: 4,
      keywords: ['递归', '算法效率'],
    },
    // 可以继续添加更多题目...
  ];

  await Question.insertMany(csProgrammingQuestions);
  console.log(`添加 ${csProgrammingQuestions.length} 道计算机编程基础测试题目`);
};

// 添加编程专项测试
const addProgrammingTests = async (category, adminUserId) => {
  // Python编程测试
  const pythonTest = new Test({
    title: 'Python编程语言评估',
    description: '测试您对Python编程语言的掌握程度，包括语法、数据结构、标准库等内容',
    category: category._id,
    difficulty: 'medium',
    duration: 35,
    totalQuestions: 30,
    passingScore: 60,
    isPublished: true,
    createdBy: adminUserId,
  });

  await pythonTest.save();
  console.log(`创建测试: ${pythonTest.title}`);

  // Python编程测试题目
  const pythonQuestions = [
    {
      test: pythonTest._id,
      questionText: '在Python中，以下哪个关键字用于定义函数？',
      questionType: 'single',
      options: [
        { text: 'def', isCorrect: true },
        { text: 'function', isCorrect: false },
        { text: 'func', isCorrect: false },
        { text: 'define', isCorrect: false },
      ],
      correctAnswer: 'def',
      difficulty: 'easy',
      points: 3.3,
      keywords: ['Python', '函数定义'],
    },
    {
      test: pythonTest._id,
      questionText: 'Python中，以下哪个数据类型是不可变的？',
      questionType: 'single',
      options: [
        { text: '列表(list)', isCorrect: false },
        { text: '字典(dict)', isCorrect: false },
        { text: '元组(tuple)', isCorrect: true },
        { text: '集合(set)', isCorrect: false },
      ],
      correctAnswer: '元组(tuple)',
      difficulty: 'medium',
      points: 3.3,
      keywords: ['Python', '数据类型', '不可变'],
    },
    {
      test: pythonTest._id,
      questionText: 'Python中，使用哪个符号表示单行注释？',
      questionType: 'single',
      options: [
        { text: '/* */', isCorrect: false },
        { text: '#', isCorrect: true },
        { text: '//', isCorrect: false },
        { text: '<!-- -->', isCorrect: false },
      ],
      correctAnswer: '#',
      difficulty: 'easy',
      points: 3.3,
      keywords: ['Python', '注释'],
    },
    // 可以继续添加更多题目...
  ];

  await Question.insertMany(pythonQuestions);
  console.log(`添加 ${pythonQuestions.length} 道Python编程语言测试题目`);
};

// 添加Web开发测试
const addWebDevelopmentTests = async (category, adminUserId) => {
  // Web开发基础知识测试
  const webDevTest = new Test({
    title: 'Web开发基础知识评估',
    description: '测试您对Web开发基础知识的掌握程度，包括HTML、CSS、JavaScript等内容',
    category: category._id,
    difficulty: 'medium',
    duration: 40,
    totalQuestions: 35,
    passingScore: 60,
    isPublished: true,
    createdBy: adminUserId,
  });

  await webDevTest.save();
  console.log(`创建测试: ${webDevTest.title}`);

  // Web开发基础知识测试题目
  const webDevQuestions = [
    {
      test: webDevTest._id,
      questionText: 'HTML中，哪个标签用于定义超链接？',
      questionType: 'single',
      options: [
        { text: '<link>', isCorrect: false },
        { text: '<a>', isCorrect: true },
        { text: '<href>', isCorrect: false },
        { text: '<url>', isCorrect: false },
      ],
      correctAnswer: '<a>',
      difficulty: 'easy',
      points: 2.8,
      keywords: ['HTML', '超链接'],
    },
    {
      test: webDevTest._id,
      questionText: 'CSS中，用于设置文本颜色的属性是什么？',
      questionType: 'single',
      options: [
        { text: 'text-color', isCorrect: false },
        { text: 'font-color', isCorrect: false },
        { text: 'color', isCorrect: true },
        { text: 'text-style', isCorrect: false },
      ],
      correctAnswer: 'color',
      difficulty: 'easy',
      points: 2.8,
      keywords: ['CSS', '文本颜色'],
    },
    {
      test: webDevTest._id,
      questionText: 'JavaScript中，用于声明变量的关键字有哪些？（多选）',
      questionType: 'multiple',
      options: [
        { text: 'var', isCorrect: true },
        { text: 'let', isCorrect: true },
        { text: 'const', isCorrect: true },
        { text: 'variable', isCorrect: false },
      ],
      correctAnswer: 'var,let,const',
      difficulty: 'medium',
      points: 2.8,
      keywords: ['JavaScript', '变量声明'],
    },
    // 可以继续添加更多题目...
  ];

  await Question.insertMany(webDevQuestions);
  console.log(`添加 ${webDevQuestions.length} 道Web开发基础知识测试题目`);
};

// 执行脚本
addProfessionalAssessmentTests();
