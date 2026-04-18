/**
 * 知识库控制器
 * 提供文章/教程内容
 */

// 知识库文章数据
const knowledgeArticles = [
  {
    id: '1',
    title: 'JavaScript ES6+ 核心特性详解',
    category: 'JavaScript',
    tags: ['ES6', '箭头函数', '解构赋值', 'Promise'],
    summary: '全面介绍ES6及以后版本的核心特性，包括箭头函数、解构赋值、模块化、异步编程等',
    content: `# JavaScript ES6+ 核心特性详解

## 1. 箭头函数

\`\`\`javascript
const add = (a, b) => a + b;

// 隐式返回
const double = x => x * 2;
\`\`\`

**特点**：
- 没有 this 绑定，this 从外层继承
- 不能作为构造函数使用
- 没有 arguments 对象

## 2. 解构赋值

\`\`\`javascript
// 数组解构
const [first, second] = [1, 2];

// 对象解构
const { name, age } = person;

// 默认值
const { x = 0, y = 0 } = position;
\`\`\`

## 3. 模板字符串

\`\`\`javascript
const name = 'World';
const greeting = \`Hello, \${name}!\`;
\`\`\`
`,
    difficulty: 'intermediate',
    readTime: 8,
    views: 1520,
    likes: 234,
    createdAt: new Date('2024-01-15'),
    author: '智学AI团队',
  },
  {
    id: '2',
    title: 'Vue3 Composition API 完整指南',
    category: 'Vue',
    tags: ['Vue3', 'Composition API', 'reactive', 'ref'],
    summary: '从Options API到Composition API的完整迁移指南，深入理解响应式原理',
    content: `# Vue3 Composition API 完整指南

## 响应式基础

### ref vs reactive

\`\`\`vue
<script setup>
import { ref, reactive } from 'vue'

// ref - 用于基本类型
const count = ref(0)

// reactive - 用于对象
const state = reactive({
  user: { name: '' },
  items: []
})
</script>
\`\`\`

## 常用组合式函数

- **computed** - 计算属性
- **watch / watchEffect** - 监听器
- **onMounted / onUnmounted** - 生命周期
- **provide / inject** - 依赖注入
`,
    difficulty: 'intermediate',
    readTime: 12,
    views: 2100,
    likes: 456,
    createdAt: new Date('2024-02-01'),
    author: '智学AI团队',
  },
  {
    id: '3',
    title: 'React Hooks 深度解析',
    category: 'React',
    tags: ['React', 'Hooks', 'useState', 'useEffect'],
    summary: '深入理解React Hooks的工作原理和最佳实践模式',
    content: `# React Hooks 深度解析

## useState

\`\`\`jsx
const [state, setState] = useState(initialValue);

// 函数式初始值
const [data, setData] = useState(() => {
  return expensiveComputation();
});
\`\`\`

## useEffect

\`\`\`jsx
useEffect(() => {
  // 副作用逻辑
  
  return () => {
    // 清理函数
  };
}, [dependencies]);
\`\`\`

## 自定义 Hook 示例

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return localStorage.getItem(key) || initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);
  
  return [value, setValue];
}
\`\`\`
`,
    difficulty: 'advanced',
    readTime: 10,
    views: 1890,
    likes: 367,
    createdAt: new Date('2024-02-20'),
    author: '智学AI团队',
  },
  {
    id: '4',
    title: 'Python 数据处理实战：Pandas 入门到精通',
    category: 'Python',
    tags: ['Python', 'Pandas', '数据处理', '数据分析'],
    summary: '从零开始学习Pandas进行数据清洗、转换和分析的完整教程',
    content: `# Python 数据处理实战：Pandas 入门到精通

## 基础操作

\`\`\`python
import pandas as pd

# 读取数据
df = pd.read_csv('data.csv')
df.head()  # 查看前5行
df.info()  # 数据概览

# 选择数据
df['column_name']           # 单列
df[['col1', 'col2']]       # 多列
df.loc[0]                   # 按标签选择
df.iloc[0:5]                # 按位置选择
\`\`\`

## 数据清洗

\`\`\`python
# 处理缺失值
df.dropna()                 # 删除空值
df.fillna(value)            # 填充空值

# 处理重复值
df.duplicated()
df.drop_duplicates()

# 类型转换
df['column'] = df['column'].astype('int')
\`\`\`
`,
    difficulty: 'beginner',
    readTime: 15,
    views: 3200,
    likes: 589,
    createdAt: new Date('2024-03-10'),
    author: '智学AI团队',
  },
  {
    id: '5',
    title: 'Node.js 后端开发最佳实践',
    category: 'Node.js',
    tags: ['Node.js', 'Express', 'REST API', '后端'],
    summary: '构建可扩展、安全的Node.js RESTful API的完整实践指南',
    content: `# Node.js 后端开发最佳实践

## 项目结构

\`\`\`
src/
├── controllers/   # 控制器
├── models/        # 数据模型
├── routes/        # 路由定义
├── middleware/    # 中间件
├── utils/         # 工具函数
└── config/        # 配置文件
\`\`\`

## Express 路由设计

\`\`\`javascript
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    // 参数校验
    if (page < 1 || limit > 100) {
      return res.status(400).json({ error: '参数无效' });
    }
    
    // 业务逻辑
    const result = await userService.getList({ page, limit, search });
    
    // 响应格式统一
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);  // 交给错误中间件处理
  }
});
\`\`\`

## 中间件最佳实践

- **认证**: JWT Token验证
- **日志**: 请求/响应日志记录
- **限流**: 防止API滥用
- **CORS**: 跨域配置
- **错误处理**: 统一错误格式
`,
    difficulty: 'advanced',
    readTime: 14,
    views: 1450,
    likes: 298,
    createdAt: new Date('2024-04-05'),
    author: '智学AI团队',
  },
  {
    id: '6',
    title: 'CSS Grid 与 Flexbox 布局完全指南',
    category: 'CSS',
    tags: ['CSS', 'Grid', 'Flexbox', '布局', '响应式'],
    summary: '现代CSS布局技术详解，掌握Grid和Flexbox的所有核心概念',
    content: `# CSS Grid 与 Flexbox 布局完全指南

## Flexbox 一维布局

\`\`\`css
.container {
  display: flex;
  justify-content: center;  /* 主轴对齐 */
  align-items: center;      /* 交叉轴对齐 */
  gap: 16px;               /* 间距 */
}

.item {
  flex: 1;                 /* 等分剩余空间 */
}
\`\`\`

## Grid 二维布局

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

/* 区域命名 */
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
}
\`\`\`

## 响应式断点推荐

| 断点 | 设备 |
|------|------|
| < 640px | 手机 |
| 640px - 1024px | 平板 |
| > 1024px | 桌面 |
`,
    difficulty: 'beginner',
    readTime: 11,
    views: 2670,
    likes: 445,
    createdAt: new Date('2024-04-15'),
    author: '智学AI团队',
  },
];

