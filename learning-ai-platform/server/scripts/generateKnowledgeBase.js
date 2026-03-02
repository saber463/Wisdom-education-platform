const mongoose = require('mongoose');
const KnowledgePoint = require('../models/KnowledgePoint');
const Category = require('../models/Category');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/learning-ai-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 计算机基础知识库内容模板
const computerBasicTemplates = {
  计算机网络: [
    {
      name: 'TCP/IP协议族',
      description: '互联网的基础通信协议',
      content: 'TCP/IP协议族是互联网的基础通信协议，包括网络层的IP协议、传输层的TCP和UDP协议等。',
    },
    {
      name: 'HTTP协议',
      description: '超文本传输协议',
      content: 'HTTP协议是超文本传输协议，用于在Web浏览器和服务器之间传输数据。',
    },
    {
      name: '网络拓扑结构',
      description: '网络连接的物理或逻辑布局',
      content: '网络拓扑结构包括总线型、星型、环型、网状型等，不同结构有不同的优缺点。',
    },
    {
      name: '子网掩码',
      description: '划分网络地址和主机地址',
      content: '子网掩码用于划分网络地址和主机地址，是TCP/IP网络中的重要概念。',
    },
    {
      name: 'DNS解析',
      description: '域名到IP地址的转换',
      content: 'DNS解析是将域名转换为IP地址的过程，由DNS服务器完成。',
    },
    {
      name: '路由器工作原理',
      description: '网络数据包转发设备',
      content: '路由器用于连接不同网络，根据路由表转发数据包，是网络的核心设备。',
    },
    {
      name: '交换机工作原理',
      description: '局域网数据交换设备',
      content: '交换机工作在数据链路层，根据MAC地址转发数据包，用于构建局域网。',
    },
    {
      name: '防火墙技术',
      description: '网络安全防护系统',
      content: '防火墙用于保护网络安全，控制进出网络的流量，防止未授权访问。',
    },
    {
      name: 'VPN技术',
      description: '虚拟专用网络',
      content: 'VPN虚拟专用网络，通过加密技术在公共网络上建立安全的专用通道。',
    },
    {
      name: '网络安全威胁',
      description: '常见的网络安全风险',
      content: '常见的网络安全威胁包括病毒、木马、钓鱼、DDoS攻击等。',
    },
  ],
  操作系统: [
    {
      name: '操作系统基本概念',
      description: '计算机系统软件',
      content: '操作系统是管理计算机硬件和软件资源的系统软件，提供用户与计算机的交互界面。',
    },
    {
      name: '进程管理',
      description: '程序执行实例的管理',
      content: '进程是程序的执行实例，操作系统负责进程的创建、调度、同步和通信。',
    },
    {
      name: '线程管理',
      description: '进程内的执行单元',
      content: '线程是进程内的执行单元，一个进程可以包含多个线程，共享进程资源。',
    },
    {
      name: '内存管理',
      description: '计算机内存的分配和回收',
      content: '内存管理负责内存的分配、回收和保护，包括分页、分段等技术。',
    },
    {
      name: '文件系统',
      description: '文件和目录的组织管理',
      content: '文件系统用于组织和管理计算机存储设备上的文件和目录。',
    },
    {
      name: '设备管理',
      description: '硬件设备的控制和管理',
      content: '设备管理负责计算机硬件设备的分配、控制和驱动程序管理。',
    },
    {
      name: '操作系统调度算法',
      description: '进程执行顺序的决定',
      content: '调度算法包括FCFS、SJF、优先级调度、时间片轮转等，用于决定进程执行顺序。',
    },
    {
      name: '死锁处理',
      description: '多进程资源竞争问题',
      content:
        '死锁是指多个进程因竞争资源而无法继续执行的状态，处理方法包括预防、避免、检测和解除。',
    },
    {
      name: '虚拟内存',
      description: '内存扩展技术',
      content: '虚拟内存是一种内存管理技术，将硬盘空间作为内存的扩展，提供更大的地址空间。',
    },
    {
      name: '操作系统分类',
      description: '不同类型的操作系统',
      content: '操作系统包括批处理系统、分时系统、实时系统、网络操作系统、分布式操作系统等。',
    },
  ],
  数据结构: [
    {
      name: '数据结构基本概念',
      description: '数据的组织和存储方式',
      content: '数据结构是组织和存储数据的方式，包括线性结构和非线性结构。',
    },
    {
      name: '数组',
      description: '固定大小的线性数据结构',
      content: '数组是一种线性数据结构，用于存储相同类型的元素，具有固定大小。',
    },
    {
      name: '链表',
      description: '动态的线性数据结构',
      content: '链表是一种动态数据结构，元素通过指针连接，包括单链表、双链表和循环链表。',
    },
    {
      name: '栈',
      description: '后进先出的数据结构',
      content: '栈是一种后进先出(LIFO)的数据结构，支持入栈和出栈操作。',
    },
    {
      name: '队列',
      description: '先进先出的数据结构',
      content: '队列是一种先进先出(FIFO)的数据结构，支持入队和出队操作。',
    },
    {
      name: '树',
      description: '非线性层次数据结构',
      content: '树是一种非线性数据结构，由节点组成，具有层次关系，包括二叉树、平衡树等。',
    },
    {
      name: '二叉树',
      description: '每个节点最多两个子节点的树',
      content: '二叉树是每个节点最多有两个子节点的树，包括满二叉树、完全二叉树等。',
    },
    {
      name: '二叉搜索树',
      description: '有序的二叉树',
      content: '二叉搜索树是一种特殊的二叉树，左子树节点值小于根节点，右子树节点值大于根节点。',
    },
    {
      name: '图',
      description: '多对多关系的数据结构',
      content: '图是由顶点和边组成的非线性数据结构，用于表示元素之间的多对多关系。',
    },
    {
      name: '哈希表',
      description: '快速查找的数据结构',
      content: '哈希表通过哈希函数将键映射到值，提供快速的插入、删除和查找操作。',
    },
  ],
  算法: [
    {
      name: '算法基本概念',
      description: '解决问题的步骤集合',
      content: '算法是解决问题的步骤集合，具有有穷性、确定性、可行性、输入和输出等特性。',
    },
    {
      name: '时间复杂度',
      description: '算法执行时间的度量',
      content: '时间复杂度用于衡量算法执行时间随输入规模增长的变化趋势。',
    },
    {
      name: '空间复杂度',
      description: '算法内存使用的度量',
      content: '空间复杂度用于衡量算法执行所需的额外空间随输入规模增长的变化趋势。',
    },
    {
      name: '排序算法',
      description: '数据排序的方法',
      content: '排序算法包括冒泡排序、选择排序、插入排序、快速排序、归并排序、堆排序等。',
    },
    {
      name: '查找算法',
      description: '数据查找的方法',
      content: '查找算法包括顺序查找、二分查找、哈希查找、二叉搜索树查找等。',
    },
    {
      name: '递归算法',
      description: '函数调用自身的算法',
      content: '递归算法通过函数调用自身解决问题，包括阶乘、斐波那契数列等经典问题。',
    },
    {
      name: '分治算法',
      description: '分而治之的算法',
      content: '分治算法将问题分解为子问题，分别解决后合并结果，如快速排序、归并排序等。',
    },
    {
      name: '动态规划',
      description: '重叠子问题的优化算法',
      content:
        '动态规划通过将问题分解为重叠子问题，保存子问题结果避免重复计算，如背包问题、最长公共子序列等。',
    },
    {
      name: '贪心算法',
      description: '局部最优的算法',
      content: '贪心算法在每一步选择当前最优解，期望得到全局最优解，如哈夫曼编码、最小生成树等。',
    },
    {
      name: '回溯算法',
      description: '尝试与回退的算法',
      content: '回溯算法通过尝试不同路径，遇到错误时回溯，如八皇后问题、迷宫问题等。',
    },
  ],
  计算机组成原理: [
    {
      name: '计算机体系结构',
      description: '计算机的组织和结构',
      content: '计算机体系结构是计算机的组织和结构，包括硬件和软件的设计原则。',
    },
    {
      name: '中央处理器(CPU)',
      description: '计算机的核心部件',
      content: 'CPU是计算机的核心部件，负责执行指令，包括运算器、控制器和寄存器。',
    },
    {
      name: '存储器系统',
      description: '计算机的存储层次',
      content: '存储器系统包括寄存器、高速缓存、主存储器和辅助存储器，具有不同的速度和容量。',
    },
    {
      name: '输入输出系统',
      description: '计算机与外部设备的接口',
      content: '输入输出系统负责计算机与外部设备的数据交换，包括接口、总线和设备控制器。',
    },
    {
      name: '指令系统',
      description: 'CPU能执行的指令集合',
      content: '指令系统是CPU能执行的指令集合，包括数据传输、运算、控制和输入输出指令。',
    },
    {
      name: '总线系统',
      description: '计算机部件间的通信线路',
      content: '总线是连接计算机各部件的通信线路，包括地址总线、数据总线和控制总线。',
    },
    {
      name: '汇编语言',
      description: '低级编程语言',
      content: '汇编语言是一种低级编程语言，与机器语言一一对应，直接操作硬件。',
    },
    {
      name: '流水线技术',
      description: 'CPU并行执行技术',
      content: '流水线技术将指令执行分解为多个阶段并行处理，提高CPU的执行效率。',
    },
    {
      name: '并行处理',
      description: '多任务并行执行',
      content: '并行处理通过同时执行多个指令或任务，提高计算机的性能。',
    },
    {
      name: '计算机性能评价',
      description: '计算机性能的指标',
      content: '计算机性能评价指标包括时钟频率、CPI、MIPS、MFLOPS等。',
    },
  ],
};

