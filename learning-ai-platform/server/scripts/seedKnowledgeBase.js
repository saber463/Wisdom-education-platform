const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KnowledgePoint = require('../models/KnowledgePoint');
const Category = require('../models/Category');

// 加载环境变量
dotenv.config({ path: '../.env' });

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 知识库初始数据
const knowledgeBaseData = [
  {
    category: 'frontend',
    name: 'HTML5',
    description: '超文本标记语言第五版，用于构建网页结构',
    content:
      '<h2>HTML5 简介</h2>\n<p>HTML5 是 HTML 的第五个版本，是构建 Web 内容的标准标记语言。HTML5 引入了许多新特性，使网页开发更加灵活和强大。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>语义化标签</strong>：如 &lt;header&gt;、&lt;nav&gt;、&lt;section&gt;、&lt;footer&gt; 等，提高代码可读性和SEO</li>\n  <li><strong>媒体支持</strong>：内置 &lt;video&gt; 和 &lt;audio&gt; 标签，无需插件即可播放媒体</li>\n  <li><strong>Canvas API</strong>：用于绘制图形、动画和游戏</li>\n  <li><strong>表单增强</strong>：新的表单控件如 date、time、email、url 等</li>\n  <li><strong>本地存储</strong>：localStorage 和 sessionStorage</li>\n  <li><strong>Web Workers</strong>：允许在后台运行 JavaScript 代码</li>\n</ul>\n<h3>基本结构</h3>\n<pre><code>&lt;!DOCTYPE html&gt;\n&lt;html lang="zh-CN"&gt;\n&lt;head&gt;\n  &lt;meta charset="UTF-8"&gt;\n  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;\n  &lt;title&gt;HTML5 示例&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n  &lt;header&gt;\n    &lt;h1&gt;网站标题&lt;/h1&gt;\n  &lt;/header&gt;\n  &lt;nav&gt;\n    &lt;ul&gt;\n      &lt;li&gt;&lt;a href="#"&gt;首页&lt;/a&gt;&lt;/li&gt;\n      &lt;li&gt;&lt;a href="#"&gt;关于&lt;/a&gt;&lt;/li&gt;\n    &lt;/ul&gt;\n  &lt;/nav&gt;\n  &lt;section&gt;\n    &lt;h2&gt;内容区域&lt;/h2&gt;\n    &lt;p&gt;这是一段示例文本&lt;/p&gt;\n  &lt;/section&gt;\n  &lt;footer&gt;\n    &lt;p&gt;版权所有 &amp;copy; 2025&lt;/p&gt;\n  &lt;/footer&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>',
    keywords: ['html5', '语义化', 'canvas', '本地存储'],
    level: 0,
  },
  {
    category: 'frontend',
    name: 'CSS3',
    description: '层叠样式表第三版，用于设计网页样式',
    content:
      '<h2>CSS3 简介</h2>\n<p>CSS3 是层叠样式表的第三个版本，用于描述 HTML 或 XML 文档的表现形式。CSS3 引入了许多新特性，使样式设计更加灵活和强大。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>选择器增强</strong>：新的选择器如 :nth-child()、:not()、:last-of-type 等</li>\n  <li><strong>边框和背景增强</strong>：圆角、阴影、渐变、多背景等</li>\n  <li><strong>文本效果</strong>：文本阴影、文本溢出、字间距等</li>\n  <li><strong>2D/3D 转换</strong>：translate、rotate、scale、skew 等</li>\n  <li><strong>动画和过渡</strong>：transition 和 animation 属性</li>\n  <li><strong>弹性布局</strong>：Flexbox 布局模型</li>\n  <li><strong>网格布局</strong>：Grid 布局模型</li>\n  <li><strong>媒体查询</strong>：响应式设计的基础</li>\n</ul>\n<h3>示例代码</h3>\n<pre><code>/* 圆角边框 */\ndiv {\n  border-radius: 10px;\n}\n\n/* 渐变背景 */\n.button {\n  background: linear-gradient(to right, #3498db, #2ecc71);\n}\n\n/* 动画效果 */\n@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n.fade-in {\n  animation: fadeIn 1s ease-in-out;\n}\n\n/* 响应式设计 */\n@media (max-width: 768px) {\n  .container {\n    width: 100%;\n  }\n}</code></pre>',
    keywords: ['css3', '动画', '响应式', 'flexbox', 'grid'],
    level: 0,
  },
  {
    category: 'frontend',
    name: 'JavaScript',
    description: '一种轻量级的编程语言，用于实现网页交互',
    content:
      '<h2>JavaScript 简介</h2>\n<p>JavaScript 是一种轻量级的解释型编程语言，主要用于实现网页的交互功能。它是 Web 开发的三大核心技术之一（HTML、CSS、JavaScript）。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>动态类型</strong>：变量类型在运行时确定</li>\n  <li><strong>面向对象</strong>：支持基于原型的面向对象编程</li>\n  <li><strong>函数式编程</strong>：函数是一等公民</li>\n  <li><strong>事件驱动</strong>：通过事件处理用户交互</li>\n  <li><strong>异步编程</strong>：支持回调、Promise、async/await</li>\n  <li><strong>DOM 操作</strong>：可以动态修改网页内容和样式</li>\n  <li><strong>JSON 支持</strong>：轻量级的数据交换格式</li>\n</ul>\n<h3>基本语法</h3>\n<pre><code>// 变量声明\nlet name = "张三";\nconst age = 25;\nvar city = "北京";\n\n// 函数定义\nfunction greet(person) {\n  return "Hello, " + person + "!";\n}\n\n// 箭头函数\nconst add = function(a, b) { return a + b; };\n\n// 条件语句\nif (age >= 18) {\n  console.log("成年人");\n} else {\n  console.log("未成年人");\n}\n\n// 循环语句\nfor (var i = 0; i < 5; i++) {\n  console.log(i);\n}\n\n// 对象\nconst user = {\n  name: "张三",\n  age: 25,\n  sayHello: function() {\n    console.log("Hello, my name is " + this.name);\n  }\n};\n\n// 数组\nconst colors = ["红", "绿", "蓝"];\ncolors.forEach(function(color) { console.log(color); });</code></pre>',
    keywords: ['javascript', '异步编程', 'dom操作', 'es6', '数组方法'],
    level: 0,
  },
  {
    category: 'backend',
    name: 'Node.js',
    description: '基于 Chrome V8 引擎的 JavaScript 运行时',
    content:
      '<h2>Node.js 简介</h2>\n<p>Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，用于在服务器端运行 JavaScript 代码。它使用事件驱动、非阻塞 I/O 模型，使其轻量且高效。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>单线程</strong>：使用单线程处理请求，但通过事件循环实现高并发</li>\n  <li><strong>非阻塞 I/O</strong>：异步处理文件系统和网络操作</li>\n  <li><strong>NPM</strong>：世界上最大的开源包管理器</li>\n  <li><strong>模块化</strong>：使用 CommonJS 模块系统</li>\n  <li><strong>事件驱动</strong>：基于 EventEmitter 类实现事件处理</li>\n  <li><strong>跨平台</strong>：可以在 Windows、macOS 和 Linux 上运行</li>\n</ul>\n<h3>基本示例</h3>\n<pre><code>// 引入模块\nconst http = require("http");\nconst fs = require("fs");\n\n// 创建 HTTP 服务器\nconst server = http.createServer(function(req, res) {\n  // 设置响应头\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  // 发送响应内容\n  res.end("Hello, Node.js!\n");\n});\n\n// 监听端口\nconst PORT = process.env.PORT || 3000;\nserver.listen(PORT, function() {\n  console.log("Server running at http://localhost:" + PORT + "/");\n});\n\n// 异步文件操作\nfs.readFile("example.txt", "utf8", function(err, data) {\n  if (err) throw err;\n  console.log(data);\n});</code></pre>',
    keywords: ['node.js', 'npm', 'express', '异步编程', '服务器'],
    level: 0,
  },
  {
    category: 'backend',
    name: 'Express',
    description: '基于 Node.js 的 Web 应用框架',
    content:
      '<h2>Express 简介</h2>\n<p>Express 是一个基于 Node.js 的快速、极简的 Web 应用框架，提供了强大的功能来构建 Web 和移动应用。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>路由系统</strong>：简洁的路由定义方式</li>\n  <li><strong>中间件</strong>：可以在请求处理过程中添加功能</li>\n  <li><strong>模板引擎</strong>：支持多种模板引擎如 EJS、Pug</li>\n  <li><strong>静态文件服务</strong>：方便地提供静态资源</li>\n  <li><strong>错误处理</strong>：集中式的错误处理机制</li>\n  <li><strong>RESTful API</strong>：易于构建 RESTful 风格的 API</li>\n</ul>\n<h3>基本示例</h3>\n<pre><code>// 引入 Express\nconst express = require("express");\n\n// 创建 Express 应用\nconst app = express();\n\n// 中间件\napp.use(express.json()); // 解析 JSON 请求体\napp.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体\n\n// 路由\napp.get("/", function(req, res) {\n  res.send("Hello, Express!");\n});\n\napp.get("/api/users", function(req, res) {\n  res.json([{ id: 1, name: "张三" }, { id: 2, name: "李四" }]);\n});\n\napp.post("/api/users", function(req, res) {\n  const newUser = req.body;\n  res.status(201).json(newUser);\n});\n\n// 错误处理中间件\napp.use(function(err, req, res, next) {\n  console.error(err.stack);\n  res.status(500).send("Something broke!");\n});\n\n// 监听端口\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, function() {\n  console.log("Server running on port " + PORT);\n});</code></pre>',
    keywords: ['express', '中间件', '路由', 'restful api', 'web框架'],
    level: 0,
  },
  {
    category: 'database',
    name: 'MongoDB',
    description: '面向文档的 NoSQL 数据库',
    content:
      '<h2>MongoDB 简介</h2>\n<p>MongoDB 是一个面向文档的 NoSQL 数据库，使用 BSON（类似 JSON）格式存储数据。它提供了高性能、高可用性和可扩展性。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>面向文档</strong>：数据以 JSON 格式存储，更接近应用程序数据结构</li>\n  <li><strong>动态模式</strong>：同一集合中的文档可以有不同的结构</li>\n  <li><strong>高可用性</strong>：支持副本集，提供数据冗余和自动故障转移</li>\n  <li><strong>水平扩展</strong>：支持分片，可在多台服务器上分布数据</li>\n  <li><strong>丰富的查询语言</strong>：支持复杂查询、聚合、索引等</li>\n  <li><strong>地理空间支持</strong>：可以存储和查询地理空间数据</li>\n  <li><strong>文本搜索</strong>：内置全文搜索功能</li>\n</ul>\n<h3>基本操作</h3>\n<pre><code>// 连接数据库\nconst mongoose = require("mongoose");\nmongoose.connect("mongodb://localhost:27017/mydatabase", { useNewUrlParser: true });\n\n// 定义模式\nconst userSchema = new mongoose.Schema({\n  name: String,\n  age: Number,\n  email: String,\n  createdAt: { type: Date, default: Date.now }\n});\n\n// 创建模型\nconst User = mongoose.model("User", userSchema);\n\n// 创建文档\nconst newUser = new User({ name: "张三", age: 25, email: "zhangsan@example.com" });\nnewUser.save()\n  .then(function(user) { console.log("User created:", user); })\n  .catch(function(err) { console.error("Error creating user:", err); });\n\n// 查询文档\nUser.find({ age: { $gt: 18 } })\n  .then(function(users) { console.log("Users older than 18:", users); })\n  .catch(function(err) { console.error("Error finding users:", err); });\n\n// 更新文档\nUser.updateOne({ name: "张三" }, { age: 26 })\n  .then(function(result) { console.log("Update result:", result); })\n  .catch(function(err) { console.error("Error updating user:", err); });\n\n// 删除文档\nUser.deleteOne({ name: "张三" })\n  .then(function(result) { console.log("Delete result:", result); })\n  .catch(function(err) { console.error("Error deleting user:", err); });</code></pre>',
    keywords: ['mongodb', 'nosql', '数据库', 'mongoose', '文档数据库'],
    level: 0,
  },
  {
    category: 'frontend',
    name: 'React',
    description: '用于构建用户界面的 JavaScript 库',
    content:
      '<h2>React 简介</h2>\n<p>React 是一个由 Facebook 开发的用于构建用户界面的 JavaScript 库。它允许开发者创建可复用的 UI 组件，并使用虚拟 DOM 提高性能。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>组件化</strong>：将 UI 拆分为独立的、可复用的组件</li>\n  <li><strong>虚拟 DOM</strong>：使用虚拟 DOM 提高渲染性能</li>\n  <li><strong>单向数据流</strong>：数据从父组件流向子组件</li>\n  <li><strong>JSX</strong>：JavaScript 的语法扩展，允许在 JavaScript 中编写 HTML</li>\n  <li><strong>生命周期方法</strong>：控制组件的创建、更新和销毁</li>\n  <li><strong>Hooks</strong>：在函数组件中使用状态和其他 React 特性</li>\n  <li><strong>Context API</strong>：在组件树中共享状态</li>\n</ul>\n<h3>基本示例</h3>\n<pre><code>// 类组件\nimport React, { Component } from "react";\n\nclass Counter extends Component {\n  constructor(props) {\n    super(props);\n    this.state = { count: 0 };\n  }\n\n  increment = function() {\n    this.setState(function(prevState) {\n      return { count: prevState.count + 1 };\n    });\n  };\n\n  render() {\n    return (\n      &lt;div&gt;\n        &lt;p&gt;Count: {this.state.count}&lt;/p&gt;\n        &lt;button onClick={this.increment}&gt;Increment&lt;/button&gt;\n      &lt;/div&gt;\n    );\n  }\n}\n\n// 函数组件 + Hooks\nimport React, { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    &lt;div&gt;\n      &lt;p&gt;Count: {count}&lt;/p&gt;\n      &lt;button onClick={function() { setCount(count + 1); }}&gt;Increment&lt;/button&gt;\n    &lt;/div&gt;\n  );\n}\n\n// 导出组件\nexport default Counter;</code></pre>',
    keywords: ['react', '组件化', 'jsx', 'hooks', '虚拟dom'],
    level: 0,
  },
  {
    category: 'frontend',
    name: 'Vue.js',
    description: '渐进式 JavaScript 框架',
    content:
      '<h2>Vue.js 简介</h2>\n<p>Vue.js 是一个渐进式 JavaScript 框架，用于构建用户界面。它易于学习和使用，同时提供了构建复杂单页应用所需的功能。</p>\n<h3>主要特性</h3>\n<ul>\n  <li><strong>渐进式</strong>：可以逐步集成到现有项目中</li>\n  <li><strong>响应式数据绑定</strong>：自动更新 DOM 当数据变化时</li>\n  <li><strong>组件化</strong>：将 UI 拆分为独立的、可复用的组件</li>\n  <li><strong>模板语法</strong>：基于 HTML 的模板，易于理解和使用</li>\n  <li><strong>指令</strong>：特殊的 HTML 属性，如 v-if、v-for、v-bind、v-on</li>\n  <li><strong>生命周期钩子</strong>：控制组件的创建、更新和销毁</li>\n  <li><strong>Vuex</strong>：状态管理库</li>\n  <li><strong>Vue Router</strong>：路由管理库</li>\n</ul>\n<h3>基础示例</h3>\n<pre><code>&lt;div id="app"&gt;\n  &lt;h1&gt;{{ message }}&lt;/h1&gt;\n  &lt;p&gt;Count: {{ count }}&lt;/p&gt;\n  &lt;button @click="increment"&gt;Increment&lt;/button&gt;\n&lt;/div&gt;\n\n&lt;script&gt;\nnew Vue({\n  el: "#app",\n  data: {\n    message: "Hello, Vue!",\n    count: 0\n  },\n  methods: {\n    increment: function() {\n      this.count++\n    }\n  }\n})\n&lt;/script&gt;</code></pre>',
    keywords: ['vue.js', '响应式', '组件化', '指令', '组合式api'],
    level: 0,
  },
];