// 分类列表
export const categories = [
  { id: 'js', name: 'JavaScript', icon: '🟨', count: 12 },
  { id: 'python', name: 'Python', icon: '🐍', count: 9 },
  { id: 'frontend', name: '前端框架', icon: '⚛️', count: 15 },
  { id: 'backend', name: '后端开发', icon: '🖥️', count: 8 },
  { id: 'database', name: '数据库', icon: '🗄️', count: 6 },
  { id: 'devops', name: 'DevOps', icon: '⚙️', count: 5 },
  { id: 'algorithm', name: '算法与数据结构', icon: '🧮', count: 10 },
  { id: 'design', name: 'UI/UX设计', icon: '🎨', count: 7 },
];

/**
 * 获取知识库文章列表
 */
export function getArticles(req, res, next) {
  try {
    let filtered = [...knowledgeArticles];

    const {
      page = 1,
      pageSize = 10,
      category,
      tag,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    // 分类筛选
    if (category && category !== 'all') {
      const catMap = {
        javascript: 'JavaScript',
        js: 'JavaScript',
        vue: 'Vue',
        react: 'React',
        python: 'Python',
        node: 'Node.js',
        css: 'CSS',
      };
      const catName = catMap[category.toLowerCase()] || category;
      filtered = filtered.filter(a => a.category === catName);
    }

    // 标签筛选
    if (tag) {
      filtered = filtered.filter(a =>
        a.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    // 搜索
    if (search) {
      const keyword = search.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(keyword) ||
          a.summary.toLowerCase().includes(keyword) ||
          a.tags.some(t => t.toLowerCase().includes(keyword))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      return order === 'desc' ? (valB > valA ? 1 : -1) : valA > valB ? 1 : -1;
    });

    // 分页
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + parseInt(pageSize));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
      categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取文章详情
 */
export function getArticleById(req, res, next) {
  try {
    const article = knowledgeArticles.find(a => a.id === req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      });
    }

    // 更新阅读量
    article.views++;

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取分类列表
 */
export function getCategories(req, res, next) {
  try {
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取热门文章
 */
export function getPopularArticles(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const popular = [...knowledgeArticles].sort((a, b) => b.likes - a.likes).slice(0, limit);

    res.json({
      success: true,
      data: popular,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 搜索文章
 */
export function searchArticles(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return getArticles(req, res, next);
    }

    const keyword = q.toLowerCase();
    const results = knowledgeArticles
      .map(article => {
        const titleMatch = article.title.toLowerCase().includes(keyword);
        const summaryMatch = article.summary.toLowerCase().includes(keyword);
        const tagMatch = article.tags.some(t => t.toLowerCase().includes(keyword));

        let score = 0;
        if (titleMatch) score += 10;
        if (summaryMatch) score += 5;
        if (tagMatch) score += 3;

        return { ...article, _relevanceScore: score };
      })
      .filter(a => a._relevanceScore > 0)
      .sort((a, b) => b._relevanceScore - a._relevanceScore)
      .map(({ _relevanceScore, ...rest }) => rest);

    res.json({
      success: true,
      data: results,
      query: q,
      total: results.length,
    });
  } catch (error) {
    next(error);
  }
}
