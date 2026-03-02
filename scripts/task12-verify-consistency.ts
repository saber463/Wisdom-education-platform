/**
 * Task 12: 数据一致性验证脚本
 * 功能: 验证数据一致性，检查孤立记录和错误率计算
 */

import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'edu_education_platform',
  waitForConnections: true,
  connectionLimit: 10
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 日志函数
function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

function logSection(message: string) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(message, colors.bright);
  log('='.repeat(60), colors.bright);
}

// 验证结果接口
interface ValidationResult {
  category: string;
  checkName: string;
  passed: boolean;
  count?: number;
  expected?: number;
  message: string;
}

// 所有验证结果
const results: ValidationResult[] = [];

/**
 * 检查孤立数据
 */
async function checkOrphanedData(connection: mysql.Connection): Promise<void> {
  logSection('检查孤立数据');

  // 1. 检查无效的提交记录（引用不存在的作业）
  const [orphanedSubmissions1] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    WHERE a.id IS NULL
  `);
  const orphanedSubmissionsCount1 = orphanedSubmissions1[0].count;
  const passed1 = orphanedSubmissionsCount1 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效提交记录（引用不存在的作业）',
    passed: passed1,
    count: orphanedSubmissionsCount1,
    expected: 0,
    message: passed1 ? '无孤立记录' : `发现 ${orphanedSubmissionsCount1} 条孤立记录`
  });
  if (passed1) {
    logSuccess(`无效提交记录（引用不存在的作业）: 0 条`);
  } else {
    logError(`无效提交记录（引用不存在的作业）: ${orphanedSubmissionsCount1} 条`);
  }

  // 2. 检查无效的提交记录（引用不存在的学生）
  const [orphanedSubmissions2] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM submissions s
    LEFT JOIN users u ON s.student_id = u.id
    WHERE u.id IS NULL
  `);
  const orphanedSubmissionsCount2 = orphanedSubmissions2[0].count;
  const passed2 = orphanedSubmissionsCount2 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效提交记录（引用不存在的学生）',
    passed: passed2,
    count: orphanedSubmissionsCount2,
    expected: 0,
    message: passed2 ? '无孤立记录' : `发现 ${orphanedSubmissionsCount2} 条孤立记录`
  });
  if (passed2) {
    logSuccess(`无效提交记录（引用不存在的学生）: 0 条`);
  } else {
    logError(`无效提交记录（引用不存在的学生）: ${orphanedSubmissionsCount2} 条`);
  }

  // 3. 检查无效的答题记录（引用不存在的提交）
  const [orphanedAnswers1] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM answers a
    LEFT JOIN submissions s ON a.submission_id = s.id
    WHERE s.id IS NULL
  `);
  const orphanedAnswersCount1 = orphanedAnswers1[0].count;
  const passed3 = orphanedAnswersCount1 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效答题记录（引用不存在的提交）',
    passed: passed3,
    count: orphanedAnswersCount1,
    expected: 0,
    message: passed3 ? '无孤立记录' : `发现 ${orphanedAnswersCount1} 条孤立记录`
  });
  if (passed3) {
    logSuccess(`无效答题记录（引用不存在的提交）: 0 条`);
  } else {
    logError(`无效答题记录（引用不存在的提交）: ${orphanedAnswersCount1} 条`);
  }

  // 4. 检查无效的答题记录（引用不存在的题目）
  const [orphanedAnswers2] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM answers a
    LEFT JOIN questions q ON a.question_id = q.id
    WHERE q.id IS NULL
  `);
  const orphanedAnswersCount2 = orphanedAnswers2[0].count;
  const passed4 = orphanedAnswersCount2 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效答题记录（引用不存在的题目）',
    passed: passed4,
    count: orphanedAnswersCount2,
    expected: 0,
    message: passed4 ? '无孤立记录' : `发现 ${orphanedAnswersCount2} 条孤立记录`
  });
  if (passed4) {
    logSuccess(`无效答题记录（引用不存在的题目）: 0 条`);
  } else {
    logError(`无效答题记录（引用不存在的题目）: ${orphanedAnswersCount2} 条`);
  }

  // 5. 检查无效的班级关联（引用不存在的班级）
  const [orphanedClassStudents1] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM class_students cs
    LEFT JOIN classes c ON cs.class_id = c.id
    WHERE c.id IS NULL
  `);
  const orphanedClassStudentsCount1 = orphanedClassStudents1[0].count;
  const passed5 = orphanedClassStudentsCount1 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效班级关联（引用不存在的班级）',
    passed: passed5,
    count: orphanedClassStudentsCount1,
    expected: 0,
    message: passed5 ? '无孤立记录' : `发现 ${orphanedClassStudentsCount1} 条孤立记录`
  });
  if (passed5) {
    logSuccess(`无效班级关联（引用不存在的班级）: 0 条`);
  } else {
    logError(`无效班级关联（引用不存在的班级）: ${orphanedClassStudentsCount1} 条`);
  }

  // 6. 检查无效的班级关联（引用不存在的学生）
  const [orphanedClassStudents2] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM class_students cs
    LEFT JOIN users u ON cs.student_id = u.id
    WHERE u.id IS NULL OR u.role != 'student'
  `);
  const orphanedClassStudentsCount2 = orphanedClassStudents2[0].count;
  const passed6 = orphanedClassStudentsCount2 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效班级关联（引用不存在的学生）',
    passed: passed6,
    count: orphanedClassStudentsCount2,
    expected: 0,
    message: passed6 ? '无孤立记录' : `发现 ${orphanedClassStudentsCount2} 条孤立记录`
  });
  if (passed6) {
    logSuccess(`无效班级关联（引用不存在的学生）: 0 条`);
  } else {
    logError(`无效班级关联（引用不存在的学生）: ${orphanedClassStudentsCount2} 条`);
  }

  // 7. 检查无效的题目（引用不存在的作业）
  const [orphanedQuestions] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM questions q
    LEFT JOIN assignments a ON q.assignment_id = a.id
    WHERE a.id IS NULL
  `);
  const orphanedQuestionsCount = orphanedQuestions[0].count;
  const passed7 = orphanedQuestionsCount === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效题目（引用不存在的作业）',
    passed: passed7,
    count: orphanedQuestionsCount,
    expected: 0,
    message: passed7 ? '无孤立记录' : `发现 ${orphanedQuestionsCount} 条孤立记录`
  });
  if (passed7) {
    logSuccess(`无效题目（引用不存在的作业）: 0 条`);
  } else {
    logError(`无效题目（引用不存在的作业）: ${orphanedQuestionsCount} 条`);
  }

  // 8. 检查无效的薄弱点（引用不存在的学生）
  const [orphanedWeakPoints1] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM student_weak_points swp
    LEFT JOIN users u ON swp.student_id = u.id
    WHERE u.id IS NULL OR u.role != 'student'
  `);
  const orphanedWeakPointsCount1 = orphanedWeakPoints1[0].count;
  const passed8 = orphanedWeakPointsCount1 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效薄弱点（引用不存在的学生）',
    passed: passed8,
    count: orphanedWeakPointsCount1,
    expected: 0,
    message: passed8 ? '无孤立记录' : `发现 ${orphanedWeakPointsCount1} 条孤立记录`
  });
  if (passed8) {
    logSuccess(`无效薄弱点（引用不存在的学生）: 0 条`);
  } else {
    logError(`无效薄弱点（引用不存在的学生）: ${orphanedWeakPointsCount1} 条`);
  }

  // 9. 检查无效的薄弱点（引用不存在的知识点）
  const [orphanedWeakPoints2] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM student_weak_points swp
    LEFT JOIN knowledge_points kp ON swp.knowledge_point_id = kp.id
    WHERE kp.id IS NULL
  `);
  const orphanedWeakPointsCount2 = orphanedWeakPoints2[0].count;
  const passed9 = orphanedWeakPointsCount2 === 0;
  results.push({
    category: '孤立数据',
    checkName: '无效薄弱点（引用不存在的知识点）',
    passed: passed9,
    count: orphanedWeakPointsCount2,
    expected: 0,
    message: passed9 ? '无孤立记录' : `发现 ${orphanedWeakPointsCount2} 条孤立记录`
  });
  if (passed9) {
    logSuccess(`无效薄弱点（引用不存在的知识点）: 0 条`);
  } else {
    logError(`无效薄弱点（引用不存在的知识点）: ${orphanedWeakPointsCount2} 条`);
  }
}

/**
 * 检查错误率计算
 */
async function checkErrorRates(connection: mysql.Connection): Promise<void> {
  logSection('检查错误率计算');

  // 1. 检查错误率计算正确性
  const [incorrectErrorRates] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM student_weak_points
    WHERE total_count > 0 
      AND error_rate != ROUND((error_count / total_count) * 100, 2)
  `);
  const incorrectErrorRatesCount = incorrectErrorRates[0].count;
  const passed1 = incorrectErrorRatesCount === 0;
  results.push({
    category: '错误率计算',
    checkName: '错误率计算正确性',
    passed: passed1,
    count: incorrectErrorRatesCount,
    expected: 0,
    message: passed1 ? '所有错误率计算正确' : `发现 ${incorrectErrorRatesCount} 条错误率计算不正确`
  });
  if (passed1) {
    logSuccess(`错误率计算正确性: 所有记录正确`);
  } else {
    logError(`错误率计算正确性: ${incorrectErrorRatesCount} 条记录不正确`);
  }

  // 2. 检查状态字段正确性
  const [incorrectStatus] = await connection.query<any[]>(`
    SELECT COUNT(*) as count
    FROM student_weak_points
    WHERE total_count > 0 
      AND (
        (error_rate >= 50 AND status != 'weak')
        OR (error_rate >= 30 AND error_rate < 50 AND status != 'improving')
        OR (error_rate < 30 AND status != 'mastered')
      )
  `);
  const incorrectStatusCount = incorrectStatus[0].count;
  const passed2 = incorrectStatusCount === 0;
  results.push({
    category: '错误率计算',
    checkName: '状态字段正确性',
    passed: passed2,
    count: incorrectStatusCount,
    expected: 0,
    message: passed2 ? '所有状态字段正确' : `发现 ${incorrectStatusCount} 条状态字段不正确`
  });
  if (passed2) {
    logSuccess(`状态字段正确性: 所有记录正确`);
  } else {
    logError(`状态字段正确性: ${incorrectStatusCount} 条记录不正确`);
  }

  // 3. 检查边界情况: error_rate = 50 应该是 weak
  const [boundary50] = await connection.query<any[]>(`
    SELECT COUNT(*) as count, COUNT(DISTINCT status) as distinct_status
    FROM student_weak_points
    WHERE error_rate = 50
  `);
  if (boundary50[0].count > 0) {
    const [boundary50Status] = await connection.query<any[]>(`
      SELECT status FROM student_weak_points WHERE error_rate = 50 LIMIT 1
    `);
    const passed3 = boundary50[0].distinct_status === 1 && boundary50Status[0].status === 'weak';
    results.push({
      category: '错误率计算',
      checkName: '边界情况: error_rate = 50',
      passed: passed3,
      count: boundary50[0].count,
      message: passed3 ? '所有记录状态为 weak' : `状态不一致或不正确`
    });
    if (passed3) {
      logSuccess(`边界情况 error_rate = 50: ${boundary50[0].count} 条记录，状态正确 (weak)`);
    } else {
      logError(`边界情况 error_rate = 50: ${boundary50[0].count} 条记录，状态不正确`);
    }
  } else {
    logInfo(`边界情况 error_rate = 50: 无记录`);
  }

  // 4. 检查边界情况: error_rate = 30 应该是 improving
  const [boundary30] = await connection.query<any[]>(`
    SELECT COUNT(*) as count, COUNT(DISTINCT status) as distinct_status
    FROM student_weak_points
    WHERE error_rate = 30
  `);
  if (boundary30[0].count > 0) {
    const [boundary30Status] = await connection.query<any[]>(`
      SELECT status FROM student_weak_points WHERE error_rate = 30 LIMIT 1
    `);
    const passed4 = boundary30[0].distinct_status === 1 && boundary30Status[0].status === 'improving';
    results.push({
      category: '错误率计算',
      checkName: '边界情况: error_rate = 30',
      passed: passed4,
      count: boundary30[0].count,
      message: passed4 ? '所有记录状态为 improving' : `状态不一致或不正确`
    });
    if (passed4) {
      logSuccess(`边界情况 error_rate = 30: ${boundary30[0].count} 条记录，状态正确 (improving)`);
    } else {
      logError(`边界情况 error_rate = 30: ${boundary30[0].count} 条记录，状态不正确`);
    }
  } else {
    logInfo(`边界情况 error_rate = 30: 无记录`);
  }

  // 5. 检查边界情况: error_rate = 0 应该是 mastered
  const [boundary0] = await connection.query<any[]>(`
    SELECT COUNT(*) as count, COUNT(DISTINCT status) as distinct_status
    FROM student_weak_points
    WHERE error_rate = 0
  `);
  if (boundary0[0].count > 0) {
    const [boundary0Status] = await connection.query<any[]>(`
      SELECT status FROM student_weak_points WHERE error_rate = 0 LIMIT 1
    `);
    const passed5 = boundary0[0].distinct_status === 1 && boundary0Status[0].status === 'mastered';
    results.push({
      category: '错误率计算',
      checkName: '边界情况: error_rate = 0',
      passed: passed5,
      count: boundary0[0].count,
      message: passed5 ? '所有记录状态为 mastered' : `状态不一致或不正确`
    });
    if (passed5) {
      logSuccess(`边界情况 error_rate = 0: ${boundary0[0].count} 条记录，状态正确 (mastered)`);
    } else {
      logError(`边界情况 error_rate = 0: ${boundary0[0].count} 条记录，状态不正确`);
    }
  } else {
    logInfo(`边界情况 error_rate = 0: 无记录`);
  }

  // 6. 显示状态分布
  const [statusDistribution] = await connection.query<any[]>(`
    SELECT 
      status,
      COUNT(*) as count,
      MIN(error_rate) as min_error_rate,
      MAX(error_rate) as max_error_rate,
      ROUND(AVG(error_rate), 2) as avg_error_rate
    FROM student_weak_points
    WHERE total_count > 0
    GROUP BY status
    ORDER BY 
      CASE status
        WHEN 'weak' THEN 1
        WHEN 'improving' THEN 2
        WHEN 'mastered' THEN 3
        ELSE 4
      END
  `);
  
  logInfo('\n状态分布统计:');
  for (const row of statusDistribution) {
    logInfo(`  ${row.status}: ${row.count} 条记录, 错误率范围 ${row.min_error_rate}%-${row.max_error_rate}%, 平均 ${row.avg_error_rate}%`);
  }
}

