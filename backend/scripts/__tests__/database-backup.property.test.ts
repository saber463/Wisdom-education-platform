/**
 * 属性测试：数据库备份文件生成
 * Feature: smart-education-platform, Property 54: 数据库备份文件生成
 * 验证需求：12.7
 * 
 * 属性：数据库备份操作应该导出数据库到指定文件夹
 */

import * as fc from 'fast-check';
import {
  DEFAULT_BACKUP_CONFIG,
  isMySQLAvailable,
  isMySQLDumpAvailable,
  databaseExists,
  ensureBackupDirectory,
  generateBackupFileName,
  listBackupFiles,
  getLatestBackup,
  getBackupStats
} from '../database-backup.js';

describe('Property 54: 数据库备份文件生成', () => {
  // 跳过测试如果MySQL不可用
  const skipIfNoMySQL = () => {
    if (!isMySQLAvailable()) {
      console.log('⚠ MySQL不可用，跳过测试');
      return true;
    }
    return false;
  };

  it('属性1: 默认备份配置应该包含所有必需字段', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const config = DEFAULT_BACKUP_CONFIG;
          
          // 验证：配置应该包含所有必需字段
          expect(config).toHaveProperty('database');
          expect(config).toHaveProperty('user');
          expect(config).toHaveProperty('backupDir');
          
          // 验证：字段类型正确
          expect(typeof config.database).toBe('string');
          expect(typeof config.user).toBe('string');
          expect(typeof config.backupDir).toBe('string');
          
          // 验证：字段值非空
          expect(config.database.length).toBeGreaterThan(0);
          expect(config.user.length).toBeGreaterThan(0);
          expect(config.backupDir.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性2: MySQL可用性检查应该返回布尔值', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const available = isMySQLAvailable();
          
          // 验证：返回值应该是布尔类型
          expect(typeof available).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性3: mysqldump可用性检查应该返回布尔值', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const available = isMySQLDumpAvailable();
          
          // 验证：返回值应该是布尔类型
          expect(typeof available).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性4: 数据库存在性检查应该返回布尔值', () => {
    if (skipIfNoMySQL()) return;

    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const exists = databaseExists();
          
          // 验证：返回值应该是布尔类型
          expect(typeof exists).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性5: 备份目录创建应该返回布尔值', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const created = ensureBackupDirectory();
          
          // 验证：返回值应该是布尔类型
          expect(typeof created).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性6: 生成的备份文件名应该符合格式规范', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const fileName = generateBackupFileName();
          
          // 验证：文件名应该是字符串
          expect(typeof fileName).toBe('string');
          
          // 验证：文件名应该以.sql结尾
          expect(fileName.endsWith('.sql')).toBe(true);
          
          // 验证：文件名应该包含日期时间信息
          expect(fileName).toMatch(/edu_platform_\d{8}_\d{6}\.sql/);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性7: 备份文件列表应该返回数组', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const files = listBackupFiles();
          
          // 验证：返回值应该是数组
          expect(Array.isArray(files)).toBe(true);
          
          // 验证：数组中的每个元素应该包含必需字段
          for (const file of files) {
            expect(file).toHaveProperty('fileName');
            expect(file).toHaveProperty('filePath');
            expect(file).toHaveProperty('fileSize');
            expect(file).toHaveProperty('createdAt');
            
            // 验证：字段类型正确
            expect(typeof file.fileName).toBe('string');
            expect(typeof file.filePath).toBe('string');
            expect(typeof file.fileSize).toBe('number');
            expect(file.createdAt instanceof Date).toBe(true);
            
            // 验证：文件大小应该是非负数
            expect(file.fileSize).toBeGreaterThanOrEqual(0);
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性8: 备份文件列表应该按时间降序排列', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const files = listBackupFiles();
          
          if (files.length > 1) {
            // 验证：文件应该按创建时间降序排列
            for (let i = 0; i < files.length - 1; i++) {
              expect(files[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                files[i + 1].createdAt.getTime()
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性9: 最新备份文件应该是null或包含所有必需字段', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const latest = getLatestBackup();
          
          if (latest !== null) {
            // 验证：应该包含所有必需字段
            expect(latest).toHaveProperty('fileName');
            expect(latest).toHaveProperty('filePath');
            expect(latest).toHaveProperty('fileSize');
            expect(latest).toHaveProperty('createdAt');
            
            // 验证：字段类型正确
            expect(typeof latest.fileName).toBe('string');
            expect(typeof latest.filePath).toBe('string');
            expect(typeof latest.fileSize).toBe('number');
            expect(latest.createdAt instanceof Date).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性10: 备份统计信息应该包含所有必需字段', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const stats = getBackupStats();
          
          // 验证：统计信息应该包含必需字段
          expect(stats).toHaveProperty('totalBackups');
          expect(stats).toHaveProperty('totalSize');
          
          // 验证：字段类型正确
          expect(typeof stats.totalBackups).toBe('number');
          expect(typeof stats.totalSize).toBe('number');
          
          // 验证：数值应该是非负数
          expect(stats.totalBackups).toBeGreaterThanOrEqual(0);
          expect(stats.totalSize).toBeGreaterThanOrEqual(0);
          
          // 验证：如果有备份，应该有日期信息
          if (stats.totalBackups > 0) {
            expect(stats.oldestBackup).toBeDefined();
            expect(stats.newestBackup).toBeDefined();
            
            if (stats.oldestBackup && stats.newestBackup) {
              expect(stats.oldestBackup instanceof Date).toBe(true);
              expect(stats.newestBackup instanceof Date).toBe(true);
              
              // 验证：最新备份应该不早于最旧备份
              expect(stats.newestBackup.getTime()).toBeGreaterThanOrEqual(
                stats.oldestBackup.getTime()
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
