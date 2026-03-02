const mongoose = require('mongoose');
const User = require('../models/User');
const Tweet = require('../models/Tweet');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './.env' });

// 系统支持的兴趣标签列表
const interestTags = [
  '前端开发',
  '后端开发',
  '移动开发',
  '人工智能',
  '机器学习',
  '数据分析',
  '云计算',
  '大数据',
  '网络安全',
  '区块链',
  '算法',
  '设计模式',
  '前端框架',
  '后端框架',
  '数据库',
  'DevOps',
  '测试',
  '产品设计',
  'UI设计',
  'UX设计',
  // 添加更多编程语言相关标签
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'TypeScript',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'Dart',
  'HTML/CSS',
  'Shell脚本',
];

// 为每个兴趣标签生成高质量帖子的内容模板
const tweetTemplates = {
  前端开发: [
    'HTML5的新特性详解：语义化标签、Canvas绘图、Web Storage等核心功能',
    'CSS3高级特性：Flexbox布局、Grid布局、动画与过渡效果的最佳实践',
    'JavaScript异步编程：Promise、async/await、事件循环机制深度解析',
    '前端性能优化：代码分割、懒加载、缓存策略、图片优化全面指南',
    '响应式设计原理：媒体查询、流式布局、移动端适配技巧总结',
  ],
  后端开发: [
    'RESTful API设计最佳实践：资源命名、HTTP方法、状态码规范',
    '服务器端渲染(SSR) vs 客户端渲染(CSR)：性能与SEO的权衡',
    '微服务架构设计：服务拆分、通信机制、容错策略、监控方案',
    '数据库事务管理：ACID特性、隔离级别、锁机制深度解析',
    '消息队列应用场景：异步处理、流量削峰、系统解耦案例分析',
  ],
  移动开发: [
    'Flutter跨平台开发：Widget体系、状态管理、性能优化',
    'React Native架构：JSBridge原理、原生模块调用、热更新实现',
    'iOS开发最佳实践：内存管理、多线程、网络请求优化',
    'Android开发进阶：Jetpack组件、MVVM架构、Kotlin协程',
    '移动应用性能优化：启动速度、内存占用、电池消耗优化',
  ],
  人工智能: [
    'AI发展历程：从符号主义到连接主义，深度学习的崛起',
    '机器学习基础：监督学习、无监督学习、强化学习核心概念',
    '神经网络原理：感知机、多层神经网络、反向传播算法',
    '自然语言处理：词嵌入、Transformer架构、BERT模型详解',
    '计算机视觉：卷积神经网络、目标检测、图像分割技术',
  ],
  机器学习: [
    '特征工程：数据清洗、特征选择、特征提取、特征缩放',
    '模型评估指标：准确率、精确率、召回率、F1值、ROC曲线',
    '过拟合与欠拟合：正则化、交叉验证、集成学习解决方案',
    '决策树算法：ID3、C4.5、CART算法原理与实现',
    '支持向量机(SVM)：核函数、软间隔、对偶问题深度解析',
  ],
  数据分析: [
    '数据分析流程：数据收集、清洗、探索、建模、可视化',
    'Pandas数据处理：DataFrame操作、数据合并、缺失值处理',
    'SQL高级查询：窗口函数、子查询、联合查询、索引优化',
    '数据可视化工具：Matplotlib、Seaborn、Plotly应用对比',
    '统计分析方法：假设检验、回归分析、聚类分析、时间序列',
  ],
  云计算: [
    '云计算服务模型：IaaS、PaaS、SaaS核心概念与应用场景',
    '云原生架构：容器化、微服务、DevOps、CI/CD最佳实践',
    'AWS核心服务：EC2、S3、RDS、Lambda、VPC使用指南',
    'Docker容器技术：镜像、容器、Dockerfile、Docker Compose',
    'Kubernetes容器编排：Pod、Deployment、Service、Ingress',
  ],
  大数据: [
    'Hadoop生态系统：HDFS、MapReduce、YARN核心组件',
    'Spark大数据处理：RDD、DataFrame、Spark SQL、Spark Streaming',
    'NoSQL数据库：MongoDB、Redis、Cassandra、HBase对比分析',
    '数据湖与数据仓库：概念区别、架构设计、ETL/ELT流程',
    '实时数据处理：Flink、Storm、Kafka Streams技术选型',
  ],
  网络安全: [
    '网络安全威胁：DDoS攻击、SQL注入、XSS攻击、CSRF攻击',
    '加密技术：对称加密、非对称加密、哈希算法、数字签名',
    'Web安全防护：HTTPS、CORS、CSRF Token、XSS过滤器',
    '身份认证与授权：OAuth2.0、JWT、RBAC、SSO单点登录',
    '安全审计与监控：日志分析、入侵检测、漏洞扫描、渗透测试',
  ],
  区块链: [
    '区块链基础：分布式账本、共识机制、密码学原理',
    '比特币技术：工作量证明(PoW)、UTXO模型、挖矿机制',
    '以太坊生态：智能合约、Solidity语言、DApp开发',
    '共识算法对比：PoW、PoS、DPoS、PBFT优缺点分析',
    '区块链应用场景：供应链金融、数字身份、去中心化存储',
  ],
  算法: [
    '排序算法全面对比：时间复杂度、空间复杂度、稳定性分析',
    '查找算法：二分查找、哈希表、二叉搜索树、红黑树',
    '动态规划：最优子结构、重叠子问题、状态转移方程',
    '贪心算法：活动选择问题、霍夫曼编码、最小生成树',
    '图论算法：DFS、BFS、最短路径、拓扑排序、网络流',
  ],
  设计模式: [
    '创建型模式：单例模式、工厂模式、建造者模式、原型模式',
    '结构型模式：适配器模式、装饰器模式、代理模式、组合模式',
    '行为型模式：观察者模式、策略模式、迭代器模式、命令模式',
    'SOLID原则：单一职责、开放封闭、里氏替换、接口隔离、依赖倒置',
    '设计模式应用：MVC、MVVM、微服务架构中的模式实践',
  ],
  前端框架: [
    'Vue.js 3核心特性：Composition API、响应式系统、Teleport、Suspense',
    'React 18新特性：Concurrent Mode、自动批处理、Suspense、Transition',
    'Angular 14：组件架构、依赖注入、路由、状态管理(NgRx)',
    'Svelte框架：编译时优化、无虚拟DOM、响应式声明式编程',
    '前端状态管理：Vuex、Redux、MobX、Pinia对比与最佳实践',
  ],
  后端框架: [
    'Express.js：中间件机制、路由设计、错误处理、性能优化',
    'Koa.js：异步中间件、上下文(Context)、洋葱模型',
    'Spring Boot：自动配置、依赖注入、REST API、微服务支持',
    'Django：ORM、Admin后台、中间件、认证授权、REST框架',
    'FastAPI：类型提示、自动文档、异步支持、依赖注入',
  ],
  数据库: [
    'MySQL高级特性：索引优化、事务隔离、分库分表、主从复制',
    'PostgreSQL：JSON支持、全文搜索、地理空间数据、事务完整性',
    'Redis：数据结构、缓存策略、持久化、集群模式、分布式锁',
    'MongoDB：文档模型、查询优化、索引、分片、聚合管道',
    '数据库设计：范式理论、ER模型、反范式设计、性能优化',
  ],
  DevOps: [
    'CI/CD流程：持续集成、持续交付、持续部署工具链',
    'Git版本控制：分支策略、合并冲突、变基、标签管理',
    '自动化测试：单元测试、集成测试、端到端测试、测试框架',
    '基础设施即代码(IaC)：Terraform、Ansible、CloudFormation',
    '监控与告警：Prometheus、Grafana、ELK Stack、Nagios',
  ],
  测试: [
    '软件测试方法论：黑盒测试、白盒测试、灰盒测试、验收测试',
    '测试用例设计：等价类划分、边界值分析、因果图、场景法',
    '自动化测试框架：Selenium、Appium、Jest、PyTest、Cypress',
    '性能测试：负载测试、压力测试、并发测试、JMeter使用指南',
    'API测试：Postman、Swagger、RestAssured、契约测试',
  ],
  产品设计: [
    '用户体验设计(UED)：用户研究、需求分析、原型设计、可用性测试',
    '产品思维：问题定义、市场分析、用户画像、需求优先级',
    '产品生命周期管理：规划、开发、上线、运营、迭代优化',
    '敏捷开发方法：Scrum、Kanban、用户故事、迭代计划、回顾会议',
    '产品数据分析：A/B测试、漏斗分析、用户留存、活跃度指标',
  ],
  UI设计: [
    '视觉设计原则：色彩理论、排版系统、对比、对齐、重复、 proximity',
    '设计系统构建：组件库、设计规范、原子设计方法论',
    '移动端UI设计：手势交互、导航模式、适配不同屏幕尺寸',
    'Web UI设计：响应式布局、交互反馈、微交互、无障碍设计',
    '设计工具应用：Figma、Sketch、Adobe XD、Photoshop高级技巧',
  ],
  UX设计: [
    '用户研究方法：访谈、问卷、可用性测试、卡片分类、用户旅程图',
    '信息架构设计：内容组织、导航设计、搜索体验优化',
    '交互设计原则：直观性、一致性、反馈机制、容错设计',
    '情感化设计：用户情绪、品牌调性、信任建立、愉悦体验',
    '服务设计：系统思维、触点分析、流程优化、服务蓝图',
  ],
  // 新添加的编程语言标签的模板
  JavaScript: [
    'JavaScript闭包详解：作用域链、内存管理、应用场景',
    'ES6+新特性：解构赋值、箭头函数、Promise、async/await',
    'JavaScript原型链与继承：构造函数、原型对象、Class语法',
    'JavaScript事件循环机制：宏任务、微任务、同步异步执行顺序',
    'JavaScript设计模式：单例模式、观察者模式、工厂模式实践',
  ],
  Python: [
    'Python数据类型与操作：列表、字典、元组、集合、字符串处理',
    'Python函数与模块：装饰器、生成器、迭代器、上下文管理器',
    'Python面向对象编程：类、继承、多态、魔术方法、属性装饰器',
    'Python并发编程：线程、进程、协程、asyncio、并发安全',
    'Python数据分析：NumPy、Pandas、Matplotlib、Seaborn库应用',
  ],
  Java: [
    'Java面向对象核心：封装、继承、多态、抽象类、接口',
    'Java集合框架：List、Set、Map、Queue实现类与使用场景',
    'Java并发编程：线程安全、同步锁、线程池、CAS算法、并发集合',
    'Java虚拟机(JVM)：内存模型、垃圾回收、类加载机制、性能调优',
    'Java新特性：Lambda表达式、Stream API、模块化、记录类、密封类',
  ],
  'C++': [
    'C++面向对象：类、继承、多态、虚函数、抽象类、接口',
    'C++模板编程：函数模板、类模板、模板特化、可变参数模板',
    'C++内存管理：堆内存分配、智能指针、内存泄漏检测',
    'C++11+新特性：自动类型推导、移动语义、lambda表达式、范围for循环',
    'C++设计模式：单例模式、工厂模式、观察者模式、策略模式',
  ],
  'C#': [
    'C#语言基础：数据类型、控制结构、面向对象编程',
    'C#高级特性：委托、事件、LINQ、Lambda表达式、异步编程',
    '.NET Core与ASP.NET Core：Web API开发、依赖注入、中间件',
    'C#设计模式：工厂模式、观察者模式、单例模式、策略模式',
    'C#与数据库：EF Core、ADO.NET、LINQ to SQL',
  ],
  Go: [
    'Go语言基础：数据类型、控制结构、函数、包管理',
    'Go并发编程：goroutine、channel、sync包、context包',
    'Go语言特性：接口、结构体、切片、映射、错误处理',
    'Go Web开发：Gin、Echo框架、RESTful API设计、中间件',
    'Go性能优化：内存分配、GC调优、并发模式最佳实践',
  ],
  Rust: [
    'Rust所有权模型：所有权、借用、生命周期、可变引用',
    'Rust语言特性：模式匹配、枚举、结构体、泛型、trait',
    'Rust并发编程：线程、通道、原子操作、锁机制',
    'Rust内存安全：零成本抽象、类型安全、避免数据竞争',
    'Rust生态系统：包管理、工具链、Web开发框架',
  ],
  TypeScript: [
    'TypeScript类型系统：基本类型、接口、泛型、联合类型、交叉类型',
    'TypeScript高级特性：装饰器、类型守卫、条件类型、映射类型',
    'TypeScript与React：组件类型定义、Hooks类型、状态管理',
    'TypeScript与Node.js：Express、NestJS框架类型支持',
    'TypeScript编译配置：tsconfig.json、模块解析、目标版本',
  ],
  PHP: [
    'PHP 8新特性：命名参数、属性提升、联合类型、匹配表达式',
    'PHP面向对象：类、继承、多态、接口、抽象类、特征(trait)',
    'PHP框架：Laravel、Symfony、CodeIgniter、Yii核心特性',
    'PHP安全：SQL注入防护、XSS防护、CSRF防护、密码哈希',
    'PHP性能优化：缓存、数据库优化、代码优化、异步处理',
  ],
  Ruby: [
    'Ruby语言特性：动态类型、面向对象、元编程、代码块',
    'Ruby on Rails框架：MVC架构、ActiveRecord、路由系统',
    'Ruby Gems生态：包管理、常用gem介绍与使用',
    'Ruby测试：RSpec、Capybara、单元测试、集成测试',
    'Ruby性能优化：内存管理、代码优化、数据库查询优化',
  ],
  Swift: [
    'Swift语言基础：类型系统、控制流、函数、闭包',
    'Swift面向对象：类、结构体、枚举、属性、方法',
    'Swift高级特性：协议、扩展、泛型、错误处理',
    'SwiftUI框架：声明式UI、状态管理、动画效果',
    'iOS开发：UIKit、Core Data、网络请求、推送通知',
  ],
  Kotlin: [
    'Kotlin语言基础：类型系统、控制流、函数、扩展函数',
    'Kotlin面向对象：类、对象、接口、继承、委托',
    'Kotlin协程：异步编程、挂起函数、协程上下文',
    'Android开发：Jetpack组件、MVVM架构、Room数据库',
    'Kotlin与Java互操作：混合开发、兼容性处理',
  ],
  Dart: [
    'Dart语言基础：类型系统、控制流、函数、异步编程',
    'Dart面向对象：类、继承、接口、混入、泛型',
    'Flutter框架：Widget体系、状态管理、路由导航',
    'FlutterUI组件：Material Design、Cupertino风格',
    'Flutter性能优化：布局优化、渲染优化、内存管理',
  ],
  'HTML/CSS': [
    'HTML5语义化标签：header、nav、section、article、footer最佳实践',
    'CSS Grid布局：网格容器、网格项、行列定义、响应式设计',
    'CSS Flexbox：弹性容器、弹性项目、对齐方式、空间分配',
    'CSS动画与过渡：@keyframes、transform、transition、动画性能优化',
    'CSS预处理器：Sass、Less、Stylus特性与使用场景',
  ],
  Shell脚本: [
    'Shell脚本基础：变量、条件判断、循环结构、函数',
    'Linux命令行：文件操作、进程管理、网络工具、系统监控',
    'Shell脚本实战：自动化部署、日志分析、系统维护',
    '正则表达式：基本语法、模式匹配、文本处理',
    'Shell脚本优化：性能、可读性、错误处理、调试技巧',
  ],
};

