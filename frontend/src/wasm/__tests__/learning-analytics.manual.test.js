/**
 * 学情分析计算模块 - 手动测试脚本
 * 用于快速验证学情分析函数的正确性
 */

// 导入函数（模拟导入）
function normalizeAnswer(answer) {
  return answer
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function levenshteinDistance(s1, s2) {
  if (s1.length > s2.length) {
    [s1, s2] = [s2, s1];
  }
  
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  let prevRow = Array.from({ length: len1 + 1 }, (_, i) => i);
  let currRow = new Array(len1 + 1);

  for (let j = 1; j <= len2; j++) {
    currRow[0] = j;
    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,
        currRow[i - 1] + 1,
        prevRow[i - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len1];
}

function calculate_average_score(scores) {
  if (scores.length === 0) {
    return 0.0;
  }

  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / scores.length;
  
  return Math.round(average * 100) / 100;
}

function calculate_pass_rate(scores) {
  if (scores.length === 0) {
    return 0.0;
  }

  const passCount = scores.filter(score => score >= 60.0).length;
  const passRate = (passCount / scores.length) * 100.0;
  
  return Math.round(passRate * 100) / 100;
}

function calculate_excellent_rate(scores) {
  if (scores.length === 0) {
    return 0.0;
  }

  const excellentCount = scores.filter(score => score >= 85.0).length;
  const excellentRate = (excellentCount / scores.length) * 100.0;
  
  return Math.round(excellentRate * 100) / 100;
}

function calculate_progress(previousScores, currentScores) {
  const prevAvg = calculate_average_score(previousScores);
  const currAvg = calculate_average_score(currentScores);
  
  const progress = currAvg - prevAvg;
  
  return Math.round(progress * 100) / 100;
}

function calculate_student_tier(averageScore) {
  if (averageScore < 60.0) {
    return 0;
  } else if (averageScore < 85.0) {
    return 1;
  } else {
    return 2;
  }
}

function calculate_knowledge_mastery(correctCount, totalCount) {
  if (totalCount === 0) {
    return 0.0;
  }

  const mastery = (correctCount / totalCount) * 100.0;
  
  return Math.round(mastery * 100) / 100;
}

function calculate_error_rate(errorCount, totalCount) {
  if (totalCount === 0) {
    return 0.0;
  }

  const errorRate = (errorCount / totalCount) * 100.0;
  
  return Math.round(errorRate * 100) / 100;
}

// 测试函数
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    console.error(`❌ FAILED: ${message} (expected ${expected}, got ${actual})`);
    process.exit(1);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

// 运行测试
console.log('========================================');
console.log('学情分析计算模块 - 手动测试');
console.log('========================================\n');

// 平均分计算测试
console.log('📊 平均分计算测试:');
assert(calculate_average_score([]) === 0.0, '空数组返回0');
assert(calculate_average_score([85.0]) === 85.0, '单个分数返回该分数');
assert(calculate_average_score([80.0, 90.0, 70.0, 85.0]) === 81.25, '多个分数计算正确');
console.log('');

// 及格率计算测试
console.log('✅ 及格率计算测试:');
assert(calculate_pass_rate([]) === 0.0, '空数组返回0');
assert(calculate_pass_rate([60.0, 70.0, 80.0, 90.0]) === 100.0, '全部及格返回100');
assert(calculate_pass_rate([30.0, 40.0, 50.0, 59.0]) === 0.0, '全部不及格返回0');
assert(calculate_pass_rate([50.0, 60.0, 70.0, 80.0]) === 75.0, '部分及格计算正确');
console.log('');

// 优秀率计算测试
console.log('⭐ 优秀率计算测试:');
assert(calculate_excellent_rate([]) === 0.0, '空数组返回0');
assert(calculate_excellent_rate([85.0, 90.0, 95.0, 100.0]) === 100.0, '全部优秀返回100');
assert(calculate_excellent_rate([50.0, 60.0, 70.0, 84.0]) === 0.0, '全部不优秀返回0');
assert(calculate_excellent_rate([70.0, 80.0, 85.0, 90.0]) === 50.0, '部分优秀计算正确');
console.log('');

// 进步幅度计算测试
console.log('📈 进步幅度计算测试:');
assert(calculate_progress([], []) === 0.0, '空数组返回0');
assert(calculate_progress([70.0, 75.0, 80.0], [80.0, 85.0, 90.0]) === 10.0, '进步计算正确');
assert(calculate_progress([80.0, 85.0, 90.0], [70.0, 75.0, 80.0]) === -10.0, '下降计算正确');
assert(calculate_progress([80.0, 85.0, 90.0], [80.0, 85.0, 90.0]) === 0.0, '无变化返回0');
console.log('');

// 学生分层测试
console.log('🎯 学生分层测试:');
assert(calculate_student_tier(50.0) === 0, '50分为基础层');
assert(calculate_student_tier(75.0) === 1, '75分为中等层');
assert(calculate_student_tier(90.0) === 2, '90分为提高层');
assert(calculate_student_tier(60.0) === 1, '60分为中等层');
assert(calculate_student_tier(85.0) === 2, '85分为提高层');
console.log('');

// 知识点掌握度测试
console.log('📚 知识点掌握度测试:');
assert(calculate_knowledge_mastery(0, 0) === 0.0, '总数为0返回0');
assert(calculate_knowledge_mastery(10, 10) === 100.0, '完全掌握返回100');
assert(calculate_knowledge_mastery(0, 10) === 0.0, '完全未掌握返回0');
assert(calculate_knowledge_mastery(7, 10) === 70.0, '部分掌握计算正确');
assertClose(calculate_knowledge_mastery(1, 3), 33.33, 0.01, '1/3掌握度约为33.33');
console.log('');

// 错误率计算测试
console.log('❌ 错误率计算测试:');
assert(calculate_error_rate(0, 0) === 0.0, '总数为0返回0');
assert(calculate_error_rate(0, 10) === 0.0, '全部正确返回0');
assert(calculate_error_rate(10, 10) === 100.0, '全部错误返回100');
assert(calculate_error_rate(3, 10) === 30.0, '部分错误计算正确');
assertClose(calculate_error_rate(2, 3), 66.67, 0.01, '2/3错误率约为66.67');
console.log('');

// 集成测试
console.log('🔗 集成测试:');
const classScores = [65, 72, 58, 85, 90, 78, 88, 92, 55, 80];
const avgScore = calculate_average_score(classScores);
const passRate = calculate_pass_rate(classScores);
const excellentRate = calculate_excellent_rate(classScores);
assertClose(avgScore, 76.3, 0.1, '班级平均分计算正确');
assert(passRate === 80.0, '班级及格率计算正确');
assert(excellentRate === 40.0, '班级优秀率计算正确');
console.log('');

// 学生进度追踪测试
console.log('📊 学生进度追踪测试:');
const month1 = [60, 65, 70, 75];
const month2 = [70, 75, 80, 85];
const progress = calculate_progress(month1, month2);
assert(progress === 10.0, '学生进步10分');
const tier1 = calculate_student_tier(calculate_average_score(month1));
const tier2 = calculate_student_tier(calculate_average_score(month2));
assert(tier1 === 1, '第一个月为中等层');
assert(tier2 === 1, '第二个月仍为中等层');
console.log('');

// 知识点掌握度和错误率关系测试
console.log('📈 知识点掌握度和错误率关系测试:');
const correctCount = 8;
const totalCount = 10;
const mastery = calculate_knowledge_mastery(correctCount, totalCount);
const errorRate = calculate_error_rate(totalCount - correctCount, totalCount);
assert(mastery === 80.0, '掌握度为80%');
assert(errorRate === 20.0, '错误率为20%');
assert(mastery + errorRate === 100.0, '掌握度 + 错误率 = 100%');
console.log('');

console.log('========================================');
console.log('✅ 所有测试通过！');
console.log('========================================');
