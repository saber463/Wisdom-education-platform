// 备用学习路径方案 - 当AI生成失败时使用
// 每个专业的跨度提供3个备用方案

const backupLearningPaths = {
  // 计算机基础专业
  computer: {
    // 短期方案（1-30天）
    short: [
      {
        id: 'computer_short_1',
        name: '计算机基础快速入门',
        minDays: 1,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const topics = ['计算机基础知识', '操作系统', '办公软件', '网络基础', '安全防护'];

          topics.forEach((topic, _idx) => {
            const daysPerTopic = Math.ceil(days / topics.length);
            for (let i = 0; i < daysPerTopic && stages.length < days; i++) {
              stages.push({
                day: stages.length + 1,
                title: `学习${topic}（第${i + 1}天）`,
                content: `深入学习${topic}的核心概念和实践技巧。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '计算机基础教材', url: '#' },
                  { name: '在线练习平台', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天计算机基础学习路径，覆盖核心知识点，帮助您快速掌握计算机基础知识。`,
            stages,
          };
        },
      },
      {
        id: 'computer_short_2',
        name: '计算机一级考试冲刺',
        minDays: 15,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const examTopics = [
            '基础知识',
            'Windows操作系统',
            'Word',
            'Excel',
            'PowerPoint',
            '网络基础',
          ];

          for (let day = 1; day <= days; day++) {
            const topicIndex = (day - 1) % examTopics.length;
            stages.push({
              day,
              title: `备考${examTopics[topicIndex]}（第${day}天）`,
              content: `针对计算机一级考试的${examTopics[topicIndex]}部分进行系统学习和练习。`,
              duration:
                intensity === 'low'
                  ? '30-60分钟'
                  : intensity === 'medium'
                    ? '60-90分钟'
                    : '90-120分钟',
              resources: [
                { name: '考试大纲解析', url: '#' },
                { name: '模拟题库', url: '#' },
              ],
            });
          }

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为计算机一级考试定制的${days}天冲刺计划，覆盖考试所有知识点，帮助您顺利通过考试。`,
            stages,
          };
        },
      },
      {
        id: 'computer_short_3',
        name: '实用办公技能提升',
        minDays: 10,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const skills = [
            'Word高级排版',
            'Excel函数应用',
            'PowerPoint演示技巧',
            '数据可视化',
            '办公效率工具',
          ];

          skills.forEach((skill, _idx) => {
            const daysPerSkill = Math.ceil(days / skills.length);
            for (let i = 0; i < daysPerSkill && stages.length < days; i++) {
              stages.push({
                day: stages.length + 1,
                title: `${skill}学习（第${i + 1}天）`,
                content: `掌握${skill}的实用技巧，提升办公效率。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '办公技能教材', url: '#' },
                  { name: '实战案例', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天办公技能提升路径，学习实用的办公软件技巧，显著提升工作效率。`,
            stages,
          };
        },
      },
    ],
    // 中期方案（31-90天）
    medium: [
      {
        id: 'computer_medium_1',
        name: '计算机基础系统学习',
        minDays: 31,
        maxDays: 90,
        generate: (goal, days, intensity) => {
          const stages = [];
          const modules = [
            { name: '计算机导论', days: 10 },
            { name: '操作系统原理', days: 15 },
            { name: '网络技术', days: 15 },
            { name: '数据库基础', days: 15 },
            { name: '编程语言入门', days: 30 },
          ];

          let currentDay = 1;
          modules.forEach(module => {
            const actualDays = Math.min(module.days, days - currentDay + 1);
            for (let i = 0; i < actualDays && currentDay <= days; i++) {
              stages.push({
                day: currentDay++,
                title: `${module.name}学习（第${i + 1}天）`,
                content: `系统学习${module.name}的理论知识和实践应用。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '系统教材', url: '#' },
                  { name: '实验平台', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天计算机基础系统学习路径，全面覆盖计算机科学的核心领域。`,
            stages,
          };
        },
      },
    ],
    // 长期方案（91-180天）
    long: [
      {
        id: 'computer_long_1',
        name: '计算机科学完整体系',
        minDays: 91,
        maxDays: 180,
        generate: (goal, days, intensity) => {
          const stages = [];
          const fields = [
            { name: '计算机科学导论', days: 20 },
            { name: '数据结构与算法', days: 40 },
            { name: '操作系统', days: 30 },
            { name: '计算机网络', days: 30 },
            { name: '数据库系统', days: 30 },
            { name: '软件工程', days: 30 },
          ];

          let currentDay = 1;
          fields.forEach(field => {
            const actualDays = Math.min(field.days, days - currentDay + 1);
            for (let i = 0; i < actualDays && currentDay <= days; i++) {
              stages.push({
                day: currentDay++,
                title: `${field.name}学习（第${i + 1}天）`,
                content: `全面学习${field.name}的理论知识和实践应用，构建完整的计算机科学体系。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '经典教材', url: '#' },
                  { name: '在线课程', url: '#' },
                  { name: '实践项目', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天计算机科学完整学习路径，涵盖计算机科学的核心领域，构建扎实的专业基础。`,
            stages,
          };
        },
      },
    ],
  },
  // 英语专业
  english: {
    // 短期方案（1-30天）
    short: [
      {
        id: 'english_short_1',
        name: '英语快速提升',
        minDays: 1,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const skills = ['词汇', '语法', '阅读', '听力', '写作'];

          skills.forEach((skill, _idx) => {
            const daysPerSkill = Math.ceil(days / skills.length);
            for (let i = 0; i < daysPerSkill && stages.length < days; i++) {
              stages.push({
                day: stages.length + 1,
                title: `${skill}训练（第${i + 1}天）`,
                content: `专注提升英语${skill}能力，通过系统练习快速进步。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '英语学习平台', url: '#' },
                  { name: '练习资料', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天英语快速提升路径，全面训练各项英语技能。`,
            stages,
          };
        },
      },
    ],
  },
  // 会计专业
  accounting: {
    // 短期方案（1-30天）
    short: [
      {
        id: 'accounting_short_1',
        name: '会计基础入门',
        minDays: 1,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const topics = ['会计基础', '财务报表', '会计凭证', '账户设置', '税务基础'];

          topics.forEach((topic, _idx) => {
            const daysPerTopic = Math.ceil(days / topics.length);
            for (let i = 0; i < daysPerTopic && stages.length < days; i++) {
              stages.push({
                day: stages.length + 1,
                title: `${topic}学习（第${i + 1}天）`,
                content: `学习${topic}的基本概念和实践操作。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '会计基础教材', url: '#' },
                  { name: '在线练习', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天会计基础入门路径，帮助您快速掌握会计基础知识。`,
            stages,
          };
        },
      },
    ],
  },
  // 教师专业
  teacher: {
    // 短期方案（1-30天）
    short: [
      {
        id: 'teacher_short_1',
        name: '教育信息化能力提升',
        minDays: 1,
        maxDays: 30,
        generate: (goal, days, intensity) => {
          const stages = [];
          const techTopics = [
            '教育技术基础',
            '多媒体课件制作',
            '在线教学平台',
            '翻转课堂设计',
            '教育数据处理',
          ];

          let currentDay = 1;
          techTopics.forEach((topic, _i) => {
            const actualDays = Math.min(6, days - currentDay + 1);
            for (let i = 0; i < actualDays && currentDay <= days; i++) {
              stages.push({
                day: currentDay++,
                title: `${topic}学习（第${i + 1}天）`,
                content: `学习${topic}知识的技能，提升教育信息化能力。`,
                duration:
                  intensity === 'low'
                    ? '30-60分钟'
                    : intensity === 'medium'
                      ? '60-90分钟'
                      : '90-120分钟',
                resources: [
                  { name: '教育技术教材', url: '#' },
                  { name: '在线课程', url: '#' },
                ],
              });
            }
          });

          return {
            goal,
            totalDays: days,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            intensity,
            summary: `为您定制的${days}天教育信息化能力提升路径，学习现代教育技术，提升教学效果。`,
            stages,
          };
        },
      },
    ],
  },
};

/**
 * 根据学习目标和天数获取合适的备用学习路径
 * @param {string} goal 学习目标
 * @param {number} days 学习天数
 * @param {string} intensity 学习强度
 * @returns {Object} 备用学习路径
 */
export const getBackupPath = (goal, days, intensity) => {
  // 简单的专业匹配逻辑
  let major = 'computer'; // 默认计算机专业

  if (goal.includes('英语')) {
    major = 'english';
  } else if (goal.includes('会计')) {
    major = 'accounting';
  } else if (goal.includes('教师') || goal.includes('教育')) {
    major = 'teacher';
  }

  // 确定方案类型（短期/中期/长期）
  let planType = 'short';
  if (days > 90) {
    planType = 'long';
  } else if (days > 30) {
    planType = 'medium';
  }

  // 获取匹配的方案列表
  const plans = backupLearningPaths[major][planType] || backupLearningPaths.computer.short;

  // 找到最合适的方案（天数范围匹配）
  const suitablePlan = plans.find(plan => days >= plan.minDays && days <= plan.maxDays) || plans[0];

  // 生成学习路径
  return suitablePlan.generate(goal, days, intensity);
};

// 通用学习路径生成器（用于快速生成简单路径）
export const generateGeneralPath = (goal, days, intensity) => {
  const stages = [];
  const baseContent = `根据您的学习目标"${goal}"，今天是第{{day}}天的学习。`;

  for (let day = 1; day <= days; day++) {
    stages.push({
      day,
      title: `${goal}学习（第${day}天）`,
      content: baseContent.replace('{{day}}', day),
      duration:
        intensity === 'low' ? '30-60分钟' : intensity === 'medium' ? '60-90分钟' : '90-120分钟',
      resources: [
        { name: '学习资料', url: '#' },
        { name: '在线课程', url: '#' },
      ],
    });
  }

  return {
    goal,
    totalDays: days,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    intensity,
    summary: `为您定制的${days}天学习路径，帮助您实现"${goal}"的目标。`,
    stages,
  };
};
