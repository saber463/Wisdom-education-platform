/**
 * 批量写入演示数据脚本
 * 运行：node health/seed-data.js
 * 覆盖范围：课程、购买记录、作业提交、虚拟伙伴、通知、战队
 */
'use strict';

const mysql = require('mysql2/promise');

const DB = { host: 'localhost', user: 'root', password: '123456', database: 'edu_education_platform' };

async function seed() {
  const c = await mysql.createConnection(DB);
  console.log('✅ 数据库已连接');

  // ─── 1. 课程数据 ──────────────────────────────────────────────────────────
  console.log('\n📚 写入课程数据...');
  const courses = [
    ['Python编程入门', 'Python',     '从零开始学Python，涵盖基础语法、数据结构、面向对象等核心内容', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',   'beginner',     0.00,  1, 1, 2680, 32, 4.8, 312],
    ['Java后端开发实战','Java',       '企业级Java开发，Spring Boot全栈实战，从入门到项目落地',          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',      'intermediate', 299.00,1, 2, 1950, 48, 4.7, 256],
    ['前端三剑客Vue3', 'JavaScript', 'HTML/CSS/JS基础 + Vue3全家桶 + TypeScript，打造现代前端工程师',  'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',    'intermediate', 199.00,1, 3, 3120, 56, 4.9, 421],
    ['C++算法进阶',    'C++',        '数据结构与算法精讲，LeetCode高频题解，竞赛&面试双剑合璧',         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg','advanced',199.00,0, 0, 876,  40, 4.6, 98],
    ['数据库MySQL精讲','SQL',        'MySQL从入门到优化，索引原理、事务、存储过程、性能调优全覆盖',      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',    'intermediate', 149.00,1, 4, 1430, 36, 4.7, 187],
    ['Rust系统编程',   'Rust',       '内存安全、零成本抽象，Rust从语法到WebAssembly全链路实战',         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',         'advanced',     249.00,0, 0, 542,  44, 4.8, 73],
  ];

  for (const [display_name, language_name, description, icon_url, difficulty, price, is_hot, hot_rank, total_students, total_lessons, avg_rating, rating_count] of courses) {
    await c.query(
      `INSERT INTO courses (language_name,display_name,description,icon_url,difficulty,price,is_hot,hot_rank,total_students,total_lessons,avg_rating,rating_count)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), total_students=VALUES(total_students)`,
      [language_name, display_name, description, icon_url, difficulty, price, is_hot, hot_rank, total_students, total_lessons, avg_rating, rating_count]
    );
  }
  const [[{ courseCount }]] = await c.query('SELECT COUNT(*) AS courseCount FROM courses');
  console.log(`  ✅ 课程表：${courseCount} 条`);

  // 获取课程 ID
  const [courseRows] = await c.query('SELECT id FROM courses ORDER BY id LIMIT 6');
  const cids = courseRows.map(r => r.id);

  // ─── 2. 课程分支 ──────────────────────────────────────────────────────────
  console.log('\n🌿 写入课程分支...');
  for (const cid of cids) {
    await c.query(
      `INSERT INTO course_branches (course_id, branch_name, description, difficulty, estimated_hours, order_num)
       VALUES (?,?,?,?,?,?),(?,?,?,?,?,?),(?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE branch_name=VALUES(branch_name)`,
      [cid,'初级班','适合零基础，循序渐进','beginner',40,1,
       cid,'中级班','有一定基础，深入进阶','intermediate',60,2,
       cid,'高级班','项目实战，冲击大厂','advanced',80,3]
    ).catch(() => {});
  }
  console.log('  ✅ 课程分支写入完成');

  // ─── 3. 购买记录（让学生能看到课程）─────────────────────────────────────
  console.log('\n🛒 写入购买记录...');
  // student001(id=4) 购买全部课程；student002(id=5) 购买前3门；student003(id=6) 购买1门
  const [branchRows] = await c.query('SELECT id, course_id FROM course_branches WHERE order_num=1 ORDER BY course_id LIMIT 6');
  const purchases = [];
  for (const { id: branch_id, course_id } of branchRows) {
    purchases.push([4, course_id, branch_id, 0.00,    'alipay',  'completed', null]);
    if (course_id <= (cids[2] || 3))
      purchases.push([5, course_id, branch_id, 0.00,  'wechat',  'completed', null]);
    if (course_id === cids[0])
      purchases.push([6, course_id, branch_id, 0.00,  'wechat',  'completed', null]);
  }
  for (const [user_id, course_id, branch_id, price, payment_method, payment_status, assigned_class_id] of purchases) {
    await c.query(
      `INSERT IGNORE INTO course_purchases (user_id,course_id,branch_id,price,payment_method,payment_status,assigned_class_id)
       VALUES (?,?,?,?,?,?,?)`,
      [user_id, course_id, branch_id, price, payment_method, payment_status, assigned_class_id]
    );
  }
  const [[{ purchCount }]] = await c.query('SELECT COUNT(*) AS purchCount FROM course_purchases');
  console.log(`  ✅ 购买记录：${purchCount} 条`);

  // ─── 4. 作业提交记录 ──────────────────────────────────────────────────────
  console.log('\n📝 写入作业提交记录...');
  const [asgRows] = await c.query('SELECT id FROM assignments WHERE status="published" LIMIT 8');
  const studentIds = [4, 5, 6, 7, 8, 9, 10];
  const statuses = ['submitted', 'graded', 'graded', 'submitted'];
  let subInserted = 0;
  for (const { id: assignment_id } of asgRows) {
    for (const student_id of studentIds.slice(0, 4)) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const score = status === 'graded' ? (60 + Math.floor(Math.random() * 40)) : null;
      const result = await c.query(
        `INSERT IGNORE INTO submissions (assignment_id, student_id, status, total_score, submit_time)
         VALUES (?,?,?,?,DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [assignment_id, student_id, status, score, Math.floor(Math.random() * 72)]
      );
      subInserted += result[0].affectedRows;
    }
  }
  console.log(`  ✅ 作业提交：${subInserted} 条`);

  // ─── 5. 虚拟学习伙伴 ──────────────────────────────────────────────────────
  console.log('\n🤖 写入虚拟学习伙伴...');
  const partners = [
    [4,  'AI小助手·晨曦', '📚 每日打卡，共同进步！',   'efficient', 5],
    [5,  'AI小助手·星辰', '🌟 一起攀登知识高峰！',     'steady',    3],
    [6,  'AI小助手·朝阳', '💪 坚持就是胜利！',         'basic',     2],
    [7,  'AI小助手·云朵', '🎯 目标明确，步步为营！',   'efficient', 4],
    [8,  'AI小助手·微风', '🔥 热爱编程，乐于分享！',   'steady',    3],
    [9,  'AI小助手·彩虹', '🌈 多元学习，全面发展！',   'efficient', 5],
    [10, 'AI小助手·闪光', '⚡ 高效学习，超越自我！',   'efficient', 4],
  ];
  for (const [user_id, partner_name, partner_signature, learning_ability_tag, partner_level] of partners) {
    await c.query(
      `INSERT INTO virtual_partners (user_id,partner_name,partner_avatar,partner_signature,learning_ability_tag,partner_level,is_active,interaction_frequency)
       VALUES (?,?,?,?,?,?,1,?)
       ON DUPLICATE KEY UPDATE partner_name=VALUES(partner_name)`,
      [user_id, partner_name, `https://api.dicebear.com/7.x/bottts/svg?seed=${user_id}`, partner_signature, learning_ability_tag, partner_level, ['high','medium','low'][user_id % 3]]
    );
  }
  const [[{ vpCount }]] = await c.query('SELECT COUNT(*) AS vpCount FROM virtual_partners');
  console.log(`  ✅ 虚拟伙伴：${vpCount} 条`);

  // ─── 6. 通知消息 ──────────────────────────────────────────────────────────
  console.log('\n🔔 写入通知消息...');
  const notifs = [
    [4,  'assignment',  'high',   '新作业提醒',       '张老师发布了新作业《Python基础练习》，请在3天内完成', '/student/assignments'],
    [4,  'grading',     'medium', '作业批改完成',      '你的《数据结构练习》已批改，得分：87分，快去查看吧！', '/student/assignments'],
    [4,  'system',      'low',    '恭喜获得新徽章！',  '你已累计学习100小时，获得"百小时学霸"勋章🏆',         '/student/dashboard'],
    [4,  'partner',     'low',    '学习伙伴动态',      'AI小助手·晨曦完成了今日打卡任务，你今天还没打卡哦～',  '/student/virtual-partner'],
    [4,  'system',      'high',   '账户安全提醒',      '检测到你的账号在新设备登录，如非本人操作请及时修改密码', '/student/dashboard'],
    [5,  'assignment',  'high',   '作业截止提醒',      '《Java作业2：集合框架》将于明天截止，请尽快提交！',    '/student/assignments'],
    [5,  'grading',     'medium', '测验结果出炉',      '本周随堂测验成绩：92分，班级排名第3，继续加油！',       '/student/dashboard'],
    [6,  'grading',     'medium', '老师批注了你的代码', '张老师对你提交的Python爬虫项目进行了详细点评，快去看看', '/student/assignments'],
    [1,  'system',      'high',   '班级异常行为预警',  '一年级1班有3名学生本周视频完成率低于30%，建议关注',     '/teacher/analytics'],
    [1,  'system',      'medium', '新提交待批改',      '共有12份作业提交待批改，最长等待时间：2天',             '/teacher/grading'],
  ];
  for (const [user_id, type, priority, title, content, action_url] of notifs) {
    await c.query(
      `INSERT INTO notifications (user_id,type,priority,title,content,action_url,is_read)
       VALUES (?,?,?,?,?,?,0)`,
      [user_id, type, priority, title, content, action_url]
    );
  }
  const [[{ notifCount }]] = await c.query('SELECT COUNT(*) AS notifCount FROM notifications');
  console.log(`  ✅ 通知消息：${notifCount} 条`);

  // ─── 7. 战队数据 ──────────────────────────────────────────────────────────
  console.log('\n⚔️  写入战队数据...');
  const [teamCheck] = await c.query('SELECT COUNT(*) AS cnt FROM teams');
  if (teamCheck[0].cnt === 0) {
    await c.query(
      `INSERT INTO teams (name, description, course_id, creator_id, max_members, status) VALUES
       ('代码先锋队', '专注Python和算法，每周挑战一道难题，共同进步！', ?,  4, 6, 'active'),
       ('全栈梦之队', '前后端全栈开发，Vue+Node.js实战项目组', ?,  5, 4, 'active'),
       ('算法特训营', '专攻LeetCode，冲刺大厂算法面试，每日一题', ?,  4, 5, 'active'),
       ('Java企业组', '学习企业级Java开发，实战SpringBoot项目', ?,  6, 6, 'active')`,
      [cids[0]||1, cids[2]||3, cids[3]||4, cids[1]||2]
    );
  }
  const [[{ teamCount }]] = await c.query('SELECT COUNT(*) AS teamCount FROM teams');
  console.log(`  ✅ 战队：${teamCount} 条`);

  // ─── 8. 更新课程班级关联（让教师工作台有数据）────────────────────────────
  console.log('\n🏫 关联课程到班级...');
  await c.query(`UPDATE classes SET course_id=? WHERE id=1`, [cids[0]||1]).catch(()=>{});
  await c.query(`UPDATE classes SET course_id=? WHERE id=2`, [cids[1]||2]).catch(()=>{});

  await c.end();

  console.log('\n🎉 所有演示数据写入完成！');
  console.log('   刷新浏览器即可看到数据');
}

seed().catch(e => { console.error('❌ 写入失败:', e.message); process.exit(1); });
