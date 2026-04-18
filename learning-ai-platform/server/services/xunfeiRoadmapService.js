/**
 * 讯飞星火API服务 - 文档解析与学习路径生成
 * API文档: https://spark-api-open.xf-yun.com/v1/files
 */

import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ChatbotService from './chatbotService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 讯飞星火 API 配置
const XUNFEI_CONFIG = {
  appid: '557bb679',
  apiSecret: 'fGVFIaShAbvzEeIRvFoT',
  apiKey: 'tnrQojUzXDQvOunDRqtf:fGVFIaShAbvzEeIRvFoT',
  baseURL: 'https://spark-api-open.xf-yun.com/v1/files',
};

// 内置开发者路线图数据（当无法访问GitHub时使用）
const BUILTIN_ROADMAPS = {
  frontend: {
    title: '前端开发者路线图',
    description: '2024年最新前端学习路径，涵盖HTML/CSS/JS到现代框架',
    stages: [
      {
        stage: 1,
        title: 'HTML与CSS基础',
        duration: '7天',
        topics: ['HTML5语义标签', 'CSS3选择器', 'Flexbox布局', 'Grid布局', '响应式设计'],
        resources: ['MDN Web Docs', 'CSS Tricks'],
        description: '掌握HTML文档结构和CSS样式基础，学习现代布局技术',
      },
      {
        stage: 2,
        title: 'JavaScript核心',
        duration: '14天',
        topics: ['ES6+语法', '异步编程', 'DOM操作', '事件机制', '原型链'],
        resources: ['JavaScript.info', "You Don't Know JS"],
        description: '深入学习JavaScript语言核心，理解ES6+新特性和异步编程',
      },
      {
        stage: 3,
        title: '前端框架 - React/Vue',
        duration: '21天',
        topics: ['组件化思想', '状态管理', '路由管理', '生命周期', '虚拟DOM'],
        resources: ['React官方文档', 'Vue官方文档'],
        description: '掌握主流前端框架，完成至少一个完整项目',
      },
      {
        stage: 4,
        title: 'TypeScript',
        duration: '7天',
        topics: ['类型系统', '接口与泛型', '装饰器', '类型守卫'],
        resources: ['TypeScript官方文档'],
        description: '学习TypeScript类型系统，提升代码质量',
      },
      {
        stage: 5,
        title: '构建工具与工程化',
        duration: '7天',
        topics: ['Vite/Webpack', 'ESLint', 'Prettier', 'Git工作流'],
        resources: ['Vite文档', 'Webpack文档'],
        description: '掌握现代前端工程化工具和团队协作流程',
      },
      {
        stage: 6,
        title: '全栈技能',
        duration: '14天',
        topics: ['Node.js基础', 'Express/Koa', 'RESTful API', '数据库基础'],
        resources: ['Node.js文档', 'MDN Express教程'],
        description: '学习后端基础，具备全栈开发能力',
      },
    ],
  },
  backend: {
    title: '后端开发者路线图',
    description: 'Node.js/Python后端开发学习路径',
    stages: [
      {
        stage: 1,
        title: '编程基础与Node.js',
        duration: '14天',
        topics: ['Node.js核心', 'npm/yarn', '异步I/O', '事件循环', 'Buffer/Stream'],
        resources: ['Node.js官方文档'],
        description: '掌握Node.js运行时和核心API',
      },
      {
        stage: 2,
        title: 'Express/Koa框架',
        duration: '10天',
        topics: ['路由系统', '中间件', '模板引擎', '静态资源', '错误处理'],
        resources: ['Express文档', 'Koa文档'],
        description: '熟练使用Express或Koa构建Web服务',
      },
      {
        stage: 3,
        title: '数据库技术',
        duration: '14天',
        topics: ['MySQL/PostgreSQL', 'MongoDB', 'Redis缓存', 'ORM框架', '数据建模'],
        resources: ['Sequelize文档', 'Mongoose文档'],
        description: '掌握关系型和非关系型数据库的使用',
      },
      {
        stage: 4,
        title: '认证与安全',
        duration: '7天',
        topics: ['JWT认证', 'OAuth2.0', '密码加密', 'SQL注入防护', 'XSS防护'],
        resources: ['OWASP指南'],
        description: '实现安全的用户认证和接口保护',
      },
      {
        stage: 5,
        title: 'API设计与文档',
        duration: '5天',
        topics: ['RESTful规范', 'GraphQL', 'OpenAPI/Swagger', 'API版本管理'],
        resources: ['RESTful API设计指南'],
        description: '设计规范、易用的API接口',
      },
      {
        stage: 6,
        title: '容器化与部署',
        duration: '7天',
        topics: ['Docker基础', 'Docker Compose', 'Nginx配置', 'CI/CD流水线'],
        resources: ['Docker官方教程'],
        description: '掌握容器化部署和自动化发布',
      },
    ],
  },
  python: {
    title: 'Python开发者路线图',
    description: 'Python全栈开发学习路径',
    stages: [
      {
        stage: 1,
        title: 'Python基础',
        duration: '10天',
        topics: ['变量与数据类型', '控制流程', '函数与模块', '面向对象', '异常处理'],
        resources: ['Python官方教程', 'Real Python'],
        description: '掌握Python基础语法和核心概念',
      },
      {
        stage: 2,
        title: 'Web框架 - Django/Flask',
        duration: '14天',
        topics: ['路由与视图', '模板引擎', 'ORM操作', '表单处理', '中间件'],
        resources: ['Django文档', 'Flask文档'],
        description: '使用Django或Flask开发Web应用',
      },
      {
        stage: 3,
        title: '数据库与ORM',
        duration: '10天',
        topics: ['SQLAlchemy', 'Django ORM', '数据库设计', '事务处理', '数据迁移'],
        resources: ['SQLAlchemy文档'],
        description: '熟练使用ORM进行数据库操作',
      },
      {
        stage: 4,
        title: 'API开发',
        duration: '7天',
        topics: ['REST API', 'DRF', 'API认证', '序列化', '分页过滤'],
        resources: ['Django REST Framework文档'],
        description: '使用DRF构建专业API服务',
      },
      {
        stage: 5,
        title: '异步编程',
        duration: '7天',
        topics: ['asyncio', 'aiohttp', 'Celery', '消息队列', 'WebSocket'],
        resources: ['Python异步编程指南'],
        description: '掌握Python异步编程和高并发处理',
      },
      {
        stage: 6,
        title: '项目实战与部署',
        duration: '14天',
        topics: ['项目架构', '单元测试', 'Docker部署', '云服务器', '监控日志'],
        resources: ['Pytest文档', 'Docker教程'],
        description: '完成完整项目并部署上线',
      },
    ],
  },
  java: {
    title: 'Java开发者路线图',
    description: 'Java企业级开发学习路径',
    stages: [
      {
        stage: 1,
        title: 'Java基础',
        duration: '14天',
        topics: ['Java SE核心', '面向对象', '集合框架', '泛型', 'Lambda表达式'],
        resources: ['Oracle官方教程', 'Java核心技术'],
        description: '掌握Java语言基础和核心特性',
      },
      {
        stage: 2,
        title: 'Web开发基础',
        duration: '10天',
        topics: ['Servlet/JSP', 'Thymeleaf', 'Session/Cookie', 'Filter/Listener'],
        resources: ['Servlet文档', 'Thymeleaf文档'],
        description: '学习Java Web开发基础',
      },
      {
        stage: 3,
        title: 'Spring框架',
        duration: '14天',
        topics: ['Spring Core', 'Spring MVC', 'Spring Boot', 'Spring Data JPA'],
        resources: ['Spring官方文档', 'Spring Boot指南'],
        description: '掌握Spring生态核心框架',
      },
      {
        stage: 4,
        title: '微服务架构',
        duration: '14天',
        topics: ['Spring Cloud', 'Nacos', 'Sentinel', 'Gateway', 'Feign'],
        resources: ['Spring Cloud文档'],
        description: '构建微服务架构系统',
      },
      {
        stage: 5,
        title: '数据库技术',
        duration: '10天',
        topics: ['MySQL优化', 'Redis缓存', 'MongoDB', '数据库中间件', '读写分离'],
        resources: ['MySQL官方文档'],
        description: '深入学习数据库和缓存技术',
      },
      {
        stage: 6,
        title: 'DevOps与部署',
        duration: '10天',
        topics: ['Maven/Gradle', 'Docker', 'K8s', 'Jenkins', 'ELK日志'],
        resources: ['Docker/K8s官方文档'],
        description: '掌握Java项目构建和部署',
      },
    ],
  },
  english: {
    title: '英语学习与考试提分路线图',
    description: '全方位提升英语听说读写能力，针对考试进行专项突破',
    stages: [
      {
        stage: 1,
        title: '核心词汇与语法基石',
        duration: '7天',
        topics: ['高频词汇记忆', '五大基本句型', '时态与语态', '从句基础', '词根词缀法'],
        resources: ['不背单词App', '旋元佑语法'],
        description: '打好词汇和语法基础，是提升英语的第一步',
      },
      {
        stage: 2,
        title: '听力强化与口语初探',
        duration: '7天',
        topics: ['精听练习', '连读与弱读技巧', '影子跟读法', '日常交际用语', '语音语调纠正'],
        resources: ['可可英语', 'TED Talks'],
        description: '通过精听和跟读，突破听力瓶颈，建立语感',
      },
      {
        stage: 3,
        title: '阅读理解与长难句分析',
        duration: '7天',
        topics: ['长难句拆解', '快速阅读技巧', '文章结构分析', '逻辑推理判断', '关键词定位'],
        resources: ['经济学人(The Economist)', '纽约时报'],
        description: '掌握阅读技巧，提高阅读速度和准确率',
      },
      {
        stage: 4,
        title: '写作进阶与逻辑表达',
        duration: '7天',
        topics: ['常用写作模板', '连接词与过渡句', '高级词汇替换', '逻辑框架构建', '作文批改与润色'],
        resources: ['慎小嶷十天突破', 'Grammarly'],
        description: '学习高质量表达，提升写作逻辑和文采',
      },
      {
        stage: 5,
        title: '真题演练与提分技巧',
        duration: '10天',
        topics: ['历年真题模拟', '错题深度分析', '考试时间分配', '各类题型解题套路', '心理素质调节'],
        resources: ['历年真题集', '考试大纲'],
        description: '针对具体考试进行高强度模拟，掌握提分秘籍',
      },
    ],
  },
  general: {
    title: '通用学习与技能提升路线图',
    description: '基于科学学习方法的通用技能习得路径',
    stages: [
      {
        stage: 1,
        title: '目标规划与基础构建',
        duration: '5天',
        topics: ['SMART目标制定', '核心概念梳理', '知识框架搭建', '基础资源搜集'],
        resources: ['思维导图工具', '学习计划表'],
        description: '明确目标，搭建起初步的知识结构',
      },
      {
        stage: 2,
        title: '深度学习与实践',
        duration: '15天',
        topics: ['费曼技巧应用', '沉浸式练习', '知识点串联', '案例分析'],
        resources: ['专业书籍', '在线课程'],
        description: '通过深度学习和实践，掌握核心技能',
      },
      {
        stage: 3,
        title: '总结复习与迁移应用',
        duration: '10天',
        topics: ['错题/疑点复盘', '知识迁移练习', '模拟测试', '最终成果展示'],
        resources: ['复盘日志', '自测题库'],
        description: '巩固所学，并尝试将其应用到不同场景中',
      },
    ],
  },
};

