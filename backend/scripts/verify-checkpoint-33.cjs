/**
 * 检查点33验证脚本
 * 验证数据库与AI模型就绪状态
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'bold');
  log(message, 'bold');
  log('='.repeat(60), 'bold');
}

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'edu_education_platform',
  charset: 'utf8mb4'
};

// 需要验证的8张新表
const newTables = [
  { name: 'learning_analytics_reports', expectedRows: 10, description: '学情报告表' },
  { name: 'offline_cache_records', expectedRows: 50, description: '离线缓存记录表' },
  { name: 'teams', expectedRows: 5, description: '学习小组表' },
  { name: 'team_members', expectedRows: 30, description: '小组成员关联表' },
  { name: 'check_ins', expectedRows: 100, description: '打卡记录表' },
  { name: 'peer_reviews', expectedRows: 40, description: '互评记录表' },
  { name: 'resource_recommendations', expectedRows: 100, description: '资源推荐表' },
  { name: 'speech_assessments', expectedRows: 20, description: '口语评测表' }
];

// AI模型训练脚本
const aiModels = [
  { 
    name: 'BERT学情分析模型', 
    script: 'python-ai/training/train_learning_analytics.py',
    requirement: '16.2',
    targetAccuracy: '≥95%'
  },
  { 
    name: 'BERT资源推荐模型', 
    script: 'python-ai/training/train_resource_recommendation.py',
    requirement: '19.5',
    targetAccuracy: '≥90%'
  },
  { 
    name: 'Wav2Vec2口语评测模型', 
    script: 'python-ai/training/train_speech_assessment.py',
    requirement: '20.3',
    targetAccuracy: '≥92%'
  }
];

// 尝试连接数据库（支持多端口）
async function connectDatabase() {
  const ports = [3306, 3307, 3308];
  
  for (const port of ports) {
    try {
      const config = { ...dbConfig, port };
      const connection = await mysql.createConnection(config);
      logSuccess(`数据库连接成功 (端口: ${port})`);
      return connection;
    } catch (error) {
      // 继续尝试下一个端口
    }
  }
  
  throw new Error('无法连接到MySQL数据库（尝试了端口3306, 3307, 3308）');
}

// 验证数据库表
async function verifyDatabaseTables(connection) {
  logSection('📊 验证数据库表');
  
  let allTablesExist = true;
  let allDataComplete = true;
  
  for (const table of newTables) {
    try {
      // 检查表是否存在
      const [tables] = await connection.execute(
        `SHOW TABLES LIKE '${table.name}'`
      );
      
      if (tables.length === 0) {
        logError(`表 ${table.name} (${table.description}) 不存在`);
        allTablesExist = false;
        continue;
      }
      
      // 检查数据行数
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      const actualRows = rows[0].count;
      
      if (actualRows >= table.expectedRows) {
        logSuccess(`${table.description} (${table.name}): ${actualRows}/${table.expectedRows} 行数据`);
      } else {
        logWarning(`${table.description} (${table.name}): ${actualRows}/${table.expectedRows} 行数据 (数据不足)`);
        allDataComplete = false;
      }
      
    } catch (error) {
      logError(`验证表 ${table.name} 时出错: ${error.message}`);
      allTablesExist = false;
    }
  }
  
  return { allTablesExist, allDataComplete };
}

// 验证AI模型训练脚本
async function verifyAIModels() {
  logSection('🤖 验证AI模型训练脚本');
  
  let allScriptsExist = true;
  
  for (const model of aiModels) {
    const scriptPath = path.join(process.cwd(), model.script);
    
    if (fs.existsSync(scriptPath)) {
      logSuccess(`${model.name} 训练脚本存在`);
      logInfo(`  - 脚本路径: ${model.script}`);
      logInfo(`  - 需求: ${model.requirement}`);
      logInfo(`  - 目标准确率: ${model.targetAccuracy}`);
    } else {
      logError(`${model.name} 训练脚本不存在: ${model.script}`);
      allScriptsExist = false;
    }
  }
  
  // 检查训练文档
  const trainingDocs = [
    'python-ai/training/README.md',
    'python-ai/training/TRAINING_GUIDE.md',
    'python-ai/training/IMPLEMENTATION_SUMMARY.md'
  ];
  
  logInfo('\n检查训练文档:');
  for (const doc of trainingDocs) {
    const docPath = path.join(process.cwd(), doc);
    if (fs.existsSync(docPath)) {
      logSuccess(`文档存在: ${doc}`);
    } else {
      logWarning(`文档缺失: ${doc}`);
    }
  }
  
  return allScriptsExist;
}

// 生成检查点报告
function generateReport(dbStatus, aiStatus) {
  logSection('📋 检查点33验证报告');
  
  log('\n数据库状态:', 'bold');
  if (dbStatus.allTablesExist && dbStatus.allDataComplete) {
    logSuccess('✓ 所有8张新表已创建，测试数据已插入');
  } else if (dbStatus.allTablesExist) {
    logWarning('⚠ 所有表已创建，但部分表数据不足');
  } else {
    logError('✗ 部分表未创建或数据缺失');
  }
  
  log('\nAI模型状态:', 'bold');
  if (aiStatus) {
    logSuccess('✓ 所有3个AI模型训练脚本已就绪');
    logInfo('  注意: 实际模型训练需要真实数据和GPU资源');
  } else {
    logError('✗ 部分AI模型训练脚本缺失');
  }
  
  log('\n总体状态:', 'bold');
  if (dbStatus.allTablesExist && dbStatus.allDataComplete && aiStatus) {
    logSuccess('✓ 检查点33验证通过！数据库与AI模型已就绪');
    log('\n可以继续进行第二阶段：后端功能开发（第3-4周）', 'green');
    return true;
  } else {
    logError('✗ 检查点33验证未通过，请解决上述问题');
    return false;
  }
}

// 主函数
async function main() {
  log('\n' + '='.repeat(60), 'bold');
  log('检查点33验证 - 数据库与AI模型就绪', 'bold');
  log('='.repeat(60) + '\n', 'bold');
  
  let connection;
  
  try {
    // 1. 连接数据库
    connection = await connectDatabase();
    
    // 2. 验证数据库表
    const dbStatus = await verifyDatabaseTables(connection);
    
    // 3. 验证AI模型
    const aiStatus = await verifyAIModels();
    
    // 4. 生成报告
    const passed = generateReport(dbStatus, aiStatus);
    
    // 5. 退出
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    logError(`验证过程出错: ${error.message}`);
    logInfo('\n可能的原因:');
    logInfo('1. MySQL服务未启动');
    logInfo('2. 数据库未创建或表未初始化');
    logInfo('3. 数据库连接配置错误');
    logInfo('\n解决方法:');
    logInfo('1. 运行 backend/scripts/setup-database.cjs 初始化数据库');
    logInfo('2. 运行 docs/sql/new-features-tables.sql 创建新表');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行主函数
main();
