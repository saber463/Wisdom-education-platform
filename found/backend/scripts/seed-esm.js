/**
 * ESM Seed Script — 填充基础数据
 * Usage: node scripts/seed-esm.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learning-ai-platform';

// ─── 简化模型定义（直接内联，避免导入路径问题）──────────────────
const categorySchema = new mongoose.Schema({
  name: String, slug: String, description: String, icon: String,
  color: String, order: Number, isActive: { type: Boolean, default: true },
  courseCount: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now }
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const achievementSchema = new mongoose.Schema({
  name: String, description: String, icon: String, type: String,
  condition: mongoose.Schema.Types.Mixed, points: Number, rarity: String,
  isActive: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
});
const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);

const testSchema = new mongoose.Schema({
  title: String, description: String, category: String, difficulty: String,
  timeLimit: Number, passingScore: Number, questions: Array,
  isPublished: { type: Boolean, default: true },
  tags: [String], createdAt: { type: Date, default: Date.now }
});
const Test = mongoose.models.Test || mongoose.model('Test', testSchema);

const groupSchema = new mongoose.Schema({
  name: String, description: String, category: String, avatar: String,
  coverImage: String, isPublic: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 100 }, memberCount: { type: Number, default: 1 },
  tags: [String], createdAt: { type: Date, default: Date.now }
});
const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

// ─── 数据 ────────────────────────────────────────────────────────
const categories = [
  { name: '前端开发', slug: 'frontend', description: 'HTML/CSS/JavaScript/Vue/React', icon: '🌐', color: '#6366f1', order: 1 },
  { name: '后端开发', slug: 'backend', description: 'Node.js/Python/Java/Go', icon: '⚙️', color: '#22d3ee', order: 2 },
  { name: '数据科学', slug: 'data-science', description: '机器学习/深度学习/数据分析', icon: '📊', color: '#10b981', order: 3 },
  { name: '算法与数据结构', slug: 'algorithms', description: '排序/搜索/动态规划/图论', icon: '🧮', color: '#f59e0b', order: 4 },
  { name: '数据库', slug: 'database', description: 'MySQL/MongoDB/Redis/PostgreSQL', icon: '🗄️', color: '#f43f5e', order: 5 },
  { name: '云计算与DevOps', slug: 'cloud-devops', description: 'Docker/K8s/CI/CD/AWS', icon: '☁️', color: '#8b5cf6', order: 6 },
  { name: '移动开发', slug: 'mobile', description: 'iOS/Android/Flutter/React Native', icon: '📱', color: '#06b6d4', order: 7 },
  { name: '网络安全', slug: 'security', description: '渗透测试/加密/Web安全', icon: '🔐', color: '#ef4444', order: 8 },
  { name: '系统设计', slug: 'system-design', description: '架构设计/微服务/分布式系统', icon: '🏗️', color: '#84cc16', order: 9 },
  { name: 'AI与大模型', slug: 'ai-llm', description: 'ChatGPT/Prompt工程/RAG/Fine-tuning', icon: '🤖', color: '#ec4899', order: 10 },
];

const achievements = [
  { name: '初学乍练', description: '完成第一次学习路径生成', icon: '🌱', type: 'milestone', condition: { action: 'generate_path', count: 1 }, points: 10, rarity: 'common' },
  { name: '知识探索者', description: '浏览10个知识点', icon: '🔍', type: 'exploration', condition: { action: 'browse_knowledge', count: 10 }, points: 20, rarity: 'common' },
  { name: '测试达人', description: '完成5次评估测试', icon: '📝', type: 'assessment', condition: { action: 'complete_test', count: 5 }, points: 50, rarity: 'uncommon' },
  { name: '满分选手', description: '评估测试得满分', icon: '💯', type: 'achievement', condition: { action: 'perfect_score', count: 1 }, points: 100, rarity: 'rare' },
  { name: '社区活跃者', description: '发布10条学习动态', icon: '💬', type: 'social', condition: { action: 'publish_tweet', count: 10 }, points: 30, rarity: 'common' },
  { name: '学习小组长', description: '创建一个学习小组', icon: '👥', type: 'social', condition: { action: 'create_group', count: 1 }, points: 50, rarity: 'uncommon' },
  { name: '坚持不懈', description: '连续学习7天', icon: '🔥', type: 'streak', condition: { action: 'daily_streak', count: 7 }, points: 70, rarity: 'uncommon' },
  { name: '月度学霸', description: '连续学习30天', icon: '🏆', type: 'streak', condition: { action: 'daily_streak', count: 30 }, points: 300, rarity: 'epic' },
  { name: 'AI助手专家', description: '使用AI对话100次', icon: '🤖', type: 'usage', condition: { action: 'ai_chat', count: 100 }, points: 150, rarity: 'rare' },
  { name: '知识分享官', description: '帮助10位同学解答问题', icon: '🎓', type: 'social', condition: { action: 'help_others', count: 10 }, points: 200, rarity: 'epic' },
];

const tests = [
  {
    title: 'JavaScript 基础测验',
    description: '测试你的JavaScript基础知识掌握程度，包括变量、函数、闭包、原型链等核心概念。',
    category: 'frontend', difficulty: 'beginner', timeLimit: 30, passingScore: 60,
    tags: ['JavaScript', '前端', '基础'],
    questions: [
      { question: 'JavaScript中 typeof null 的返回值是什么？', options: ['null', 'object', 'undefined', 'string'], correct: 1, explanation: '这是JS的一个历史遗留bug，typeof null返回"object"' },
      { question: '以下哪个方法可以深拷贝一个对象？', options: ['Object.assign()', 'JSON.parse(JSON.stringify())', '扩展运算符...', '浅拷贝无法深拷贝'], correct: 1, explanation: 'JSON.parse(JSON.stringify())是常用的深拷贝方法，但不支持函数和循环引用' },
      { question: 'Promise.all() 和 Promise.race() 的区别是？', options: ['没有区别', 'all等所有完成，race等最快的', 'all等最快的，race等所有完成', '都是等所有完成'], correct: 1, explanation: 'Promise.all等所有Promise完成，Promise.race等第一个完成/失败的' },
    ]
  },
  {
    title: 'Vue 3 核心特性测验',
    description: '深入考察Vue 3的Composition API、响应式系统、生命周期等核心特性。',
    category: 'frontend', difficulty: 'intermediate', timeLimit: 45, passingScore: 70,
    tags: ['Vue3', '前端框架', 'Composition API'],
    questions: [
      { question: 'Vue 3中 ref() 和 reactive() 的主要区别是？', options: ['ref用于基本类型，reactive用于对象', '没有区别', 'reactive更快', 'ref只能用在模板里'], correct: 0, explanation: 'ref可以包装任意类型，访问需要.value；reactive只能包装对象/数组' },
      { question: 'watchEffect 和 watch 的区别是？', options: ['完全相同', 'watchEffect自动追踪依赖，watch需要指定数据源', 'watch更快', 'watchEffect不支持清除副作用'], correct: 1, explanation: 'watchEffect立即执行并自动收集依赖，watch需要显式指定监听的数据源' },
    ]
  },
  {
    title: '算法复杂度分析',
    description: '测试对时间复杂度和空间复杂度的理解，包括大O表示法和常见算法分析。',
    category: 'algorithms', difficulty: 'intermediate', timeLimit: 40, passingScore: 65,
    tags: ['算法', '复杂度', '大O'],
    questions: [
      { question: '快速排序的平均时间复杂度是？', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1, explanation: '快速排序平均O(n log n)，最坏情况O(n²)（已排序数组+选最后元素为pivot）' },
      { question: '二分查找的时间复杂度是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correct: 1, explanation: '每次将搜索范围缩小一半，所以是O(log n)' },
      { question: '以下哪种数据结构的查找时间复杂度是O(1)？', options: ['链表', '二叉搜索树', '哈希表', '数组'], correct: 2, explanation: '哈希表通过哈希函数直接定位，平均查找时间O(1)' },
    ]
  },
  {
    title: 'Python 数据科学入门',
    description: '测试NumPy、Pandas、Matplotlib等数据科学基础库的使用知识。',
    category: 'data-science', difficulty: 'beginner', timeLimit: 35, passingScore: 60,
    tags: ['Python', 'NumPy', 'Pandas', '数据科学'],
    questions: [
      { question: 'Pandas中如何读取CSV文件？', options: ['pd.read_csv()', 'pd.load_csv()', 'pd.import_csv()', 'pd.open_csv()'], correct: 0, explanation: 'pd.read_csv()是读取CSV文件的标准方法' },
      { question: 'NumPy数组和Python列表的主要区别？', options: ['没有区别', 'NumPy数组元素类型必须相同，运算更快', 'Python列表更快', 'NumPy只能存储数字'], correct: 1, explanation: 'NumPy数组是同类型数据的高效存储，向量化运算比Python循环快数十倍' },
    ]
  },
  {
    title: 'MySQL 查询优化',
    description: '考察SQL查询性能优化技巧，包括索引、执行计划、Join优化等。',
    category: 'database', difficulty: 'advanced', timeLimit: 50, passingScore: 75,
    tags: ['MySQL', '数据库', 'SQL优化', '索引'],
    questions: [
      { question: 'EXPLAIN关键字的作用是？', options: ['删除表', '分析查询执行计划', '创建索引', '备份数据库'], correct: 1, explanation: 'EXPLAIN显示MySQL如何执行查询，包括是否使用索引、扫描行数等信息' },
      { question: '以下哪种情况会导致索引失效？', options: ['在WHERE中使用=', '使用LIKE "abc%"', '使用LIKE "%abc"', '在索引列上使用ORDER BY'], correct: 2, explanation: 'LIKE以%开头会导致全表扫描，索引无法使用' },
    ]
  },
];

const groups = [
  { name: 'Vue 3 进阶学习小组', description: '深入学习Vue 3 Composition API、Pinia、Vue Router等核心技术', category: 'frontend', avatar: 'https://picsum.photos/seed/vue3group/64/64', coverImage: 'https://picsum.photos/seed/vue3cover/800/400', tags: ['Vue3', 'Pinia', '前端'], maxMembers: 50, memberCount: 23, status: 'active', visibility: 'public' },
  { name: 'LeetCode 每日打卡', description: '每天一道算法题，一起备战大厂面试，互相讨论解题思路', category: 'algorithms', avatar: 'https://picsum.photos/seed/leetcode/64/64', coverImage: 'https://picsum.photos/seed/leetcodecover/800/400', tags: ['算法', '面试', 'LeetCode'], maxMembers: 200, memberCount: 156, status: 'active', visibility: 'public' },
  { name: 'AI大模型研究组', description: '探索ChatGPT、Claude、Gemini等大语言模型的原理与应用', category: 'ai-llm', avatar: 'https://picsum.photos/seed/aigroup/64/64', coverImage: 'https://picsum.photos/seed/aicover/800/400', tags: ['AI', 'LLM', 'Prompt'], maxMembers: 100, memberCount: 67, status: 'active', visibility: 'public' },
  { name: 'Python 数据分析交流', description: '分享数据分析项目、可视化技巧和机器学习实战经验', category: 'data-science', avatar: 'https://picsum.photos/seed/pythongroup/64/64', coverImage: 'https://picsum.photos/seed/pythoncover/800/400', tags: ['Python', '数据分析', 'Pandas'], maxMembers: 80, memberCount: 45, status: 'active', visibility: 'public' },
  { name: 'DevOps 实践社群', description: 'Docker/K8s/CI CD 实践分享，云原生技术交流', category: 'cloud-devops', avatar: 'https://picsum.photos/seed/devopsgroup/64/64', coverImage: 'https://picsum.photos/seed/devopscover/800/400', tags: ['Docker', 'K8s', 'DevOps'], maxMembers: 60, memberCount: 31, status: 'active', visibility: 'public' },
  { name: 'React 生态圈', description: '讨论React 18新特性、Next.js、状态管理最佳实践', category: 'frontend', avatar: 'https://picsum.photos/seed/reactgroup/64/64', coverImage: 'https://picsum.photos/seed/reactcover/800/400', tags: ['React', 'Next.js', '前端'], maxMembers: 80, memberCount: 52, status: 'active', visibility: 'public' },
  { name: 'Go语言实战营', description: '从入门到精通Go语言，分享微服务架构实战经验', category: 'backend', avatar: 'https://picsum.photos/seed/gogroup/64/64', coverImage: 'https://picsum.photos/seed/gocover/800/400', tags: ['Go', '后端', '微服务'], maxMembers: 50, memberCount: 28, status: 'active', visibility: 'public' },
  { name: '网络安全CTF战队', description: 'CTF赛题解析、渗透测试技术、安全工具分享', category: 'security', avatar: 'https://picsum.photos/seed/ctfgroup/64/64', coverImage: 'https://picsum.photos/seed/ctfcover/800/400', tags: ['安全', 'CTF', '渗透测试'], maxMembers: 30, memberCount: 19, status: 'active', visibility: 'public' },
];

// ─── 主函数 ────────────────────────────────────────────────────────
async function seed() {
  console.log('🔗 连接数据库:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ 数据库已连接');

  // Categories
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany(categories);
    console.log(`✅ 已插入 ${categories.length} 个分类`);
  } else {
    console.log(`⏭️  分类已有 ${catCount} 条，跳过`);
  }

  // Achievements
  const achCount = await Achievement.countDocuments();
  if (achCount === 0) {
    await Achievement.insertMany(achievements);
    console.log(`✅ 已插入 ${achievements.length} 个成就`);
  } else {
    console.log(`⏭️  成就已有 ${achCount} 条，跳过`);
  }

  // 查出分类 slug→_id 映射
  const allCats = await Category.find({}, { slug: 1, _id: 1 });
  const catMap = {};
  allCats.forEach(c => { catMap[c.slug] = c._id; });

  // Tests（category 字段需要 ObjectId）
  const testCount = await Test.countDocuments();
  if (testCount === 0) {
    const testsWithIds = tests.map(t => ({
      ...t,
      category: catMap[t.category] || catMap['frontend'], // fallback to frontend
    }));
    await Test.insertMany(testsWithIds);
    console.log(`✅ 已插入 ${tests.length} 个测试`);
  } else {
    console.log(`⏭️  测试已有 ${testCount} 条，跳过`);
  }

  // Groups — 直接用原生 MongoDB driver 写入，绕过 Mongoose Schema 限制
  const SYSTEM_OID = new mongoose.Types.ObjectId('000000000000000000000001');
  const groupColl = mongoose.connection.db.collection('groups');
  const groupCount = await groupColl.countDocuments();
  if (groupCount === 0) {
    const groupDocs = groups.map(g => ({
      ...g,
      visibility: 'public',
      status: 'active',
      creator: SYSTEM_OID,
      admins: [SYSTEM_OID],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await groupColl.insertMany(groupDocs);
    console.log(`✅ 已插入 ${groups.length} 个学习小组`);
  } else {
    console.log(`⏭️  小组已有 ${groupCount} 条，跳过`);
  }

  console.log('\n🎉 Seed完成！');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed失败:', err.message);
  process.exit(1);
});
