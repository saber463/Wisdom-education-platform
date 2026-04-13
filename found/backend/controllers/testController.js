// 导入自定义错误类
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} from '../utils/errorResponse.js';

import Test from '../models/Test.js';
import Question from '../models/Question.js';
import TestResult from '../models/TestResult.js';
import WrongQuestion from '../models/WrongQuestion.js';
import User from '../models/User.js';
import { calculateScore } from '../utils/test.js';
import mongoose from 'mongoose';

// 获取所有测试
export const getAllTests = async (req, res, next) => {
  try {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const tests = await Test.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name')
      .lean();

    const total = await Test.countDocuments(query);

    // 为每个测试添加用户的最后一次得分（如果有）
    const testsWithScores = await Promise.all(
      tests.map(async test => {
        if (req.user) {
          const lastResult = await TestResult.findOne({ user: req.user._id, test: test._id })
            .sort({ completedAt: -1 })
            .lean();

          if (lastResult) {
            test.lastScore = lastResult.score;
          }
        }
        return test;
      })
    );

    res.status(200).json({
      success: true,
      data: { tests: testsWithScores, total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    console.error('获取测试列表失败:', error);
    return next(new InternalServerError('获取测试列表失败'));
  }
};

// 根据ID获取测试
export const getTestById = async (req, res, next) => {
  try {
    const testId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return next(new BadRequestError('无效的测试ID'));
    }

    const test = await Test.findById(testId).populate('category', 'name');
    if (!test) {
      return next(new NotFoundError('测试不存在'));
    }

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    console.error('获取测试详情失败:', error);
    return next(new InternalServerError('获取测试详情失败'));
  }
};

// 获取测试题目
export const getTestQuestions = async (req, res, next) => {
  try {
    const testId = req.params.id;

    // 验证测试ID是否有效
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return next(new BadRequestError('无效的测试ID'));
    }

    const test = await Test.findById(testId).lean();

    if (!test) {
      return next(new NotFoundError('测试不存在'));
    }

    const questions = await Question.find({ test: testId }).select('-correctAnswer').lean();

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error('获取测试题目失败:', error);
    return next(new InternalServerError('获取测试题目失败'));
  }
};

// 创建测试
export const createTest = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, duration, isPublished } = req.body;

    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const test = new Test({
      title,
      description,
      category,
      difficulty,
      duration,
      isPublished,
      createdBy: req.user._id,
    });

    await test.save();

    res.status(201).json({ success: true, message: '测试创建成功', data: test });
  } catch (error) {
    console.error('创建测试失败:', error);
    return next(new InternalServerError('创建测试失败'));
  }
};

// 更新测试
export const updateTest = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, duration, isPublished } = req.body;
    const testId = req.params.id;

    // 验证测试ID是否有效
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return next(new BadRequestError('无效的测试ID'));
    }

    const test = await Test.findByIdAndUpdate(
      testId,
      { title, description, category, difficulty, duration, isPublished },
      { new: true, runValidators: true }
    );

    if (!test) {
      return next(new NotFoundError('测试不存在'));
    }

    res.status(200).json({ success: true, message: '测试更新成功', data: test });
  } catch (error) {
    console.error('更新测试失败:', error);
    return next(new InternalServerError('更新测试失败'));
  }
};

// 删除测试
export const deleteTest = async (req, res, next) => {
  try {
    const testId = req.params.id;

    // 验证测试ID是否有效
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return next(new BadRequestError('无效的测试ID'));
    }

    // 先找到测试，确保它存在
    const test = await Test.findById(testId);
    if (!test) {
      return next(new NotFoundError('测试不存在'));
    }

    // 然后删除测试
    await Test.findByIdAndDelete(testId);

    // 同时删除关联的题目、测试结果和错题
    await Question.deleteMany({ test: testId });
    await TestResult.deleteMany({ test: testId });
    await WrongQuestion.deleteMany({ test: testId });

    res.status(200).json({ success: true, message: '测试删除成功' });
  } catch (error) {
    console.error('删除测试失败:', error);
    return next(new InternalServerError('删除测试失败'));
  }
};

