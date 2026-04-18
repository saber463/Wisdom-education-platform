/**
 * 明星导师帖子数据 - 每位导师10条学习社区帖子
 * 基于导师主讲的课程方向生成，包含技术分享、实战经验、行业见解等类型
 */

// 通用时间生成器 - 模拟不同时间段发布的帖子
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

// ===== 导师1: 李明哲 - 前端架构师 · 前阿里P8 =====
// 主讲课程: Vue3企业级实战, TypeScript进阶, 前端性能优化, 微前端架构设计
export const teacher1_tweets = [
  {
    _id: 't1_post_1',
    content: '【Vue3 Composition API 最佳实践】\n\n今天分享一个我在项目中常用的模式：使用 composable 封装业务逻辑。把数据获取、状态管理、副作用都抽到独立的 hook 里，组件就只剩模板和组合逻辑了。\n\n代码可读性提升300%，测试也变得超简单！\n\n#Vue3 #CompositionAPI #前端架构',
    images: [],
    likes: 328, comments: [], shares: 56, likedBy: [],
    createdAt: hoursAgo(2),
    knowledgePoints: ['composable 拆分原则', '单一职责原则', '关注点分离'],
  },
  {
    _id: 't1_post_2',
    content: 'TypeScript 泛型约束的妙用\n\n很多人觉得 TS 泛型难，其实核心就一句话：「约束输入输出的形状」。\n\n举个实战例子：\n```ts\nfunction fetchData<T extends { id: string }>(url: string): Promise<T[]> {\n  return fetch(url).then(r => r.json());\n}\n```\n这样调用方就能自动获得完整的类型推导。\n\n#TypeScript #泛型 #类型安全',
    images: [],
    likes: 256, comments: [], shares: 42, likedBy: [],
    createdAt: hoursAgo(6),
    knowledgePoints: ['泛型约束 extends', '自动类型推导', 'API 类型封装'],
  },
  {
    _id: 't1_post_3',
    content: '【前端性能优化】Chrome Performance 面板使用指南 🚀\n\n上周帮团队排查了一个首屏加载从 4.2s 降到 1.1s 的案例：\n\n1️⃣ 用 Lighthouse 先做基线评分\n2️⃣ Performance 面板录制一次完整加载\n3️⃣ 找出 Main Thread 上的长任务（>50ms）\n4️⃣ 重点优化：图片懒加载 + 代码分割 + 关键CSS内联\n\n关键发现：一个第三方 SDK 的初始化阻塞了主线程整整 800ms！\n\n#性能优化 #Chrome #WebVitals',
    images: [],
    likes: 512, comments: [], shares: 89, likedBy: [],
    createdAt: daysAgo(1),
    knowledgePoints: ['Lighthouse 性能分析', '长任务优化', '关键渲染路径'],
  },
  {
    _id: 't1_post_4',
    content: '微前端实战踩坑记录 qiankun\n\n我们团队用 qiankun 做微前端落地已经一年多了，总结几个血泪教训：\n\n❌ JS 沙箱不能完全隔离样式\n✅ 用 CSS Module 或 scoped 样式 + 命名约定\n❌ 子应用间通信不要用全局变量\n✅ 用自定义事件或状态管理库\n❌ 路由冲突是最大的坑\n✅ 统一前缀约定 + 路由拦截器\n\n#微前端 #qiankun #架构设计',
    images: [],
    likes: 389, comments: [], shares: 67, likedBy: [],
    createdAt: daysAgo(2),
    knowledgePoints: ['沙箱隔离', '样式冲突', '路由前缀约定'],
  },
  {
    _id: 't1_post_5',
    content: 'Vue3 vs React：2024年的选择建议\n\n经常被问到这个问题，说下我的真实看法：\n\n选 Vue3 如果：\n- 团队有 Vue 背景\n- 追求开发效率和上手速度\n- 中后台管理系统居多\n- 中文生态需求强\n\n选 React 如果：\n- 大型复杂应用\n- 需要最大灵活性\n- 移动端跨平台（React Native）\n- 团队偏好函数式编程\n\n其实两个框架的核心思想越来越像了，学好一个另一个很快上手。\n\n#Vue3 #React #技术选型',
    images: [],
    likes: 723, comments: [], shares: 134, likedBy: [],
    createdAt: daysAgo(3),
    knowledgePoints: ['技术选型考量', '团队能力匹配', '生态对比'],
  },
  {
    _id: 't1_post_6',
    content: '【Webpack5 模块联邦】微前端的另一种思路\n\nModule Federation 是 Webpack5 最激动人心的特性之一！它让不同的独立构建可以共享代码。\n\n核心配置就这几行：\n```js\nnew ModuleFederationPlugin({\n  name: \'host\',\n  remotes: { mfe1: \'mfe1@http://localhost:3001/remoteEntry.js\' },\n  shared: { vue: { singleton: true } }\n})\n```\n比 qiankun 更轻量，适合同技术栈场景。\n\n#Webpack #模块联邦 #微前端',
    images: [],
    likes: 198, comments: [], shares: 35, likedBy: [],
    createdAt: daysAgo(4),
    knowledgePoints: ['Module Federation', 'remote entry', 'shared 依赖'],
  },
  {
    _id: 't1_post_7',
    content: '关于前端工程师的成长路径，想和新人说几句真心话：\n\n📌 第1-2年：打好基础\nHTML/CSS/JS 三件套要扎实，不是会用就行，是要理解原理\n\n📌 第3-4年：深入框架源码\n会用 ≠ 懂，看源码才能理解设计思想\n\n📌 第5年+：工程化思维\n性能、安全、监控、CI/CD、架构设计\n\n最重要的是：保持好奇心，技术变化很快，学习能力才是核心竞争力。\n\n#前端成长 #职业规划 #程序员',
    images: [],
    likes: 1056, comments: [], shares: 234, likedBy: [],
    createdAt: daysAgo(5),
    knowledgePoints: ['基础的重要性', '源码阅读', '工程化思维'],
  },
  {
    _id: 't1_post_8',
    content: 'Vite 为什么这么快？底层原理解析 🔥\n\nVite 的快主要体现在两个方面：\n\n1️⃣ 开发服务器启动快\n- 使用 esbuild 预构建依赖（Go 写的，比 webpack 快 10-100x）\n- 浏览器原生 ESM，按需编译，不用打包整个项目\n\n2️⃣ 热更新快\n- HMR 只更新变更的模块及其依赖链\n- 不管项目多大，HMR 都能在毫秒级完成\n\n生产环境还是用 Rollup 打包，兼顾体积和兼容性。\n\n#Vite #esbuild #构建工具',
    images: [],
    likes: 445, comments: [], shares: 78, likedBy: [],
    createdAt: daysAgo(6),
    knowledgePoints: ['esbuild 预构建', '原生 ESM', '精确 HMR'],
  },
  {
    _id: 't1_post_9',
    content: 'CSS 新特性 Container Queries 实战\n\nContainer Queries 终于在主流浏览器全面支持了！它解决了响应式设计的痛点：\n\n之前：只能根据 viewport 大小调整样式\n现在：可以根据父容器大小调整样式！\n\n```css\n.card-container {\n  container-type: inline-size;\n}\n@container (min-width: 400px) {\n  .card { display: flex; }\n}\n```\n组件级别的真正响应式终于来了！\n\n#CSS #ContainerQueries #响应式',
    images: [],
    likes: 267, comments: [], shares: 43, likedBy: [],
    createdAt: daysAgo(7),
    knowledgePoints: ['container-type', '@container', '组件级响应式'],
  },
  {
    _id: 't1_post_10',
    content: '【年终总结】2024年前端技术趋势回顾\n\n今年最值得关注的前端技术：\n\n🏆 Server Components（RSC）- 服务端组件成为主流\n🏆 Edge Computing - 边缘计算改变部署方式\n🏆 AI + 前端 - AI 编程助手大幅提效\n🏆 Bun/Node.js 替代方案 - 运行时竞争白热化\n🏆 Signal-based - 细粒度响应式新范式\n\n你对哪个最感兴趣？评论区聊聊 👇\n\n#前端趋势 #2024总结 #技术展望',
    images: [],
    likes: 892, comments: [], shares: 156, likedBy: [],
    createdAt: daysAgo(9),
    knowledgePoints: ['Server Components', 'Edge Computing', 'Signal-based 响应式'],
  }
];

