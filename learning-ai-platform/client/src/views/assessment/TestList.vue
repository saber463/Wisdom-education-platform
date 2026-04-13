<template>
  <div class="test-list-container">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8 text-center">
        <div class="inline-block relative mb-4">
          <div
            class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-2xl blur-xl opacity-30"
          />
          <h1
            class="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink"
          >
            学习测试
          </h1>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
          通过测试了解您的知识掌握情况，发现薄弱环节，提升学习效率
        </p>
      </div>

      <!-- 测试分类筛选 -->
      <div class="glass-card rounded-2xl p-6 mb-8">
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            v-for="category in categories"
            :key="category"
            :class="[
              'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105',
              selectedCategory === category
                ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-neon-blue'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            ]"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="glass-card rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue to-tech-purple">6</div>
          <div class="text-sm text-gray-500 mt-1">测试总数</div>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-green-500">3</div>
          <div class="text-sm text-gray-500 mt-1">已完成</div>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-yellow-500">76</div>
          <div class="text-sm text-gray-500 mt-1">平均分</div>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-tech-pink">12</div>
          <div class="text-sm text-gray-500 mt-1">错题待复习</div>
        </div>
      </div>

      <!-- 测试列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="test in filteredTests"
          :key="test.id"
          class="glass-card rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-tech-blue/30 group relative overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-gradient-to-br from-tech-blue/5 via-transparent to-tech-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div class="relative">
            <!-- 图标 + 标题 -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3 flex-1">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md flex-shrink-0"
                  :class="test.iconBg"
                >
                  <i :class="test.icon" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3
                    class="text-lg font-bold text-gray-800 dark:text-white transition-colors duration-300 group-hover:text-tech-blue truncate"
                  >
                    {{ test.title }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span><i class="fa fa-users mr-1" />{{ test.participants }}人参与</span>
                    <span><i class="fa fa-check-circle mr-1" />{{ test.passRate }}%通过</span>
                  </div>
                </div>
              </div>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold transition-all border flex-shrink-0"
                :class="{
                  'bg-green-100 text-green-800 border-green-200': test.difficulty === '简单',
                  'bg-yellow-100 text-yellow-800 border-yellow-200': test.difficulty === '中等',
                  'bg-red-100 text-red-800 border-red-200': test.difficulty === '困难',
                }"
                >{{ test.difficulty }}</span
              >
            </div>

            <!-- 描述 -->
            <div class="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-2 h-10 overflow-hidden">
              {{ test.description }}
            </div>

            <!-- 标签行 -->
            <div
              class="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400"
            >
              <span
                class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full"
              >
                <i class="fa fa-question-circle text-tech-blue" />{{ test.totalQuestions }}题
              </span>
              <span
                class="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-full"
              >
                <i class="fa fa-clock-o text-tech-purple" />{{ test.duration }}分钟
              </span>
              <span
                class="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 px-2.5 py-1 rounded-full"
              >
                <i class="fa fa-folder text-tech-pink" />{{ test.categoryName }}
              </span>
            </div>

            <!-- 底部：分数 + 按钮 -->
            <div
              class="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between"
            >
              <div v-if="test.lastScore > 0" class="flex items-center gap-2">
                <div class="text-right">
                  <div class="text-lg font-bold" :class="test.lastScore >= 60 ? 'text-green-500' : 'text-red-500'">
                    {{ test.lastScore }}<span class="text-xs text-gray-400 font-normal">/100</span>
                  </div>
                  <div class="text-xs text-gray-400">上次成绩</div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-400">
                <i class="fa fa-clock-o mr-1" />尚未测试
              </div>
              <button
                class="btn-primary text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 px-5 py-2 rounded-xl"
                @click="startTest(test)"
              >
                <i class="fa fa-play mr-1" /> {{ test.lastScore > 0 ? '再次测试' : '开始测试' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 没有测试时的提示 -->
      <div v-if="filteredTests.length === 0" class="text-center py-16">
        <div class="relative inline-block mb-6">
          <div
            class="absolute inset-0 bg-gradient-to-r from-tech-blue to-tech-purple rounded-full blur-2xl opacity-20"
          />
          <div
            class="relative w-24 h-24 bg-gradient-to-br from-tech-blue/10 to-tech-purple/10 rounded-full flex items-center justify-center mx-auto border-2 border-tech-blue/20"
          >
            <i class="fa fa-file-text-o text-5xl text-tech-blue" />
          </div>
        </div>
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无可用的测试</h3>
        <p class="text-gray-500 dark:text-gray-400">请稍后再试或选择其他分类</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { testApi } from '@/utils/api';

const router = useRouter();

// 测试数据
const tests = ref([]);
const categories = ref(['全部', '前端开发', '后端开发', '计算机基础', '人工智能']);
const selectedCategory = ref('全部');
const loading = ref(false);

// Mock测试数据 - 6个核心测试
const mockTests = [
  {
    id: 'mock1', title: 'Vue3 Composition API 专项测试',
    description: 'ref/reactive/computed/watch 生命周期钩子、依赖注入、provide/inject 等核心概念综合考察',
    categoryName: '前端开发', difficulty: '中等', duration: 45, totalQuestions: 25,
    lastScore: 82, participants: 1286, passRate: 78,
    icon: 'fa fa-vuejs fab', iconBg: 'bg-gradient-to-br from-green-400 to-green-600 text-white',
    mockQuestions: [
      { _id: 'mq1_1', questionType: 'single', questionText: '在 Vue3 Composition API 中，以下哪个函数用于创建响应式基本类型数据？', options: [{ text: 'reactive()' }, { text: 'ref()' }, { text: 'computed()' }, { text: 'watch()' }], correctAnswer: 1, knowledgePoints: ['ref', '响应式系统'], explanation: 'ref() 用于创建响应式的基本类型数据（如数字、字符串、布尔值），reactive() 用于创建响应式对象。' },
      { _id: 'mq1_2', questionType: 'single', questionText: 'Vue3 中 watch 和 watchEffect 的主要区别是什么？', options: [{ text: 'watchEffect 不需要指定监听源' }, { text: 'watch 不支持深度监听' }, { text: 'watchEffect 性能更好' }, { text: '没有区别，只是别名' }], correctAnswer: 0, knowledgePoints: ['watch', 'watchEffect'], explanation: 'watchEffect 会自动收集回调函数中使用的响应式依赖，而 watch 需要显式指定要监听的源数据。' },
      { _id: 'mq1_3', questionType: 'truefalse', questionText: '在 Vue3 的 setup() 函数中，this 指向当前组件实例。', options: [], correctAnswer: false, knowledgePoints: ['setup', 'Composition API'], explanation: '在 Composition API 的 setup() 函数中没有 this 访问，因为它在组件实例创建之前执行。需要通过参数接收 props 和 context。' },
      { _id: 'mq1_4', questionType: 'single', questionText: '以下哪个是 Vue3 推荐的代码组织方式？', options: [{ text: 'Options API' }, { text: 'Composition API + <script setup>' }, { text: 'Class-based API' }, { text: 'Mixin 模式' }], correctAnswer: 1, knowledgePoints: ['script setup', '代码组织'], explanation: '<script setup> 是 Vue3 的编译时语法糖，是官方推荐的 Composition API 书写方式，代码更简洁高效。' },
      { _id: 'mq1_5', questionType: 'single', questionText: 'toRef 和 toRefs 的作用是什么？', options: [{ text: '创建计算属性' }, { text: '将 reactive 对象的属性转为 ref' }, { text: '创建只读引用' }, { text: '进行类型转换' }], correctAnswer: 1, knowledgePoints: ['toRef', 'toRefs'], explanation: 'toRef 可以为 reactive 对象的某个属性创建一个 ref，toRefs 则将整个 reactive 对象的所有属性转为 ref 对象，常用于解构。' },
    ],
  },
  {
    id: 'mock2', title: 'React Hooks 核心概念测试',
    description: 'useState/useEffect/useContext/useReducer 自定义 Hook、闭包陷阱、性能优化综合考察',
    categoryName: '前端开发', difficulty: '中等', duration: 40, totalQuestions: 20,
    lastScore: 0, participants: 956, passRate: 72,
    icon: 'fa fa-react fab', iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white',
    mockQuestions: [
      { _id: 'mq2_1', questionType: 'single', questionText: '以下哪个 React Hook 用于在函数组件中管理副作用？', options: [{ text: 'useState' }, { text: 'useEffect' }, { text: 'useContext' }, { text: 'useRef' }], correctAnswer: 1, knowledgePoints: ['useEffect', '副作用'], explanation: 'useEffect 用于在函数组件中执行副作用操作，如数据获取、订阅、DOM 操作等。' },
      { _id: 'mq2_2', questionType: 'single', questionText: 'React 中 useRef 和 useState 的主要区别是什么？', options: [{ text: 'ref 不会触发重新渲染' }, { text: 'ref 只能存储数字' }, { text: 'useState 性能更好' }, { text: '没有区别' }], correctAnswer: 0, knowledgePoints: ['useRef', 'useState'], explanation: 'useRef 返回一个可变引用对象，修改其 current 值不会触发组件重新渲染，适合存储不需要参与渲染的数据。' },
      { _id: 'mq2_3', questionType: 'truefalse', questionText: 'React useEffect 的清理函数会在组件卸载时自动调用。', options: [], correctAnswer: true, knowledgePoints: ['useEffect', '组件生命周期'], explanation: 'useEffect 返回的清理函数会在组件卸载时执行，也可以在依赖变化导致 effect 重新执行前调用，用于清理定时器、取消订阅等。' },
      { _id: 'mq2_4', questionType: 'single', questionText: '以下哪种方式可以避免 React Hook 中的闭包陷阱？', options: [{ text: '使用 var 声明变量' }, { text: '使用 useCallback 和正确的依赖数组' }, { text: '避免使用 useEffect' }, { text: '使用 class 组件替代' }], correctAnswer: 1, knowledgePoints: ['useCallback', '闭包陷阱'], explanation: 'useCallback 配合正确的依赖数组可以避免闭包陷阱，确保回调函数始终能访问到最新的状态值。' },
    ],
  },
  {
    id: 'mock3', title: '算法与数据结构综合测评',
    description: '数组、链表、栈、队列、二叉树、排序算法、动态规划、递归核心知识点全面考察',
    categoryName: '计算机基础', difficulty: '困难', duration: 60, totalQuestions: 30,
    lastScore: 65, participants: 2341, passRate: 55,
    icon: 'fa fa-sitemap', iconBg: 'bg-gradient-to-br from-orange-400 to-red-500 text-white',
    mockQuestions: [
      { _id: 'mq3_1', questionType: 'single', questionText: '快速排序的平均时间复杂度是多少？', options: [{ text: 'O(n)' }, { text: 'O(n log n)' }, { text: 'O(n²)' }, { text: 'O(log n)' }], correctAnswer: 1, knowledgePoints: ['排序算法', '时间复杂度'], explanation: '快速排序通过分治策略，平均时间复杂度为 O(n log n)，最坏情况（已排序数组）为 O(n²)。' },
      { _id: 'mq3_2', questionType: 'single', questionText: '二叉搜索树（BST）中查找一个元素的最坏时间复杂度是？', options: [{ text: 'O(1)' }, { text: 'O(log n)' }, { text: 'O(n)' }, { text: 'O(n log n)' }], correctAnswer: 2, knowledgePoints: ['二叉搜索树', '查找'], explanation: 'BST 查找的最坏情况发生在树退化为链表时，时间复杂度为 O(n)。平衡 BST（如 AVL 树）可保证 O(log n)。' },
      { _id: 'mq3_3', questionType: 'truefalse', questionText: '动态规划一定能将指数时间复杂度的暴力递归优化为多项式时间复杂度。', options: [], correctAnswer: false, knowledgePoints: ['动态规划', '算法优化'], explanation: '并非所有问题都能用动态规划优化。NP-Hard 问题（如旅行商问题）即使用动态规划，时间复杂度仍然是指数级的。' },
      { _id: 'mq3_4', questionType: 'single', questionText: '以下哪种数据结构适合实现"撤销"操作？', options: [{ text: '队列' }, { text: '栈' }, { text: '链表' }, { text: '哈希表' }], correctAnswer: 1, knowledgePoints: ['栈', '数据结构应用'], explanation: '栈的后进先出（LIFO）特性使其天然适合实现撤销操作，每次操作入栈，撤销时弹出栈顶恢复状态。' },
      { _id: 'mq3_5', questionType: 'single', questionText: '哈希表处理冲突的常见方法不包括以下哪个？', options: [{ text: '链地址法' }, { text: '开放寻址法' }, { text: '二叉平衡法' }, { text: '再哈希法' }], correctAnswer: 2, knowledgePoints: ['哈希表', '冲突处理'], explanation: '哈希表常见的冲突处理方法包括：链地址法、开放寻址法（线性探测、二次探测）、再哈希法等。二叉平衡法不是哈希冲突处理方法。' },
    ],
  },
  {
    id: 'mock4', title: 'Node.js 后端开发能力测试',
    description: 'Express 路由、中间件机制、异步编程、Stream、事件循环、RESTful API 设计全面考察',
    categoryName: '后端开发', difficulty: '中等', duration: 50, totalQuestions: 25,
    lastScore: 88, participants: 1087, passRate: 81,
    icon: 'fa fa-node-js fab', iconBg: 'bg-gradient-to-br from-green-500 to-green-700 text-white',
    mockQuestions: [
      { _id: 'mq4_1', questionType: 'single', questionText: 'Node.js 中的事件循环主要处理哪类任务？', options: [{ text: '同步 CPU 密集型计算' }, { text: '异步 I/O 操作回调' }, { text: '内存管理' }, { text: '垃圾回收' }], correctAnswer: 1, knowledgePoints: ['事件循环', '异步编程'], explanation: 'Node.js 事件循环负责管理和执行异步 I/O 操作的回调，是 Node.js 非阻塞 I/O 模型的核心机制。' },
      { _id: 'mq4_2', questionType: 'single', questionText: 'Express 中间件的执行顺序是怎样的？', options: [{ text: '随机执行' }, { text: '按注册顺序从上到下' }, { text: '按字母顺序' }, { text: '并行执行' }], correctAnswer: 1, knowledgePoints: ['Express', '中间件'], explanation: 'Express 中间件按照代码中的注册顺序依次执行，形成中间件栈。每个中间件可以调用 next() 将控制权传递给下一个中间件。' },
      { _id: 'mq4_3', questionType: 'truefalse', questionText: 'Node.js 的 Stream 模式可以用于处理大文件而不会耗尽内存。', options: [], correctAnswer: true, knowledgePoints: ['Stream', '内存管理'], explanation: 'Stream 以分块（chunk）的方式处理数据，不需要将整个文件加载到内存中，因此非常适合处理大文件、网络传输等场景。' },
      { _id: 'mq4_4', questionType: 'single', questionText: '以下哪种方式可以正确处理 async/await 中的错误？', options: [{ text: '使用 callback' }, { text: '使用 try/catch' }, { text: '忽略即可' }, { text: '使用 return' }], correctAnswer: 1, knowledgePoints: ['async/await', '错误处理'], explanation: 'try/catch 是 async/await 中处理错误的标准方式，可以捕获异步操作抛出的异常，类似于同步代码中的错误处理模式。' },
    ],
  },
  {
    id: 'mock5', title: 'Python 编程能力综合测试',
    description: '列表推导式、装饰器、生成器、上下文管理器、面向对象、异常处理深入考察',
    categoryName: '后端开发', difficulty: '中等', duration: 45, totalQuestions: 20,
    lastScore: 0, participants: 1654, passRate: 68,
    icon: 'fa fa-python fab', iconBg: 'bg-gradient-to-br from-blue-400 to-yellow-500 text-white',
    mockQuestions: [
      { _id: 'mq5_1', questionType: 'single', questionText: 'Python 中装饰器本质上是什么？', options: [{ text: '一种设计模式' }, { text: '接受函数并返回函数的高阶函数' }, { text: '一种数据结构' }, { text: '一个类' }], correctAnswer: 1, knowledgePoints: ['装饰器', '高阶函数'], explanation: '装饰器是一个高阶函数，它接受一个函数作为参数，并返回一个新的函数，用于在不修改原函数代码的情况下扩展其功能。' },
      { _id: 'mq5_2', questionType: 'single', questionText: 'Python 生成器（Generator）使用哪个关键字来暂停和恢复执行？', options: [{ text: 'return' }, { text: 'break' }, { text: 'yield' }, { text: 'pause' }], correctAnswer: 2, knowledgePoints: ['生成器', 'yield'], explanation: 'yield 关键字用于定义生成器函数，它暂停函数执行并返回一个值，下次调用时从暂停处继续执行。' },
      { _id: 'mq5_3', questionType: 'truefalse', questionText: 'Python 的 GIL（全局解释器锁）使得多线程无法实现真正的并行计算。', options: [], correctAnswer: true, knowledgePoints: ['GIL', '多线程'], explanation: 'GIL 是 CPython 的全局解释器锁，同一时刻只允许一个线程执行 Python 字节码，因此 CPU 密集型任务无法通过多线程实现真正的并行计算。' },
      { _id: 'mq5_4', questionType: 'single', questionText: 'Python 中 with 语句的作用是什么？', options: [{ text: '条件判断' }, { text: '上下文管理，自动处理资源的获取和释放' }, { text: '循环控制' }, { text: '异常捕获' }], correctAnswer: 1, knowledgePoints: ['上下文管理器', 'with'], explanation: 'with 语句用于上下文管理，确保资源（文件、数据库连接、锁等）在使用后自动正确释放，即使发生异常也能保证清理。' },
    ],
  },
  {
    id: 'mock6', title: '机器学习与 AI 基础测评',
    description: '监督/无监督学习、神经网络、损失函数、梯度下降、过拟合/欠拟合、模型评估综合考察',
    categoryName: '人工智能', difficulty: '困难', duration: 50, totalQuestions: 25,
    lastScore: 71, participants: 892, passRate: 52,
    icon: 'fa fa-brain', iconBg: 'bg-gradient-to-br from-purple-400 to-pink-500 text-white',
    mockQuestions: [
      { _id: 'mq6_1', questionType: 'single', questionText: '以下哪种方法可以有效防止模型过拟合？', options: [{ text: '增加模型复杂度' }, { text: '正则化（L1/L2）和 Dropout' }, { text: '使用更大的训练数据集来训练更久' }, { text: '减少训练数据' }], correctAnswer: 1, knowledgePoints: ['过拟合', '正则化'], explanation: '正则化通过约束模型权重（L1产生稀疏解，L2约束权重大小）来防止过拟合。Dropout 随机丢弃神经元也能有效防止过拟合。' },
      { _id: 'mq6_2', questionType: 'single', questionText: '梯度下降算法中学习率（Learning Rate）设置过大可能导致什么问题？', options: [{ text: '收敛速度太慢' }, { text: '损失函数震荡甚至发散' }, { text: '模型欠拟合' }, { text: '没有影响' }], correctAnswer: 1, knowledgePoints: ['梯度下降', '超参数'], explanation: '学习率过大可能导致参数更新步长过大，损失函数无法收敛而出现震荡甚至发散，无法找到最优解。' },
      { _id: 'mq6_3', questionType: 'truefalse', questionText: 'K-Means 聚类算法需要预先指定聚类的数量 K。', options: [], correctAnswer: true, knowledgePoints: ['K-Means', '无监督学习'], explanation: 'K-Means 是一种需要预先指定聚类数 K 的无监督学习算法。可以使用肘部法则（Elbow Method）或轮廓系数来确定最佳 K 值。' },
      { _id: 'mq6_4', questionType: 'single', questionText: '在分类问题中，当正负样本严重不平衡时，以下哪个评估指标最不可靠？', options: [{ text: '精确率（Precision）' }, { text: '召回率（Recall）' }, { text: '准确率（Accuracy）' }, { text: 'F1-Score' }], correctAnswer: 2, knowledgePoints: ['模型评估', '不平衡数据'], explanation: '当正负样本严重不平衡时（如99%为负样本），模型只需全部预测为负类就能获得99%的准确率，但这个指标没有意义。F1-Score、Precision 和 Recall 更适合评估不平衡场景。' },
      { _id: 'mq6_5', questionType: 'single', questionText: '以下哪个是卷积神经网络（CNN）的核心组件？', options: [{ text: '循环层' }, { text: '注意力机制' }, { text: '卷积层和池化层' }, { text: '全连接层' }], correctAnswer: 2, knowledgePoints: ['CNN', '深度学习'], explanation: 'CNN 的核心是卷积层（提取局部特征）和池化层（降维和特征选择），它们通过参数共享和局部连接大大减少了参数数量。' },
    ],
  },
];

// 筛选后的测试列表
const filteredTests = computed(() => {
  if (selectedCategory.value === '全部') {
    return tests.value;
  }
  return tests.value.filter(test => test.categoryName === selectedCategory.value);
});

// 获取测试列表
const fetchTests = async () => {
  loading.value = true;
  try {
    const params = { isPublished: true };
    const response = await testApi.getList(params);
    const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' };
    tests.value = response.data.data.map(test => ({
      id: test._id,
      title: test.title,
      description: test.description,
      categoryName: test.category?.name || '未分类',
      difficulty: difficultyMap[test.difficulty] || test.difficulty,
      duration: test.duration,
      totalQuestions: test.totalQuestions || 0,
      lastScore: test.lastScore || 0,
    }));
    if (tests.value.length === 0) tests.value = mockTests;
  } catch (error) {
    console.error('获取测试列表失败:', error);
    tests.value = mockTests;
  } finally {
    loading.value = false;
  }
};

// 开始测试
const startTest = test => {
  // 如果是 mock 数据（id 以 mock 开头），将 mock 题目数据存入 sessionStorage 供 TestDetail 使用
  if (test.id && test.id.toString().startsWith('mock') && test.mockQuestions) {
    sessionStorage.setItem(
      `mock_test_${test.id}`,
      JSON.stringify({
        _id: test.id,
        title: test.title,
        description: test.description,
        categoryName: test.categoryName,
        difficulty: test.difficulty,
        duration: test.duration,
        totalQuestions: test.mockQuestions.length,
        questions: test.mockQuestions,
      })
    );
  }
  router.push({
    name: 'TestDetail',
    params: { id: test.id },
  });
};

// 组件挂载时加载数据
onMounted(() => {
  fetchTests();
});
</script>

<style scoped>
.test-list-container {
  min-height: calc(100vh - 120px);
}
</style>