// 提交测试
export const submitTest = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const testId = req.params.id;

    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    // 验证测试ID是否有效
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return next(new BadRequestError('无效的测试ID'));
    }

    // 检查参数是否存在
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return next(new BadRequestError('请提交答案'));
    }

    // 获取测试信息
    console.log('获取测试信息:', testId);
    const test = await Test.findById(testId).lean();
    if (!test) {
      return next(new NotFoundError('测试不存在'));
    }

    // 获取所有题目信息（包含正确答案）
    console.log('获取所有题目信息:', testId);
    const questions = await Question.find({ test: testId }).lean();
    if (!questions || questions.length === 0) {
      return next(new NotFoundError('测试题目不存在'));
    }

    // 将前端发送的answers数组转换为userAnswers对象
    const userAnswers = {};
    answers.forEach(answer => {
      if (answer.questionId && answer.selectedOption) {
        userAnswers[answer.questionId.toString()] = answer.selectedOption;
      }
    });

    // 计算得分
    console.log('计算得分:', JSON.stringify(userAnswers), JSON.stringify(questions));
    const { score, correctAnswers, wrongAnswers, answerDetails } = calculateScore(
      userAnswers,
      questions
    );
    console.log('得分结果:', { score, correctAnswers, wrongAnswers, answerDetails });

    // 从错误答案中提取知识点
    const wrongAnswerKnowledgePoints = wrongAnswers
      ? wrongAnswers
          .map(wrongAnswer => {
            const question = questions.find(q => q._id.toString() === wrongAnswer.questionId);
            return question?.keywords || [];
          })
          .flat()
          .filter((value, index, self) => self.indexOf(value) === index)
      : [];

    console.log('生成学习推荐:', req.user._id, test.category, score, wrongAnswerKnowledgePoints);
    // 调用生成个性化推荐的函数
    const personalizedRecommendations = await generatePersonalizedRecommendations(
      req.user._id,
      test.category,
      score,
      wrongAnswerKnowledgePoints
    );
    console.log('学习推荐结果:', personalizedRecommendations);

    // 记录测试结果
    console.log('记录测试结果:', testId, req.user._id);
    const testResult = new TestResult({
      user: req.user._id,
      test: testId,
      answers: answerDetails, // 使用标准化的答案格式
      score,
      correctAnswers,
      totalQuestions: questions.length,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 10), 0), // 计算总分数
      isPassed: score >= test.passingScore, // 判断是否通过
      startTime: new Date(Date.now() - test.duration * 60 * 1000), // 假设测试时长等于设定的duration
      endTime: new Date(),
      duration: test.duration,
      completedAt: new Date(),
      weakKnowledgePoints: wrongAnswerKnowledgePoints, // 添加薄弱知识点
      recommendations: personalizedRecommendations, // 添加学习推荐
    });

    console.log('保存测试结果:', testResult);
    await testResult.save();

    // 记录错题
    if (wrongAnswers && wrongAnswers.length > 0) {
      const wrongQuestionEntries = wrongAnswers.map(wrongAnswer => {
        return {
          user: req.user._id,
          test: testId,
          testResult: testResult._id,
          question: wrongAnswer.questionId,
          selectedAnswer: wrongAnswer.userAnswer, // 保存用户选择的答案
        };
      });

      await WrongQuestion.insertMany(wrongQuestionEntries);
    }

    // 更新用户测试完成次数和总得分
    console.log('更新用户信息:', req.user._id);
    const user = await User.findById(req.user._id);
    if (user) {
      user.totalTestsCompleted += 1;
      user.totalTestScore += score;
      await user.save();
    }

    // 返回测试结果
    res.status(200).json({
      success: true,
      message: '测试提交成功',
      data: {
        testResult,
        answerDetails,
        recommendations: personalizedRecommendations,
      },
    });
  } catch (error) {
    console.error('提交测试失败:', error);
    console.error('错误堆栈:', error.stack);
    return next(new InternalServerError('提交测试失败'));
  }
};