// ===== 导师2: 王雪峰 - 后端技术专家 · 前字节架构师 =====
// 主讲课程: Go微服务架构, Kubernetes实战, 高并发系统设计, 分布式事务
export const teacher2_tweets = [
  {
    _id: 't2_post_1',
    content: '【Go 并发模式】Worker Pool 实战详解\n\n在高并发场景中，goroutine 不能无限制创建，Worker Pool 是标准解决方案：\n\n核心思路：固定数量的 worker 从 job channel 取任务执行，结果通过 result channel 返回。\n\n⚠️ 注意事项：\n1. 记得 close job channel 让 worker 能退出\n2. 用 WaitGroup 等待所有 worker 完成\n3. 用 buffered channel 控制并发度\n\n我在字节跳动处理日均百亿请求的系统里大量使用了这个模式。\n\n#Go #并发 #WorkerPool',
    images: [],
    likes: 456, comments: [], shares: 78, likedBy: [],
    createdAt: hoursAgo(3),
    knowledgePoints: ['goroutine 池', 'channel 通信', 'WaitGroup 协调'],
  },
  {
    _id: 't2_post_2',
    content: 'Kubernetes Pod 调度策略全解析\n\nK8s 的 Pod 调度远比你想象的智能：\n\n📌 nodeSelector - 最简单的节点选择\n📌 nodeAffinity - 软硬亲和性规则\n📌 taints/tolerations - 专用节点标记\n📌 PodDisruptionBudget - 可用性保障\n\n实战经验：生产环境务必设置 PDB 和资源请求（requests），否则 Pod 可能被调度到资源不足的节点导致 OOM。\n\n#Kubernetes #K8s #云原生',
    images: [],
    likes: 334, comments: [], shares: 52, likedBy: [],
    createdAt: hoursAgo(8),
    knowledgePoints: ['调度亲和性', 'Taint/Toleration', 'PDB 可用性保障'],
  },
  {
    _id: 't2_post_3',
    content: '【高并发系统设计】如何设计每秒处理 100 万 QPS 的网关？\n\n在字节跳动的经验分享：\n\n🔹 连接池复用 - 不要每次请求新建连接\n🔹 异步非 IO - Netty/Go net 都是首选\n🔹 多级缓存 - 本地缓存 → Redis → DB\n🔹 限流熔断 - Sentinel/Hystrix 保护下游\n🔹 水平扩展 - 无状态设计 + 自动扩缩容\n\n核心原则：任何单点都不能成为瓶颈。\n\n#高并发 #架构设计 #系统设计',
    images: [],
    likes: 678, comments: [], shares: 112, likedBy: [],
    createdAt: daysAgo(1),
    knowledgePoints: ['连接复用', '多级缓存', '无状态水平扩展'],
  },
  {
    _id: 't2_post_4',
    content: '分布式事务：2PC、TCC、Saga、本地消息表 怎么选？\n\n这是后端面试必考题，也是实际开发中最容易踩坑的地方：\n\n| 方案 | 一致性 | 性能 | 复杂度 | 适用场景 |\n|------|--------|------|--------|----------|\n| 2PC | 强一致 | 低 | 低 | 传统金融 |\n| TCC | 强一致 | 中 | 高 | 金融核心 |\n| Saga | 最终一致 | 高 | 中 | 长事务流程 |\n| 消息表 | 最终一致 | 高 | 低 | 异步解耦 |\n\n我的建议：90%的场景用本地消息表就够了，别过度设计。\n\n#分布式 #分布式事务 #微服务',
    images: [],
    likes: 534, comments: [], shares: 98,likedBy: [],
    createdAt: daysAgo(2),
    knowledgePoints: ['2PC 两阶段提交', 'TCC 补偿模式', 'Saga 长事务'],
  },
  {
    _id: 't2_post_5',
    content: 'Go vs Java：后端开发的 2024 选择\n\n作为两个语言都有深度使用的开发者：\n\nGo 赢在：\n- 启动速度快（微秒级 vs 秒级）\n- 内存占用低（MB 级 vs GB 级）\n- 并发模型简单（goroutine vs 线程池）\n- 单二进制部署方便\n\nJava 赢在：\n- 生态系统成熟（Spring 全家桶）\n- 企业级特性完善（JMX、JFR、Agent）\n- 人才储备丰富\n- 性能优化空间大（JIT）\n\n我的做法：Go 用于网关/中间件，Java 用于核心业务逻辑。\n\n#Go #Java #后端技术',
    images: [],
    likes: 445, comments: [], shares: 76, likedBy: [],
    createdAt: daysAgo(3),
    knowledgePoints: ['goroutine vs 线程', '启动性能对比', '生态成熟度'],
  },
  {
    _id: 't2_post_6',
    content: 'gRPC 为什么比 REST 更适合内部服务通信？\n\n在微服务架构中，服务间通信的选择至关重要：\n\ngRPC 优势：\n✅ Protocol Buffers 序列化体积小 3-5x\n✅ HTTP/2 多路复用减少连接开销\n✅ 强类型的接口定义（proto 文件）\n✅ 双向流式传输\n✅ 内置代码生成\n\nREST 优势：\n✅ 浏览器直接可用\n✅ 人类可读\n✅ 缓存友好\n\n结论：内部用 gRPC，对外暴露 REST Gateway。\n\n#gRPC #微服务 #ProtocolBuffers',
    images: [],
    likes: 289, comments: [], shares: 48, likedBy: [],
    createdAt: daysAgo(4),
    knowledgePoints: ['Protobuf 序列化', 'HTTP/2 多路复用', 'API Gateway 模式'],
  },
  {
    _id: 't2_post_7',
    content: '【实战经验】Redis Cluster 故障恢复全流程\n\n上个月我们的 Redis Cluster 一个主节点挂了，分享一下故障恢复过程：\n\n1️⃣ 监控报警：Sentinel 检测到主节点失联\n2️⃣ 自动故障转移：Slave 升级为新 Master（约 3s）\n3️⃣ 数据同步：新 Master 开始接收写操作\n4️⃣ 问题：部分客户端还在连旧 IP → 配置错误\n5️⃣ 修复：更新 DNS + 重启受影响的服务\n\n教训：客户端一定要用 sentinel 模式而不是直连！\n\n#Redis #高可用 #故障排查',
    images: [],
    likes: 367, comments: [], shares: 63, likedBy: [],
    createdAt: daysAgo(5),
    knowledgePoints: ['Sentinel 哨兵', '故障自动转移', 'DNS 更新策略'],
  },
  {
    _id: 't2_post_8',
    content: '消息队列选型 Kafka vs RocketMQ vs Pulsar\n\n做过三个项目的对比：\n\n🔸 Kafka - 吞吐量之王\n- 日志场景、流处理首选\n- 不适合严格顺序要求\n- 运维成本中等\n\n🔸 RocketMQ - 事务消息无敌\n- 电商/金融场景首选\n- 延迟消息、事务消息支持好\n- 阿里系生态\n\n🔸 Pulsar - 云原生未来\n- 存算分离架构\n- 多租户支持最好\n- 相对较新，社区活跃\n\n你们公司用的哪个？\n\n#消息队列 #Kafka #RocketMQ',
    images: [],
    likes: 412, comments: [], shares: 71, likedBy: [],
    createdAt: daysAgo(6),
    knowledgePoints: ['吞吐量对比', '事务消息', '存算分离'],
  },
  {
    _id: 't2_post_9',
    content: 'Service Mesh（Istio）值得上吗？\n\n很多团队问要不要引入 Istio，我的判断标准：\n\n✅ 应该上的条件：\n- 微服务数量 > 20 个\n- 多语言技术栈\n- 需要统一的可观测性\n- 有专门的平台团队维护\n\n❌ 暂不推荐的情况：\n- 服务少且同语言（SDK 就够了）\n- 团队没有 K8s 运维能力\n- 对延迟极其敏感（sidecar 有开销）\n\nIstio 不是银弹，合适最重要。\n\n#ServiceMesh #Istio #云原生',
    images: [],
    likes: 234, comments: [], shares: 39, likedBy: [],
    createdAt: daysAgo(7),
    knowledgePoints: ['Sidecar 代理', '流量管理', '可观测性统一'],
  },
  {
    _id: 't2_post_10',
    content: '【干货】后端面试高频题：数据库索引为什么用 B+树？\n\n这个问题的回答深度能看出候选人的功底：\n\n1. B+树 vs B树：\n   - B+树所有数据在叶子节点，查询稳定 O(log n)\n   - 叶子节点用双向链表连接，范围查询极快\n\n2. B+树 vs Hash索引：\n   - Hash 等值查询 O(1) 但不支持范围查询\n   - B+树支持 > < between 等范围操作\n\n3. 为什么不是红黑树？\n   - 树太高，IO 次数多\n   - B+树扇出大，3-4 层就能存千万级数据\n\n#数据库 #MySQL #B+树 #面试',
    images: [],
    likes: 867, comments: [], shares: 198, likedBy: [],
    createdAt: daysAgo(10),
    knowledgePoints: ['B+树结构', '页式存储', 'IO 成本分析'],
  }
];

