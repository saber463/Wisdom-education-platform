/**
 * Task 10.1: 分析所有GROUP BY语法
 * 扫描所有TypeScript文件中的SQL查询，检查GROUP BY语法是否符合MySQL 8.0严格模式
 */

import * as fs from 'fs';
import * as path from 'path';

interface GroupByIssue {
  file: string;
  lineNumber: number;
  query: string;
  selectColumns: string[];
  groupByColumns: string[];
  missingColumns: string[];
  severity: 'error' | 'warning' | 'info';
}

const issues: GroupByIssue[] = [];

/**
 * 扫描目录中的所有TypeScript文件
 */
function scanDirectory(dir: string): void {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      analyzeFile(filePath);
    }
  }
}

/**
 * 分析单个文件中的SQL查询
 */
function analyzeFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let inQuery = false;
  let queryLines: string[] = [];
  let queryStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测SQL查询开始（包含SELECT和反引号或引号）
    if ((line.includes('SELECT') || line.includes('select')) && 
        (line.includes('`') || line.includes("'") || line.includes('"'))) {
      inQuery = true;
      queryStartLine = i + 1;
      queryLines = [line];
    } else if (inQuery) {
      queryLines.push(line);

      // 检测查询结束（包含分号或反引号/引号结束）
      if (line.includes(';') || 
          (line.includes('`') && !line.trim().startsWith('//')) ||
          line.includes("'") || 
          line.includes('"')) {
        const query = queryLines.join('\n');
        
        // 只分析包含GROUP BY的查询
        if (query.toUpperCase().includes('GROUP BY')) {
          analyzeGroupByQuery(filePath, queryStartLine, query);
        }

        inQuery = false;
        queryLines = [];
      }
    }
  }
}

/**
 * 分析GROUP BY查询
 */
function analyzeGroupByQuery(file: string, lineNumber: number, query: string): void {
  // 清理查询字符串
  const cleanQuery = query
    .replace(/`/g, '')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 提取SELECT子句
  const selectMatch = cleanQuery.match(/SELECT\s+(.*?)\s+FROM/i);
  if (!selectMatch) return;

  const selectClause = selectMatch[1];

  // 提取GROUP BY子句
  const groupByMatch = cleanQuery.match(/GROUP BY\s+(.*?)(?:\s+ORDER BY|\s+HAVING|\s+LIMIT|$)/i);
  if (!groupByMatch) return;

  const groupByClause = groupByMatch[1];

  // 解析SELECT列
  const selectColumns = parseSelectColumns(selectClause);
  
  // 解析GROUP BY列
  const groupByColumns = parseGroupByColumns(groupByClause);

  // 查找缺失的列
  const missingColumns = findMissingColumns(selectColumns, groupByColumns);

  if (missingColumns.length > 0) {
    issues.push({
      file: file.replace(/\\/g, '/'),
      lineNumber,
      query: cleanQuery.substring(0, 200) + (cleanQuery.length > 200 ? '...' : ''),
      selectColumns,
      groupByColumns,
      missingColumns,
      severity: 'error'
    });
  }
}

/**
 * 解析SELECT列
 */
function parseSelectColumns(selectClause: string): string[] {
  const columns: string[] = [];
  const parts = selectClause.split(',');

  for (const part of parts) {
    const trimmed = part.trim();

    // 跳过聚合函数
    if (/^(COUNT|SUM|AVG|MAX|MIN|GROUP_CONCAT)\s*\(/i.test(trimmed)) {
      continue;
    }

    // 提取列名（处理别名）
    const asMatch = trimmed.match(/^(.+?)\s+(?:AS\s+)?(\w+)$/i);
    if (asMatch) {
      const columnName = asMatch[1].trim();
      if (!isAggregateFunction(columnName)) {
        columns.push(normalizeColumnName(columnName));
      }
    } else if (!isAggregateFunction(trimmed)) {
      columns.push(normalizeColumnName(trimmed));
    }
  }

  return columns;
}

/**
 * 解析GROUP BY列
 */
function parseGroupByColumns(groupByClause: string): string[] {
  return groupByClause
    .split(',')
    .map(col => normalizeColumnName(col.trim()))
    .filter(col => col.length > 0);
}

/**
 * 标准化列名
 */
function normalizeColumnName(column: string): string {
  // 移除表别名
  const parts = column.split('.');
  return parts[parts.length - 1].trim();
}

/**
 * 检查是否是聚合函数
 */
function isAggregateFunction(expr: string): boolean {
  return /^(COUNT|SUM|AVG|MAX|MIN|GROUP_CONCAT)\s*\(/i.test(expr);
}

/**
 * 查找缺失的列
 */
function findMissingColumns(selectColumns: string[], groupByColumns: string[]): string[] {
  const missing: string[] = [];

  for (const selectCol of selectColumns) {
    const found = groupByColumns.some(groupCol => {
      return selectCol.toLowerCase() === groupCol.toLowerCase();
    });

    if (!found) {
      missing.push(selectCol);
    }
  }

  return missing;
}

/**
 * 生成报告
 */
function generateReport(): void {
  console.log('\n========================================');
  console.log('Task 10.1: GROUP BY 语法分析报告');
  console.log('========================================\n');

  if (issues.length === 0) {
    console.log('✓ 未发现GROUP BY语法问题！');
    console.log('✓ 所有SQL查询都符合MySQL 8.0严格模式\n');
    return;
  }

  console.log(`✗ 发现 ${issues.length} 个GROUP BY语法问题:\n`);

  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:${issue.lineNumber}`);
    console.log(`   严重程度: ${issue.severity.toUpperCase()}`);
    console.log(`   SELECT列: ${issue.selectColumns.join(', ')}`);
    console.log(`   GROUP BY列: ${issue.groupByColumns.join(', ')}`);
    console.log(`   缺失列: ${issue.missingColumns.join(', ')}`);
    console.log(`   查询片段: ${issue.query}`);
    console.log('');
  });

  console.log('========================================');
  console.log('修复建议:');
  console.log('========================================\n');
  console.log('将缺失的列添加到GROUP BY子句中，例如:');
  console.log('');
  console.log('修复前:');
  console.log('  SELECT a.id, a.title, COUNT(s.id) as count');
  console.log('  FROM assignments a');
  console.log('  GROUP BY a.id');
  console.log('');
  console.log('修复后:');
  console.log('  SELECT a.id, a.title, COUNT(s.id) as count');
  console.log('  FROM assignments a');
  console.log('  GROUP BY a.id, a.title');
  console.log('');
}

/**
 * 主函数
 */
function main(): void {
  console.log('开始扫描TypeScript文件...\n');

  const backendDir = path.join(process.cwd(), 'backend', 'src');
  
  if (!fs.existsSync(backendDir)) {
    console.error('错误: backend/src 目录不存在');
    process.exit(1);
  }

  scanDirectory(backendDir);
  generateReport();

  // 退出码：0=成功，1=发现问题
  process.exit(issues.length > 0 ? 1 : 0);
}

// 运行主函数
main();
