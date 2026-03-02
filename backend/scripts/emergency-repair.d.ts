/**
 * 应急修复模块
 * 提供系统诊断和自动修复功能
 */
/**
 * 修复结果
 */
export interface RepairResult {
    step: string;
    success: boolean;
    message: string;
    details?: string[];
}
/**
 * 批量修复结果
 */
export interface BatchRepairResult {
    success: boolean;
    results: RepairResult[];
    totalFixed: number;
    totalFailed: number;
}
/**
 * 清理占用端口的进程
 */
export declare function clearOccupiedPorts(): Promise<RepairResult>;
/**
 * 清理临时文件和缓存
 */
export declare function cleanupTempFilesAndCache(): RepairResult;
/**
 * 检查MySQL连接
 */
export declare function checkMySQLConnection(): RepairResult;
/**
 * 检查依赖完整性
 */
export declare function checkDependencies(): RepairResult;
/**
 * 检查并创建配置文件
 */
export declare function checkAndCreateConfigFiles(): RepairResult;
/**
 * 执行完整的应急修复
 */
export declare function performEmergencyRepair(): Promise<BatchRepairResult>;
/**
 * 获取系统诊断信息
 */
export declare function getDiagnosticInfo(): Promise<{
    portsInUse: number[];
    mysqlAvailable: boolean;
    dependenciesComplete: boolean;
    configFilesExist: boolean;
}>;
//# sourceMappingURL=emergency-repair.d.ts.map