// 获取用户知识点分析
export const getUserKnowledgePointsAnalysis = async (req, res, next) => {
  try {
    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    const user = req.user._id;

    // 获取用户所有测试结果
    const testResults = await TestResult.find({ user }).lean();

    if (!testResults || testResults.length === 0) {
      return res.status(200).json({
        success: true,
        data: { analysis: [], totalTests: 0, averageScore: 0 },
      });
    }

    // 获取所有错题
    const wrongQuestions = await WrongQuestion.find({ user })
      .populate('question', 'knowledgePoint')
      .lean();

    // 按知识点统计错误次数
    const knowledgePointsMap = {};

    wrongQuestions.forEach(wrongQuestion => {
      if (wrongQuestion.question.knowledgePoint) {
        const kp = wrongQuestion.question.knowledgePoint;
        knowledgePointsMap[kp] = (knowledgePointsMap[kp] || 0) + 1;
      }
    });

    // 计算平均分
    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalScore / testResults.length;

    // 生成知识点分析
    const analysis = Object.entries(knowledgePointsMap)
      .map(([knowledgePoint, errorCount]) => {
        return {
          knowledgePoint,
          errorCount,
          masteryLevel: calculateMasteryLevel(errorCount, wrongQuestions.length),
        };
      })
      .sort((a, b) => b.errorCount - a.errorCount);

    res.status(200).json({
      success: true,
      data: {
        analysis,
        totalTests: testResults.length,
        averageScore: Math.round(averageScore * 100) / 100,
      },
    });
  } catch (error) {
    console.error('获取知识点分析失败:', error);
    return next(new InternalServerError('获取知识点分析失败'));
  }
};

// 获取测试结果详情
export const getTestResultById = async (req, res, next) => {
  try {
    const resultId = req.params.resultId;

    // 验证用户是否存在
    if (!req.user || !req.user._id) {
      return next(new UnauthorizedError('用户未登录'));
    }

    // 验证结果ID是否有效
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return next(new BadRequestError('无效的测试结果ID'));
    }

    const testResult = await TestResult.findById(resultId)
      .populate('test', 'title duration difficulty category')
      .lean();

    if (!testResult) {
      return next(new NotFoundError('测试结果不存在'));
    }

    // 确保只有测试结果的所有者可以查看
    if (testResult.user.toString() !== req.user._id.toString()) {
      return next(new UnauthorizedError('无权访问该测试结果'));
    }

    // 获取题目详情
    const questions = await Question.find({ test: testResult.test._id }).lean();

    if (!questions || questions.length === 0) {
      return next(new NotFoundError('测试题目不存在'));
    }

    // 将testResult.answers转换为userAnswers对象
    const userAnswers = {};
    testResult.answers.forEach(answer => {
      userAnswers[answer.questionId.toString()] = answer.selectedAnswer;
    });

    // 计算得分
    const {
      score: _score,
      correctAnswers: _correctAnswers,
      wrongAnswers: _wrongAnswers,
      answerDetails,
    } = calculateScore(userAnswers, questions);
    // 计算知识点掌握情况
    const knowledgePointStats = {};
    questions.forEach(question => {
      const kps = question.knowledgePoint || question.keywords || [];
      const questionId = question._id.toString();
      const isCorrect = userAnswers[questionId] === question.correctAnswer;

      kps.forEach(kp => {
        if (!knowledgePointStats[kp]) {
          knowledgePointStats[kp] = { totalQuestions: 0, correctQuestions: 0 };
        }
        knowledgePointStats[kp].totalQuestions++;
        if (isCorrect) {
          knowledgePointStats[kp].correctQuestions++;
        }
      });
    });

    // 转换为知识点掌握情况数组
    const knowledgePoints = Object.keys(knowledgePointStats).map(kp => {
      const stats = knowledgePointStats[kp];
      return {
        id: kp,
        name: kp,
        mastery: Math.round((stats.correctQuestions / stats.totalQuestions) * 100),
      };
    });

    // 返回测试结果详情
    res.status(200).json({
      success: true,
      data: {
        testResult: {
          ...testResult,
          knowledgePoints,
          weakKnowledgePoints: Object.keys(knowledgePointStats)
            .filter(kp => {
              const stats = knowledgePointStats[kp];
              return stats.correctQuestions / stats.totalQuestions < 0.6;
            })
            .sort((a, b) => {
              const masteryA =
                knowledgePointStats[a].correctQuestions / knowledgePointStats[a].totalQuestions;
              const masteryB =
                knowledgePointStats[b].correctQuestions / knowledgePointStats[b].totalQuestions;
              return masteryA - masteryB;
            }),
        },
        answerDetails,
        test: testResult.test,
      },
    });
  } catch (error) {
    console.error('获取测试结果详情失败:', error);
    return next(new InternalServerError('获取测试结果详情失败'));
  }
};

