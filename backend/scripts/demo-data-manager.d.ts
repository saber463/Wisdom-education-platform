/**
 * 演示数据管理模块
 * 负责演示数据的重置、验证和统计
 */
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
export declare const DEFAULT_DB_CONFIG: DatabaseConfig;
/**
 * SQL文件路径
 */
export declare const SQL_FILES: {
    schema: string;
    testData: string;
    extendedBank: string;
};
/**
 * 检查MySQL是否可用
 */
export declare function isMySQLAvailable(): boolean;
/**
 * 检查数据库是否存在
 */
export declare function databaseExists(config?: DatabaseConfig): boolean;
/**
 * 检查SQL文件是否存在
 */
export declare function checkSQLFiles(): {
    schema: boolean;
    testData: boolean;
    extendedBank: boolean;
};
/**
 * 删除数据库
 */
export declare function dropDatabase(config?: DatabaseConfig): boolean;
/**
 * 创建数据库
 */
export declare function createDatabase(config?: DatabaseConfig): boolean;
/**
 * 导入SQL文件
 */
export declare function importSQLFile(filePath: string, config?: DatabaseConfig): boolean;
/**
 * 获取表数量
 */
export declare function getTableCount(config?: DatabaseConfig): number;
/**
 * 获取表中的记录数
 */
export declare function getRecordCount(tableName: string, config?: DatabaseConfig): number;
/**
 * 获取演示数据统计
 */
export declare function getDemoDataStats(config?: DatabaseConfig): DemoDataStats;
/**
 * 重置演示数据
 */
export declare function resetDemoData(config?: DatabaseConfig): {
    success: boolean;
    steps: {
        dropDatabase: boolean;
        createDatabase: boolean;
        importSchema: boolean;
        importTestData: boolean;
        importExtendedBank: boolean;
    };
    stats?: DemoDataStats;
};
/**
 * 验证演示数据完整性
 */
export declare function validateDemoData(config?: DatabaseConfig): {
    valid: boolean;
    errors: string[];
    stats: DemoDataStats;
};
//# sourceMappingURL=demo-data-manager.d.ts.map