/**
 * 上传文件到讯飞星火API进行解析
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 * @returns {Promise<object>} 解析结果
 */
async function uploadAndParseDocument(filePath, fileName) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'text/markdown',
    });
    formData.append('description', 'Developer Roadmap Document');

    const response = await axios.post(XUNFEI_CONFIG.baseURL, formData, {
      headers: {
        Authorization: `Bearer ${XUNFEI_CONFIG.apiKey}`,
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error('讯飞API调用失败:', error.message);
    throw error;
  }
}

/**
 * 使用讯飞API解析开发者路线图
 * @param {string} roadmapType - 路线图类型 (frontend/backend/python/java)
 * @returns {Promise<object>} 解析后的学习路径
 */
async function parseRoadmapWithAPI(roadmapType) {
  const roadmap = BUILTIN_ROADMAPS[roadmapType];
  if (!roadmap) {
    throw new Error(`未知的路线图类型: ${roadmapType}`);
  }

  // 如果有本地roadmap文件，优先使用API解析
  const localRoadmapPath = path.join(
    __dirname,
    '../../roadmap-content',
    `${roadmapType}/README.md`
  );

  if (fs.existsSync(localRoadmapPath)) {
    try {
      const apiResult = await uploadAndParseDocument(localRoadmapPath, `${roadmapType}-roadmap.md`);
      return {
        ...roadmap,
        apiResult,
        parsedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.log('API解析失败，使用内置数据');
    }
  }

  return {
    ...roadmap,
    parsedAt: new Date().toISOString(),
    source: 'builtin',
  };
}

/**
 * 使用 AI 动态生成学习路径
 */
async function generateDynamicRoadmap(goal, days, intensity) {
  const prompt = `
    你是一个专业的教育规划专家。请为用户生成一个详细的学习路径（Roadmap）。
    用户的学习目标是：${goal}
    预计学习天数：${days}天
    学习强度：${intensity}（low: 30-60min/day, medium: 60-90min/day, high: 90-120min/day）

    请严格按照以下 JSON 格式返回，不要包含任何其他文字说明：
    {
      "title": "学习路径标题",
      "description": "学习路径的整体描述",
      "stages": [
        {
          "stage": 1,
          "title": "阶段标题",
          "duration": "持续时间（如：5天）",
          "topics": ["主题1", "主题2"],
          "resources": ["资源1", "资源2"],
          "description": "阶段详细描述"
        }
      ]
    }
    请确保内容专业、科学，并根据用户的天数和强度合理分配每个阶段。
  `;

  try {
    const response = await ChatbotService.sendMessage(prompt);
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('AI 返回格式错误');
  } catch (error) {
    console.error('AI 动态生成路径失败:', error);
    return null;
  }
}

async function generateLearningPath(goal, days, intensity) {
  // 1. 尝试使用 AI 动态生成（真正的 API 意义所在）
  const dynamicRoadmap = await generateDynamicRoadmap(goal, days, intensity);
  if (dynamicRoadmap && dynamicRoadmap.stages && dynamicRoadmap.stages.length > 0) {
    console.log('[generateLearningPath] Successfully generated dynamic roadmap using AI');
    return expandRoadmapToModules(dynamicRoadmap, goal, days, intensity, 'ai-dynamic');
  }

  // 2. 如果 AI 生成失败，则回退到内置模板匹配逻辑
  console.log('[generateLearningPath] Falling back to builtin templates');
  
  let roadmapType = 'general';
  const goalLower = goal.toLowerCase();

  // 优先级排序：特定领域 -> 英语 -> 前端 -> 通用
  if (goalLower.includes('后端') || goalLower.includes('node') || goalLower.includes('express')) {
    roadmapType = 'backend';
  } else if (
    goalLower.includes('python') ||
    goalLower.includes('django') ||
    goalLower.includes('flask')
  ) {
    roadmapType = 'python';
  } else if (goalLower.includes('java') || goalLower.includes('spring')) {
    roadmapType = 'java';
  } else if (goalLower.includes('英语') || goalLower.includes('english') || goalLower.includes('单词') || goalLower.includes('雅思') || goalLower.includes('托福') || goalLower.includes('四级') || goalLower.includes('六级') || goalLower.includes('cet')) {
    roadmapType = 'english';
  } else if (goalLower.includes('前端') || goalLower.includes('html') || goalLower.includes('css') || goalLower.includes('javascript') || goalLower.includes('vue') || goalLower.includes('react')) {
    roadmapType = 'frontend';
  }
  
  const roadmap = BUILTIN_ROADMAPS[roadmapType] || BUILTIN_ROADMAPS.general;
  return expandRoadmapToModules(roadmap, goal, days, intensity, 'roadmap-enhanced');
}

/**
 * 将路线图（包含 stages）展开为每日模块（modules）
 */
function expandRoadmapToModules(roadmap, goal, days, intensity, source) {
  // 解析每个阶段的持续天数
  const stageDurations = roadmap.stages.map(s => {
    const match = s.duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 7;
  });

  const totalStageDays = stageDurations.reduce((a, b) => a + b, 0);
  const scaleFactor = Math.min(1.5, days / totalStageDays); // 允许一定的伸缩，但不宜过度

  const modules = [];
  let currentDay = 1;

  // 每个阶段按天数展开
  roadmap.stages.forEach((stage, stageIndex) => {
    const allocatedDays = Math.max(1, Math.round(stageDurations[stageIndex] * scaleFactor));
    const topics = stage.topics;

    for (
      let dayOffset = 0;
      dayOffset < allocatedDays && currentDay <= days;
      dayOffset++, currentDay++
    ) {
      const topicIdx = dayOffset % topics.length;
      const mainTopic = topics[topicIdx];

      let dayTitle, focusContent, tasks;

      if (allocatedDays === 1) {
        dayTitle = stage.title;
        focusContent = `📚 ${stage.description}\n\n🎯 今日主题：${stage.title}\n\n📖 核心内容：\n${topics.map(t => `   • ${t}`).join('\n')}\n\n📚 推荐资源：\n${stage.resources.map(r => `   🔗 ${r}`).join('\n')}`;
        tasks = [`学习${mainTopic}基础概念和实践用法`];
      } else if (dayOffset === 0) {
        dayTitle = `${stage.title} - 基础入门`;
        focusContent = `📚 ${stage.description}\n\n🎯 第${dayOffset + 1}天：${stage.title}入门\n\n今日重点学习：\n   • ${mainTopic} 基础概念和原理\n   • 环境搭建与配置\n\n📚 推荐资源：\n${stage.resources.map(r => `   🔗 ${r}`).join('\n')}`;
        tasks = ['环境配置', '理解基本概念'];
      } else if (dayOffset === allocatedDays - 1) {
        dayTitle = `${stage.title} - 实战总结`;
        focusContent = `🎯 第${dayOffset + 1}天：${stage.title}实战总结\n\n📝 本阶段回顾：\n   ${topics.join('、')}\n\n💪 今日任务：\n   1. 综合练习\n   2. 完成Demo\n   3. 整理笔记`;
        tasks = ['综合练习', '整理笔记'];
      } else {
        dayTitle = `${stage.title} - 深入${mainTopic}`;
        focusContent = `🎯 第${dayOffset + 1}天：深入${mainTopic}\n\n📖 学习内容：\n   • ${mainTopic} 进阶用法\n   • 最佳实践与调试技巧\n\n💻 动手实践：\n   编写代码练习${mainTopic}的核心功能`;
        tasks = [`${mainTopic}进阶练习`, '实际编码'];
      }

      modules.push({
        day: currentDay,
        moduleName: dayTitle,
        detailedContent: focusContent,
        topics: topics,
        estimatedTime: stage.duration,
        dailySchedule: [
          { time: '上午', content: tasks[0], duration: '45分钟' },
          { time: '下午', content: tasks[1] || mainTopic, duration: '60分钟' },
          { time: '晚上', content: `复习+总结`, duration: '45分钟' },
        ],
        practice: tasks[0],
        checkpoint: `掌握${mainTopic}的核心概念`,
      });
    }
  });

  // 填充剩余天数
  while (currentDay <= days) {
    modules.push({
      day: currentDay++,
      moduleName: `综合复习与实践 Day${currentDay-1}`,
      detailedContent: `🚀 综合实战与复习阶段\n\n今日重点：\n1. 回顾薄弱环节\n2. 完善实践项目\n3. 整理知识体系`,
      topics: roadmap.stages.flatMap(s => s.topics).slice(0, 5),
      estimatedTime: '2小时',
      practice: '综合练习',
      checkpoint: '准备就绪',
    });
  }

  return {
    title: goal,
    days: days,
    certificateType: roadmap.title,
    intensity: intensity,
    modules: modules.slice(0, days),
    summary: `📚 ${days}天${goal}学习计划\n\n本计划由 AI 为您量身定制，涵盖 ${roadmap.stages.length} 个核心阶段。\n\n🎯 学习建议：\n• 保持连贯性，每日打卡\n• 动手实践比单纯看书更重要\n• 及时复习巩固`,
    generatedAt: new Date().toISOString(),
    source: source,
  };
}

/**
 * 获取可用的路线图列表
 */
function getAvailableRoadmaps() {
  return Object.keys(BUILTIN_ROADMAPS).map(key => ({
    type: key,
    title: BUILTIN_ROADMAPS[key].title,
    description: BUILTIN_ROADMAPS[key].description,
    stagesCount: BUILTIN_ROADMAPS[key].stages.length,
  }));
}

export { generateLearningPath, parseRoadmapWithAPI, getAvailableRoadmaps, BUILTIN_ROADMAPS };