// 计算知识点掌握程度
function calculateMasteryLevel(errorCount, totalErrors) {
  const errorRate = errorCount / totalErrors;
  if (errorRate < 0.2) return '优秀';
  if (errorRate < 0.4) return '良好';
  if (errorRate < 0.6) return '中等';
  if (errorRate < 0.8) return '及格';
  return '需要提高';
}

// 生成个性化学习推荐
async function generatePersonalizedRecommendations(
  userId,
  category,
  testScore,
  weakKnowledgePoints
) {
  try {
    // 确定学习难度
    let difficulty = 'beginner';
    if (testScore >= 80) difficulty = 'advanced';
    else if (testScore >= 60) difficulty = 'intermediate';

    // 根据测试分类和难度推荐学习资源
    const recommendedResources = await getRecommendedResources(
      category,
      difficulty,
      weakKnowledgePoints
    );

    // 生成针对性学习路径
    const learningPath = generateLearningPath(category, weakKnowledgePoints);

    // 根据用户的掌握度生成学习建议
    const learningSuggestions = generateLearningSuggestions(testScore, weakKnowledgePoints);

    return {
      resources: recommendedResources,
      learningPath: learningPath,
      suggestions: learningSuggestions,
      difficultyLevel: difficulty,
    };
  } catch (error) {
    console.error('生成个性化学习推荐失败:', error);
    return {
      resources: [],
      learningPath: [],
      suggestions: [],
      difficultyLevel: 'beginner',
    };
  }
}