/**
 * 检查数据完整性
 */
async function checkDataIntegrity(connection: mysql.Connection): Promise<void> {
  logSection('检查数据完整性');

  // 1. 检查各表记录数
  const tables = ['assignments', 'submissions', 'questions', 'answers', 'class_students', 'student_weak_points'];
  
  logInfo('\n各表记录数统计:');
  for (const table of tables) {
    const [result] = await connection.query<any[]>(`SELECT COUNT(*) as count FROM ${table}`);
    logInfo(`  ${table}: ${result[0].count} 条记录`);
  }

  // 2. 检查外键完整性
  const [fkCheck] = await connection.query<any[]>(`
    SELECT 
      'submissions -> assignments' as check_name,
      COUNT(DISTINCT s.assignment_id) as referenced_count,
      (SELECT COUNT(*) FROM assignments) as total_count
    FROM submissions s
    UNION ALL
    SELECT 
      'submissions -> users' as check_name,
      COUNT(DISTINCT s.student_id) as referenced_count,
      (SELECT COUNT(*) FROM users WHERE role = 'student') as total_count
    FROM submissions s
    UNION ALL
    SELECT 
      'answers -> submissions' as check_name,
      COUNT(DISTINCT a.submission_id) as referenced_count,
      (SELECT COUNT(*) FROM submissions) as total_count
    FROM answers a
    UNION ALL
    SELECT 
      'answers -> questions' as check_name,
      COUNT(DISTINCT a.question_id) as referenced_count,
      (SELECT COUNT(*) FROM questions) as total_count
    FROM answers a
  `);

  logInfo('\n外键引用统计:');
  for (const row of fkCheck) {
    logInfo(`  ${row.check_name}: 引用 ${row.referenced_count} / ${row.total_count} 条记录`);
  }
}

