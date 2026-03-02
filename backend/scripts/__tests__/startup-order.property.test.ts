/**
 * 属性测试：服务启动顺序正确性
 * Feature: smart-education-platform, Property 50: 服务启动顺序正确性
 * 验证需求：12.1
 * 
 * 属性：系统应按照 MySQL → Rust → Python → Node → Frontend 的顺序启动服务
 */

import * as fc from 'fast-check';
import {
  getStartupOrder,
  validateStartupOrder,
  validateServiceDefinitions,
  getServiceInfo,
  isPortInUse,
  verifyStartupSequence
} from '../startup-order.js';

describe('Property 50: 服务启动顺序正确性', () => {
  it('属性1: 服务启动顺序应该是固定的 MySQL(1) → Rust(2) → Python(3) → Node(4) → Frontend(5)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const startupOrder = getStartupOrder();
          
          // 验证：应该有5个服务
          expect(startupOrder.length).toBe(5);
          
          // 验证：服务顺序应该是 MySQL → Rust → Python → Node → Frontend
          expect(startupOrder[0].name).toBe('MySQL');
          expect(startupOrder[0].order).toBe(1);
          expect(startupOrder[0].port).toBe(3306);
          
          expect(startupOrder[1].name).toBe('Rust');
          expect(startupOrder[1].order).toBe(2);
          expect(startupOrder[1].port).toBe(8080);
          
          expect(startupOrder[2].name).toBe('Python');
          expect(startupOrder[2].order).toBe(3);
          expect(startupOrder[2].port).toBe(5000);
          
          expect(startupOrder[3].name).toBe('Node');
          expect(startupOrder[3].order).toBe(4);
          expect(startupOrder[3].port).toBe(3000);
          
          expect(startupOrder[4].name).toBe('Frontend');
          expect(startupOrder[4].order).toBe(5);
          expect(startupOrder[4].port).toBe(5173);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性2: 服务定义应该是有效的（无重复order、port、name）', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const validation = validateServiceDefinitions();
          
          // 验证：服务定义应该是有效的
          expect(validation.valid).toBe(true);
          
          // 验证：不应该有错误
          expect(validation.errors.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性3: 每个服务的order应该是连续的正整数', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const startupOrder = getStartupOrder();
          
          // 验证：order应该从1开始连续递增
          for (let i = 0; i < startupOrder.length; i++) {
            expect(startupOrder[i].order).toBe(i + 1);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性4: 服务信息查询应该返回正确的服务对象', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('MySQL', 'Rust', 'Python', 'Node', 'Frontend'),
        (serviceName) => {
          const serviceInfo = getServiceInfo(serviceName);
          
          // 验证：应该能找到服务
          expect(serviceInfo).toBeDefined();
          
          if (serviceInfo) {
            // 验证：服务名称应该匹配
            expect(serviceInfo.name).toBe(serviceName);
            
            // 验证：应该有有效的order和port
            expect(serviceInfo.order).toBeGreaterThan(0);
            expect(serviceInfo.order).toBeLessThanOrEqual(5);
            expect(serviceInfo.port).toBeGreaterThan(0);
            expect(serviceInfo.port).toBeLessThan(65536);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性5: 不存在的服务名应该返回undefined', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['MySQL', 'Rust', 'Python', 'Node', 'Frontend'].includes(s)),
        (invalidServiceName) => {
          const serviceInfo = getServiceInfo(invalidServiceName);
          
          // 验证：不存在的服务应该返回undefined
          expect(serviceInfo).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性6: 端口检查函数应该返回布尔值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1024, max: 65535 }),
        async (port) => {
          const result = await isPortInUse(port);
          
          // 验证：返回值应该是布尔类型
          expect(typeof result).toBe('boolean');
          
          return true;
        }
      ),
      { numRuns: 20 } // 减少运行次数，因为涉及网络操作
    );
  });

  it('属性7: 服务顺序验证应该正确识别有效和无效的顺序', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // 测试有效顺序
          const validOrder = getStartupOrder();
          expect(validateStartupOrder(validOrder)).toBe(true);
          
          // 测试无效顺序（顺序打乱）
          if (validOrder.length > 1) {
            const invalidOrder = [...validOrder];
            // 交换前两个元素
            [invalidOrder[0], invalidOrder[1]] = [invalidOrder[1], invalidOrder[0]];
            expect(validateStartupOrder(invalidOrder)).toBe(false);
          }
          
          // 测试不完整的顺序
          const incompleteOrder = validOrder.slice(0, 3);
          expect(validateStartupOrder(incompleteOrder)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性8: 启动顺序验证应该返回包含valid、runningServices和expectedOrder的对象', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const result = await verifyStartupSequence();
          
          // 验证：返回对象应该包含必需的字段
          expect(result).toHaveProperty('valid');
          expect(result).toHaveProperty('runningServices');
          expect(result).toHaveProperty('expectedOrder');
          
          // 验证：valid应该是布尔值
          expect(typeof result.valid).toBe('boolean');
          
          // 验证：runningServices应该是数组
          expect(Array.isArray(result.runningServices)).toBe(true);
          
          // 验证：expectedOrder应该是数组且长度为5
          expect(Array.isArray(result.expectedOrder)).toBe(true);
          expect(result.expectedOrder.length).toBe(5);
          
          // 验证：expectedOrder应该按order排序
          for (let i = 0; i < result.expectedOrder.length - 1; i++) {
            expect(result.expectedOrder[i].order).toBeLessThan(result.expectedOrder[i + 1].order);
          }
          
          return true;
        }
      ),
      { numRuns: 10 } // 减少运行次数，因为涉及网络操作
    );
  });

  it('属性9: 所有服务的端口号应该在有效范围内(1-65535)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const services = getStartupOrder();
          
          for (const service of services) {
            // 验证：端口号应该在有效范围内
            expect(service.port).toBeGreaterThan(0);
            expect(service.port).toBeLessThan(65536);
            
            // 验证：端口号应该是整数
            expect(Number.isInteger(service.port)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('属性10: 服务列表应该是不可变的（每次调用返回相同的顺序）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (iterations) => {
          const firstCall = getStartupOrder();
          
          for (let i = 0; i < iterations; i++) {
            const subsequentCall = getStartupOrder();
            
            // 验证：每次调用应该返回相同长度的数组
            expect(subsequentCall.length).toBe(firstCall.length);
            
            // 验证：每个服务的order应该相同
            for (let j = 0; j < firstCall.length; j++) {
              expect(subsequentCall[j].name).toBe(firstCall[j].name);
              expect(subsequentCall[j].order).toBe(firstCall[j].order);
              expect(subsequentCall[j].port).toBe(firstCall[j].port);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