// 获取推荐学习资源
async function getRecommendedResources(category, difficulty, _weakKnowledgePoints = []) {
  // 基础资源链接（可以根据实际情况扩展）
  const baseResources = {
    计算机基础: {
      beginner: [
        {
          name: '计算机基础知识教程',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1zt411o7i7/',
        },
        {
          name: '计算机基础入门',
          type: 'article',
          url: 'https://www.runoob.com/w3cnote/basic-computer-knowledge.html',
        },
        {
          name: '计算机基础练习',
          type: 'exercise',
          url: 'https://www.exam8.com/computer/grade2/',
        },
      ],
      intermediate: [
        {
          name: '计算机系统结构',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1f7411y7aV/',
        },
        {
          name: '操作系统原理',
          type: 'article',
          url: 'https://blog.csdn.net/u014727709/article/details/107257873',
        },
        {
          name: '计算机网络习题',
          type: 'exercise',
          url: 'https://www.nowcoder.com/exam/oj?tab=%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C%E7%AF%87',
        },
      ],
      advanced: [
        {
          name: '计算机组成原理进阶',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1X7411G7rF/',
        },
        {
          name: '算法设计与分析',
          type: 'article',
          url: 'https://www.cnblogs.com/vamei/archive/2013/03/22/2973866.html',
        },
        {
          name: '高级编程练习',
          type: 'exercise',
          url: 'https://leetcode-cn.com/problemset/all/',
        },
      ],
    },
    英语: {
      beginner: [
        {
          name: '零基础英语入门',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1X7411G7rF/',
        },
        { name: '英语语法基础', type: 'article', url: 'https://www.hjenglish.com/new/p1283366/' },
        { name: '英语单词练习', type: 'exercise', url: 'https://www.jianshu.com/p/9c8c5a0b7c2a' },
      ],
      intermediate: [
        {
          name: '中级英语听力',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV177411L7Qt/',
        },
        {
          name: '英语写作技巧',
          type: 'article',
          url: 'https://www.cnblogs.com/helloworld-yuhui/p/11257341.html',
        },
        {
          name: '英语阅读训练',
          type: 'exercise',
          url: 'https://www.kekenet.com/menu/202001/605300.shtml',
        },
      ],
      advanced: [
        {
          name: '高级英语听说',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1Q5411b7h7/',
        },
        {
          name: '学术英语写作',
          type: 'article',
          url: 'https://blog.sciencenet.cn/blog-339326-1206151.html',
        },
        { name: '英语专业八级练习', type: 'exercise', url: 'https://www.cet46.org/' },
      ],
    },
    会计: {
      beginner: [
        {
          name: '会计基础入门',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1zt411o7i7/',
        },
        {
          name: '会计科目详解',
          type: 'article',
          url: 'https://www.acc5.com/course/course_10000.html',
        },
        { name: '会计基础练习', type: 'exercise', url: 'https://www.kuaiji.com/kaoshi/chuji/' },
      ],
      intermediate: [
        {
          name: '中级财务会计',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1f7411y7aV/',
        },
        {
          name: '成本会计实务',
          type: 'article',
          url: 'https://www.chinaacc.com/zhongji/lesson/cwkjsx/',
        },
        { name: '会计中级练习', type: 'exercise', url: 'https://www.kuaiji.com/kaoshi/zhongji/' },
      ],
      advanced: [
        {
          name: '高级会计实务',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1X7411G7rF/',
        },
        {
          name: '审计学原理',
          type: 'article',
          url: 'https://www.chinaacc.com/gaoji/lesson/sjsx/',
        },
        { name: '注册会计师练习', type: 'exercise', url: 'https://www.kuaiji.com/kaoshi/zhuce/' },
      ],
    },
    教师: {
      beginner: [
        {
          name: '教育学基础',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV177411L7Qt/',
        },
        { name: '心理学入门', type: 'article', url: 'https://www.jianshu.com/p/6c3c2a6b7b7f' },
        { name: '教师资格证练习', type: 'exercise', url: 'https://www.233.com/ntce/' },
      ],
      intermediate: [
        {
          name: '教育心理学',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1Q5411b7h7/',
        },
        {
          name: '教学设计方法',
          type: 'article',
          url: 'https://www.cnblogs.com/chenshijiao/p/12872835.html',
        },
        { name: '教师招聘考试练习', type: 'exercise', url: 'https://www.zgjsks.com/' },
      ],
      advanced: [
        {
          name: '教育研究方法',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1zt411o7i7/',
        },
        {
          name: '教育领导力',
          type: 'article',
          url: 'https://www.chinaedunet.com/education/202304/t20230421_186540.shtml',
        },
        { name: '特级教师案例分析', type: 'exercise', url: 'https://www.jiaoshi.com.cn/' },
      ],
    },
    设计: {
      beginner: [
        {
          name: '设计基础入门',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1X7411G7rF/',
        },
        {
          name: '色彩理论',
          type: 'article',
          url: 'https://www.uisdc.com/color-theory-application',
        },
        { name: '设计基础练习', type: 'exercise', url: 'https://www.58pic.com/school/' },
      ],
      intermediate: [
        {
          name: 'UI设计进阶',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV177411L7Qt/',
        },
        { name: '交互设计原理', type: 'article', url: 'https://www.jianshu.com/p/9f6b4c2a7e8e' },
        { name: '设计作品点评', type: 'exercise', url: 'https://www.zcool.com.cn/' },
      ],
      advanced: [
        {
          name: '设计思维与方法',
          type: 'video',
          url: 'https://www.bilibili.com/video/BV1Q5411b7h7/',
        },
        { name: '品牌设计策略', type: 'article', url: 'https://www.zhihu.com/question/20414398' },
        { name: '设计竞赛题目', type: 'exercise', url: 'https://www.reddot.org/' },
      ],
    },
  };

  // 根据测试分类和难度获取资源
  let resources = [];
  if (baseResources[category] && baseResources[category][difficulty]) {
    resources = baseResources[category][difficulty];
  } else {
    // 默认使用计算机基础的资源
    resources = baseResources['计算机基础'][difficulty];
  }

  return resources;
}