// ===== 导师3: 张智能 - AI算法工程师 · 前腾讯AI Lab =====
// 主讲课程: 机器学习实战, 深度学习入门, 大模型应用开发, Prompt Engineering
export const teacher3_tweets = [
  {
    _id: 't3_post_1',
    content: '【Prompt Engineering】写出高质量提示词的 5 个技巧\n\n在腾讯AI Lab 工作期间总结了这些 prompt 经验：\n\n1️⃣ 给角色设定：\"你是一位资深前端工程师\"\n2️⃣ 提供示例（Few-shot）：给 2-3 个期望输出样例\n3️⃣ 分步思考：\"请先分析...再给出...最后...\"\n4️⃣ 约束输出格式：JSON / Markdown / 表格\n5️⃣ 迭代优化：第一版不好很正常，逐步调整\n\n好的 prompt 能让输出质量提升不止一个档次！\n\n#PromptEngineering #AI #LLM',
    images: [],
    likes: 567, comments: [], shares: 102, likedBy: [],
    createdAt: hoursAgo(1),
    knowledgePoints: ['角色扮演', 'Few-shot 学习', '思维链 CoT'],
  },
  {
    _id: 't3_post_2',
    content: 'Transformer 架构核心：Self-Attention 图解\n\nSelf-Attention 是 Transformer 的灵魂，理解它只需要记住三步：\n\nQ (Query): \"我要查什么?\"\nK (Key): \"你有什么特征?\" \nV (Value): \"你的实际内容是什么?\"\n\nAttention(Q,K,V) = softmax(QK^T / √d_k) V\n\n本质就是加权求和：与 Query 相关的 Key 会得到更高的权重，从而提取更有价值的 Value。\n\n这就是为什么 LLM 能「理解」上下文的数学原理。\n\n#Transformer #深度学习 #Attention机制',
    images: [],
    likes: 445, comments: [], shares: 87, likedBy: [],
    createdAt: hoursAgo(5),
    knowledgePoints: ['QKV 计算', 'Scaled Dot-Product', '权重矩阵'],
  },
  {
    _id: 't3_post_3',
    content: '大模型 RAG（检索增强生成）实战指南\n\n纯 LLM 的两大问题：知识过时 + 幻觉。RAG 是当前最佳解决方案：\n\n📖 检索阶段：用户问题 → Embedding → 向量数据库 Top-K 召回\n✍️ 生成阶段：召回文档 + 用户问题 → 组装 Prompt → LLM 生成答案\n\n关键技术点：\n- 文档切片策略（按语义边界切，不要按字数！）\n- Embedding 模型选型（OpenAI text-embedding-3 / BGE 系列）\n- 重排序（Rerank）提升精度\n\n我们在腾讯内部用 RAG 把客服准确率从 75% 提升到了 94%。\n\n#RAG #LLM #向量数据库',
    images: [],
    likes: 623, comments: [], shares: 115, likedBy: [],
    createdAt: daysAgo(1),
    knowledgePoints: ['文档向量化', 'Top-K 召回', '重排序 Reranker'],
  },
  {
    _id: 't3_post_4',
    content: '【入门指南】Python 机器学习环境搭建\n\n新手最容易卡在环境搭建上，推荐一套稳定方案：\n\n1️⃣ Miniconda（别用 Anaconda，太重）\n2️⃣ conda create -n ml python=3.11\n3️⃣ pip install torch numpy pandas scikit-learn matplotlib\n4️⃣ Jupyter Lab 作为开发环境\n5️⃣ GPU 环境用 CUDA 版 PyTorch\n\n避坑提醒：Windows 上训练大模型建议 WSL2，原生 Windows 兼容性问题多。\n\n#Python #机器学习 #环境配置',
    images: [],
    likes: 389, comments: [], shares: 65, likedBy: [],
    createdAt: daysAgo(2),
    knowledgePoints: ['Conda 虚拟环境', 'PyTorch 安装', 'WSL2 GPU 环境'],
  },
  {
    _id: 't3_post_5',
    content: 'CNN vs ViT：计算机视觉的新旧王者对决\n\nVision Transformer 正在取代 CNN 成为视觉任务的主流：\n\nCNN 优势：\n✅ 归纳偏置好（局部性、平移不变性）\n✅ 数据量小时表现更好\n✅ 计算效率高\n\nViT 优势：\n✅ 全局注意力捕获长距离依赖\n✅ 预训练-微调范式效果惊艳\n✅ 与 NLP 统一架构，便于多模态融合\n\n我的预测：混合架构（CNN 特征提取 + Transformer 建模）会是未来的主流方向。\n\n#CV #ViT #深度学习',
    images: [],
    likes: 334, comments: [], shares: 58, likedBy: [],
    createdAt: daysAgo(3),
    knowledgePoints: ['归纳偏置', '全局自注意力', '多模态融合'],
  },
  {
    _id: 't3_post_6',
    content: '【实战案例】用 LLM 做智能客服的完整流程\n\n去年帮一家教育公司做了 AI 客服系统，分享整体架构：\n\n1️⃣ 意图识别：用户输入 → 分类模型判断意图类型\n2️⃣ 知识检索：FAQ 向量化入库，语义匹配召回\n3️⃣ 回答生成：GPT-4 + 业务上下文 → 自然语言回复\n4️⃣ 人工兜底：置信度低于阈值转人工客服\n5️⃣ 持续学习：人工标注数据 → 微调意图分类模型\n\n效果：80% 问题自动解答，平均响应时间从 5 分钟降到 3 秒。\n\n#NLP #智能客服 #LLM应用',
    images: [],
    likes: 478, comments: [], shares: 84, likedBy: [],
    createdAt: daysAgo(4),
    knowledgePoints: ['意图分类', '置信度阈值', '人机协作'],
  },
  {
    _id: 't3_post_7',
    content: 'PyTorch 训练技巧：从 3 天缩短到 3 小时\n\n加速深度学习训练的实用技巧合集：\n\n🔥 DataLoader: num_workers=4, pin_memory=True\n🔥 AMP 混合精度：fp16 训练显存减半，速度翻倍\n🔥 Gradient Accumulation: 显存不够就用梯度累积模拟大 batch\n🔥 torch.compile(): PyTorch 2.0 新特性，免费提速 20-30%\n🔥 DistributedDataParallel: 多卡并行训练\n\n记住：先保证正确，再追求速度。\n\n#PyTorch #深度学习 #训练加速',
    images: [],
    likes: 298, comments: [], shares: 51, likedBy: [],
    createdAt: daysAgo(5),
    knowledgePoints: ['AMP 混合精度', '梯度累积', 'DDP 并行'],
  },
  {
    _id: 't3_post_8',
    content: '【前沿动态】2024 年大模型领域最重要的 3 个进展\n\n作为从业者，我认为今年最有影响力的方向：\n\n🥇 多模态大模型 GPT-4o / Gemini\n→ 语音、图像、文本统一理解，交互体验质的飞跃\n\n🥈 小模型崛起（<7B 参数）\n→ Mistral、Phi-3、Llama 3.2 在小尺寸也能达到惊人效果\n\n🥉 Agent / Function Calling\n→ LLM 从对话工具进化为行动者，能调用 API 完成复杂任务\n\n你关注哪个方向？\n\n#大模型 #AI趋势 #LLM',
    images: [],
    likes: 734, comments: [], shares: 143, likedBy: [],
    createdAt: daysAgo(7),
    knowledgePoints: ['多模态统一', '小模型蒸馏', 'Tool Use Agent'],
  },
  {
    _id: 't3_post_9',
    content: '【数学基础】机器学习中必须掌握的数学概念\n\n不需要成为数学家，但这些概念必须懂：\n\n📐 线性代数：矩阵运算、特征分解、SVD\n📈 概率论：贝叶斯定理、分布、期望方差\n📉 微积分：梯度、偏导数、链式法则\n📊 优化：SGD、Adam、学习率调度\n\n推荐资源：\n- 《程序员的数学》（入门）\n- 3Blue1Brown 线代系列（可视化理解）\n- 李沐《动手学深度学习》\n\n#机器学习 #数学基础 #学习路线',
    images: [],
    likes: 556, comments: [], shares: 97, likedBy: [],
    createdAt: daysAgo(8),
    knowledgePoints: ['矩阵分解', '梯度下降', '反向传播'],
  },
  {
    _id: 't3_post_10',
    content: 'Fine-tune vs RAG vs Prompt Engineering 如何选择？\n\n三种 LLM 应用方式的决策树：\n\n🔧 Prompt Engineering\n→ 快速验证、简单任务、无需额外成本\n→ 局限：上下文有限、无法注入私有知识\n\n📚 RAG（检索增强生成）\n→ 有大量文档/知识库需要查询\n→ 要求事实准确性高（法律/医疗/金融）\n→ 动态更新的知识\n\n🎯 Fine-tuning\n→ 特定领域风格/格式适配\n→ 需要降低推理成本（更小的模型）\n→ 有足够的标注数据（>500条）\n\n最佳实践：三者组合使用！\n\n#LLM #AI工程 #技术选型',
    images: [],
    likes: 498, comments: [], shares: 91, likedBy: [],
    createdAt: daysAgo(11),
    knowledgePoints: ['LoRA 高效微调', '知识注入', '成本效益分析'],
  }
];