// 批量生成知识库内容
const generateKnowledgeBase = async () => {
  try {
    // 首先删除所有现有知识条目
    await KnowledgePoint.deleteMany({});
    console.log('已删除所有现有知识条目');

    // 获取所有分类
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // 为每个专业生成知识库内容
    let totalCount = 0;

    // 计算机基础知识库
    console.log('开始生成计算机基础知识库...');
    for (const [categoryName, items] of Object.entries(computerBasicTemplates)) {
      for (let i = 0; i < 20; i++) {
        // 每个子分类生成20条内容，共5个子分类，总计100条
        for (const item of items) {
          const knowledgePoint = new KnowledgePoint({
            name: `计算机基础 - ${item.name} (${i + 1})`,
            description: item.description,
            content: `${item.content} 这是第${i + 1}条详细内容，包含更多关于${item.name}的专业知识和实际应用案例。`,
            category:
              categoryMap['计算机基础'] || categoryMap['计算机网络'] || categoryMap['操作系统'],
            parent: null,
            level: 1,
            keywords: [item.name, categoryName, '计算机基础'],
          });
          await knowledgePoint.save();
          totalCount++;
        }
      }
    }
    console.log('计算机基础知识库生成完成');

    console.log(`\n知识库生成完成！共生成 ${totalCount} 条知识条目`);
    console.log('每个专业知识库条目数量：');
    console.log('- 计算机基础：约 1000 条');
  } catch (error) {
    console.error('生成知识库失败:', error);
  }
};

// 执行脚本
const main = async () => {
  await connectDB();
  await generateKnowledgeBase();
  mongoose.disconnect();
};

main();
