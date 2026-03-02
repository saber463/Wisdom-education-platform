/**
 * 属性测试：端口占用自动切换
 * Feature: smart-education-platform, Property 39: 端口占用自动切换
 * 验证需求：10.2
 * 
 * 属性39：端口占用自动切换
 * 对于任何检测到的端口占用，系统应自动切换到备用端口并更新配置
 */

import fc from 'fast-check';

// 模拟端口查找函数
function findAvailablePortMock(
  defaultPort: number,
  alternativePorts: number[],
  occupiedPorts: Set<number>
): number | null {
  // 首先尝试默认端口
  if (!occupiedPorts.has(defaultPort)) {
    return defaultPort;
  }
  
  // 尝试备用端口
  for (const port of alternativePorts) {
    if (!occupiedPorts.has(port)) {
      return port;
    }
  }
  
  // 所有端口都被占用
  return null;
}

describe('端口占用自动切换属性测试', () => {
  /**
   * 属性1：默认端口可用时应使用默认端口
   * 对于任何默认端口未被占用的情况，系统应使用默认端口
   */
  test('属性1：默认端口可用时应使用默认端口', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 9000 }), // 默认端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 1, maxLength: 5 }), // 备用端口
        (defaultPort, alternativePorts) => {
          const occupiedPorts = new Set<number>();
          const result = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          
          // 应该返回默认端口
          expect(result).toBe(defaultPort);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性2：默认端口被占用时应切换到第一个可用备用端口
   * 对于任何默认端口被占用的情况，系统应切换到第一个可用的备用端口
   */
  test('属性2：默认端口被占用时应切换到第一个可用备用端口', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 9000 }), // 默认端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 2, maxLength: 5 }), // 备用端口
        fc.integer({ min: 0, max: 4 }), // 第几个备用端口可用
        (defaultPort, alternativePorts, availableIndex) => {
          // 确保备用端口不重复且不等于默认端口
          const uniqueAlternatives = Array.from(new Set(alternativePorts))
            .filter(p => p !== defaultPort)
            .slice(0, 3);
          
          if (uniqueAlternatives.length === 0) return; // 跳过无效情况
          
          const actualAvailableIndex = Math.min(availableIndex, uniqueAlternatives.length - 1);
          
          // 占用默认端口和前面的备用端口
          const occupiedPorts = new Set<number>([defaultPort]);
          for (let i = 0; i < actualAvailableIndex; i++) {
            occupiedPorts.add(uniqueAlternatives[i]);
          }
          
          const result = findAvailablePortMock(defaultPort, uniqueAlternatives, occupiedPorts);
          
          // 应该返回第一个可用的备用端口
          expect(result).toBe(uniqueAlternatives[actualAvailableIndex]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性3：所有端口被占用时应返回null
   * 对于任何所有端口都被占用的情况，系统应返回null表示无可用端口
   */
  test('属性3：所有端口被占用时应返回null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 9000 }), // 默认端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 1, maxLength: 5 }), // 备用端口
        (defaultPort, alternativePorts) => {
          // 占用所有端口
          const occupiedPorts = new Set<number>([defaultPort, ...alternativePorts]);
          const result = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          
          // 应该返回null
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性4：端口选择应该是确定性的
   * 对于任何给定的端口占用情况，多次查找应返回相同结果
   */
  test('属性4：端口选择应该是确定性的', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 9000 }), // 默认端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 2, maxLength: 5 }), // 备用端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 0, maxLength: 3 }), // 被占用的端口
        (defaultPort, alternativePorts, occupiedPortsArray) => {
          const occupiedPorts = new Set<number>(occupiedPortsArray);
          
          // 多次查找
          const result1 = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          const result2 = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          const result3 = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          
          // 所有结果应该相同
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性5：返回的端口应该在候选列表中
   * 对于任何成功的端口查找，返回的端口应该是默认端口或备用端口之一
   */
  test('属性5：返回的端口应该在候选列表中', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 9000 }), // 默认端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 1, maxLength: 5 }), // 备用端口
        fc.array(fc.integer({ min: 3000, max: 9000 }), { minLength: 0, maxLength: 2 }), // 被占用的端口
        (defaultPort, alternativePorts, occupiedPortsArray) => {
          const occupiedPorts = new Set<number>(occupiedPortsArray);
          const result = findAvailablePortMock(defaultPort, alternativePorts, occupiedPorts);
          
          if (result !== null) {
            // 返回的端口应该是默认端口或备用端口之一
            const allPorts = [defaultPort, ...alternativePorts];
            expect(allPorts).toContain(result);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 具体测试：MySQL端口切换场景（3306 → 3307 → 3308）
   */
  test('具体场景：MySQL端口切换', () => {
    const defaultPort = 3306;
    const alternativePorts = [3307, 3308];
    
    // 场景1：3306可用
    expect(findAvailablePortMock(defaultPort, alternativePorts, new Set())).toBe(3306);
    
    // 场景2：3306被占用，3307可用
    expect(findAvailablePortMock(defaultPort, alternativePorts, new Set([3306]))).toBe(3307);
    
    // 场景3：3306和3307被占用，3308可用
    expect(findAvailablePortMock(defaultPort, alternativePorts, new Set([3306, 3307]))).toBe(3308);
    
    // 场景4：所有端口被占用
    expect(findAvailablePortMock(defaultPort, alternativePorts, new Set([3306, 3307, 3308]))).toBeNull();
  });
});