// ===== 导师4: 陈树举 - 数据库专家 · 前美团DBA负责人 =====
// 主讲课程: Redis缓存设计, MySQL性能优化, 数据库集群实战, 分库分表
export const teacher4_tweets = [
  {
    _id: 't4_post_1',
    content: '【Redis 缓存穿透/击穿/雪崩】三兄弟的区别和解决方案\n\n这三个概念经常被混淆，一张表说清楚：\n\n🔴 缓存穿透：查询不存在的数据 → 一直打到 DB\n解决：布隆过滤器 + 缓存空值\n\n🟠 缓存击穿：热点 key 过期瞬间 → 大量请求打到 DB\n解决：互斥锁 + 热点 key 不过期\n\n🟡 缓存雪崩：大量 key 同时过期 → DB 压力暴增\n解决：随机过期时间 + 多级缓存 + 熔断降级\n\n#Redis #缓存 #高可用',
    images: [],
    likes: 678, comments: [], shares: 124, likedBy: [],
    createdAt: hoursAgo(4),
    knowledgePoints: ['布隆过滤器', '互斥锁重建', '随机过期时间'],
  },
  {
    _id: 't4_post_2',
    content: 'MySQL EXPLAIN 结果逐字段解读\n\n每次 SQL 慢查询都要看 EXPLAIN，这些字段你必须会看：\n\n📌 type：访问类型（all < index < range < ref < eq_ref < const）\n📌 key：实际用到的索引（NULL 表示没走索引！）\n📌 rows：预估扫描行数（越小越好）\n📌 Extra：重要信息（Using filesort/临时表都是危险信号）\n\n常见优化手段：加合适的索引、避免 SELECT *、优化 WHERE 条件。\n\n#MySQL #SQL优化 #EXPLAIN',
    images: [],
    likes: 445, comments: [], shares: 79, likedBy: [],
    createdAt: hoursAgo(10),
    knowledgePoints: ['执行计划分析', '索引选择', 'Extra 字段解读'],
  },
  {
    _id: 't4_post_3',
    content: '【实战案例】MySQL 慢查询从 30s 到 0.3s 的优化过程\n\n美团的订单列表查询曾经是个老大难问题：\n\n原始 SQL：3 表 JOIN + LIKE 模糊搜索 + ORDER BY + LIMIT\n\n优化步骤：\n1. 去掉 SELECT *，只查需要的列\n2. JOIN 改为子查询，先过滤再关联\n3. LIKE 改为 Elasticsearch 全文检索\n4. 分页改为游标分页（基于 ID 的 keyset pagination）\n5. 加上适当的覆盖索引\n\n结果：P99 延迟从 30s 降到 0.3s，用户体验质变！\n\n#MySQL #性能优化 #慢查询',
    images: [],
    likes: 567, comments: [], shares: 103, likedBy: [],
    createdAt: daysAgo(1),
    knowledgePoints: ['覆盖索引', '游标分页', 'ES 全文检索'],
  },
  {
    _id: 't4_post_4',
    content: 'Redis 7.0 新特性速览\n\nRedis 7.0 是一个大版本升级，值得关注的特性：\n\n⭐ Functions：原生支持 JavaScript 函数（类似存储过程）\n⭐ ACL 细粒度权限控制增强\n⭐ Sharded Cluster：自动数据分片\n⭐ Multi-part AOF：AOF 重写不再阻塞\n⭐ Commands introspection：命令耗时统计\n\n升级建议：先在测试环境验证，特别是 Functions 功能可能会影响现有脚本。\n\n#Redis7 #新特性 #NoSQL',
    images: [],
    likes: 234, comments: [], shares: 41, likedBy: [],
    createdAt: daysAgo(3),
    knowledgePoints: ['Redis Functions', 'Sharded Cluster', 'ACL 权限'],
  },
  {
    _id: 't4_post_5',
    content: '分库分表：什么时候该分？怎么分？\n\n分库分表是最后的手段，不是第一选择：\n\n🚫 先不要分的信号：\n- 单表 < 500 万行\n- QPS < 2000\n- 还没做读写分离\n\n✅ 该分了的信号：\n- 单表超过 2000 万行\n- 单机写入瓶颈\n- 单库连接数接近上限\n\n分片策略推荐：\n- 水平分片：按 user_id % N（最常用）\n- 垂直分片：按业务域拆分\n\n注意：一旦分片，跨库查询会很痛苦，提前规划好。\n\n#分库分表 #Sharding #数据库架构',
    images: [],
    likes: 389, comments: [], shares: 72, likedBy: [],
    createdAt: daysAgo(4),
    knowledgePoints: ['水平分片策略', '垂直拆分原则', '跨库查询代价'],
  },
  {
    _id: 't4_post_6',
    content: 'MySQL 主从复制延迟怎么解决？\n\n主从延迟是读写分离架构的经典问题：\n\n🔍 延迟原因：\n- 从库单线程 replay binlog\n- 大事务导致从库跟不上\n- 从库硬件配置低\n\n💡 解决方案（按优先级）：\n1. MGR（MySQL Group Replication）替代传统复制\n2. 半同步复制（semi-sync）\n3. 业务层强制读主（关键数据）\n4. 并行复制（MTS）开启\n5. 减少大事务，拆分为多个小事务\n\n#MySQL #主从复制 #高可用',
    images: [],
    likes: 312, comments: [], shares: 54, likedBy: [],
    createdAt: daysAgo(5),
    knowledgePoints: ['binlog 同步', '半同步复制', 'MTS 并行复制'],
  },
  {
    _id: 't4_post_7',
    content: '数据库连接池参数怎么调？\n\nHikariCP（Spring Boot 默认）参数调优经验：\n\nmaximumPoolSize: CPU核心数 * 2 + 1（一般 10-20）\nminimumIdle: maximumPoolSize（保持预热）\nconnectionTimeout: 30s（获取超时时间）\nidleTimeout: 10min（空闲回收）\nmaxLifetime: 30min（防止长时间连接出问题）\n\n⚠️ 最大坑：pool size 不是越大越好！连接太多会导致 DB 端线程切换开销剧增。\n\n#数据库 #连接池 #HikariCP',
    images: [],
    likes: 278, comments: [], shares: 47, likedBy: [],
    createdAt: daysAgo(6),
    knowledgePoints: ['连接复用', '连接泄漏检测', '线程数匹配'],
  },
  {
    _id: 't4_post_8',
    content: 'MongoDB vs MySQL 选型指南\n\n两种数据库各有适用场景：\n\n选 MongoDB：\n- 文档型数据（JSON 天然契合）\n- Schema 经常变动（敏捷迭代）\n- 需要地理位置查询\n- 日志/监控类时序数据\n- 读多写少的场景\n\n选 MySQL：\n- 强事务一致性要求（金融/库存）\n- 复杂 JOIN 查询\n- 成熟的运维体系\n- 结构化报表统计\n\n实际上很多公司两者都用，按场景选型。\n\n#MongoDB #MySQL #数据库选型',
    images: [],
    likes: 356, comments: [], shares: 63, likedBy: [],
    createdAt: daysAgo(7),
    knowledgePoints: ['ACID 事务', 'Schema-free 优点', '地理索引'],
  },
  {
    _id: 't4_post_9',
    content: '【线上事故复盘】一次误操作删除生产数据的经历\n\n虽然不是我本人操作的（咳咳），但这次事故教训深刻：\n\n📌 事件：开发人员在测试环境写了 DELETE 语句，结果连到了生产库\n📌 影响：丢失了约 50 万条订单数据\n📌 恢复：用了 4 小时从备份恢复 + binlog 补数据\n\n改进措施：\n1. 生产库权限最小化原则\n2. 测试环境和生产环境严格隔离（不同账号/网络段）\n3. 重要操作必须有二次确认\n4. 定期备份 + 定期演练恢复流程\n5. DELETE 操作改软删除（is_deleted 标记）\n\n#数据库 #线上事故 #运维经验',
    images: [],
    likes: 689, comments: [], shares: 145, likedBy: [],
    createdAt: daysAgo(8),
    knowledgePoints: ['权限隔离', 'binlog 恢复', '软删除策略'],
  },
  {
    _id: 't4_post_10',
    content: '数据库索引设计十大原则\n\n在美团做 DBA 这些年总结的经验：\n\n1️⃣ 最左前缀原则：联合索引 (a,b,c) 能查 a, ab, abc\n2️⃣ 选择性高的列放前面\n3️⃣ 覆盖索引优先：避免回表查询\n4️⃣ 避免 SELECT *：只取需要的列\n5️⃣ 索引不是越多越好：影响写入速度\n6️⃣ LIKE \'%xx%\' 无法用索引\n7️⃣ 函数操作索引列会使索引失效\n8️⃣ 小表驱动大表（JOIN 优化）\n9️⃣ 区分度 < 5% 的列不适合建索引\n🔟 定期用 pt-index-usage 分析未使用索引\n\n#MySQL #索引 #数据库优化',
    images: [],
    likes: 823, comments: [], shares: 167, likedBy: [],
    createdAt: daysAgo(10),
    knowledgePoints: ['最左前缀', '选择性计算', '覆盖索引回表'],
  }
];

