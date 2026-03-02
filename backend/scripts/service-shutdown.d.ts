/**
 * 服务关闭管理模块
 * 负责安全关闭所有服务并释放端口
 */
import { Service } from './startup-order.js';
/**
 * 服务关闭结果
 */
export interface ShutdownResult {
    service: string;
    port: number;
    stopped: boolean;
    portReleased: boolean;
    error?: string;
}
/**
 * 批量关闭结果
 */
export interface BatchShutdownResult {
    success: boolean;
    results: ShutdownResult[];
    totalStopped: number;
    totalPortsReleased: number;
}
/**
 * 查找占用指定端口的进程ID
 */
export declare function findProcessByPort(port: number): number[];
/**
 * 停止指定进程
 */
export declare function killProcess(pid: number): boolean;
/**
 * 停止占用指定端口的所有进程
 */
export declare function stopProcessesByPort(port: number): {
    stopped: number;
    failed: number;
};
/**
 * 停止MySQL服务
 */
export declare function stopMySQLService(): boolean;
/**
 * 停止单个服务
 */
export declare function stopService(service: Service): Promise<ShutdownResult>;
/**
 * 停止所有服务
 */
export declare function stopAllServices(): Promise<BatchShutdownResult>;
/**
 * 检查所有服务是否已停止
 */
export declare function areAllServicesStopped(): Promise<boolean>;
/**
 * 获取正在运行的服务端口列表
 */
export declare function getRunningPorts(): Promise<number[]>;
/**
 * 清理临时文件
 */
export declare function cleanupTempFiles(): {
    cleaned: string[];
    failed: string[];
};
//# sourceMappingURL=service-shutdown.d.ts.map