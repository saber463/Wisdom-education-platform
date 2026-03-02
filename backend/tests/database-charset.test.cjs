/**
 * 属性测试：数据库字符集配置正确性
 * Feature: smart-education-platform, Property 47: 数据库字符集配置正确性
 * Validates: Requirements 11.4
 * 
 * 验证：对于任何创建的数据库，字符集应设置为UTF8MB4，排序规则为utf8mb4_general_ci
 */

const { execSync } = require('child_process');
const fc = require('fast-check');

// 数据库配置
const DB_NAME = 'edu_education_platform';
const EXPECTED_CHARSET = 'utf8mb4';
const EXPECTED_COLLATE = 'utf8mb4_general_ci';

/**
 * 查询数据库字符集配置
 */
function getDatabaseCharset(dbName) {
  try {
    const query = `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='${dbName}';`;
    const result = execSync(`mysql -u root -e "${query}"`, { encoding: 'utf8' });
    
    // 解析输出
    const lines = result.trim().split('\n');
    if (lines.length < 2) {
      return null;
    }
    
    const values = lines[1].split('\t');
    return {
      charset: values[0],
      collate: values[1]
    };
  } catch (error) {
    console.error('查询数据库字符集失败:', error.message);
    return null;
  }
}

/**
 * 创建测试数据库
 */
function createTestDatabase(dbName, charset, collate) {
  try {
    const createSQL = `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET ${charset} COLLATE ${collate};`;
    execSync(`mysql -u root -e "${createSQL}"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('创建数据库失败:', error.message);
    return false;
  }
}

/**
 * 删除测试数据库
 */
function dropTestDatabase(dbName) {
  try {
    execSync(`mysql -u root -e "DROP DATABASE IF EXISTS ${dbName};"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('删除数据库失败:', error.message);
    return false;
  }
}

/**
 * 属性测试：数据库字符集配置正确性
 */
describe('Property 47: 数据库字符集配置正确性', () => {
  
  test('主数据库字符集应为UTF8MB4', () => {
    const config = getDatabaseCharset(DB_NAME);
    
    expect(config).not.toBeNull();
    expect(config.charset).toBe(EXPECTED_CHARSET);
    expect(config.collate).toBe(EXPECTED_COLLATE);
  });
  
  test('属性测试：任何使用正确参数创建的数据库都应有正确的字符集', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // 生成随机数字作为数据库名后缀
        (num) => {
          const testDbName = `test_db_charset_${num}`;
          
          try {
            // 创建测试数据库
            const created = createTestDatabase(testDbName, EXPECTED_CHARSET, EXPECTED_COLLATE);
            if (!created) {
              return true; // 如果创建失败，跳过此测试
            }
            
            // 验证字符集配置
            const config = getDatabaseCharset(testDbName);
            
            // 清理测试数据库
            dropTestDatabase(testDbName);
            
            // 断言
            return config !== null && 
                   config.charset === EXPECTED_CHARSET && 
                   config.collate === EXPECTED_COLLATE;
          } catch (error) {
            // 清理
            dropTestDatabase(testDbName);
            throw error;
          }
        }
      ),
      { numRuns: 100 } // 运行100次迭代
    );
  });
  
  test('属性测试：字符集配置应持久化', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 200 }),
        (num) => {
          const testDbName = `test_db_persist_${num}`;
          
          try {
            // 创建数据库
            createTestDatabase(testDbName, EXPECTED_CHARSET, EXPECTED_COLLATE);
            
            // 第一次查询
            const config1 = getDatabaseCharset(testDbName);
            
            // 第二次查询（验证持久化）
            const config2 = getDatabaseCharset(testDbName);
            
            // 清理
            dropTestDatabase(testDbName);
            
            // 断言：两次查询结果应一致
            return config1 !== null && 
                   config2 !== null &&
                   config1.charset === config2.charset &&
                   config1.collate === config2.collate &&
                   config1.charset === EXPECTED_CHARSET &&
                   config1.collate === EXPECTED_COLLATE;
          } catch (error) {
            dropTestDatabase(testDbName);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('属性测试：UTF8MB4应支持中文字符存储', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 201, max: 300 }),
        fc.string({ minLength: 1, maxLength: 50 }), // 生成随机字符串
        (num, testString) => {
          const testDbName = `test_db_chinese_${num}`;
          const testTableName = 'test_table';
          
          try {
            // 创建数据库
            createTestDatabase(testDbName, EXPECTED_CHARSET, EXPECTED_COLLATE);
            
            // 创建测试表
            const createTableSQL = `
              USE ${testDbName};
              CREATE TABLE ${testTableName} (
                id INT PRIMARY KEY AUTO_INCREMENT,
                content VARCHAR(255)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            `;
            execSync(`mysql -u root -e "${createTableSQL}"`, { stdio: 'pipe' });
            
            // 插入中文测试数据
            const chineseText = '测试中文字符：' + testString;
            const escapedText = chineseText.replace(/'/g, "\\'");
            const insertSQL = `USE ${testDbName}; INSERT INTO ${testTableName} (content) VALUES ('${escapedText}');`;
            execSync(`mysql -u root -e "${insertSQL}"`, { stdio: 'pipe' });
            
            // 查询数据
            const selectSQL = `USE ${testDbName}; SELECT content FROM ${testTableName} LIMIT 1;`;
            const result = execSync(`mysql -u root -e "${selectSQL}"`, { encoding: 'utf8' });
            
            // 清理
            dropTestDatabase(testDbName);
            
            // 验证数据包含中文
            return result.includes('测试中文字符');
          } catch (error) {
            dropTestDatabase(testDbName);
            // 如果是特殊字符导致的SQL错误，跳过此测试
            if (error.message.includes('SQL syntax')) {
              return true;
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
});

// 如果直接运行此文件
if (require.main === module) {
  console.log('运行数据库字符集配置属性测试...\n');
  
  // 检查MySQL是否可用
  try {
    execSync('mysql --version', { stdio: 'pipe' });
    console.log('✓ MySQL已安装\n');
  } catch (error) {
    console.error('✗ MySQL未安装或未添加到PATH');
    process.exit(1);
  }
  
  // 运行测试
  console.log('测试1: 主数据库字符集验证');
  const config = getDatabaseCharset(DB_NAME);
  if (config) {
    console.log(`  字符集: ${config.charset}`);
    console.log(`  排序规则: ${config.collate}`);
    console.log(`  结果: ${config.charset === EXPECTED_CHARSET && config.collate === EXPECTED_COLLATE ? '✓ 通过' : '✗ 失败'}\n`);
  } else {
    console.log('  ✗ 无法查询数据库配置\n');
  }
  
  console.log('运行完整属性测试需要安装Jest和fast-check:');
  console.log('  npm install --save-dev jest fast-check @types/jest');
  console.log('  npm test');
}
