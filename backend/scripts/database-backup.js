/**
 * 数据库备份管理模块
 * 负责数据库备份、恢复和管理
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
/**
 * 默认备份配置
 */
export const DEFAULT_BACKUP_CONFIG = {
    database: 'edu_education_platform',
    user: 'root',
    password: '',
    backupDir: path.resolve(__dirname, '..', '..', 'docs', 'sql', 'backup')
};
/**
 * 检查MySQL是否可用
 */
export function isMySQLAvailable() {
    try {
        execSync('mysql --version', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 检查mysqldump是否可用
 */
export function isMySQLDumpAvailable() {
    try {
        execSync('mysqldump --version', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 检查数据库是否存在
 */
export function databaseExists(config = DEFAULT_BACKUP_CONFIG) {
    try {
        const command = `mysql -u ${config.user} -e "USE ${config.database};"`;
        execSync(command, { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 确保备份目录存在
 */
export function ensureBackupDirectory(config = DEFAULT_BACKUP_CONFIG) {
    try {
        if (!fs.existsSync(config.backupDir)) {
            fs.mkdirSync(config.backupDir, { recursive: true });
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 生成备份文件名
 */
export function generateBackupFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `edu_platform_${year}${month}${day}_${hour}${minute}${second}.sql`;
}
/**
 * 执行数据库备份
 */
export function backupDatabase(config = DEFAULT_BACKUP_CONFIG) {
    const result = {
        success: false,
        timestamp: new Date()
    };
    try {
        // 检查MySQL和mysqldump是否可用
        if (!isMySQLAvailable() || !isMySQLDumpAvailable()) {
            result.error = 'MySQL或mysqldump不可用';
            return result;
        }
        // 检查数据库是否存在
        if (!databaseExists(config)) {
            result.error = '数据库不存在';
            return result;
        }
        // 确保备份目录存在
        if (!ensureBackupDirectory(config)) {
            result.error = '无法创建备份目录';
            return result;
        }
        // 生成备份文件路径
        const fileName = generateBackupFileName();
        const filePath = path.join(config.backupDir, fileName);
        // 执行备份
        const passwordArg = config.password ? `-p${config.password}` : '';
        const command = `mysqldump -u ${config.user} ${passwordArg} --databases ${config.database} --add-drop-database --add-drop-table --routines --triggers --events > "${filePath}"`;
        execSync(command, { stdio: 'ignore' });
        // 验证备份文件
        if (!fs.existsSync(filePath)) {
            result.error = '备份文件未生成';
            return result;
        }
        const stats = fs.statSync(filePath);
        if (stats.size < 1024) {
            result.error = '备份文件太小，可能备份失败';
            return result;
        }
        result.success = true;
        result.filePath = filePath;
        result.fileSize = stats.size;
    }
    catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
    }
    return result;
}
/**
 * 获取所有备份文件
 */
export function listBackupFiles(config = DEFAULT_BACKUP_CONFIG) {
    const backupFiles = [];
    try {
        if (!fs.existsSync(config.backupDir)) {
            return backupFiles;
        }
        const files = fs.readdirSync(config.backupDir);
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(config.backupDir, file);
                const stats = fs.statSync(filePath);
                backupFiles.push({
                    fileName: file,
                    filePath,
                    fileSize: stats.size,
                    createdAt: stats.birthtime
                });
            }
        }
        // 按创建时间降序排序
        backupFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    catch {
        // 返回空数组
    }
    return backupFiles;
}
/**
 * 删除旧备份文件
 */
export function cleanupOldBackups(keepCount = 10, config = DEFAULT_BACKUP_CONFIG) {
    const result = {
        deleted: 0,
        kept: 0
    };
    try {
        const backupFiles = listBackupFiles(config);
        if (backupFiles.length <= keepCount) {
            result.kept = backupFiles.length;
            return result;
        }
        // 保留最新的keepCount个文件，删除其余的
        for (let i = 0; i < backupFiles.length; i++) {
            if (i < keepCount) {
                result.kept++;
            }
            else {
                try {
                    fs.unlinkSync(backupFiles[i].filePath);
                    result.deleted++;
                }
                catch {
                    // 删除失败，继续
                }
            }
        }
    }
    catch {
        // 返回默认结果
    }
    return result;
}
/**
 * 获取最新的备份文件
 */
export function getLatestBackup(config = DEFAULT_BACKUP_CONFIG) {
    const backupFiles = listBackupFiles(config);
    return backupFiles.length > 0 ? backupFiles[0] : null;
}
/**
 * 验证备份文件
 */
export function validateBackupFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                valid: false,
                error: '文件不存在'
            };
        }
        const stats = fs.statSync(filePath);
        if (stats.size < 1024) {
            return {
                valid: false,
                fileSize: stats.size,
                error: '文件太小'
            };
        }
        // 检查文件内容是否包含SQL关键字
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasSQLKeywords = content.includes('CREATE TABLE') ||
            content.includes('INSERT INTO') ||
            content.includes('DROP DATABASE');
        if (!hasSQLKeywords) {
            return {
                valid: false,
                fileSize: stats.size,
                error: '文件内容无效'
            };
        }
        return {
            valid: true,
            fileSize: stats.size
        };
    }
    catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * 获取备份统计信息
 */
export function getBackupStats(config = DEFAULT_BACKUP_CONFIG) {
    const backupFiles = listBackupFiles(config);
    const totalSize = backupFiles.reduce((sum, file) => sum + file.fileSize, 0);
    return {
        totalBackups: backupFiles.length,
        totalSize,
        oldestBackup: backupFiles.length > 0 ? backupFiles[backupFiles.length - 1].createdAt : undefined,
        newestBackup: backupFiles.length > 0 ? backupFiles[0].createdAt : undefined
    };
}
//# sourceMappingURL=database-backup.js.map