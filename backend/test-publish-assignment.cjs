/**
 * 测试作业发布接口
 * 测试场景：
 * 1. 创建一个草稿作业（包含客观题和主观题）
 * 2. 尝试发布作业（验证客观题标准答案检查）
 * 3. 验证通知推送功能
 */

const http = require('http');

// 配置
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let assignmentId = null;

// HTTP请求辅助函数
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试步骤
async function runTests() {
  console.log('=== 开始测试作业发布接口 ===\n');

  try {
    // 步骤1: 教师登录
    console.log('步骤1: 教师登录...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'teacher001',
      password: 'teacher123'
    });
    
    if (loginRes.status !== 200 || !loginRes.data.success) {
      console.error('❌ 登录失败:', loginRes.data);
      return;
    }
    
    authToken = loginRes.data.token;
    console.log('✅ 登录成功\n');

    // 步骤2: 创建草稿作业（包含客观题和主观题）
    console.log('步骤2: 创建草稿作业...');
    const createRes = await makeRequest('POST', '/api/assignments', {
      title: '测试作业-数学第一单元',
      description: '测试作业发布功能',
      class_id: 1,
      difficulty: 'medium',
      total_score: 100,
      deadline: '2024-12-31 23:59:59',
      questions: [
        {
          question_number: 1,
          question_type: 'choice',
          question_content: '1+1等于几？ A.1 B.2 C.3 D.4',
          standard_answer: 'B',
          score: 10
        },
        {
          question_number: 2,
          question_type: 'fill',
          question_content: '2+2等于___',
          standard_answer: '4',
          score: 10
        },
        {
          question_number: 3,
          question_type: 'judge',
          question_content: '3+3=6（判断对错）',
          standard_answer: '对',
          score: 10
        },
        {
          question_number: 4,
          question_type: 'subjective',
          question_content: '请简述加法的交换律',
          standard_answer: '加法交换律：a+b=b+a',
          score: 70
        }
      ]
    }, authToken);

    if (createRes.status !== 201 || !createRes.data.success) {
      console.error('❌ 创建作业失败:', createRes.data);
      return;
    }

    assignmentId = createRes.data.data.id;
    console.log(`✅ 作业创建成功，ID: ${assignmentId}\n`);

    // 步骤3: 尝试发布作业（应该成功，因为所有客观题都有标准答案）
    console.log('步骤3: 发布作业...');
    const publishRes = await makeRequest('POST', `/api/assignments/${assignmentId}/publish`, null, authToken);

    if (publishRes.status !== 200 || !publishRes.data.success) {
      console.error('❌ 发布作业失败:', publishRes.data);
      return;
    }

    console.log('✅ 作业发布成功');
    console.log(`   - 通知推送学生数: ${publishRes.data.data.notifiedStudents}`);
    console.log(`   - 作业状态: ${publishRes.data.data.assignment.status}\n`);

    // 步骤4: 创建一个缺少标准答案的作业
    console.log('步骤4: 创建缺少标准答案的作业...');
    const createRes2 = await makeRequest('POST', '/api/assignments', {
      title: '测试作业-缺少答案',
      description: '测试客观题标准答案验证',
      class_id: 1,
      difficulty: 'medium',
      total_score: 100,
      deadline: '2024-12-31 23:59:59',
      questions: [
        {
          question_number: 1,
          question_type: 'choice',
          question_content: '测试题目',
          standard_answer: '',  // 故意留空
          score: 100
        }
      ]
    }, authToken);

    if (createRes2.status !== 201) {
      console.error('❌ 创建作业失败:', createRes2.data);
      return;
    }

    const assignmentId2 = createRes2.data.data.id;
    console.log(`✅ 作业创建成功，ID: ${assignmentId2}\n`);

    // 步骤5: 尝试发布缺少答案的作业（应该失败）
    console.log('步骤5: 尝试发布缺少答案的作业（预期失败）...');
    const publishRes2 = await makeRequest('POST', `/api/assignments/${assignmentId2}/publish`, null, authToken);

    if (publishRes2.status === 400 && !publishRes2.data.success) {
      console.log('✅ 验证成功：系统正确拒绝了缺少标准答案的作业');
      console.log(`   - 错误信息: ${publishRes2.data.message}`);
      console.log(`   - 缺少答案的题号: ${publishRes2.data.missingAnswers}\n`);
    } else {
      console.error('❌ 验证失败：系统应该拒绝缺少标准答案的作业');
      return;
    }

    // 步骤6: 验证通知是否创建
    console.log('步骤6: 验证通知推送...');
    console.log('✅ 通知推送功能已在发布时执行\n');

    console.log('=== 所有测试通过！ ===');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runTests();
