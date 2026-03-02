/**
 * Task 11: Database Index Analysis Script
 * 数据库索引分析脚本
 * 
 * 功能：
 * 1. 列出所有表的当前索引
 * 2. 识别缺失的索引
 * 3. 分析查询模式
 * 4. 推荐额外的索引
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edu_education_platform',
  port: parseInt(process.env.DB_PORT || '3306')
};

// Task 11 要求的索引
const REQUIRED_INDEXES = {
  assignments: ['idx_class_deadline', 'idx_teacher_status'],
  submissions: ['idx_assignment_status', 'idx_student_submit_time'],
  answers: ['idx_submission_question', 'idx_needs_review'],
  student_weak_points: ['idx_student_error_rate', 'idx_knowledge_status'],
  resource_recommendations: ['idx_user_score', 'idx_recommended_at']
};

interface IndexInfo {
  table: string;
  indexName: string;
  columnName: string;
  seqInIndex: number;
  nonUnique: number;
}

interface TableIndexes {
  [tableName: string]: IndexInfo[];
}

/**
 * 获取所有表的索引信息
 */
async function getAllIndexes(pool: mysql.Pool): Promise<TableIndexes> {
  const [rows] = await pool.query<any[]>(`
    SELECT 
      TABLE_NAME as \`table\`,
      INDEX_NAME as indexName,
      COLUMN_NAME as columnName,
      SEQ_IN_INDEX as seqInIndex,
      NON_UNIQUE as nonUnique
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('assignments', 'submissions', 'answers', 'student_weak_points', 'resource_recommendations')
    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
  `, [dbConfig.database]);

  const tableIndexes: TableIndexes = {};
  
  for (const row of rows) {
    if (!tableIndexes[row.table]) {
      tableIndexes[row.table] = [];
    }
    tableIndexes[row.table].push(row);
  }

  return tableIndexes;
}

/**
 * 检查缺失的索引
 */
function checkMissingIndexes(tableIndexes: TableIndexes): { [table: string]: string[] } {
  const missingIndexes: { [table: string]: string[] } = {};

  for (const [tableName, requiredIndexNames] of Object.entries(REQUIRED_INDEXES)) {
    const existingIndexNames = tableIndexes[tableName]
      ? [...new Set(tableIndexes[tableName].map(idx => idx.indexName))]
      : [];

    const missing = requiredIndexNames.filter(
      reqIdx => !existingIndexNames.includes(reqIdx)
    );

    if (missing.length > 0) {
      missingIndexes[tableName] = missing;
    }
  }

  return missingIndexes;
}

/**
 * 分析索引使用情况
 */
async function analyzeIndexUsage(pool: mysql.Pool): Promise<any[]> {
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT 
        TABLE_NAME as tableName,
        INDEX_NAME as indexName,
        CARDINALITY as cardinality,
        SEQ_IN_INDEX as seqInIndex,
        COLUMN_NAME as columnName
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN ('assignments', 'submissions', 'answers', 'student_weak_points', 'resource_recommendations')
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [dbConfig.database]);

    return rows;
  } catch (error) {
    console.error('索引使用情况分析失败:', error);
    return [];
  }
}

/**
 * 扫描TypeScript文件中的SQL查询
 */
