/**
 * 依赖下载镜像切换脚本
 * 功能：Python依赖下载失败时切换到清华镜像，Node.js依赖下载失败时切换到淘宝镜像
 * 需求：10.3, 10.4
 */
/**
 * 切换Python镜像源
 */
export declare function switchPythonMirror(): boolean;
/**
 * 切换npm镜像源
 */
export declare function switchNpmMirror(): boolean;
/**
 * 自动切换所有镜像源
 */
export declare function autoSwitchMirrors(): {
    python: boolean;
    npm: boolean;
};
/**
 * 获取镜像配置信息
 */
export declare function getMirrorInfo(): {
    python: {
        current: string | null;
        available: string[];
    };
    npm: {
        current: string | null;
        available: string[];
    };
};
//# sourceMappingURL=mirror-switcher.d.ts.map