// ===== 导师5: 刘云原生 - DevOps专家 · 前华为云架构师 =====
// 主讲课程: Docker容器化实战, K8s集群管理, 云原生架构设计, GitOps工作流
export const teacher5_tweets = [
  {
    _id: 't5_post_1',
    content: 'Dockerfile 最佳实践：镜像体积缩小 90%\n\n一个典型的 Node.js 镜像从 1GB 降到 150MB 的过程：\n\n❌ 错误做法：FROM node:18\n✅ 正确做法：\n```dockerfile\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nFROM node:18-alpine\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY . .\nCMD ["node", "server.js"]\n```\n\n关键技巧：多阶段构建 + alpine 基础镜像 + npm ci\n\n#Docker #容器化 #镜像优化',
    images: [],
    likes: 445, comments: [], shares: 82, likedBy: [],
    createdAt: hoursAgo(2),
    knowledgePoints: ['多阶段构建', 'alpine 基础镜像', 'npm ci vs install'],
  },
  {
    _id: 't5_post_2',
    content: 'K8s Deployment 滚动更新策略详解\n\nKubernetes 的 RollingUpdate 是零停机部署的标准方案：\n\n关键参数：\n- maxUnavailable: 更新期间最多不可用的 Pod 数\n- maxSurge: 更新期间最多额外的 Pod 数\n\n推荐配置：\n```yaml\nstrategy:\n  type: RollingUpdate\n  rollingUpdate:\n    maxUnavailable: 0  # 零 downtime\n    maxSurge: 25%       # 最多多25% Pod\n```\n配合 readinessProbe 和 livenessProbe，实现平滑发布。\n\n#Kubernetes #DevOps #滚动更新',
    images: [],
    likes: 334, comments: [], shares: 58, likedBy: [],
    createdAt: hoursAgo(7),
    knowledgeParams: ['readinessProbe', 'livenessProbe', 'maxUnavailable'],
  },
  {
    _id: 't5_post_3',
    content: 'GitOps：用 Git 管理一切基础设施\n\n在华为云推行 GitOps 后，基础设施变更效率提升了 3 倍：\n\n核心理念：Git 是唯一真相来源\n\n📦 工具链：\n- ArgoCD / FluxCD 做 Git ↔ K8s 同步\n- GitHub Actions 做 CI 流水线\n- Terraform 管理云资源\n- Helm Charts 管理应用模板\n\n工作流：PR → Code Review → 合并 → 自动部署\n\n好处：所有变更可追溯、可回滚、可审计。\n\n#GitOps #ArgoCD #IaC',
    images: [],
    likes: 289, comments: [], shares: 51, likedBy: [],
    createdAt: daysAgo(1),
    knowledgePoints: ['声明式配置', 'Drift Detection', '自动同步'],
  },
  {
    _id: 't5_post_4',
    content: 'CI/CD 流水线设计：从代码到生产的全自动路径\n\n一条成熟的 CI/CD 流水线应该包含这些阶段：\n\n1️⃣ 代码检查：Lint + SonarQube 质量门禁\n2️⃣ 单元测试：覆盖率 > 80% 才能通过\n3️⃣ 构建：Docker 镜像构建 + 推送仓库\n4️⃣ 集成测试：Staging 环境自动化测试\n5️⃣ 安全扫描：Trivy 扫描镜像漏洞\n6️⃣ 发布审批：生产环境需人工确认\n7️⃣ 灰度发布：Canary 先放 5% 流量\n8️⃣ 全量发布 + 监控告警\n\n整个流程控制在 15 分钟以内。\n\n#CICD #DevOps #自动化',
    images: [],
    likes: 378, comments: [], shares: 69, likedBy: [],
    createdAt: daysAgo(2),
    knowledgePoints: ['质量门禁', '灰度发布', '自动化测试分层'],
  },
  {
    _id: 't5_post_5',
    content: '【华为云经验】大规模 K8s 集群运维实践\n\n管理过 5000+ 节点的 K8s 集群，分享几个关键经验：\n\n🔸 节点分组：按业务线/环境分组，用 nodeSelector/tolerations 调度\n🔸 资源配额：每个 namespace 设 ResourceQuota，防止单租户吃光资源\n🔸 网络策略：NetworkPolicy 默认 DENY，按需开放\n🔸 日志采集：Fluentd → Elasticsearch → Kibana 全链路\n🔸 监控体系：Prometheus + Grafana + Alertmanager\n\n最重要的一条：一切皆代码，手动操作是大忌。\n\n#K8s #集群运维 #华为云',
    images: [],
    likes: 456, comments: [], shares: 83, likedBy: [],
    createdAt: daysAgo(3),
    knowledgePoints: ['ResourceQuota', 'NetworkPolicy', '日志采集链路'],
  },
  {
    _id: 't5_post_6',
    content: '容器安全：不容忽视的 10 个安全最佳实践\n\n容器不是虚拟机，安全问题更隐蔽：\n\n1️⃣ 使用非 root 用户运行容器\n2️⃣ 只读文件系统（readOnlyRootFilesystem）\n3️⃣ 限制 capabilities（drop ALL, add only needed）\n4️⃣ Resource limits 防止 DoS\n5️⃣ 镜像签名验证（cosign/notary）\n6️⃣ 最小化基础镜像（alpine/distroless）\n7️⃣ 不要在镜像中放密钥（用 Secrets/KMS）\n8️⃣ 定期扫描漏洞（Trivy/Grype）\n9️⃣ 网络隔离（Network Policy）\n🔟 审计日志开启\n\n安全是 DevOps 的重要一环！\n\n#容器安全 #DevOps #安全最佳实践',
    images: [],
    likes: 312, comments: [], shares: 56, likedBy: [],
    createdAt: daysAgo(4),
    knowledgePoints: ['capabilities 限制', '镜像签名', 'Security Context'],
  },
  {
    _id: 't5_post_7',
    content: 'Prometheus + Grafana 监控体系搭建\n\n监控是可观测性的基石，推荐这套方案：\n\n📊 四大黄金指标：\n- Latency（延迟）：P50/P95/P99\n- Traffic（流量）：QPS、错误率\n- Errors（错误）：HTTP 5xx、异常率\n- Saturation（饱和度）：CPU/内存/磁盘使用率\n\n📈 Grafana Dashboard 模板：\n- Node Exporter：服务器指标\n- cAdvisor：容器指标\n- Blackbox Exporter：探活检测\n\n告警规则：SRE 的 Error Budget 驱动，不要设太敏感也不要太迟钝。\n\n#Prometheus #Grafana #监控',
    images: [],
    likes: 267, comments: [], shares: 46, likedBy: [],
    createdAt: daysAgo(5),
    knowledgePoints: ['RED 方法', 'USE 方法', 'Error Budget'],
  },
  {
    _id: 't5_post_8',
    content: 'Helm vs Kustomize vs Jsonnet：K8s 配置管理怎么选？\n\n三个工具各有定位：\n\n🎯 Helm — 包管理器\n- Chart 模板 + Values 覆盖\n- 适合应用发布\n- 缺点：模板语法有时反人类\n\n🎯 Kustomize — 声明式 overlay\n- Base + Overlay 变体管理\n- 适合多环境配置差异\n- K8s 原生集成\n\n🎯 Jsonnet — 配置编程语言\n- 最灵活的表达能力\n- 陡峭的学习曲线\n\n我的建议：Helm 管应用 + Kustomize 管环境差异\n\n#Helm #Kustomize #K8s配置管理',
    images: [],
    likes: 198, comments: [], shares: 35, likedBy: [],
    createdAt: daysAgo(6),
    knowledgePoints: ['Chart 模板', 'Base Overlay', '配置变体'],
  },
  {
    _id: 't5_post_9',
    content: '【实战】AWS EKS 生产环境配置清单\n\n在 AWS 上跑生产 K8s，这份清单帮你避坑：\n\n✅ EKS Managed Node Group + Auto Scaling\n✅ IRSA（IAM Roles for Service Accounts）细粒度权限\n✅ VPC CNI + Security Groups 网络隔离\n✅ EBS CSI Driver 持久化存储\n✅ ALB Ingress Controller 七层负载均衡\n✅ Cluster Autoscaler 自动扩缩容\n✅ Secrets Manager / SSM Parameter Store 存密钥\n✅ CloudWatch Container Insights 日志\n\n月费用预估：$500-$2000（取决于规模）\n\n#AWS #EKS #云原生',
    images: [],
    likes: 245, comments: [], shares: 44, likedBy: [],
    createdAt: daysAgo(8),
    knowledgePoints: ['IRSA 权限', 'VPC CNI', 'ALB Ingress'],
  },
  {
    _id: 't5_post_10',
    content: 'DevOps 工程师的成长路线\n\n从普通运维到云架构师，我走了 13 年：\n\nLevel 1（1-2年）：Linux 基础 + 脚本能力\n- Shell/Python、常用命令、网络基础\n\nLevel 2（3-5年）：容器 & 编排\n- Docker、K8s 核心、CI/CD 搭建\n\nLevel 3（5-8年）：平台工程\n- 自研 PaaS 平台、多集群管理\n\nLevel 4（8年+）：云架构师\n- 多云策略、成本优化、安全合规、团队管理\n\n核心能力：不仅是技术深度，更是解决问题的思维方式和沟通协调能力。\n\n#DevOps #职业发展 #云原生',
    images: [],
    likes: 534, comments: [], shares: 98, likedBy: [],
    createdAt: daysAgo(11),
    knowledgePoints: ['平台工程', '多云策略', 'FinOps 成本优化'],
  }
];

