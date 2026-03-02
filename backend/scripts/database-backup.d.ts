/**
 * 数据库备份管理模块
 * 负责数据库备份、恢复和管理
 */
/**
 * 备份配置
 */
export interface BackupConfig {
    database: string;
    user: string;
    password?: string;
    backupDir: string;
}
/**
 * 备份结果
 */
export interface BackupResult {
    success: boolean;
    filePath?: string;
    fileSize?: number;
    error?: string;
    timestamp: Date;
}
/**
 * 备份文件信息
 */
export interface BackupFileInfo {
    fileName: string;
    filePath: string;
    fileSize: number;
    createdAt: Date;
}
/**
 * 默认备份配置
 */
export declare const DEFAULT_BACKUP_CONFIG: BackupConfig;
/**
 * 检查MySQL是否可用
 */
export declare function isMySQLAvailable(): boolean;
/**
 * 检查mysqldump是否可用
 */
export declare function isMySQLDumpAvailable(): boolean;
/**
 * 检查数据库是否存在
 */
export declare function databaseExists(config?: BackupConfig): boolean;
/**
 * 确保备份目录存在
 */
export declare function ensureBackupDirectory(config?: BackupConfig): boolean;
/**
 * 生成备份文件名
 */
export declare function generateBackupFileName(): string;
/**
 * 执行数据库备份
 */
export declare function backupDatabase(config?: BackupConfig): BackupResult;
/**
 * 获取所有备份文件
 */
export declare function listBackupFiles(config?: BackupConfig): BackupFileInfo[];
/**
 * 删除旧备份文件
 */
export declare function cleanupOldBackups(keepCount?: number, config?: BackupConfig): {
    deleted: number;
    kept: number;
};
/**
 * 获取最新的备份文件
 */
export declare function getLatestBackup(config?: BackupConfig): BackupFileInfo | null;
/**
 * 验证备份文件
 */
export declare function validateBackupFile(filePath: string): {
    valid: boolean;
    fileSize?: number;
    error?: string;
};
/**
 * 获取备份统计信息
 */
export declare function getBackupStats(config?: BackupConfig): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
};
//# sourceMappingURL=database-backup.d.ts.map