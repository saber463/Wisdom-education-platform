// 测试相关工具函数

/**
 * 计算测试得分
 * @param {Object} userAnswers - 用户答案对象，键为题目ID，值为用户选择的答案
 * @param {Array} questions - 题目数组，包含正确答案
 * @returns {Object} - 得分信息，包含总得分、正确题数、错误题数和详细答案
 */
export const calculateScore = (userAnswers, questions) => {
  if (!userAnswers || !questions) {
    return {
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      answerDetails: [],
    };
  }

  const answerDetails = [];
  let correctCount = 0;
  let totalScore = 0;
  const wrongAnswers = [];

  questions.forEach(question => {
    const questionId = question._id.toString();
    const userAnswer = userAnswers[questionId];
    const correctAnswer = question.correctAnswer;
    const isCorrect = userAnswer === correctAnswer;
    const points = question.points || 10;
    const earnedPoints = isCorrect ? points : 0;

    // 处理选项显示
    const options = question.options.map(option => ({
      text: option.text,
      isCorrect: option.value === correctAnswer,
    }));

    answerDetails.push({
      questionId,
      question: question.questionText, // 使用questionText而不是content
      selected: userAnswer,
      correct: correctAnswer,
      isCorrect,
      score: earnedPoints,
      totalPoints: points,
      options,
      explanation: question.explanation || '',
      knowledgePoints: question.knowledgePoint || question.keywords || [],
    });

    if (isCorrect) {
      correctCount++;
      totalScore += earnedPoints;
    } else {
      wrongAnswers.push({
        questionId,
        userAnswer,
        correctAnswer,
        knowledgePoints: question.knowledgePoint || question.keywords || [],
      });
    }
  });

  // 计算得分百分比
  const maxPossibleScore = questions.reduce((sum, q) => sum + (q.points || 10), 0);
  const score = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    score,
    correctAnswers: correctCount,
    totalAnswers: questions.length,
    totalScore,
    maxPossibleScore,
    wrongAnswers,
    answerDetails,
  };
};

/**
 * 计算知识点掌握程度
 * @param {number} errorCount - 该知识点的错误次数
 * @param {number} totalErrors - 总错误次数
 * @returns {string} - 掌握程度（需要提高、及格、中等、良好、优秀）
 */
export const calculateMasteryLevel = (errorCount, totalErrors) => {
  if (totalErrors === 0) return '优秀';

  const errorRate = errorCount / totalErrors;
  if (errorRate < 0.2) return '优秀';
  if (errorRate < 0.4) return '良好';
  if (errorRate < 0.6) return '中等';
  if (errorRate < 0.8) return '及格';
  return '需要提高';
};

/**
 * 计算知识点掌握度百分比
 * @param {Object} knowledgePointStats - 知识点统计信息
 * @returns {Object} - 知识点掌握度百分比
 */
export const calculateKnowledgePointMastery = knowledgePointStats => {
  const masteryMap = {};

  for (const [kp, stats] of Object.entries(knowledgePointStats)) {
    const { totalQuestions, correctQuestions } = stats;
    if (totalQuestions > 0) {
      masteryMap[kp] = Math.round((correctQuestions / totalQuestions) * 100);
    } else {
      masteryMap[kp] = 100;
    }
  }

  return masteryMap;
};
