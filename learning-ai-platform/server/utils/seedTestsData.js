const dotenv = require('dotenv');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Category = require('../models/Category');
const connectDB = require('../config/db');

// 加载环境变量
dotenv.config({
  path: '../.env',
});

// 连接数据库
connectDB();

/**
 * 测试和题目种子数据
 */
const seedData = async () => {
  try {
    // 检查是否已存在种子数据
    const existingTestsCount = await Test.countDocuments();
    if (existingTestsCount > 0) {
      process.exit();
    }

    // 创建计算机编程相关分类
    const categories = await Category.find({ name: { $in: ['前端开发', '后端开发', '人工智能'] } });
    let categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // 如果分类不存在，创建默认分类
    if (!categoryMap['前端开发']) {
      const frontendCategory = new Category({ name: '前端开发', description: '前端开发相关测试' });
      await frontendCategory.save();
      categoryMap['前端开发'] = frontendCategory._id;
    }

    if (!categoryMap['后端开发']) {
      const backendCategory = new Category({ name: '后端开发', description: '后端开发相关测试' });
      await backendCategory.save();
      categoryMap['后端开发'] = backendCategory._id;
    }

    // 创建测试数据
    const tests = [
      {
        title: 'JavaScript基础测试',
        description: 'JavaScript编程语言基础概念测试，包括变量、函数、数据类型等内容',
        category: categoryMap['前端开发'],
        difficulty: 'easy',
        duration: 30,
        totalQuestions: 10,
        passingScore: 60,
        isPublished: true,
        createdBy: '60d5ec49a23e4d0015d1f7f0', // 默认管理员ID
      },
      {
        title: 'Python基础测试',
        description: 'Python编程语言基础概念测试，包括语法、数据结构、函数等内容',
        category: categoryMap['后端开发'],
        difficulty: 'easy',
        duration: 30,
        totalQuestions: 10,
        passingScore: 60,
        isPublished: true,
        createdBy: '60d5ec49a23e4d0015d1f7f0', // 默认管理员ID
      },
    ];

    // 插入测试数据
    const createdTests = await Test.insertMany(tests);
    console.log('✅ 测试数据插入成功');

    // 创建题目数据
    const questions = [
      // JavaScript测试题目
      {
        test: createdTests[0]._id,
        questionText: 'JavaScript中，以下哪个不是基本数据类型？',
        questionType: 'single',
        options: [
          { text: 'String', isCorrect: false },
          { text: 'Number', isCorrect: false },
          { text: 'Object', isCorrect: true },
          { text: 'Boolean', isCorrect: false },
        ],
        correctAnswer: 'c',
        difficulty: 'easy',
        points: 10,
        explanation:
          'JavaScript的基本数据类型包括String、Number、Boolean、Null、Undefined、Symbol和BigInt。Object是引用数据类型。',
      },
      {
        test: createdTests[0]._id,
        questionText: '以下哪个方法可以用于创建数组？',
        questionType: 'single',
        options: [
          { text: 'new Array()', isCorrect: false },
          { text: '[1, 2, 3]', isCorrect: false },
          { text: 'Array.from([1, 2, 3])', isCorrect: false },
          { text: '以上都是', isCorrect: true },
        ],
        correctAnswer: 'd',
        difficulty: 'easy',
        points: 10,
        explanation:
          'JavaScript提供了多种创建数组的方法，包括new Array()构造函数、数组字面量[]和Array.from()方法。',
      },
      {
        test: createdTests[0]._id,
        questionText: '关于JavaScript中的函数，以下说法正确的是？',
        questionType: 'single',
        options: [
          { text: '函数不能作为参数传递', isCorrect: false },
          { text: '函数可以作为返回值', isCorrect: true },
          { text: '函数不能有默认参数', isCorrect: false },
          { text: '函数只能定义一次', isCorrect: false },
        ],
        correctAnswer: 'b',
        difficulty: 'medium',
        points: 10,
        explanation:
          'JavaScript中的函数是一等公民，可以作为参数传递、作为返回值、有默认参数，并且可以多次定义（后面的定义会覆盖前面的）。',
      },
      {
        test: createdTests[0]._id,
        questionText: '以下哪个关键字用于声明块级作用域变量？',
        questionType: 'single',
        options: [
          { text: 'var', isCorrect: false },
          { text: 'let', isCorrect: true },
          { text: 'const', isCorrect: false },
          { text: 'function', isCorrect: false },
        ],
        correctAnswer: 'b',
        difficulty: 'easy',
        points: 10,
        explanation:
          'let关键字用于声明块级作用域变量，var声明的是函数作用域变量，const声明的是只读常量。',
      },
      {
        test: createdTests[0]._id,
        questionText: 'JavaScript中，以下哪个方法用于添加事件监听器？',
        questionType: 'single',
        options: [
          { text: 'addEventListener()', isCorrect: true },
          { text: 'attachEvent()', isCorrect: false },
          { text: 'onclick()', isCorrect: false },
          { text: 'bindEvent()', isCorrect: false },
        ],
        correctAnswer: 'a',
        difficulty: 'medium',
        points: 10,
        explanation:
          'addEventListener()是标准的DOM事件监听方法，attachEvent()是IE旧版本的方法，onclick是事件属性，bindEvent()不是标准方法。',
      },
      // Python测试题目
      {
        test: createdTests[1]._id,
        questionText: 'Python中，以下哪个不是基本数据类型？',
        questionType: 'single',
        options: [
          { text: 'int', isCorrect: false },
          { text: 'float', isCorrect: false },
          { text: 'list', isCorrect: true },
          { text: 'bool', isCorrect: false },
        ],
        correctAnswer: 'c',
        difficulty: 'easy',
        points: 10,
        explanation: 'Python的基本数据类型包括int、float、bool、str等，list是复合数据类型。',
      },
      {
        test: createdTests[1]._id,
        questionText: 'Python中，用于定义函数的关键字是？',
        questionType: 'single',
        options: [
          { text: 'def', isCorrect: true },
          { text: 'function', isCorrect: false },
          { text: 'func', isCorrect: false },
          { text: 'define', isCorrect: false },
        ],
        correctAnswer: 'a',
        difficulty: 'easy',
        points: 10,
        explanation: 'Python中使用def关键字定义函数，例如：def my_function(): pass',
      },
      {
        test: createdTests[1]._id,
        questionText: 'Python中，以下哪个方法用于列表排序？',
        questionType: 'single',
        options: [
          { text: 'sort()', isCorrect: true },
          { text: 'sorted()', isCorrect: false },
          { text: 'order()', isCorrect: false },
          { text: 'arrange()', isCorrect: false },
        ],
        correctAnswer: 'a',
        difficulty: 'easy',
        points: 10,
        explanation:
          'sort()是列表对象的方法，用于原地排序；sorted()是内置函数，返回新的排序后的列表。',
      },
      {
        test: createdTests[1]._id,
        questionText: 'Python中，以下哪个语句用于异常处理？',
        questionType: 'single',
        options: [
          { text: 'try...catch', isCorrect: false },
          { text: 'try...except', isCorrect: true },
          { text: 'try...error', isCorrect: false },
          { text: 'try...fail', isCorrect: false },
        ],
        correctAnswer: 'b',
        difficulty: 'medium',
        points: 10,
        explanation:
          'Python中使用try...except语句进行异常处理，try...catch是JavaScript等语言的语法。',
      },
      {
        test: createdTests[1]._id,
        questionText: 'Python中，以下哪个模块用于数学运算？',
        questionType: 'single',
        options: [
          { text: 'math', isCorrect: true },
          { text: 'number', isCorrect: false },
          { text: 'calc', isCorrect: false },
          { text: 'compute', isCorrect: false },
        ],
        correctAnswer: 'a',
        difficulty: 'easy',
        points: 10,
        explanation: 'math模块提供了各种数学运算函数，如sin、cos、sqrt等。',
      },
    ];

    // 插入题目数据
    await Question.insertMany(questions);
    console.log('✅ 题目数据插入成功');

    process.exit();
  } catch (error) {
    console.error('❌ 种子数据插入失败：', error.message);
    console.error('详细错误信息：', error);
    process.exit(1);
  }
};

// 执行种子数据插入
seedData();
