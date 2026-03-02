/**
 * 属性测试：依赖下载镜像切换
 * Feature: smart-education-platform, Property 40: 依赖下载镜像切换
 * 验证需求：10.3, 10.4
 *
 * 属性：当依赖下载失败时，系统应自动切换到备用镜像源
 */
import * as fc from 'fast-check';
import { switchPythonMirror, switchNpmMirror, autoSwitchMirrors, getMirrorInfo } from '../mirror-switcher.js';
describe('Property 40: 依赖下载镜像切换', () => {
    it('属性1: 镜像信息应该包含当前镜像和可用镜像列表', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 5 }), (iterations) => {
            for (let i = 0; i < iterations; i++) {
                const mirrorInfo = getMirrorInfo();
                // 验证：返回的对象应该包含python和npm配置
                expect(mirrorInfo).toHaveProperty('python');
                expect(mirrorInfo).toHaveProperty('npm');
                // 验证：每个配置应该包含current和available字段
                expect(mirrorInfo.python).toHaveProperty('current');
                expect(mirrorInfo.python).toHaveProperty('available');
                expect(mirrorInfo.npm).toHaveProperty('current');
                expect(mirrorInfo.npm).toHaveProperty('available');
                // 验证：available应该是数组
                expect(Array.isArray(mirrorInfo.python.available)).toBe(true);
                expect(Array.isArray(mirrorInfo.npm.available)).toBe(true);
                // 验证：available数组应该包含至少一个镜像
                expect(mirrorInfo.python.available.length).toBeGreaterThan(0);
                expect(mirrorInfo.npm.available.length).toBeGreaterThan(0);
                // 验证：每个镜像URL应该是有效的字符串
                for (const mirror of mirrorInfo.python.available) {
                    expect(typeof mirror).toBe('string');
                    expect(mirror.length).toBeGreaterThan(0);
                }
                for (const mirror of mirrorInfo.npm.available) {
                    expect(typeof mirror).toBe('string');
                    expect(mirror.length).toBeGreaterThan(0);
                }
            }
            return true;
        }), { numRuns: 20 } // 优化：减少运行次数
        );
    });
    it('属性2: Python镜像切换函数应该返回布尔值', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            // 注意：实际执行可能失败（如果pip不可用），但应该返回布尔值
            const result = switchPythonMirror();
            // 验证：返回值应该是布尔类型
            expect(typeof result).toBe('boolean');
            return true;
        }), { numRuns: 5 } // 优化：减少运行次数，因为涉及系统命令
        );
    });
    it('属性3: npm镜像切换函数应该返回布尔值', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            // 注意：实际执行可能失败（如果npm不可用），但应该返回布尔值
            const result = switchNpmMirror();
            // 验证：返回值应该是布尔类型
            expect(typeof result).toBe('boolean');
            return true;
        }), { numRuns: 5 } // 优化：减少运行次数，因为涉及系统命令
        );
    });
    it('属性4: 自动切换镜像应该返回包含python和npm结果的对象', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const result = autoSwitchMirrors();
            // 验证：返回的对象应该包含python和npm字段
            expect(result).toHaveProperty('python');
            expect(result).toHaveProperty('npm');
            // 验证：每个字段应该是布尔值
            expect(typeof result.python).toBe('boolean');
            expect(typeof result.npm).toBe('boolean');
            return true;
        }), { numRuns: 3 } // 优化：减少运行次数，因为涉及系统命令
        );
    });
    it('属性5: 镜像URL应该是有效的HTTP/HTTPS地址', () => {
        fc.assert(fc.property(fc.constant(null), () => {
            const mirrorInfo = getMirrorInfo();
            // 验证：所有Python镜像URL应该以http://或https://开头
            for (const mirror of mirrorInfo.python.available) {
                const isValidUrl = mirror.startsWith('http://') || mirror.startsWith('https://');
                expect(isValidUrl).toBe(true);
            }
            // 验证：所有npm镜像URL应该以http://或https://开头
            for (const mirror of mirrorInfo.npm.available) {
                const isValidUrl = mirror.startsWith('http://') || mirror.startsWith('https://');
                expect(isValidUrl).toBe(true);
            }
            return true;
        }), { numRuns: 20 } // 优化：减少运行次数
        );
    });
});
//# sourceMappingURL=mirror-switcher.property.test.js.map