/**
 * 生成详细报告
 */
function generateReport(): void {
  logSection('生成验证报告');

  const reportLines: string[] = [];
  reportLines.push('========================================');
  reportLines.push('Task 12: 数据一致性验证报告');
  reportLines.push('========================================');
  reportLines.push('');
  reportLines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  reportLines.push('');

  // 按类别分组
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    reportLines.push('');
    reportLines.push(`## ${category}`);
    reportLines.push('');
    
    const categoryResults = results.filter(r => r.category === category);
    for (const result of categoryResults) {
      reportLines.push(`### ${result.checkName}`);
      reportLines.push(`- 状态: ${result.passed ? '✓ 通过' : '✗ 失败'}`);
      if (result.count !== undefined) {
        reportLines.push(`- 数量: ${result.count}`);
      }
      if (result.expected !== undefined) {
        reportLines.push(`- 期望: ${result.expected}`);
      }
      reportLines.push(`- 说明: ${result.message}`);
      reportLines.push('');
    }
  }

  // 统计
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = totalChecks - passedChecks;
  const passRate = ((passedChecks / totalChecks) * 100).toFixed(2);

  reportLines.push('');
  reportLines.push('========================================');
  reportLines.push('验证统计');
  reportLines.push('========================================');
  reportLines.push('');
  reportLines.push(`总检查项: ${totalChecks}`);
  reportLines.push(`通过: ${passedChecks}`);
  reportLines.push(`失败: ${failedChecks}`);
  reportLines.push(`通过率: ${passRate}%`);
  reportLines.push('');

  if (failedChecks === 0) {
    reportLines.push('✓ 所有检查项通过！数据一致性良好。');
  } else {
    reportLines.push(`✗ 有 ${failedChecks} 个检查项失败，请检查数据一致性。`);
  }

  reportLines.push('');
  reportLines.push('========================================');

  // 保存报告
  const reportPath = path.join(__dirname, '..', 'docs', 'task12-consistency-report.txt');
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
  
  logSuccess(`报告已保存到: ${reportPath}`);

  // 输出统计
  logSection('验证统计');
  log(`总检查项: ${totalChecks}`, colors.cyan);
  log(`通过: ${passedChecks}`, colors.green);
  log(`失败: ${failedChecks}`, failedChecks > 0 ? colors.red : colors.green);
  log(`通过率: ${passRate}%`, failedChecks > 0 ? colors.yellow : colors.green);

  if (failedChecks === 0) {
    logSuccess('\n所有检查项通过！数据一致性良好。');
  } else {
    logError(`\n有 ${failedChecks} 个检查项失败，请检查数据一致性。`);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  log('\n' + '='.repeat(60), colors.bright);
  log('Task 12: 数据一致性验证脚本', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  let connection: mysql.Connection | null = null;

  try {
    // 连接数据库
    logInfo('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    logSuccess('数据库连接成功');

    // 执行检查
    await checkOrphanedData(connection);
    await checkErrorRates(connection);
    await checkDataIntegrity(connection);

    // 生成报告
    generateReport();

    // 退出码
    const failedChecks = results.filter(r => !r.passed).length;
    process.exit(failedChecks > 0 ? 1 : 0);

  } catch (error) {
    logError(`错误: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logInfo('\n数据库连接已关闭');
    }
  }
}

// 运行主函数
main();
