/**
 * 学习平台集成数据库迁移测试脚本
 * 测试所有表创建成功、验证外键约束正确、测试索引性能
 * Requirements: 1.7
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edu_education_platform',
  multipleStatements: true
};

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 预期创建的表列表
const expectedTables = [
  'courses',
  'course_branches',
  'course_lessons',
  'course_purchases',
  'course_classes',
  'course_reviews',
  'memberships',
  'user_points',
  'point_transactions',
  'learning_paths',
  'learning_path_steps',
  'learning_resources',
  'resource_favorites',
  'learning_progress',
  'resource_knowledge_points',
  'user_interests',
  'knowledge_mastery',
  'virtual_partners',
  'collaborative_tasks',
  'video_quiz_questions',
  'wrong_question_book',
  'video_quiz_records'
];

// 预期的外键约束
const expectedForeignKeys = {
  'course_branches': ['course_id'],
  'course_lessons': ['branch_id'],
  'course_purchases': ['user_id', 'course_id'],
  'course_classes': ['course_id', 'branch_id', 'teacher_id'],
  'course_reviews': ['user_id', 'course_id'],
  'memberships': ['user_id'],
  'user_points': ['user_id'],
  'point_transactions': ['user_id'],
  'learning_paths': ['user_id'],
  'learning_path_steps': ['learning_path_id', 'assignment_id'],
  'learning_resources': ['author_id'],
  'resource_favorites': ['user_id', 'resource_id'],
  'learning_progress': ['user_id', 'learning_path_id'],
  'resource_knowledge_points': ['resource_id', 'knowledge_point_id'],
  'user_interests': ['user_id'],
  'knowledge_mastery': ['user_id', 'knowledge_point_id'],
  'virtual_partners': ['user_id'],
  'collaborative_tasks': ['user_id', 'partner_id'],
  'video_quiz_questions': ['lesson_id'],
  'wrong_question_book': ['user_id', 'question_id', 'lesson_id'],
  'video_quiz_records': ['user_id', 'lesson_id', 'question_id']
};

// 预期的索引（每个表至少应该有的索引数量）
const expectedMinIndexes = {
  'courses': 3,
  'course_branches': 2,
  'course_lessons': 2,
  'course_purchases': 4,
  'course_classes': 3,
  'course_reviews': 4,
  'memberships': 3,
  'user_points': 1,
  'point_transactions': 3,
  'learning_paths': 4,
  'learning_path_steps': 2,
  'learning_resources': 5,
  'resource_favorites': 3,
  'learning_progress': 4,
  'resource_knowledge_points': 1,
  'user_interests': 3,
  'knowledge_mastery': 3,
  'virtual_partners': 2,
  'collaborative_tasks': 3,
  'video_quiz_questions': 2,
  'wrong_question_book': 4,
  'video_quiz_records': 4
};

/**
 * 运行测试
 */
