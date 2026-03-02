/**
 * 服务启动顺序管理模块
 * 确保服务按照正确的顺序启动：MySQL → Rust → Python → Node → Frontend
 */
/**
 * 服务定义
 */
export interface Service {
    name: string;
    port: number;
    order: number;
    command?: string;
    checkCommand?: string;
}
/**
 * 预定义的服务启动顺序
 */
export declare const SERVICES: Service[];
/**
 * 获取服务启动顺序
 */
export declare function getStartupOrder(): Service[];
/**
 * 验证服务顺序是否正确
 */
export declare function validateStartupOrder(services: Service[]): boolean;
/**
 * 检查端口是否被占用
 */
export declare function isPortInUse(port: number): Promise<boolean>;
/**
 * 检查服务是否正在运行
 */
export declare function isServiceRunning(service: Service): Promise<boolean>;
/**
 * 获取正在运行的服务列表
 */
export declare function getRunningServices(): Promise<Service[]>;
/**
 * 验证服务是否按正确顺序启动
 * 通过检查端口占用情况来推断启动顺序
 */
export declare function verifyStartupSequence(): Promise<{
    valid: boolean;
    runningServices: Service[];
    expectedOrder: Service[];
}>;
/**
 * 获取服务启动信息
 */
export declare function getServiceInfo(serviceName: string): Service | undefined;
/**
 * 检查所有服务是否已启动
 */
export declare function areAllServicesRunning(): Promise<boolean>;
/**
 * 获取下一个应该启动的服务
 */
export declare function getNextServiceToStart(): Promise<Service | null>;
/**
 * 验证服务启动顺序的完整性
 */
export declare function validateServiceDefinitions(): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=startup-order.d.ts.map