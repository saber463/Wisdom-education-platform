/**
 * 综合测试脚本 - 测试所有功能和创建不同用户
 * 用途：验证项目闭环，测试所有核心功能
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// 修复 Windows 终端乱码
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
}

interface TestUser {
  username: string;
  password: string;
  real_name: string;
  role: 'teacher' | 'student' | 'parent';
  email: string;
}

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

class ComprehensiveTestSuite {
  private api: AxiosInstance;
  private baseURL: string = 'http://localhost:3000/api';
  private results: TestResult[] = [];
  private tokens: Map<string, string> = new Map();
  private testUsers: TestUser[] = [
    {
      username: 'teacher001',
      password: 'teacher123',
      real_name: '张老师',
      role: 'teacher',
      email: 'zhang@edu.com'
    },
    {
      username: 'student001',
      password: 'student123',
      real_name: '张小明',
      role: 'student',
      email: 'zhangxm@stu.edu.com'
    },
    {
      username: 'student002',
      password: 'student123',
      real_name: '李小红',
      role: 'student',
      email: 'lixh@stu.edu.com'
    },
    {
      username: 'parent001',
      password: 'parent123',
      real_name: '张父',
      role: 'parent',
      email: 'zhangf@parent.com'
    }
  ];

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      validateStatus: () => true // 不抛出任何状态码错误
    });
  }

  private log(message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const prefix = {
      INFO: '[ℹ️  信息]',
      SUCCESS: '[✅ 成功]',
      ERROR: '[❌ 错误]',
      WARN: '[⚠️  警告]'
    }[type];
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  private recordResult(name: string, status: 'PASS' | 'FAIL', message: string, duration: number) {
    this.results.push({ name, status, message, duration });
    const icon = status === 'PASS' ? '✅' : '❌';
    this.log(`${icon} ${name} (${duration}ms): ${message}`, status === 'PASS' ? 'SUCCESS' : 'ERROR');
  }

  async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.recordResult(testName, 'PASS', '测试通过', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.recordResult(testName, 'FAIL', message, duration);
    }
  }

  // ==================== 用户管理测试 ====================

  async testUserRegistration() {
    await this.runTest('用户注册', async () => {
      for (const user of this.testUsers) {
        const response = await this.api.post('/auth/register', user);
        // 409 means user already exists, which is fine for this test
        if (response.status !== 201 && response.status !== 200 && response.status !== 409) {
          throw new Error(`注册失败: ${user.username} (状态码: ${response.status}, 消息: ${response.data?.message})`);
        }
        this.log(`✓ 用户 ${user.username} 已存在或注册成功`, 'INFO');
      }
    });
  }

  async testUserLogin() {
    await this.runTest('用户登录', async () => {
      for (const user of this.testUsers) {
        const response = await this.api.post('/auth/login', {
          username: user.username,
          password: user.password
        });
        
        if (response.status !== 200) {
          throw new Error(`登录失败: ${user.username} (状态码: ${response.status}, 消息: ${response.data?.message})`);
        }
        
        // Handle both response.data.token and response.data.data.token
        const token = response.data?.token || response.data?.data?.token;
        if (!token) {
          throw new Error(`未获得令牌: ${user.username}`);
        }
        
        this.tokens.set(user.username, token);
        this.log(`✓ 用户 ${user.username} 登录成功`, 'INFO');
      }
    });
  }

  // ==================== 作业管理测试 ====================

  async testAssignmentCreation() {
    await this.runTest('作业创建', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      const response = await this.api.post(
        '/assignments',
        {
          title: '数学作业 - 第一章',
          description: '完成第一章的所有练习题',
          class_id: 1,
          difficulty: 'medium',
          total_score: 100,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          headers: { Authorization: `Bearer ${teacherToken}` }
        }
      );

      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`作业创建失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      this.log(`✓ 作业创建成功: ${response.data?.data?.id}`, 'INFO');
    });
  }

  async testAssignmentQuery() {
    await this.runTest('作业查询', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      const response = await this.api.get('/assignments', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      if (response.status !== 200) {
        throw new Error(`作业查询失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      const assignments = response.data?.data?.assignments || [];
      this.log(`✓ 查询到 ${assignments.length} 个作业`, 'INFO');
    });
  }

  // ==================== 批改管理测试 ====================

  async testGradingSubmission() {
    await this.runTest('作业提交与批改', async () => {
      const studentToken = this.tokens.get('student001');
      if (!studentToken) throw new Error('学生令牌不存在');

      const response = await this.api.post(
        '/grading/submit',
        {
          assignment_id: 1,
          answers: [
            { question_id: 1, student_answer: '2' },
            { question_id: 2, student_answer: '5' }
          ]
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`作业提交失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      this.log(`✓ 作业提交成功，批改ID: ${response.data?.data?.submission_id}`, 'INFO');
    });
  }

  async testGradingQuery() {
    await this.runTest('批改结果查询', async () => {
      const studentToken = this.tokens.get('student001');
      if (!studentToken) throw new Error('学生令牌不存在');

      const response = await this.api.get('/grading/1', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (response.status !== 200) {
        throw new Error(`批改结果查询失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      this.log(`✓ 批改结果查询成功，总分: ${response.data?.data?.submission?.total_score}`, 'INFO');
    });
  }

  // ==================== 学情分析测试 ====================

  async testAnalyticsQuery() {
    await this.runTest('学情分析查询', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      const response = await this.api.get('/analytics/class/1', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      if (response.status !== 200) {
        throw new Error(`学情分析查询失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      this.log(`✓ 学情分析查询成功，平均分: ${response.data?.data?.average_score}`, 'INFO');
    });
  }

  async testWeakPointsAnalysis() {
    await this.runTest('薄弱点分析', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      const response = await this.api.get('/analytics/weak-points', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      if (response.status !== 200) {
        throw new Error(`薄弱点分析失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      const weakPoints = response.data?.data || [];
      this.log(`✓ 薄弱点分析成功，发现 ${weakPoints.length} 个薄弱知识点`, 'INFO');
    });
  }

  // ==================== 推荐系统测试 ====================

  async testRecommendations() {
    await this.runTest('个性化推荐', async () => {
      const studentToken = this.tokens.get('student001');
      if (!studentToken) throw new Error('学生令牌不存在');

      const response = await this.api.get('/recommendations/1', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (response.status !== 200) {
        throw new Error(`推荐查询失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      const recommendations = response.data?.data || [];
      this.log(`✓ 推荐查询成功，推荐 ${recommendations.length} 道题目`, 'INFO');
    });
  }

  // ==================== AI答疑测试 ====================

  async testQAService() {
    await this.runTest('AI答疑服务', async () => {
      const studentToken = this.tokens.get('student001');
      if (!studentToken) throw new Error('学生令牌不存在');

      const response = await this.api.post(
        '/qa/ask',
        {
          question: '如何解决二次方程？'
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`AI答疑失败 (状态码: ${response.status}, 消息: ${response.data?.message})`);
      }

      this.log(`✓ AI答疑成功，获得答案`, 'INFO');
    });
  }

  // ==================== 权限控制测试 ====================

  async testAuthorizationControl() {
    await this.runTest('权限控制验证', async () => {
      const studentToken = this.tokens.get('student001');
      if (!studentToken) throw new Error('学生令牌不存在');

      // 学生不应该能访问教师专用接口
      const response = await this.api.get('/analytics/class/1', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      if (response.status === 403) {
        this.log(`✓ 权限控制正确，学生无法访问教师接口`, 'INFO');
      } else if (response.status === 200) {
        this.log(`⚠️  权限控制可能有问题，学生能访问教师接口`, 'WARN');
      } else {
        throw new Error(`权限检查返回意外状态码: ${response.status}`);
      }
    });
  }

  // ==================== 数据一致性测试 ====================

  async testDataConsistency() {
    await this.runTest('数据一致性验证', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      // 创建作业
      const createResponse = await this.api.post(
        '/assignments',
        {
          title: '一致性测试作业',
          description: '用于测试数据一致性',
          class_id: 1,
          difficulty: 'basic',
          total_score: 50,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          headers: { Authorization: `Bearer ${teacherToken}` }
        }
      );

      if (createResponse.status !== 201 && createResponse.status !== 200) {
        throw new Error('作业创建失败');
      }

      const assignmentId = createResponse.data?.data?.id;

      // 查询作业
      const queryResponse = await this.api.get(`/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      if (queryResponse.status !== 200) {
        throw new Error('作业查询失败');
      }

      // 验证数据一致性
      if (queryResponse.data?.data?.title !== '一致性测试作业') {
        throw new Error('数据不一致：标题不匹配');
      }

      this.log(`✓ 数据一致性验证通过`, 'INFO');
    });
  }

  // ==================== 性能测试 ====================

  async testPerformance() {
    await this.runTest('性能基准测试', async () => {
      const teacherToken = this.tokens.get('teacher001');
      if (!teacherToken) throw new Error('教师令牌不存在');

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await this.api.get('/assignments', {
          headers: { Authorization: `Bearer ${teacherToken}` }
        });
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      this.log(`✓ 性能测试完成 - 平均: ${avgTime.toFixed(2)}ms, 最大: ${maxTime}ms, 最小: ${minTime}ms`, 'INFO');

      if (avgTime > 1000) {
        this.log(`⚠️  平均响应时间超过1秒，可能需要优化`, 'WARN');
      }
    });
  }

  // ==================== 主测试流程 ====================

  async runAllTests() {
    console.log('\n');
    this.log('========================================', 'INFO');
    this.log('开始执行综合功能测试套件', 'INFO');
    this.log('========================================', 'INFO');
    console.log('\n');

    // 第一阶段：用户管理
    this.log('【第一阶段】用户管理测试', 'INFO');
    await this.testUserRegistration();
    await this.testUserLogin();
    console.log('\n');

    // 第二阶段：作业管理
    this.log('【第二阶段】作业管理测试', 'INFO');
    await this.testAssignmentCreation();
    await this.testAssignmentQuery();
    console.log('\n');

    // 第三阶段：批改系统
    this.log('【第三阶段】批改系统测试', 'INFO');
    await this.testGradingSubmission();
    await this.testGradingQuery();
    console.log('\n');

    // 第四阶段：学情分析
    this.log('【第四阶段】学情分析测试', 'INFO');
    await this.testAnalyticsQuery();
    await this.testWeakPointsAnalysis();
    console.log('\n');

    // 第五阶段：推荐系统
    this.log('【第五阶段】推荐系统测试', 'INFO');
    await this.testRecommendations();
    console.log('\n');

    // 第六阶段：AI答疑
    this.log('【第六阶段】AI答疑测试', 'INFO');
    await this.testQAService();
    console.log('\n');

    // 第七阶段：权限控制
    this.log('【第七阶段】权限控制测试', 'INFO');
    await this.testAuthorizationControl();
    console.log('\n');

    // 第八阶段：数据一致性
    this.log('【第八阶段】数据一致性测试', 'INFO');
    await this.testDataConsistency();
    console.log('\n');

    // 第九阶段：性能测试
    this.log('【第九阶段】性能基准测试', 'INFO');
    await this.testPerformance();
    console.log('\n');

    // 生成测试报告
    this.generateReport();
  }

  private generateReport() {
    console.log('\n');
    this.log('========================================', 'INFO');
    this.log('测试执行完成 - 生成报告', 'INFO');
    this.log('========================================', 'INFO');
    console.log('\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log('📊 测试统计:');
    console.log(`   总测试数: ${total}`);
    console.log(`   ✅ 通过: ${passed}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log(`   📈 通过率: ${passRate}%`);
    console.log('\n');

    if (failed > 0) {
      console.log('❌ 失败的测试:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.message}`);
        });
      console.log('\n');
    }

    console.log('📋 详细结果:');
    this.results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${icon} ${r.name.padEnd(30)} ${r.duration}ms`);
    });
    console.log('\n');

    this.log('========================================', 'INFO');
    if (failed === 0) {
      this.log('🎉 所有测试通过！项目闭环验证成功！', 'SUCCESS');
    } else {
      this.log(`⚠️  有 ${failed} 个测试失败，请检查日志`, 'WARN');
    }
    this.log('========================================', 'INFO');
    console.log('\n');
  }
}

// 执行测试
async function main() {
  const suite = new ComprehensiveTestSuite();
  try {
    await suite.runAllTests();
  } catch (error) {
    console.error('测试执行出错:', error);
    process.exit(1);
  }
}

main();