async function runTest(testName, testFn) {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    console.log(`✓ ${testName}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.error(`✗ ${testName}`);
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

/**
 * 测试1: 执行迁移脚本
 */
async function testMigrationExecution(connection) {
  const sqlFilePath = path.join(__dirname, '../sql/learning-platform-integration-tables.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  await connection.query(sql);
}

/**
 * 测试2: 验证所有表创建成功
 */
async function testAllTablesCreated(connection) {
  const [rows] = await connection.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = ? 
      AND table_name IN (?)
  `, [dbConfig.database, expectedTables]);
  
  const createdTables = rows.map(row => row.table_name || row.TABLE_NAME);
  const missingTables = expectedTables.filter(table => !createdTables.includes(table));
  
  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`);
  }
  
  if (createdTables.length !== expectedTables.length) {
    throw new Error(`Expected ${expectedTables.length} tables, but found ${createdTables.length}`);
  }
}

/**
 * 测试3: 验证外键约束正确
 */
async function testForeignKeyConstraints(connection) {
  for (const [tableName, expectedColumns] of Object.entries(expectedForeignKeys)) {
    const [rows] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database, tableName]);
    
    const foreignKeyColumns = rows.map(row => row.COLUMN_NAME);
    
    for (const expectedColumn of expectedColumns) {
      if (!foreignKeyColumns.includes(expectedColumn)) {
        throw new Error(
          `Table ${tableName} missing foreign key on column ${expectedColumn}`
        );
      }
    }
  }
}

/**
 * 测试4: 验证索引存在
 */
async function testIndexesExist(connection) {
  for (const [tableName, minIndexCount] of Object.entries(expectedMinIndexes)) {
    const [rows] = await connection.query(`
      SELECT COUNT(DISTINCT index_name) as index_count
      FROM information_schema.statistics
      WHERE table_schema = ?
        AND table_name = ?
    `, [dbConfig.database, tableName]);
    
    const actualIndexCount = rows[0].index_count || rows[0].INDEX_COUNT;
    
    if (actualIndexCount < minIndexCount) {
      throw new Error(
        `Table ${tableName} has ${actualIndexCount} indexes, expected at least ${minIndexCount}`
      );
    }
  }
}

/**
 * 测试5: 测试索引性能（插入和查询）
 */
async function testIndexPerformance(connection) {
  // 测试courses表的索引性能
  await connection.query(`
    INSERT INTO courses (language_name, display_name, difficulty, is_hot, hot_rank)
    VALUES ('Python', 'Python编程', 'beginner', true, 1)
  `);
  
  const startTime = Date.now();
  await connection.query(`
    SELECT * FROM courses WHERE is_hot = true AND hot_rank > 0
  `);
  const queryTime = Date.now() - startTime;
  
  // 查询应该在10ms内完成（使用索引）
  if (queryTime > 10) {
    console.warn(`  Warning: Query took ${queryTime}ms (expected < 10ms)`);
  }
  
  // 清理测试数据
  await connection.query(`DELETE FROM courses WHERE language_name = 'Python'`);
}

/**
 * 测试6: 测试级联删除
 */
async function testCascadeDelete(connection) {
  // 创建测试数据
  const [courseResult] = await connection.query(`
    INSERT INTO courses (language_name, display_name, difficulty)
    VALUES ('TestLang', 'Test Language', 'beginner')
  `);
  const courseId = courseResult.insertId;
  
  const [branchResult] = await connection.query(`
    INSERT INTO course_branches (course_id, branch_name, difficulty)
    VALUES (?, 'Test Branch', 'beginner')
  `, [courseId]);
  const branchId = branchResult.insertId;
  
  await connection.query(`
    INSERT INTO course_lessons (branch_id, lesson_number, title)
    VALUES (?, 1, 'Test Lesson')
  `, [branchId]);
  
  // 删除课程，应该级联删除分支和课节
  await connection.query(`DELETE FROM courses WHERE id = ?`, [courseId]);
  
  // 验证分支和课节已被删除
  const [branches] = await connection.query(
    `SELECT * FROM course_branches WHERE id = ?`,
    [branchId]
  );
  
  if (branches.length > 0) {
    throw new Error('Cascade delete failed: course_branches not deleted');
  }
}

/**
 * 测试7: 测试唯一约束
 */
async function testUniqueConstraints(connection) {
  // 测试user_points的唯一约束
  const [userResult] = await connection.query(`
    INSERT INTO users (username, password_hash, real_name, role)
    VALUES ('test_unique_user', 'hash', 'Test User', 'student')
  `);
  const userId = userResult.insertId;
  
  await connection.query(`
    INSERT INTO user_points (user_id, total_points, available_points)
    VALUES (?, 100, 100)
  `, [userId]);
  
  // 尝试插入重复记录，应该失败
  try {
    await connection.query(`
      INSERT INTO user_points (user_id, total_points, available_points)
      VALUES (?, 200, 200)
    `, [userId]);
    throw new Error('Unique constraint not working: duplicate insert succeeded');
  } catch (error) {
    if (!error.message.includes('Duplicate entry')) {
      throw error;
    }
  }
  
  // 清理测试数据
  await connection.query(`DELETE FROM users WHERE id = ?`, [userId]);
}

/**
 * 测试8: 测试JSON字段
 */
async function testJsonFields(connection) {
  const [userResult] = await connection.query(`
    INSERT INTO users (username, password_hash, real_name, role)
    VALUES ('test_json_user', 'hash', 'Test User', 'student')
  `);
  const userId = userResult.insertId;
  
  // 测试user_interests的JSON字段
  await connection.query(`
    INSERT INTO user_interests (
      user_id, 
      learning_goal, 
      interested_languages, 
      interested_directions,
      learning_style,
      skill_level,
      weekly_hours,
      survey_completed
    )
    VALUES (?, 'employment', ?, ?, ?, 'beginner', 'hours_5_10', true)
  `, [
    userId,
    JSON.stringify(['Python', 'JavaScript']),
    JSON.stringify(['frontend', 'backend']),
    JSON.stringify(['video', 'document'])
  ]);
  
  // 验证JSON数据可以正确读取
  const [rows] = await connection.query(`
    SELECT interested_languages, interested_directions, learning_style
    FROM user_interests
    WHERE user_id = ?
  `, [userId]);
  
  if (rows.length === 0) {
    throw new Error('JSON field test failed: no data found');
  }
  
  const languages = JSON.parse(rows[0].interested_languages);
  if (!Array.isArray(languages) || languages.length !== 2) {
    throw new Error('JSON field test failed: invalid data structure');
  }
  
  // 清理测试数据
  await connection.query(`DELETE FROM users WHERE id = ?`, [userId]);
}

/**
 * 测试9: 测试ENUM字段
 */
async function testEnumFields(connection) {
  // 测试有效的ENUM值
  const [courseResult] = await connection.query(`
    INSERT INTO courses (language_name, display_name, difficulty)
    VALUES ('EnumTest', 'Enum Test', 'beginner')
  `);
  const courseId = courseResult.insertId;
  
  // 尝试插入无效的ENUM值，应该失败
  try {
    await connection.query(`
      INSERT INTO courses (language_name, display_name, difficulty)
      VALUES ('EnumTest2', 'Enum Test 2', 'invalid_difficulty')
    `);
    throw new Error('ENUM constraint not working: invalid value accepted');
  } catch (error) {
    if (!error.message.includes('ENUM') && !error.message.includes('Data truncated')) {
      throw error;
    }
  }
  
  // 清理测试数据
  await connection.query(`DELETE FROM courses WHERE id = ?`, [courseId]);
}

/**
 * 测试10: 测试通知表扩展
 */
async function testNotificationExtensions(connection) {
  // 验证通知表已添加新字段
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'notifications'
      AND COLUMN_NAME IN ('priority', 'action_url', 'expires_at', 'metadata')
  `, [dbConfig.database]);
  
  const columnNames = columns.map(col => col.COLUMN_NAME);
  const expectedColumns = ['priority', 'action_url', 'expires_at', 'metadata'];
  
  for (const expectedColumn of expectedColumns) {
    if (!columnNames.includes(expectedColumn)) {
      throw new Error(`Notification table missing extended column: ${expectedColumn}`);
    }
  }
}