// 运行种子脚本
const runSeed = async function () {
  try {
    // 连接数据库
    await connectDB();

    // 获取分类 ID
    const frontendCategory = await Category.findOne({ slug: 'frontend' });
    const backendCategory = await Category.findOne({ slug: 'backend' });
    const databaseCategory = await Category.findOne({ slug: 'database' });

    // 调试：输出获取的分类
    console.log('分类查询结果:');
    console.log('前端开发:', frontendCategory);
    console.log('后端开发:', backendCategory);
    console.log('数据库:', databaseCategory);

    // 映射分类
    const categoryMap = {
      frontend: frontendCategory?._id,
      backend: backendCategory?._id,
      database: databaseCategory?._id,
    };

    // 插入知识点
    for (let i = 0; i < knowledgeBaseData.length; i++) {
      const item = knowledgeBaseData[i];
      // 检查是否已存在
      const existing = await KnowledgePoint.findOne({ name: item.name });
      if (!existing) {
        const knowledgePoint = new KnowledgePoint({
          ...item,
          category: categoryMap[item.category],
        });
        await knowledgePoint.save();
        console.log('✅ 已添加知识点: ' + item.name);
      } else {
        console.log('⚠️  知识点已存在: ' + item.name);
      }
    }

    console.log('\n🎉 知识库种子数据添加完成！');
  } catch (error) {
    console.error('❌ 种子脚本执行失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
};

// 执行种子脚本
runSeed();
