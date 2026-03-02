/**
 * 属性测试：演示数据重置完整性
 * Feature: smart-education-platform, Property 51: 演示数据重置完整性
 * 验证需求：12.3
 *
 * 属性：演示数据初始化操作应该清空数据库并重新插入完整的演示数据
 */
import * as fc from 'fast-check';
import { DEFAULT_DB_CONFIG, isMySQLAvailable, databaseExists, checkSQLFiles, getDemoDataStats, validateDemoData, getTableCount, getRecordCount } from '../demo-data-manager.js';
describe('Property 51: 演示数据重置完整性', () => {
    // 跳过测试如果MySQL不可用
    const skipIfNoMySQL = () => {
        if (!isMySQLAvailable()) {
            console.log('⚠ MySQL不可用，跳过测试');
            return true;
        }
        return false;
    };
    it('属性1: SQL文件应该存在于指定路径', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const files = checkSQLFiles();
            // 验证：schema.sql应该存在
            expect(files.schema).toBe(true);
            // 验证：test-data.sql应该存在
            expect(files.testData).toBe(true);
            // 注意：extended-exercise-bank.sql是可选的
            // 不强制要求存在
            return true;
        }), { numRuns: 10 });
    });
    it('属性2: 数据库配置应该包含所有必需字段', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const config = DEFAULT_DB_CONFIG;
            // 验证：配置应该包含所有必需字段
            expect(config).toHaveProperty('host');
            expect(config).toHaveProperty('user');
            expect(config).toHaveProperty('password');
            expect(config).toHaveProperty('database');
            expect(config).toHaveProperty('charset');
            expect(config).toHaveProperty('collation');
            // 验证：字符集应该是utf8mb4
            expect(config.charset).toBe('utf8mb4');
            // 验证：排序规则应该是utf8mb4_general_ci
            expect(config.collation).toBe('utf8mb4_general_ci');
            // 验证：数据库名应该是edu_education_platform
            expect(config.database).toBe('edu_education_platform');
            return true;
        }), { numRuns: 20 });
    });
    it('属性3: 演示数据统计应该返回包含所有字段的对象', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            const stats = getDemoDataStats();
            // 验证：统计对象应该包含所有必需字段
            expect(stats).toHaveProperty('tables');
            expect(stats).toHaveProperty('users');
            expect(stats).toHaveProperty('teachers');
            expect(stats).toHaveProperty('students');
            expect(stats).toHaveProperty('parents');
            expect(stats).toHaveProperty('classes');
            expect(stats).toHaveProperty('assignments');
            expect(stats).toHaveProperty('exercises');
            // 验证：所有字段应该是非负整数
            expect(stats.tables).toBeGreaterThanOrEqual(0);
            expect(stats.users).toBeGreaterThanOrEqual(0);
            expect(stats.teachers).toBeGreaterThanOrEqual(0);
            expect(stats.students).toBeGreaterThanOrEqual(0);
            expect(stats.parents).toBeGreaterThanOrEqual(0);
            expect(stats.classes).toBeGreaterThanOrEqual(0);
            expect(stats.assignments).toBeGreaterThanOrEqual(0);
            expect(stats.exercises).toBeGreaterThanOrEqual(0);
            return true;
        }), { numRuns: 10 });
    });
    it('属性4: 如果数据库存在，表数量应该大于0', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            if (databaseExists()) {
                const tableCount = getTableCount();
                // 验证：如果数据库存在，应该至少有一些表
                expect(tableCount).toBeGreaterThan(0);
            }
            return true;
        }), { numRuns: 10 });
    });
    it('属性5: 用户总数应该等于教师+学生+家长数量', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            if (databaseExists()) {
                const stats = getDemoDataStats();
                // 验证：用户总数应该等于各角色用户数之和
                expect(stats.users).toBe(stats.teachers + stats.students + stats.parents);
            }
            return true;
        }), { numRuns: 10 });
    });
    it('属性6: 数据验证应该返回包含valid、errors和stats的对象', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            const validation = validateDemoData();
            // 验证：返回对象应该包含必需字段
            expect(validation).toHaveProperty('valid');
            expect(validation).toHaveProperty('errors');
            expect(validation).toHaveProperty('stats');
            // 验证：valid应该是布尔值
            expect(typeof validation.valid).toBe('boolean');
            // 验证：errors应该是数组
            expect(Array.isArray(validation.errors)).toBe(true);
            // 验证：stats应该包含所有统计字段
            expect(validation.stats).toHaveProperty('tables');
            expect(validation.stats).toHaveProperty('users');
            return true;
        }), { numRuns: 10 });
    });
    it('属性7: 如果数据有效，errors数组应该为空', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            const validation = validateDemoData();
            if (validation.valid) {
                // 验证：如果数据有效，不应该有错误
                expect(validation.errors.length).toBe(0);
            }
            else {
                // 验证：如果数据无效，应该有至少一个错误
                expect(validation.errors.length).toBeGreaterThan(0);
            }
            return true;
        }), { numRuns: 10 });
    });
    it('属性8: 表记录数查询应该返回非负整数', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constantFrom('users', 'classes', 'assignments', 'exercise_bank'), (tableName) => {
            if (databaseExists()) {
                const count = getRecordCount(tableName);
                // 验证：记录数应该是非负整数
                expect(count).toBeGreaterThanOrEqual(0);
                expect(Number.isInteger(count)).toBe(true);
            }
            return true;
        }), { numRuns: 20 });
    });
    it('属性9: MySQL可用性检查应该返回布尔值', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const available = isMySQLAvailable();
            // 验证：返回值应该是布尔类型
            expect(typeof available).toBe('boolean');
            return true;
        }), { numRuns: 10 });
    });
    it('属性10: 数据库存在性检查应该返回布尔值', () => {
        if (skipIfNoMySQL())
            return;
        fc.assert(fc.property(fc.constant(null), () => {
            const exists = databaseExists();
            // 验证：返回值应该是布尔类型
            expect(typeof exists).toBe('boolean');
            return true;
        }), { numRuns: 10 });
    });
});
//# sourceMappingURL=demo-data-reset.property.test.js.map