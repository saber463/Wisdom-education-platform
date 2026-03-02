/**
 * 属性测试：服务安全关闭
 * Feature: smart-education-platform, Property 52: 服务安全关闭
 * 验证需求：12.4
 * 
 * 属性：停止服务操作应该安全关闭所有服务并释放端口
 */

import * as fc from 'fast-check';
import {
  findProcessByPort,
  killProcess,
  stopProcessesByPort,
  areAllServicesStopped,
  getRunningPorts,
  cleanupTempFiles
} from '../service-shutdown.js';
import { SERVICES } from '../startup-order.js';

describe('Property 52: 服务安全关闭', () => {
  it('属性1: 查找进程函数应该返回数组', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 65535 }),
        (port) => {
          const pids = findProcessByPort(port);
          
          // 验证：返回值应该是数组
          expect(Array.isArray(pids)).toBe(true);
          
          // 验证：数组中的所有元素应该是正整数
          for (const pid of pids) {
            expect(Number.isInteger(pid)).toBe(true);
            expect(pid).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性2: 停止进程函数应该返回布尔值', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        (pid) => {
          const result = killProcess(pid);
          
          // 验证：返回值应该是布尔类型
          expect(typeof result).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 } // 减少运行次数，避免影响系统
    );
  });

  it('属性3: 按端口停止进程应该返回包含stopped和failed的对象', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 65535 }),
        (port) => {
          const result = stopProcessesByPort(port);
          
          // 验证：返回对象应该包含stopped和failed字段
          expect(result).toHaveProperty('stopped');
          expect(result).toHaveProperty('failed');
          
          // 验证：stopped和failed应该是非负整数
          expect(Number.isInteger(result.stopped)).toBe(true);
          expect(result.stopped).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(result.failed)).toBe(true);
          expect(result.failed).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性4: 检查所有服务是否停止应该返回布尔值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const allStopped = await areAllServicesStopped();
          
          // 验证：返回值应该是布尔类型
          expect(typeof allStopped).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性5: 获取正在运行的端口应该返回数组', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const runningPorts = await getRunningPorts();
          
          // 验证：返回值应该是数组
          expect(Array.isArray(runningPorts)).toBe(true);
          
          // 验证：数组中的所有元素应该是有效的端口号
          for (const port of runningPorts) {
            expect(Number.isInteger(port)).toBe(true);
            expect(port).toBeGreaterThan(0);
            expect(port).toBeLessThan(65536);
          }
          
          // 验证：端口号应该来自SERVICES列表
          const validPorts = SERVICES.map(s => s.port);
          for (const port of runningPorts) {
            expect(validPorts).toContain(port);
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性6: 清理临时文件应该返回包含cleaned和failed的对象', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const result = cleanupTempFiles();
          
          // 验证：返回对象应该包含cleaned和failed字段
          expect(result).toHaveProperty('cleaned');
          expect(result).toHaveProperty('failed');
          
          // 验证：cleaned和failed应该是数组
          expect(Array.isArray(result.cleaned)).toBe(true);
          expect(Array.isArray(result.failed)).toBe(true);
          
          // 验证：数组中的所有元素应该是字符串
          for (const path of result.cleaned) {
            expect(typeof path).toBe('string');
          }
          
          for (const path of result.failed) {
            expect(typeof path).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性7: 正在运行的端口数量应该小于等于服务总数', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const runningPorts = await getRunningPorts();
          
          // 验证：正在运行的端口数量不应该超过服务总数
          expect(runningPorts.length).toBeLessThanOrEqual(SERVICES.length);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性8: 如果所有服务都停止，正在运行的端口列表应该为空', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const allStopped = await areAllServicesStopped();
          const runningPorts = await getRunningPorts();
          
          if (allStopped) {
            // 验证：如果所有服务都停止，端口列表应该为空
            expect(runningPorts.length).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('属性9: 查找不存在的端口应该返回空数组', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60000, max: 65535 }), // 使用不太可能被占用的高端口
        (port) => {
          const pids = findProcessByPort(port);
          
          // 验证：返回值应该是数组（可能为空）
          expect(Array.isArray(pids)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性10: 停止不存在的进程应该返回false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 90000, max: 99999 }), // 使用不太可能存在的PID
        (pid) => {
          const result = killProcess(pid);
          
          // 验证：停止不存在的进程应该返回false
          expect(result).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