// 生成随机内容的函数
function generateTweetContent(tag, index) {
  const templates = tweetTemplates[tag] || ['学习编程的最佳实践和技巧分享'];
  const baseContent = templates[index % templates.length];
  const suffixes = [
    '。通过实际项目案例深入理解这些概念',
    '。掌握这些技能将大幅提升开发效率',
    '。结合最新技术趋势，探索未来发展方向',
    '。从基础到进阶，全面梳理核心知识点',
    '。通过实战演练，巩固理论知识并提升应用能力',
  ];

  return `${baseContent}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
}

// 创建系统用户
async function createSystemUser() {
  try {
    // 检查系统用户是否已存在
    let systemUser = await User.findOne({ username: 'system' });

    if (systemUser) {
      console.log('系统用户已存在');
      return systemUser;
    }

    // 创建新的系统用户
    systemUser = new User({
      username: 'system',
      email: 'system@learning-ai-platform.com',
      password: 'System@1234',
      learningInterests: interestTags, // 系统用户关注所有兴趣标签
    });

    await systemUser.save();
    console.log('系统用户创建成功');
    return systemUser;
  } catch (error) {
    console.error('创建系统用户失败:', error.message);
    throw error;
  }
}

// 为每个兴趣标签生成50条帖子
async function generateSystemTweets(systemUser) {
  try {
    for (const tag of interestTags) {
      console.log(`开始生成${tag}相关的帖子...`);

      // 检查该标签下的帖子数量
      const existingCount = await Tweet.countDocuments({
        user: systemUser._id,
        hashtags: tag,
      });

      if (existingCount >= 50) {
        console.log(`${tag}标签下已有${existingCount}条帖子，跳过生成`);
        continue;
      }

      // 需要生成的帖子数量
      const needToGenerate = 50 - existingCount;
      const tweets = [];

      for (let i = 0; i < needToGenerate; i++) {
        const tweet = new Tweet({
          user: systemUser._id,
          content: generateTweetContent(tag, existingCount + i),
          hashtags: [tag],
          likes: Math.floor(Math.random() * 100), // 随机点赞数
          reposts: Math.floor(Math.random() * 50), // 随机转发数
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机生成过去30天内的时间
        });
        tweets.push(tweet);
      }

      // 批量保存帖子
      await Tweet.insertMany(tweets);
      console.log(`${tag}标签下成功生成${needToGenerate}条帖子`);
    }

    console.log('所有兴趣标签的系统帖子生成完成！');
  } catch (error) {
    console.error('生成系统帖子失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await connectDB();
    const systemUser = await createSystemUser();
    await generateSystemTweets(systemUser);

    // 断开数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已断开');
  } catch (error) {
    console.error('执行脚本失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();