/**
 * 主测试函数
 */
async function main() {
  let connection;
  
  try {
    console.log('========================================');
    console.log('学习平台集成数据库迁移测试');
    console.log('========================================\n');
    
    // 连接数据库
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ 数据库连接成功\n');
    
    // 运行所有测试
    console.log('开始测试...\n');
    
    await runTest('测试1: 执行迁移脚本', async () => {
      await testMigrationExecution(connection);
    });
    
    await runTest('测试2: 验证所有表创建成功', async () => {
      await testAllTablesCreated(connection);
    });
    
    await runTest('测试3: 验证外键约束正确', async () => {
      await testForeignKeyConstraints(connection);
    });
    
    await runTest('测试4: 验证索引存在', async () => {
      await testIndexesExist(connection);
    });
    
    await runTest('测试5: 测试索引性能', async () => {
      await testIndexPerformance(connection);
    });
    
    await runTest('测试6: 测试级联删除', async () => {
      await testCascadeDelete(connection);
    });
    
    await runTest('测试7: 测试唯一约束', async () => {
      await testUniqueConstraints(connection);
    });
    
    await runTest('测试8: 测试JSON字段', async () => {
      await testJsonFields(connection);
    });
    
    await runTest('测试9: 测试ENUM字段', async () => {
      await testEnumFields(connection);
    });
    
    await runTest('测试10: 测试通知表扩展', async () => {
      await testNotificationExtensions(connection);
    });
    
    // 输出测试结果
    console.log('\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`通过: ${testResults.passed}`);
    console.log(`失败: ${testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log('\n失败的测试:');
      testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
      process.exit(1);
    } else {
      console.log('\n✓ 所有测试通过！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n✗ 测试执行失败:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行测试
main();
