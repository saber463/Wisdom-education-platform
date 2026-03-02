/**
 * 应急修复模块
 * 提供系统诊断和自动修复功能
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { stopProcessesByPort } from './service-shutdown.js';
import { isPortInUse, SERVICES } from './startup-order.js';
/**
 * 清理占用端口的进程
 */
export async function clearOccupiedPorts() {
    const details = [];
    let totalCleared = 0;
    for (const service of SERVICES) {
        const inUse = await isPortInUse(service.port);
        if (inUse) {
            const result = stopProcessesByPort(service.port);
            if (result.stopped > 0) {
                totalCleared += result.stopped;
                details.push(`端口 ${service.port} (${service.name}): 已清理 ${result.stopped} 个进程`);
            }
        }
    }
    return {
        step: '清理占用端口',
        success: true,
        message: `已清理 ${totalCleared} 个占用端口的进程`,
        details
    };
}
/**
 * 清理临时文件和缓存
 */
export function cleanupTempFilesAndCache() {
    const details = [];
    const pathsToClean = [
        'backend/node_modules/.cache',
        'frontend/node_modules/.cache',
        'python-ai/__pycache__',
        'python-ai/tests/__pycache__',
        'rust-service/target/debug'
    ];
    let cleaned = 0;
    let failed = 0;
    for (const cleanPath of pathsToClean) {
        try {
            const fullPath = path.resolve(process.cwd(), '..', cleanPath);
            if (fs.existsSync(fullPath)) {
                if (process.platform === 'win32') {
                    execSync(`rd /S /Q "${fullPath}"`, { stdio: 'ignore' });
                }
                else {
                    execSync(`rm -rf "${fullPath}"`, { stdio: 'ignore' });
                }
                cleaned++;
                details.push(`已清理: ${cleanPath}`);
            }
        }
        catch {
            failed++;
            details.push(`清理失败: ${cleanPath}`);
        }
    }
    return {
        step: '清理临时文件',
        success: failed === 0,
        message: `已清理 ${cleaned} 个缓存目录，${failed} 个失败`,
        details
    };
}
/**
 * 检查MySQL连接
 */
export function checkMySQLConnection() {
    const details = [];
    try {
        // 检查MySQL是否安装
        execSync('mysql --version', { stdio: 'ignore' });
        details.push('MySQL已安装');
        // 尝试连接数据库
        try {
            execSync('mysql -u root -e "SELECT 1;"', { stdio: 'ignore' });
            details.push('数据库连接正常');
            // 刷新权限
            try {
                execSync('mysql -u root -e "FLUSH PRIVILEGES;"', { stdio: 'ignore' });
                details.push('数据库权限已刷新');
            }
            catch {
                details.push('权限刷新失败');
            }
            // 检查数据库是否存在
            try {
                execSync('mysql -u root -e "USE edu_education_platform;"', { stdio: 'ignore' });
                details.push('数据库 edu_education_platform 存在');
            }
            catch {
                details.push('数据库不存在，需要初始化');
            }
            return {
                step: '数据库连接检查',
                success: true,
                message: '数据库连接正常',
                details
            };
        }
        catch {
            details.push('无法连接到MySQL');
            return {
                step: '数据库连接检查',
                success: false,
                message: '数据库连接失败',
                details
            };
        }
    }
    catch {
        details.push('MySQL未安装');
        return {
            step: '数据库连接检查',
            success: false,
            message: 'MySQL未安装',
            details
        };
    }
}
/**
 * 检查依赖完整性
 */
export function checkDependencies() {
    const details = [];
    let allComplete = true;
    // 检查Node.js后端依赖
    const backendNodeModules = path.resolve(process.cwd(), '..', 'backend', 'node_modules');
    if (fs.existsSync(backendNodeModules)) {
        details.push('Node.js后端依赖完整');
    }
    else {
        details.push('Node.js后端依赖缺失');
        allComplete = false;
    }
    // 检查前端依赖
    const frontendNodeModules = path.resolve(process.cwd(), '..', 'frontend', 'node_modules');
    if (fs.existsSync(frontendNodeModules)) {
        details.push('前端依赖完整');
    }
    else {
        details.push('前端依赖缺失');
        allComplete = false;
    }
    // 检查Python依赖
    try {
        execSync('python -c "import flask"', { stdio: 'ignore' });
        details.push('Python依赖完整');
    }
    catch {
        details.push('Python依赖缺失');
        allComplete = false;
    }
    // 检查Rust
    try {
        execSync('rustc --version', { stdio: 'ignore' });
        details.push('Rust已安装');
    }
    catch {
        details.push('Rust未安装');
        allComplete = false;
    }
    return {
        step: '依赖完整性检查',
        success: allComplete,
        message: allComplete ? '所有依赖完整' : '部分依赖缺失',
        details
    };
}
/**
 * 检查并创建配置文件
 */
export function checkAndCreateConfigFiles() {
    const details = [];
    let created = 0;
    const configPairs = [
        { example: 'backend/.env.example', target: 'backend/.env' },
        { example: 'python-ai/.env.example', target: 'python-ai/.env' },
        { example: 'rust-service/.env.example', target: 'rust-service/.env' }
    ];
    for (const pair of configPairs) {
        const examplePath = path.resolve(process.cwd(), '..', pair.example);
        const targetPath = path.resolve(process.cwd(), '..', pair.target);
        if (fs.existsSync(examplePath)) {
            if (!fs.existsSync(targetPath)) {
                try {
                    fs.copyFileSync(examplePath, targetPath);
                    created++;
                    details.push(`已创建: ${pair.target}`);
                }
                catch {
                    details.push(`创建失败: ${pair.target}`);
                }
            }
            else {
                details.push(`已存在: ${pair.target}`);
            }
        }
    }
    return {
        step: '配置文件检查',
        success: true,
        message: created > 0 ? `已创建 ${created} 个配置文件` : '所有配置文件已存在',
        details
    };
}
/**
 * 执行完整的应急修复
 */
export async function performEmergencyRepair() {
    const results = [];
    // 1. 清理占用端口
    results.push(await clearOccupiedPorts());
    // 2. 清理临时文件
    results.push(cleanupTempFilesAndCache());
    // 3. 检查数据库连接
    results.push(checkMySQLConnection());
    // 4. 检查依赖完整性
    results.push(checkDependencies());
    // 5. 检查配置文件
    results.push(checkAndCreateConfigFiles());
    const totalFixed = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;
    return {
        success: totalFailed === 0,
        results,
        totalFixed,
        totalFailed
    };
}
/**
 * 获取系统诊断信息
 */
export async function getDiagnosticInfo() {
    const portsInUse = [];
    for (const service of SERVICES) {
        const inUse = await isPortInUse(service.port);
        if (inUse) {
            portsInUse.push(service.port);
        }
    }
    let mysqlAvailable = false;
    try {
        execSync('mysql --version', { stdio: 'ignore' });
        mysqlAvailable = true;
    }
    catch {
        // MySQL not available
    }
    const depCheck = checkDependencies();
    const dependenciesComplete = depCheck.success;
    const configCheck = checkAndCreateConfigFiles();
    const configFilesExist = configCheck.details?.every(d => d.includes('已存在') || d.includes('已创建')) || false;
    return {
        portsInUse,
        mysqlAvailable,
        dependenciesComplete,
        configFilesExist
    };
}
//# sourceMappingURL=emergency-repair.js.map