// 生成学习路径
function generateLearningPath(category, weakPoints, _difficulty) {
  // 根据不同分类和弱点生成学习路径
  const paths = {
    计算机基础: [
      { stage: '基础巩固', topics: ['计算机组成原理', '操作系统', '计算机网络'], duration: '3天' },
      { stage: '进阶学习', topics: ['数据结构', '算法设计', '编程语言'], duration: '5天' },
      { stage: '实践应用', topics: ['项目开发', '调试技巧', '性能优化'], duration: '7天' },
    ],
    英语: [
      { stage: '词汇积累', topics: ['核心词汇', '常用短语', '固定搭配'], duration: '3天' },
      { stage: '听说训练', topics: ['听力理解', '口语表达', '语音语调'], duration: '5天' },
      { stage: '读写提升', topics: ['阅读理解', '写作技巧', '语法应用'], duration: '7天' },
    ],
    会计: [
      { stage: '会计基础', topics: ['会计科目', '借贷记账', '财务报表'], duration: '3天' },
      { stage: '实务操作', topics: ['账务处理', '成本核算', '税务申报'], duration: '5天' },
      { stage: '财务管理', topics: ['预算编制', '财务分析', '投资决策'], duration: '7天' },
    ],
    教师: [
      { stage: '教育理论', topics: ['教育学', '心理学', '教育法规'], duration: '3天' },
      { stage: '教学技能', topics: ['教学设计', '课堂管理', '教学评价'], duration: '5天' },
      { stage: '专业发展', topics: ['教育研究', '课程开发', '教师职业道德'], duration: '7天' },
    ],
    设计: [
      { stage: '设计基础', topics: ['色彩理论', '排版设计', '视觉传达'], duration: '3天' },
      { stage: '软件技能', topics: ['Photoshop', 'Illustrator', 'Figma'], duration: '5天' },
      { stage: '设计思维', topics: ['用户体验', '交互设计', '品牌设计'], duration: '7天' },
    ],
  };

  let path = paths[category] || paths['计算机基础'];

  // 如果有薄弱知识点，调整学习路径的重点
  if (weakPoints && weakPoints.length > 0) {
    path[0].focusPoints = weakPoints;
  }

  return path;
}

// 生成学习建议
function generateLearningSuggestions(testScore, weakKnowledgePoints) {
  const suggestions = [];

  if (testScore >= 80) {
    suggestions.push({
      title: '继续保持优秀表现',
      content: '您在本次测试中表现出色，建议挑战更高级别的学习内容，进一步提升专业能力。',
    });
  } else if (testScore >= 60) {
    suggestions.push({
      title: '巩固已掌握的知识',
      content: '您已经掌握了基本概念，但仍有提升空间。建议加强薄弱知识点的学习。',
    });
  } else {
    suggestions.push({
      title: '从基础开始，逐步提升',
      content: '建议您从基础内容开始学习，建立扎实的知识体系，再逐步挑战更难的内容。',
    });
  }

  if (weakKnowledgePoints && weakKnowledgePoints.length > 0) {
    suggestions.push({
      title: '重点复习薄弱知识点',
      content: `建议您重点复习以下知识点：${weakKnowledgePoints.join('、')}。可以通过相关课程和练习来加强。`,
    });
  }

  suggestions.push({
    title: '定期练习，保持学习状态',
    content: '建议您定期进行测试和练习，巩固所学知识，及时发现并弥补知识漏洞。',
  });

  return suggestions;
}

// 默认导出（兼容性）
export default {
  getAllTests,
  getTestById,
  getTestQuestions,
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getUserKnowledgePointsAnalysis,
  getTestResultById,
};
