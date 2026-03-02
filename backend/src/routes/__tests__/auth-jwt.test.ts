/**
 * 属性测试：JWT认证有效性
 * Feature: smart-education-platform, Property 32: JWT认证有效性
 * 验证需求：9.1
 * 
 * 属性32：JWT认证有效性
 * 对于任何用户登录，系统应生成JWT令牌，令牌有效期为24小时
 */

import fc from 'fast-check';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key';
const JWT_EXPIRES_IN = '24h';

// 模拟用户数据生成器
const userArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  username: fc.string({ minLength: 3, maxLength: 20 }),
  role: fc.constantFrom('teacher', 'student', 'parent')
});

describe('JWT认证有效性属性测试', () => {
  /**
   * 属性1：生成的令牌应该可以被验证
   * 对于任何用户数据，生成的JWT令牌应该能够被成功验证并还原原始数据
   */
  test('属性1：生成的令牌应该可以被验证', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          // 生成令牌
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // 验证令牌
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          
          // 验证数据一致性
          expect(decoded.id).toBe(user.id);
          expect(decoded.username).toBe(user.username);
          expect(decoded.role).toBe(user.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性2：令牌应该包含过期时间
   * 对于任何生成的令牌，应该包含exp字段表示过期时间
   */
  test('属性2：令牌应该包含过期时间', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const beforeTime = Math.floor(Date.now() / 1000);
          
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          
          // 应该有exp字段
          expect(decoded.exp).toBeDefined();
          expect(typeof decoded.exp).toBe('number');
          
          // 过期时间应该在未来
          expect(decoded.exp).toBeGreaterThan(beforeTime);
          
          // 过期时间应该大约是24小时后（允许1分钟误差）
          const expectedExpiry = beforeTime + 24 * 60 * 60;
          expect(Math.abs(decoded.exp - expectedExpiry)).toBeLessThan(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性3：相同用户数据生成的令牌应该不同
   * 对于任何用户数据，多次生成的令牌应该不同（因为iat时间戳不同）
   */
  test('属性3：相同用户数据生成的令牌应该不同', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        async (user) => {
          const token1 = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // 等待至少1100毫秒确保时间戳不同（JWT的iat精度是秒级）
          await new Promise(resolve => setTimeout(resolve, 1100));
          
          const token2 = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // 令牌应该不同
          expect(token1).not.toBe(token2);
          
          // 但解码后的用户数据应该相同
          const decoded1 = jwt.verify(token1, JWT_SECRET) as any;
          const decoded2 = jwt.verify(token2, JWT_SECRET) as any;
          
          expect(decoded1.id).toBe(decoded2.id);
          expect(decoded1.username).toBe(decoded2.username);
          expect(decoded1.role).toBe(decoded2.role);
          
          // iat应该不同（JWT的iat是秒级时间戳）
          expect(decoded1.iat).not.toBe(decoded2.iat);
        }
      ),
      { numRuns: 3 } // 优化：减少运行次数因为有1.1秒延迟
    );
  }, 20000); // 增加测试超时时间到20秒（3次 * 1.1秒 + 缓冲）

  /**
   * 属性4：错误的密钥应该无法验证令牌
   * 对于任何令牌，使用错误的密钥应该无法验证
   */
  test('属性4：错误的密钥应该无法验证令牌', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        fc.string({ minLength: 10, maxLength: 50 }), // 错误的密钥
        (user, wrongSecret) => {
          // 确保错误密钥不等于正确密钥
          if (wrongSecret === JWT_SECRET) return;
          
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // 使用错误密钥验证应该抛出错误
          expect(() => {
            jwt.verify(token, wrongSecret);
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性5：令牌应该包含签发时间
   * 对于任何生成的令牌，应该包含iat字段表示签发时间
   */
  test('属性5：令牌应该包含签发时间', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const beforeTime = Math.floor(Date.now() / 1000);
          
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          const afterTime = Math.floor(Date.now() / 1000);
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          
          // 应该有iat字段
          expect(decoded.iat).toBeDefined();
          expect(typeof decoded.iat).toBe('number');
          
          // 签发时间应该在生成令牌的时间范围内
          expect(decoded.iat).toBeGreaterThanOrEqual(beforeTime);
          expect(decoded.iat).toBeLessThanOrEqual(afterTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 具体测试：24小时有效期验证
   */
  test('具体场景：令牌有效期为24小时', () => {
    const user = {
      id: 1,
      username: 'testuser',
      role: 'student' as const
    };
    
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const expiryDuration = decoded.exp - decoded.iat;
    
    // 有效期应该是24小时（86400秒）
    expect(expiryDuration).toBe(24 * 60 * 60);
  });

  /**
   * 具体测试：角色验证
   */
  test('具体场景：令牌包含正确的角色信息', () => {
    const roles: Array<'teacher' | 'student' | 'parent'> = ['teacher', 'student', 'parent'];
    
    roles.forEach(role => {
      const user = {
        id: 1,
        username: 'testuser',
        role: role
      };
      
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.role).toBe(role);
    });
  });
});
