/**
 * 演示数据管理模块
 * 负责演示数据的重置、验证和统计
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  charset: string;
  collation: string;
}

/**
 * 演示数据统计
 */
export interface DemoDataStats {
  tables: number;
  users: number;
  teachers: number;
  students: number;
  parents: number;
  classes: number;
  assignments: number;
  exercises: number;
}

/**
 * 默认数据库配置
 */
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'edu_education_platform',
  charset: 'utf8mb4',
  collation: 'utf8mb4_general_ci'
};

/**
 * SQL文件路径
 */
export const SQL_FILES = {
  schema: path.resolve(__dirname, '..', '..', 'docs', 'sql', 'schema.sql'),
  testData: path.resolve(__dirname, '..', '..', 'docs', 'sql', 'test-data.sql'),
  extendedBank: path.resolve(__dirname, '..', '..', 'docs', 'sql', 'extended-exercise-bank.sql')
};

/**
 * 检查MySQL是否可用
 */
export function isMySQLAvailable(): boolean {
  try {
    execSync('mysql --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查数据库是否存在
 */
export function databaseExists(config: DatabaseConfig = DEFAULT_DB_CONFIG): boolean {
  try {
    const command = `mysql -u ${config.user} -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database}';"`;
    const result = execSync(command, { encoding: 'utf-8' });
    return result.includes(config.database);
  } catch {
    return false;
  }
}

/**
 * 检查SQL文件是否存在
 */
export function checkSQLFiles(): {
  schema: boolean;
  testData: boolean;
  extendedBank: boolean;
} {
  return {
    schema: fs.existsSync(SQL_FILES.schema),
    testData: fs.existsSync(SQL_FILES.testData),
    extendedBank: fs.existsSync(SQL_FILES.extendedBank)
  };
}

/**
 * 删除数据库
 */
export function dropDatabase(config: DatabaseConfig = DEFAULT_DB_CONFIG): boolean {
  try {
    const command = `mysql -u ${config.user} -e "DROP DATABASE IF EXISTS ${config.database};"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建数据库
 */
export function createDatabase(config: DatabaseConfig = DEFAULT_DB_CONFIG): boolean {
  try {
    const command = `mysql -u ${config.user} -e "CREATE DATABASE ${config.database} CHARACTER SET ${config.charset} COLLATE ${config.collation};"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 导入SQL文件
 */
export function importSQLFile(
  filePath: string,
  config: DatabaseConfig = DEFAULT_DB_CONFIG
): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const command = `mysql -u ${config.user} ${config.database} < "${filePath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取表数量
 */
export function getTableCount(config: DatabaseConfig = DEFAULT_DB_CONFIG): number {
  try {
    const command = `mysql -u ${config.user} ${config.database} -e "SHOW TABLES;" -s`;
    const result = execSync(command, { encoding: 'utf-8' });
    const tables = result.trim().split('\n').filter(line => line.trim());
    return tables.length;
  } catch {
    return 0;
  }
}

/**
 * 获取表中的记录数
 */
export function getRecordCount(
  tableName: string,
  config: DatabaseConfig = DEFAULT_DB_CONFIG
): number {
  try {
    const command = `mysql -u ${config.user} ${config.database} -e "SELECT COUNT(*) FROM ${tableName};" -s`;
    const result = execSync(command, { encoding: 'utf-8' });
    const count = parseInt(result.trim().split('\n')[1] || '0', 10);
    return count;
  } catch {
    return 0;
  }
}

/**
 * 获取演示数据统计
 */
export function getDemoDataStats(config: DatabaseConfig = DEFAULT_DB_CONFIG): DemoDataStats {
  if (!databaseExists(config)) {
    return {
      tables: 0,
      users: 0,
      teachers: 0,
      students: 0,
      parents: 0,
      classes: 0,
      assignments: 0,
      exercises: 0
    };
  }

  const tables = getTableCount(config);
  const users = getRecordCount('users', config);
  
  // 获取各角色用户数
  let teachers = 0;
  let students = 0;
  let parents = 0;
  
  try {
    const teacherCommand = `mysql -u ${config.user} ${config.database} -e "SELECT COUNT(*) FROM users WHERE role='teacher';" -s`;
    const teacherResult = execSync(teacherCommand, { encoding: 'utf-8' });
    teachers = parseInt(teacherResult.trim().split('\n')[1] || '0', 10);
    
    const studentCommand = `mysql -u ${config.user} ${config.database} -e "SELECT COUNT(*) FROM users WHERE role='student';" -s`;
    const studentResult = execSync(studentCommand, { encoding: 'utf-8' });
    students = parseInt(studentResult.trim().split('\n')[1] || '0', 10);
    
    const parentCommand = `mysql -u ${config.user} ${config.database} -e "SELECT COUNT(*) FROM users WHERE role='parent';" -s`;
    const parentResult = execSync(parentCommand, { encoding: 'utf-8' });
    parents = parseInt(parentResult.trim().split('\n')[1] || '0', 10);
  } catch {
    // 如果查询失败，使用默认值
  }
  
  const classes = getRecordCount('classes', config);
  const assignments = getRecordCount('assignments', config);
  const exercises = getRecordCount('exercise_bank', config);

  return {
    tables,
    users,
    teachers,
    students,
    parents,
    classes,
    assignments,
    exercises
  };
}

/**
 * 重置演示数据
 */
export function resetDemoData(config: DatabaseConfig = DEFAULT_DB_CONFIG): {
  success: boolean;
  steps: {
    dropDatabase: boolean;
    createDatabase: boolean;
    importSchema: boolean;
    importTestData: boolean;
    importExtendedBank: boolean;
  };
  stats?: DemoDataStats;
} {
  const steps = {
    dropDatabase: false,
    createDatabase: false,
    importSchema: false,
    importTestData: false,
    importExtendedBank: false
  };

  // 1. 删除数据库
  steps.dropDatabase = dropDatabase(config);
  if (!steps.dropDatabase) {
    return { success: false, steps };
  }

  // 2. 创建数据库
  steps.createDatabase = createDatabase(config);
  if (!steps.createDatabase) {
    return { success: false, steps };
  }

  // 3. 导入表结构
  steps.importSchema = importSQLFile(SQL_FILES.schema, config);
  if (!steps.importSchema) {
    return { success: false, steps };
  }

  // 4. 导入测试数据
  steps.importTestData = importSQLFile(SQL_FILES.testData, config);
  if (!steps.importTestData) {
    return { success: false, steps };
  }

  // 5. 导入扩展题库（可选）
  if (fs.existsSync(SQL_FILES.extendedBank)) {
    steps.importExtendedBank = importSQLFile(SQL_FILES.extendedBank, config);
  } else {
    steps.importExtendedBank = true; // 文件不存在视为成功
  }

  // 获取统计信息
  const stats = getDemoDataStats(config);

  return {
    success: true,
    steps,
    stats
  };
}

/**
 * 验证演示数据完整性
 */
export function validateDemoData(config: DatabaseConfig = DEFAULT_DB_CONFIG): {
  valid: boolean;
  errors: string[];
  stats: DemoDataStats;
} {
  const errors: string[] = [];
  const stats = getDemoDataStats(config);

  // 检查数据库是否存在
  if (!databaseExists(config)) {
    errors.push('数据库不存在');
    return { valid: false, errors, stats };
  }

  // 检查表数量（至少应该有14张表）
  if (stats.tables < 14) {
    errors.push(`表数量不足: 期望至少14张，实际${stats.tables}张`);
  }

  // 检查用户数量
  if (stats.users === 0) {
    errors.push('用户表为空');
  }

  // 检查教师数量（至少应该有3个）
  if (stats.teachers < 3) {
    errors.push(`教师数量不足: 期望至少3个，实际${stats.teachers}个`);
  }

  // 检查学生数量（至少应该有30个）
  if (stats.students < 30) {
    errors.push(`学生数量不足: 期望至少30个，实际${stats.students}个`);
  }

  // 检查家长数量（至少应该有10个）
  if (stats.parents < 10) {
    errors.push(`家长数量不足: 期望至少10个，实际${stats.parents}个`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats
  };
}