function scanSQLQueries(directory: string): string[] {
  const queries: string[] = [];
  
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 提取SQL查询（简单的正则匹配）
        const sqlMatches = content.match(/`[\s\S]*?SELECT[\s\S]*?FROM[\s\S]*?`/gi);
        if (sqlMatches) {
          queries.push(...sqlMatches.map(q => q.replace(/`/g, '').trim()));
        }
      }
    }
  }
  
  scanDir(directory);
  return queries;
}

/**
 * 分析查询模式
 */
function analyzeQueryPatterns(queries: string[]): any {
  const patterns = {
    whereColumns: new Map<string, number>(),
    joinColumns: new Map<string, number>(),
    orderByColumns: new Map<string, number>()
  };

  for (const query of queries) {
    // 提取WHERE子句中的列
    const whereMatches = query.match(/WHERE[\s\S]*?(?:GROUP BY|ORDER BY|LIMIT|$)/i);
    if (whereMatches) {
      const whereClause = whereMatches[0];
      const columnMatches = whereClause.match(/\b\w+\.\w+\b/g);
      if (columnMatches) {
        for (const col of columnMatches) {
          patterns.whereColumns.set(col, (patterns.whereColumns.get(col) || 0) + 1);
        }
      }
    }

    // 提取JOIN子句中的列
    const joinMatches = query.match(/JOIN[\s\S]*?ON[\s\S]*?(?:WHERE|GROUP BY|ORDER BY|$)/gi);
    if (joinMatches) {
      for (const joinClause of joinMatches) {
        const columnMatches = joinClause.match(/\b\w+\.\w+\b/g);
        if (columnMatches) {
          for (const col of columnMatches) {
            patterns.joinColumns.set(col, (patterns.joinColumns.get(col) || 0) + 1);
          }
        }
      }
    }

    // 提取ORDER BY子句中的列
    const orderByMatches = query.match(/ORDER BY[\s\S]*?(?:LIMIT|$)/i);
    if (orderByMatches) {
      const orderByClause = orderByMatches[0];
      const columnMatches = orderByClause.match(/\b\w+\.\w+\b/g);
      if (columnMatches) {
        for (const col of columnMatches) {
          patterns.orderByColumns.set(col, (patterns.orderByColumns.get(col) || 0) + 1);
        }
      }
    }
  }

  return patterns;
}

/**
 * 生成分析报告
 */
function generateReport(
  tableIndexes: TableIndexes,
  missingIndexes: { [table: string]: string[] },
  indexUsage: any[],
  queryPatterns: any
): string {
  let report = '';

  report += '========================================\n';
  report += 'Task 11: 数据库索引分析报告\n';
  report += '========================================\n\n';

  // 1. 当前索引状态
  report += '1. 当前索引状态\n';
  report += '----------------------------------------\n';
  for (const [tableName, indexes] of Object.entries(tableIndexes)) {
    const uniqueIndexes = [...new Set(indexes.map(idx => idx.indexName))];
    report += `\n表: ${tableName}\n`;
    report += `  索引数量: ${uniqueIndexes.length}\n`;
    report += `  索引列表:\n`;
    
    const indexGroups = new Map<string, string[]>();
    for (const idx of indexes) {
      if (!indexGroups.has(idx.indexName)) {
        indexGroups.set(idx.indexName, []);
      }
      indexGroups.get(idx.indexName)!.push(idx.columnName);
    }
    
    for (const [indexName, columns] of indexGroups) {
      report += `    - ${indexName}: (${columns.join(', ')})\n`;
    }
  }

  // 2. 缺失的索引
  report += '\n\n2. 缺失的索引（Task 11要求）\n';
  report += '----------------------------------------\n';
  if (Object.keys(missingIndexes).length === 0) {
    report += '✓ 所有要求的索引都已存在\n';
  } else {
    for (const [tableName, indexes] of Object.entries(missingIndexes)) {
      report += `\n表: ${tableName}\n`;
      report += `  缺失索引:\n`;
      for (const indexName of indexes) {
        report += `    ✗ ${indexName}\n`;
      }
    }
  }

  // 3. 索引基数分析
  report += '\n\n3. 索引基数分析（Cardinality）\n';
  report += '----------------------------------------\n';
  report += '注：基数越高，索引选择性越好\n\n';
  
  const cardinalityByTable = new Map<string, any[]>();
  for (const row of indexUsage) {
    if (!cardinalityByTable.has(row.tableName)) {
      cardinalityByTable.set(row.tableName, []);
    }
    cardinalityByTable.get(row.tableName)!.push(row);
  }

  for (const [tableName, rows] of cardinalityByTable) {
    report += `\n表: ${tableName}\n`;
    const indexGroups = new Map<string, any[]>();
    for (const row of rows) {
      if (!indexGroups.has(row.indexName)) {
        indexGroups.set(row.indexName, []);
      }
      indexGroups.get(row.indexName)!.push(row);
    }
    
    for (const [indexName, cols] of indexGroups) {
      const cardinality = cols[0].cardinality || 0;
      report += `  ${indexName}: ${cardinality}\n`;
    }
  }

  // 4. 查询模式分析
  report += '\n\n4. 查询模式分析\n';
  report += '----------------------------------------\n';
  
  report += '\nWHERE子句中最常用的列（前10）:\n';
  const topWhereColumns = Array.from(queryPatterns.whereColumns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [col, count] of topWhereColumns) {
    report += `  ${col}: ${count}次\n`;
  }

  report += '\nJOIN子句中最常用的列（前10）:\n';
  const topJoinColumns = Array.from(queryPatterns.joinColumns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [col, count] of topJoinColumns) {
    report += `  ${col}: ${count}次\n`;
  }

  report += '\nORDER BY子句中最常用的列（前10）:\n';
  const topOrderByColumns = Array.from(queryPatterns.orderByColumns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [col, count] of topOrderByColumns) {
    report += `  ${col}: ${count}次\n`;
  }

  // 5. 总结
  report += '\n\n5. 总结与建议\n';
  report += '----------------------------------------\n';
  
  const totalTables = Object.keys(REQUIRED_INDEXES).length;
  const tablesWithMissingIndexes = Object.keys(missingIndexes).length;
  const totalRequiredIndexes = Object.values(REQUIRED_INDEXES).reduce((sum, arr) => sum + arr.length, 0);
  const totalMissingIndexes = Object.values(missingIndexes).reduce((sum, arr) => sum + arr.length, 0);
  
  report += `\n总计:\n`;
  report += `  - 需要优化的表: ${totalTables}\n`;
  report += `  - 要求的索引总数: ${totalRequiredIndexes}\n`;
  report += `  - 缺失的索引数: ${totalMissingIndexes}\n`;
  report += `  - 完成度: ${((totalRequiredIndexes - totalMissingIndexes) / totalRequiredIndexes * 100).toFixed(1)}%\n`;
  
  if (totalMissingIndexes === 0) {
    report += '\n✓ 所有Task 11要求的索引都已添加！\n';
  } else {
    report += '\n⚠ 请运行 scripts/task11-add-indexes.sql 添加缺失的索引\n';
  }

  report += '\n建议:\n';
  report += '  1. 定期监控索引使用情况（SHOW INDEX FROM table_name）\n';
  report += '  2. 使用EXPLAIN分析慢查询，确认索引被正确使用\n';
  report += '  3. 避免过度索引，平衡读写性能\n';
  report += '  4. 定期更新索引统计信息（ANALYZE TABLE）\n';

  report += '\n========================================\n';
  report += '分析完成\n';
  report += '========================================\n';

  return report;
}

/**
 * 主函数
 */
async function main() {
  console.log('Task 11: 数据库索引分析开始...\n');

  let pool: mysql.Pool | null = null;

  try {
    // 连接数据库
    pool = mysql.createPool(dbConfig);
    console.log('✓ 数据库连接成功\n');

    // 1. 获取所有索引
    console.log('1. 获取当前索引信息...');
    const tableIndexes = await getAllIndexes(pool);
    console.log('✓ 索引信息获取完成\n');

    // 2. 检查缺失的索引
    console.log('2. 检查缺失的索引...');
    const missingIndexes = checkMissingIndexes(tableIndexes);
    console.log('✓ 索引检查完成\n');

    // 3. 分析索引使用情况
    console.log('3. 分析索引使用情况...');
    const indexUsage = await analyzeIndexUsage(pool);
    console.log('✓ 索引使用情况分析完成\n');

    // 4. 扫描SQL查询
    console.log('4. 扫描SQL查询模式...');
    const backendDir = path.join(process.cwd(), 'backend', 'src');
    const queries = scanSQLQueries(backendDir);
    console.log(`✓ 扫描完成，找到 ${queries.length} 个SQL查询\n`);

    // 5. 分析查询模式
    console.log('5. 分析查询模式...');
    const queryPatterns = analyzeQueryPatterns(queries);
    console.log('✓ 查询模式分析完成\n');

    // 6. 生成报告
    console.log('6. 生成分析报告...');
    const report = generateReport(tableIndexes, missingIndexes, indexUsage, queryPatterns);
    
    // 保存报告
    const reportPath = path.join(process.cwd(), 'docs', 'task11-index-analysis-report.txt');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✓ 报告已保存到: ${reportPath}\n`);

    // 输出报告
    console.log(report);

    // 退出码
    const exitCode = Object.keys(missingIndexes).length === 0 ? 0 : 1;
    process.exit(exitCode);

  } catch (error) {
    console.error('✗ 分析失败:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// 运行主函数
main();