// ===== 导师信息映射 =====
export const TEACHER_DATA = {
  limingzhe: {
    id: 1,
    name: '李明哲',
    title: '前端架构师 · 前阿里P8',
    avatar: 'https://ui-avatars.com/api/?name=李明哲&background=6366f1&color=fff&size=200&font-size=0.35&bold=true',
    accentColor: '#6366f1',
    skills: ['Vue3', 'React', 'TypeScript', 'Webpack'],
    rating: 4.9,
    isVIP: true,
    students: 12500,
    experience: 12,
    coursesList: ['Vue3 企业级实战', 'TypeScript 进阶指南', '前端性能优化实战', '微前端架构设计'],
    bio: '12年前端开发经验，曾主导多个千万级用户的前端架构设计。专注于 Vue3 生态、性能优化和工程化建设。',
    tweets: teacher1_tweets,
  },
  wangxuefeng: {
    id: 2,
    name: '王雪峰',
    title: '后端技术专家 · 前字节架构师',
    avatar: 'https://ui-avatars.com/api/?name=王雪峰&background=059669&color=fff&size=200&font-size=0.35&bold=true',
    accentColor: '#059669',
    skills: ['Java', 'Go', 'Kubernetes', '微服务'],
    rating: 4.8,
    isVIP: true,
    students: 15800,
    experience: 15,
    coursesList: ['Go 微服务架构', 'Kubernetes 实战', '高并发系统设计', '分布式事务原理'],
    bio: '15年后端架构经验，在字节跳动负责核心交易系统的架构设计。擅长高并发、分布式系统。',
    tweets: teacher2_tweets,
  },
  zhangzhineng: {
    id: 3,
    name: '张智能',
    title: 'AI 算法工程师 · 前腾讯AI Lab',
    avatar: 'https://ui-avatars.com/api/?name=张智能&background=dc2626&color=fff&size=200&font-size=0.35&bold=true',
    accentColor: '#dc2626',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'LLM'],
    rating: 4.9,
    isVIP: true,
    students: 9800,
    experience: 10,
    coursesList: ['机器学习实战', '深度学习入门', '大模型应用开发', 'Prompt Engineering'],
    bio: '腾讯AI Lab前研究员，专注深度学习和大规模语言模型应用落地。多篇顶会论文作者。',
    tweets: teacher3_tweets,
  },
  chenshuju: {
    id: 4,
    name: '陈树举',
    title: '数据库专家 · 前美团DBA负责人',
    avatar: 'https://ui-avatars.com/api/?name=陈树举&background=d97706&color=fff&size=200&font-size=0.35&bold=true',
    accentColor: '#d97706',
    skills: ['MySQL', 'Redis', 'MongoDB', '数据库优化'],
    rating: 4.7,
    isVIP: false,
    students: 7200,
    experience: 11,
    coursesList: ['Redis 缓存设计', 'MySQL 性能优化', '数据库集群实战', '分库分表最佳实践'],
    bio: '11年数据库领域深耕，曾负责美团核心交易链路的数据库架构优化。精通 MySQL 内核调优。',
    tweets: teacher4_tweets,
  },
  liuyuansheng: {
    id: 5,
    name: '刘云原',
    title: 'DevOps 专家 · 前华为云架构师',
    avatar: 'https://ui-avatars.com/api/?name=刘云原&background=7c3aed&color=fff&size=200&font-size=0.35&bold=true',
    accentColor: '#7c3aed',
    skills: ['Docker', 'K8s', 'CI/CD', 'AWS/GCP'],
    rating: 4.8,
    isVIP: false,
    students: 8900,
    experience: 13,
    coursesList: ['Docker 容器化实战', 'K8s 集群管理', '云原生架构设计', 'GitOps 工作流'],
    bio: '13年DevOps与云原生经验，华为云核心架构团队成员。主导过多个超大规模容器集群的建设。',
    tweets: teacher5_tweets,
  },
};

// 根据 userId 获取导师帖子
export function getTeacherTweets(userId) {
  const teacher = TEACHER_DATA[userId];
  if (!teacher) return [];
  
  // 给每条帖子附加用户信息
  return teacher.tweets.map(tweet => ({
    ...tweet,
    user: {
      _id: String(teacher.id),
      username: teacher.name,
      avatar: teacher.avatar,
      role: 'teacher',
    },
  }));
}

// 判断是否为导师用户ID
export function isTeacherId(userId) {
  return userId in TEACHER_DATA;
}
