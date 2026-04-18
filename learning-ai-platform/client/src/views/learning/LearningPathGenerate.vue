<template>
  <div class="learning-path-generate min-h-screen">
    <div class="container mx-auto px-4 py-8 relative">
      <h2
        class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-center mb-6 bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink bg-clip-text text-transparent"
      >
        AI智能学习路径生成
      </h2>

      <MembershipStatusCard :membership-info="membershipInfo" />

      <LearningPathForm
        ref="formRef"
        :is-loading="isLoading"
        :is-form-valid="isFormValid"
        :is-at-limit="isAtLimit"
        @submit="handleGenerate"
        @update:formState="handleFormStateUpdate"
      />

      <LearningPathDisplay
        v-if="learningPath"
        :learning-path="learningPath"
        :intensity="intensity"
      />

      <div
        v-if="errorMsg"
        class="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-600 dark:text-red-400 mb-8 animate-fadeIn backdrop-blur-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa fa-exclamation-circle" />
            <span>{{ errorMsg }}</span>
          </div>
          <router-link
            v-if="isAtLimit"
            to="/membership"
            class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            立即升级 <i class="fa fa-arrow-right ml-1" />
          </router-link>
        </div>
      </div>
      <!-- 热门路径模板 -->
      <div class="mt-12 mb-4">
        <h3 class="text-xl font-bold text-white mb-6 text-center">🔥 热门学习路径模板</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="tmpl in pathTemplates"
            :key="tmpl.id"
            @click="showTemplateDetail(tmpl)"
            class="rounded-xl overflow-hidden border border-white/10 hover:border-tech-blue/50 transition-all hover:scale-105 cursor-pointer bg-white/5 backdrop-blur-sm"
          >
            <img :src="tmpl.cover" :alt="tmpl.title" class="w-full h-28 object-cover" />
            <div class="p-3">
              <div class="text-sm font-semibold text-white mb-1 line-clamp-2">{{ tmpl.title }}</div>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span>📅 {{ tmpl.days }}天</span>
                <span class="ml-auto" :class="tmpl.difficulty === '困难' ? 'text-red-400' : tmpl.difficulty === '中等' ? 'text-yellow-400' : 'text-green-400'">{{ tmpl.difficulty }}</span>
              </div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="tag in tmpl.tags" :key="tag" class="text-xs bg-tech-blue/10 text-tech-blue px-1.5 py-0.5 rounded">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模板详情弹窗 -->
      <div v-if="showTemplateModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" @click.self="closeTemplateModal">
        <div class="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-gray-700 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-white">{{ selectedTemplate?.title }}</h3>
            <button @click="closeTemplateModal" class="text-gray-400 hover:text-white transition-colors">
              <i class="fa fa-times text-xl"></i>
            </button>
          </div>

          <div class="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-4 mb-3">
              <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">📅 {{ selectedTemplate?.days }}天</span>
              <span :class="selectedTemplate?.difficulty === '困难' ? 'text-red-400' : selectedTemplate?.difficulty === '中等' ? 'text-yellow-400' : 'text-green-400'">
                {{ selectedTemplate?.difficulty }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in selectedTemplate?.tags" :key="tag" class="text-xs bg-tech-blue/10 text-tech-blue px-2 py-1 rounded">{{ tag }}</span>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-400 mb-2">📖 学习内容概览</h4>
            <div class="bg-gray-700/30 rounded-lg p-4">
              <p class="text-gray-300 text-sm">{{ selectedTemplate?.description }}</p>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-400 mb-2">🎯 学习目标</h4>
            <ul class="text-gray-300 text-sm space-y-1">
              <li v-for="(goal, idx) in selectedTemplate?.goals" :key="idx">• {{ goal }}</li>
            </ul>
          </div>

          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-400 mb-2">📚 核心技术栈</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="tech in selectedTemplate?.techStack" :key="tech" class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{{ tech }}</span>
            </div>
          </div>

          <button
            @click="useTemplate"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <i class="fa fa-magic mr-2"></i>
            使用此模板生成学习路径
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { generateLearningPathByAi } from '@/hooks/useAiApi';
import { LearningPathLogger } from '@/utils/learningPathLogger';
import { useMembership } from '@/hooks/useMembership';
import { useLearningPathForm } from '@/hooks/useLearningPathForm';
import MembershipStatusCard from '@/components/business/MembershipStatusCard.vue';
import LearningPathForm from '@/components/business/LearningPathForm.vue';
import LearningPathDisplay from '@/components/business/LearningPathDisplay.vue';

const route = useRoute();
const formRef = ref(null);

const { membershipInfo, fetchMembershipInfo, isAtLimit } = useMembership();
const { isFormValid, isFormTouched, updateFormState } = useLearningPathForm();

const isLoading = ref(false);
const errorMsg = ref('');
const learningPath = ref(null);
const intensity = ref('medium'); // 增加缺失的 intensity ref
const showTemplateModal = ref(false);
const selectedTemplate = ref(null);

// 热门路径模板 mock数据
const pathTemplates = ref([
  {
    id: 1,
    title: '30天JavaScript零基础入门',
    days: 30,
    difficulty: '简单',
    tags: ['JS', '前端'],
    cover: 'https://picsum.photos/seed/pt1/280/160',
    description: '从零开始学习JavaScript，掌握前端开发的核心技术栈，包括ES6+语法、DOM操作、事件处理和异步编程。',
    goals: ['掌握JavaScript基础语法', '能够独立操作DOM', '理解事件驱动编程', '学会使用Fetch进行API调用'],
    techStack: ['JavaScript', 'ES6+', 'DOM', 'BOM', 'AJAX']
  },
  {
    id: 2,
    title: '45天Python数据分析实战',
    days: 45,
    difficulty: '中等',
    tags: ['Python', 'Pandas'],
    cover: 'https://picsum.photos/seed/pt2/280/160',
    description: '系统学习Python数据分析，掌握Pandas、NumPy、Matplotlib等核心库，完成多个数据分析项目。',
    goals: ['熟练使用Pandas进行数据处理', '掌握NumPy数组操作', '学会数据可视化', '完成至少3个数据分析实战项目'],
    techStack: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter']
  },
  {
    id: 3,
    title: '60天Vue3全栈开发',
    days: 60,
    difficulty: '中等',
    tags: ['Vue3', 'Node.js'],
    cover: 'https://picsum.photos/seed/pt3/280/160',
    description: '从前端到后端，系统学习Vue3 + Node.js全栈开发，掌握从前端组件到后端API的完整技术链条。',
    goals: ['掌握Vue3组合式API', '熟练使用Pinia状态管理', '学会Node.js + Express开发API', '完成一个完整的全栈项目'],
    techStack: ['Vue3', 'Pinia', 'Vue Router', 'Node.js', 'Express', 'MongoDB']
  },
  {
    id: 4,
    title: '90天Java后端架构师',
    days: 90,
    difficulty: '困难',
    tags: ['Java', 'Spring'],
    cover: 'https://picsum.photos/seed/pt4/280/160',
    description: '深入学习Java后端开发，从Spring基础到Spring Cloud微服务架构，成为合格的Java后端工程师。',
    goals: ['掌握Spring Boot开发', '深入理解Spring Cloud微服务', '熟练使用Redis缓存', '学会Docker容器化部署'],
    techStack: ['Java', 'Spring Boot', 'Spring Cloud', 'MySQL', 'Redis', 'Docker', 'K8S']
  },
  {
    id: 5,
    title: '21天英语四级速通',
    days: 21,
    difficulty: '简单',
    tags: ['英语', '四级'],
    cover: 'https://picsum.photos/seed/pt5/280/160',
    description: '针对大学英语四级考试的系统复习计划，涵盖听力、阅读、写作、翻译四大模块的技巧训练。',
    goals: ['掌握四级核心词汇2500+', '熟悉四级题型技巧', '提升听力理解能力', '完成6套真题练习'],
    techStack: ['词汇记忆法', '听力技巧', '阅读理解', '写作模板']
  },
  {
    id: 6,
    title: '60天算法与数据结构',
    days: 60,
    difficulty: '困难',
    tags: ['算法', 'LeetCode'],
    cover: 'https://picsum.photos/seed/pt6/280/160',
    description: '系统学习常用算法和数据结构，通过LeetCode刷题提升编程能力和面试技巧。',
    goals: ['掌握10种常用数据结构', '熟练运用20种算法思想', '完成200道LeetCode题目', '具备算法面试能力'],
    techStack: ['数组', '链表', '树', '图', '动态规划', '回溯', '分治']
  },
  {
    id: 7,
    title: '30天React从入门到项目',
    days: 30,
    difficulty: '中等',
    tags: ['React', 'TypeScript'],
    cover: 'https://picsum.photos/seed/pt7/280/160',
    description: '学习React核心概念和Hooks，通过多个实战项目掌握现代前端工程化开发。',
    goals: ['掌握React核心原理', '熟练使用React Hooks', '学会TypeScript类型系统', '完成2个React项目'],
    techStack: ['React', 'Hooks', 'TypeScript', 'Redux', 'Vite']
  },
  {
    id: 8,
    title: '45天机器学习入门',
    days: 45,
    difficulty: '困难',
    tags: ['ML', 'Python'],
    cover: 'https://picsum.photos/seed/pt8/280/160',
    description: '从数学基础开始，系统学习机器学习核心算法，包括监督学习和无监督学习。',
    goals: ['掌握机器学习数学基础', '熟练使用Scikit-Learn', '理解主要机器学习算法原理', '完成3个实战项目'],
    techStack: ['Python', 'NumPy', 'Pandas', 'Scikit-Learn', 'TensorFlow']
  },
  {
    id: 9,
    title: '14天Docker/K8s容器化',
    days: 14,
    difficulty: '中等',
    tags: ['Docker', 'DevOps'],
    cover: 'https://picsum.photos/seed/pt9/280/160',
    description: '快速掌握Docker容器技术和Kubernetes编排，完成企业级应用的容器化部署。',
    goals: ['熟练使用Docker命令', '掌握Dockerfile编写', '学会K8s集群管理', '完成CI/CD集成'],
    techStack: ['Docker', 'Kubernetes', 'Helm', 'CI/CD', 'Jenkins']
  },
  {
    id: 10,
    title: '30天Go语言并发编程',
    days: 30,
    difficulty: '中等',
    tags: ['Go', '并发'],
    cover: 'https://picsum.photos/seed/pt10/280/160',
    description: '深入学习Go语言核心特性，掌握Goroutine、Channel等并发编程技能。',
    goals: ['掌握Go语言基础', '熟练使用Goroutine', '理解Channel通信机制', '完成并发项目实战'],
    techStack: ['Go', 'Goroutine', 'Channel', 'Context', 'Sync']
  },
]);

// 显示模板详情
const showTemplateDetail = (tmpl) => {
  selectedTemplate.value = tmpl;
  showTemplateModal.value = true;
};

// 关闭模板弹窗
const closeTemplateModal = () => {
  showTemplateModal.value = false;
  selectedTemplate.value = null;
};

// ========== 降级方案：本地生成学习路径（当AI API不可用时使用）==========
const generateDegradedPath = (template) => {
  const goalText = template.title;
  const days = template.days || 30;
  const difficulty = template.difficulty === '困难' ? 'hard' : template.difficulty === '中等' ? 'medium' : 'easy';
  
  // 根据模板类型生成不同的学习阶段内容
  const stageGenerators = {
    js: () => [
      { title: 'JavaScript基础语法', duration: `${Math.ceil(days*0.2)}分钟`, status: 'completed', content: [
        { topic: '变量与数据类型', items: ['let/const/var区别', '基本数据类型', '类型转换'] },
        { topic: '运算符与表达式', items: ['算术运算符', '比较运算符', '逻辑运算符', '赋值运算符'] },
        { topic: '流程控制', items: ['if/else条件判断', 'switch语句', 'for/while循环', 'break/continue'] },
      ]},
      { title: 'JavaScript核心', duration: `${Math.ceil(days*0.25)}分钟`, status: 'in_progress', content: [
        { topic: '函数进阶', items: ['箭头函数', '默认参数', '解构赋值', '展开运算符'] },
        { topic: '对象与数组方法', items: ['map/filter/reduce', 'Object.keys/values', '数组去重与排序'] },
        { topic: '异步编程', items: ['Promise基础', 'async/await', 'fetch API请求', '错误处理'] },
      ]},
      { title: 'DOM操作实战', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: 'DOM选择与操作', items: ['querySelector系列', '元素创建与插入', '事件绑定与委托'] },
        { topic: '事件处理', items: ['鼠标事件', '键盘事件', '表单事件', '自定义事件'] },
        { topic: '实战项目', items: ['Todo List应用', '轮播图组件', '表单验证器'] },
      ]},
      { title: 'ES6+高级特性', duration: `${Math.ceil(days*0.3)}分钟`, status: 'pending', content: [
        { topic: '模块化', items: ['import/export', '动态导入', '模块打包概念'] },
        { topic: '类与继承', items: ['class定义', 'extends继承', 'getter/setter', '静态方法'] },
        { topic: '新特性实践', items: ['可选链操作符', '空值合并', 'Proxy与Reflect', 'Iterator协议'] },
      ]},
    ],
    python: () => [
      { title: 'Python基础入门', duration: `${Math.ceil(days*0.25)}分钟`, status: 'completed', content: [
        { topic: '环境搭建', items: ['Python安装与配置', 'VS Code开发环境', 'pip包管理器', '虚拟环境venv'] },
        { topic: '基础语法', items: ['变量与数据类型', '字符串操作', '输入输出', '注释规范'] },
        { topic: '控制结构', items: ['if/elif/else', 'for循环遍历', 'while循环', '异常处理try/except'] },
      ]},
      { title: '数据结构与算法', duration: `${Math.ceil(days*0.25)}分钟`, status: 'in_progress', content: [
        { topic: '内置数据结构', items: ['列表list操作', '元组tuple', '字典dict', '集合set'] },
        { topic: '常用算法', items: ['排序算法实现', '查找算法', '递归思想', '时间复杂度分析'] },
        { topic: '函数式编程', items: ['lambda表达式', 'map/filter/reduce', '列表推导式', '生成器yield'] },
      ]},
      { title: '文件与数据处理', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '文件I/O', items: ['读写文本文件', 'CSV文件处理', 'JSON数据解析', '路径操作pathlib'] },
        { topic: '数据分析库', items: ['NumPy数组操作', 'Pandas DataFrame', 'Matplotlib绑图', '数据清洗技巧'] },
      ]},
      { title: '项目实战', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '综合应用', items: ['爬虫基础requests', '自动化脚本', 'API接口调用', '小型Web应用Flask'] },
      ]},
    ],
    java: () => [
      { title: 'Java语言基础', duration: `${Math.ceil(days*0.2)}分钟`, status: 'completed', content: [
        { topic: '开发环境', items: ['JDK安装配置', 'IDEA/Eclipse使用', '第一个Java程序', '包管理机制'] },
        { topic: '基本语法', items: ['数据类型', '运算符', '流程控制', '数组操作'] },
        { topic: '面向对象', items: ['类与对象', '构造方法', 'this关键字', '封装性'] },
      ]},
      { title: 'Java核心API', duration: `${Math.ceil(days*0.25)}分钟`, status: 'in_progress', content: [
        { topic: '集合框架', items: ['List接口ArrayList', 'Map接口HashMap', 'Set接口HashSet', '泛型使用'] },
        { topic: '异常与IO', items: ['异常体系', '自定义异常', 'File文件操作', 'IO流体系'] },
        { topic: '多线程', items: ['Thread创建', 'Runnable接口', '同步synchronized', '线程池'] },
      ]},
      { title: 'Spring框架入门', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: 'Spring Core', items: ['IOC容器理解', '依赖注入DI', 'Bean作用域', 'AOP切面编程'] },
        { topic: 'Spring MVC', items: ['Controller层', 'RESTful接口', '请求参数绑定', '拦截器Filter'] },
        { topic: 'MyBatis', items: ['Mapper接口', 'SQL映射', '动态SQL', '关联查询'] },
      ]},
      { title: '微服务架构', duration: `${Math.ceil(days*0.3)}分钟`, status: 'pending', content: [
        { topic: 'Spring Boot', items: ['自动配置原理', 'Starter依赖', '配置文件YAML', 'Actuator监控'] },
        { topic: '中间件', items: ['Redis缓存集成', 'RabbitMQ消息队列', 'Eureka注册中心'] },
      ]},
    ],
    vue: () => [
      { title: 'Vue3基础核心', duration: `${Math.ceil(days*0.2)}分钟`, status: 'completed', content: [
        { topic: '响应式系统', items: ['ref/reactive', 'computed计算属性', 'watch/watchEffect监听', '生命周期钩子'] },
        { topic: '组件化', items: ['单文件组件SFC', 'Props传递数据', 'Emits事件通信', 'Slot插槽'] },
        { topic: '指令与模板', items: ['v-if/v-show', 'v-for列表渲染', 'v-model双向绑定', '内置组件Transition'] },
      ]},
      { title: 'Vue Router + Pinia', duration: `${Math.ceil(days*0.25)}分钟`, status: 'in_progress', content: [
        { topic: '路由管理', items: ['路由配置模式', '嵌套路由', '路由守卫导航', '动态路由匹配'] },
        { topic: '状态管理', items: ['Pinia Store定义', 'State/Getter/Action', '模块化组织', '持久化插件'] },
        { topic: '组合式API', items: ['setup()函数', '<script setup>语法糖', 'Composables复用逻辑', 'provide/inject'] },
      ]},
      { title: '工程化与工具链', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '构建工具', items: ['Vite快速开发', '环境变量配置', '代码分割策略', '构建优化'] },
        { topic: 'TypeScript集成', items: ['类型定义', '泛型使用', '组件类型标注', 'API类型安全'] },
        { topic: '测试', items: ['Vitest单元测试', 'Cypress E2E测试', '组件测试写法'] },
      ]},
      { title: '全栈项目实战', duration: `${Math.ceil(days*0.3)}分钟`, status: 'pending', content: [
        { topic: 'Node.js后端', items: ['Express/Koa基础', 'MongoDB操作', 'JWT认证鉴权', 'RESTful设计'] },
        { topic: '部署运维', items: ['Nginx反向代理', 'Docker容器化', 'CI/CD流水线', '性能优化'] },
      ]},
    ],
    react: () => [
      { title: 'React核心基础', duration: `${Math.ceil(days*0.25)}分钟`, status: 'completed', content: [
        { topic: 'JSX与组件', items: ['JSX语法规则', '函数式组件', 'Props传递', '条件渲染与列表渲染'] },
        { topic: 'Hooks核心', items: ['useState状态管理', 'useEffect副作用', 'useContext上下文', '自定义Hook封装'] },
        { topic: '事件处理', items: ['合成事件对象', '事件绑定方式', '表单受控与非受控'] },
      ]},
      { title: 'React生态体系', duration: `${Math.ceil(days*0.3)}分钟`, status: 'in_progress', content: [
        { topic: '路由与状态', items: ['React Router v6', 'Redux Toolkit', 'Zustand轻量状态', 'React Query服务端状态'] },
        { topic: 'UI框架', items: ['Ant Design', 'MUI/Material UI', 'Tailwind CSS集成', '组件库定制'] },
        { topic: 'TypeScript', items: ['FC类型定义', '泛型组件', 'Props类型约束'] },
      ]},
      { title: '进阶与实践', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '性能优化', items: ['memo/useMemo/useCallback', '虚拟列表', '代码分割懒加载', 'React DevTools调试'] },
        { topic: '服务端渲染', items: ['Next.js App Router', 'SSR vs SSG', 'Server Components'] },
      ]},
      { title: '项目实战', duration: `${Math.ceil(days*0.2)}分钟`, status: 'pending', content: [
        { topic: '全栈开发', items: ['Next.js全栈项目', 'Prisma ORM', '认证授权NextAuth'] },
      ]},
    ],
    go: () => [
      { title: 'Go语言基础', duration: `${Math.ceil(days*0.25)}分钟`, status: 'completed', content: [
        { topic: '环境与语法', items: ['Go安装与GOPATH', '变量声明', '基本数据类型', '指针理解'] },
        { topic: '流程控制', items: ['if/switch', 'for循环唯一形式', 'defer延迟调用', 'panic/recover'] },
        { topic: '复合类型', items: ['Array与Slice', 'Map字典', 'struct结构体', 'type别名'] },
      ]},
      { title: '并发编程核心', duration: `${Math.ceil(days*0.35)}分钟`, status: 'in_progress', content: [
        { topic: 'Goroutine协程', items: ['go关键字启动', '并发模型', '调度器GMP', '内存管理'] },
        { topic: 'Channel通道', items: ['无缓冲/有缓冲通道', 'select多路复用', '关闭与遍历', '管道模式'] },
        { topic: '同步原语', items: ['sync.Mutex互斥锁', 'sync.WaitGroup等待组', 'sync.Once单次执行', 'atomic原子操作'] },
      ]},
      { title: '标准库与工程', duration: `${Math.ceil(days*0.2)}分钟`, status: 'pending', content: [
        { topic: '网络编程', items: ['net/http服务器', 'JSON处理encoding/json', 'template模板引擎'] },
        { topic: '工程化', items: ['go mod依赖管理', '项目目录规范', '单元测试testing', '基准测试benchmark'] },
      ]},
      { title: '微服务实战', duration: `${Math.ceil(days*0.2)}分钟`, status: 'pending', content: [
        { topic: 'Web框架', items: ['Gin框架', 'Echo框架', '中间件设计', '参数校验'] },
        { topic: '云原生', items: ['gRPC通信', 'Protobuf定义', 'Docker多阶段构建'] },
      ]},
    ],
    algorithm: () => [
      { title: '数据结构基础', duration: `${Math.ceil(days*0.25)}分钟`, status: 'completed', content: [
        { topic: '线性结构', items: ['数组与动态数组', '链表(单向/双向)', '栈与队列', '双端队列Deque'] },
        { topic: '树形结构', items: ['二叉树遍历', 'BST搜索树', 'AVL平衡树', '红黑树概念'] },
        { topic: '图论基础', items: ['图的表示(邻接矩阵/邻接表)', 'BFS广度优先', 'DFS深度优先', '最短路径Dijkstra'] },
      ]},
      { title: '基础算法', duration: `${Math.ceil(days*0.3)}分钟`, status: 'in_progress', content: [
        { topic: '排序算法', items: ['冒泡排序O(n²)', '快速排序O(nlogn)', '归并排序稳定排序', '堆排序'] },
        { topic: '搜索算法', items: ['二分查找', '哈希查找', 'DFS回溯法', '贪心算法'] },
        { topic: '动态规划', items: ['背包问题', '最长公共子序列', '编辑距离', '状态转移方程设计'] },
      ]},
      { title: '高频面试题', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: 'LeetCode Hot', items: ['两数之和', '合并K个有序链表', 'LRU缓存', '三数之和'] },
        { topic: '设计题', items: ['LRU Cache实现', '最小栈', '迭代器设计', 'LFU缓存'] },
      ]},
      { title: '刷题方法论', duration: `${Math.ceil(days*0.2)}分钟`, status: 'pending', content: [
        { topic: '刷题策略', items: ['按分类刷题', '一题多解', '总结解题模板', '模拟面试环境'] },
      ]},
    ],
    english: () => [
      { title: '词汇积累', duration: `${Math.ceil(days*0.3)}分钟`, status: 'completed', content: [
        { topic: '核心词汇', items: ['四级必考词2000+', '高频短语500个', '词根词缀记忆法', '同义词替换'] },
        { topic: '记忆技巧', items: ['艾宾浩斯遗忘曲线', '间隔重复法', '语境记忆', '联想记忆'] },
      ]},
      { title: '听力训练', duration: `${Math.ceil(days*0.25)}分钟`, status: 'in_progress', content: [
        { topic: '听力技巧', items: ['预读选项', '抓关键词', '数字时间速记', '长对话策略'] },
        { topic: '练习材料', items: ['VOA慢速英语', 'BBC六分钟', '历年真题听力', '美剧跟读模仿'] },
      ]},
      { title: '阅读与写作', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '阅读理解', items: ['快速略读skimming', '精读扫描scanning', '长难句拆解', '主旨大意定位'] },
        { topic: '写作模板', items: ['议论文框架', '图表作文模板', '书信格式', '万能句型积累'] },
      ]},
      { title: '翻译与完型', duration: `${Math.ceil(days*0.2)}分钟`, status: 'pending', content: [
        { topic: '翻译技巧', items: ['英译汉定语从句', '汉译英句式转换', '增译减译法', '真题翻译练习'] },
        { topic: '完型填空', items: ['上下文逻辑', '固定搭配', '词义辨析', '语法考点'] },
      ]},
    ],
    docker: () => [
      { title: 'Docker基础', duration: `${Math.ceil(days*0.4)}分钟`, status: 'completed', content: [
        { topic: '核心概念', items: ['镜像Image', '容器Container', '仓库Registry', 'Dockerfile编写'] },
        { topic: '常用命令', items: ['run/build/push/pull', 'exec进入容器', 'logs查看日志', '网络与存储卷'] },
        { topic: '镜像优化', items: ['多阶段构建', 'Alpine精简镜像', '.dockerignore', '安全最佳实践'] },
      ]},
      { title: 'Kubernetes入门', duration: `${Math.ceil(days*0.35)}分钟`, status: 'in_progress', content: [
        { topic: '核心资源', items: ['Pod Deployment Service', 'ConfigMap Secret', 'Ingress入口', 'PV/PVC存储'] },
        { topic: '集群管理', items: ['kubectl命令行', 'YAML清单编写', '滚动更新回滚', 'HPA自动扩缩容'] },
      ]},
      { title: 'CI/CD实战', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '流水线', items: ['Jenkins Pipeline', 'GitHub Actions', 'GitLab CI', 'Argo CD GitOps'] },
        { topic: '监控告警', items: ['Prometheus指标', 'Grafana面板', '日志收集ELK'] },
      ]},
    ],
    ml: () => [
      { title: '数学基础', duration: `${Math.ceil(days*0.25)}分钟`, status: 'completed', content: [
        { topic: '线性代数', items: ['向量与矩阵运算', '特征值分解', 'SVD奇异值分解'] },
        { topic: '概率统计', items: ['概率分布', '贝叶斯定理', '期望方差', '假设检验'] },
        { topic: '微积分', items: ['梯度与偏导', '链式法则', '优化基础'] },
      ]},
      { title: '机器学习核心', duration: `${Math.ceil(days*0.35)}分钟`, status: 'in_progress', content: [
        { topic: '监督学习', items: ['线性回归', '逻辑回归', '决策树', '随机森林', 'SVM支持向量机'] },
        { topic: '无监督学习', items: ['K-means聚类', 'PCA降维', 'DBSCAN密度聚类', '关联规则'] },
        { topic: '深度学习', items: ['神经网络基础', 'CNN卷积神经网络', 'RNN/LSTM序列模型', 'Transformer注意力机制'] },
      ]},
      { title: '实战项目', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: 'NLP自然语言', items: ['文本分类', '情感分析', '命名实体识别', '大模型应用'] },
        { topic: '计算机视觉', items: ['图像分类', '目标检测YOLO', '图像分割', '风格迁移'] },
      ]},
      { title: '工程落地', duration: `${Math.ceil(days*0.15)}分钟`, status: 'pending', content: [
        { topic: 'MLOps', items: ['模型评估指标', '交叉验证', '超参数调优GridSearch', 'ONNX模型导出'] },
      ]},
    ],
    default: () => [
      { title: '第一阶段：基础入门', duration: `${Math.ceil(days*0.3)}分钟`, status: 'completed', content: [
        { topic: '基础知识', items: ['环境搭建与配置', '核心概念理解', '基本语法掌握', 'Hello World项目'] },
        { topic: '学习方法', items: ['官方文档阅读', '视频教程跟进', '动手实践练习', '笔记整理归纳'] },
      ]},
      { title: '第二阶段：核心技能', duration: `${Math.ceil(days*0.3)}分钟`, status: 'in_progress', content: [
        { topic: '深入理解', items: ['核心原理剖析', '常见问题排查', '最佳实践总结', '性能初步优化'] },
        { topic: '实战练习', items: ['小项目练手', '案例分析与模仿', '代码审查习惯', '技术博客输出'] },
      ]},
      { title: '第三阶段：进阶提升', duration: `${Math.ceil(days*0.25)}分钟`, status: 'pending', content: [
        { topic: '高级特性', items: ['设计模式应用', '架构思维培养', '源码级理解', '性能深度优化'] },
        { topic: '工程能力', items: ['团队协作开发', 'CI/CD流水线', '测试驱动开发', '文档编写规范'] },
      ]},
      { title: '第四阶段：综合实战', duration: `${Math.ceil(days*0.15)}分钟`, status: 'pending', content: [
        { topic: '完整项目', items: ['需求分析到上线', '技术选型决策', '难点攻关解决', '复盘总结经验'] },
      ]},
    ],
  };

  // 根据模板标签选择对应的阶段生成器
  let generator = stageGenerators.default;
  const tagLower = (template.tags?.join(',') + template.title).toLowerCase();
  if (tagLower.includes('javascript') || tagLower.includes('js') || tagLower.includes('前端') || tagLower.includes('dom')) {
    generator = stageGenerators.js;
  } else if (tagLower.includes('python') || tagLower.includes('pandas')) {
    generator = stageGenerators.python;
  } else if (tagLower.includes('java') || tagLower.includes('spring')) {
    generator = stageGenerators.java;
  } else if (tagLower.includes('vue') || tagLower.includes('vue3')) {
    generator = stageGenerators.vue;
  } else if (tagLower.includes('react')) {
    generator = stageGenerators.react;
  } else if (tagLower.includes('go') || tagLower.includes('golang')) {
    generator = stageGenerators.go;
  } else if (tagLower.includes('算法') || tagLower.includes('leetcode') || tagLower.includes('数据结构')) {
    generator = stageGenerators.algorithm;
  } else if (tagLower.includes('英语') || tagLower.includes('四级') || tagLower.includes('六级') || tagLower.includes('cet')) {
    generator = stageGenerators.english;
  } else if (tagLower.includes('docker') || tagLower.includes('k8s') || tagLower.includes('kubernetes') || tagLower.includes('devops')) {
    generator = stageGenerators.docker;
  } else if (tagLower.includes('机器学习') || tagLower.includes('ml') || tagLower.includes('ai') || tagLower.includes('tensor')) {
    generator = stageGenerators.ml;
  }

  const stages = generator();

  return {
    goal: goalText,
    totalDays: days,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
    intensity: difficulty,
    summary: `基于「${goalText}」为您生成的${days}天学习计划，共${stages.length}个阶段。涵盖${template.techStack ? template.techStack.slice(0, 5).join('、') : '核心技术栈'}等核心知识点。`,
    isStreaming: false,
    isCached: true,
    isDegraded: true, // 标记为降级方案
    stages: stages.map((stage, idx) => ({
      ...stage,
      order: idx + 1,
      startDate: dayjs().add(Math.floor(days * idx / stages.length), 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(Math.floor(days * (idx + 1) / stages.length), 'day').format('YYYY-MM-DD'),
      progress: stage.status === 'completed' ? 100 : stage.status === 'in_progress' ? 50 : 0,
    })),
  };
};

// 使用模板生成 - 先尝试调API，失败则用降级方案
const useTemplate = async () => {
  if (!selectedTemplate.value) return;

  closeTemplateModal();

  const tmpl = selectedTemplate.value;

  // 设置表单值
  const goalText = tmpl.title;
  intensity.value = tmpl.difficulty === '困难' ? 'hard' : tmpl.difficulty === '中等' ? 'medium' : 'easy';
  
  if (formRef.value) {
    formRef.value.goal = goalText;
    formRef.value.days = tmpl.days;
  }

  isLoading.value = true;
  errorMsg.value = '';
  
  // 显示加载中的路径
  learningPath.value = {
    goal: goalText,
    totalDays: tmpl.days,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(tmpl.days, 'day').format('YYYY-MM-DD'),
    intensity: intensity.value,
    stages: [],
    summary: '正在连接AI服务生成个性化学习路径...',
    isStreaming: true,
    isCached: false,
  };

  try {
    // 尝试调用 AI API 生成
    LearningPathLogger.logGenerateStart({
      goal: goalText,
      days: tmpl.days,
      intensity: tmpl.difficulty.toLowerCase(),
    });

    const finalResult = await generateLearningPathByAi(
      goalText,
      tmpl.days,
      tmpl.difficulty === '困难' ? 'hard' : tmpl.difficulty === '中等' ? 'medium' : 'easy',
      progress => {
        learningPath.value = {
          ...learningPath.value,
          ...progress,
        };
      }
    );

    // API 成功 - 使用 AI 生成的结果
    learningPath.value = {
      ...finalResult,
      isStreaming: false,
      isDegraded: false,
    };

    await fetchMembershipInfo();
  } catch (apiError) {
    console.warn('[学习路径] AI API 调用失败，使用降级方案:', apiError.message);
    
    // API 失败 - 使用本地降级方案
    const degradedPath = generateDegradedPath(tmpl);
    learningPath.value = degradedPath;
    
    LearningPathLogger.logGenerateError({
      goal: goalText,
      days: tmpl.days,
      error: `API失败，已切换降级方案: ${apiError.message}`,
    });
  } finally {
    isLoading.value = false;
  }
  
  // 滚动到结果区域
  setTimeout(() => {
    document.querySelector('.learning-path-display')?.scrollIntoView({ behavior: 'smooth' });
  }, 300);
};

// 处理表单状态更新
const handleFormStateUpdate = (formState) => {
  updateFormState(formState.goal, formState.days);
};

const handleGenerate = async formData => {
  isFormTouched.value = true;
  if (!isFormValid.value) return;

  if (isAtLimit.value) {
    errorMsg.value = `您已达到今日生成次数上限（${membershipInfo.value.dailyGenerationLimit}次），升级会员可解锁更多次数`;
    return;
  }

  LearningPathLogger.logGenerateStart({
    goal: formData.goal,
    days: formData.days,
    intensity: formData.intensity,
  });

  isLoading.value = true;
  errorMsg.value = '';
  intensity.value = formData.intensity;

  learningPath.value = {
    goal: formData.goal,
    totalDays: formData.days,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(formData.days, 'day').format('YYYY-MM-DD'),
    intensity: formData.intensity,
    stages: [],
    summary: '正在发起AI请求...',
    isStreaming: true,
    isCached: false,
  };

  try {
    const startTime = Date.now();

    const finalResult = await generateLearningPathByAi(
      formData.goal,
      formData.days,
      formData.intensity,
      progress => {
        learningPath.value = {
          ...learningPath.value,
          ...progress,
          intensity: formData.intensity,
          startDate: progress.startDate || dayjs().format('YYYY-MM-DD'),
          endDate: progress.endDate || dayjs().add(formData.days, 'day').format('YYYY-MM-DD'),
        };
      }
    );

    const endTime = Date.now();
    LearningPathLogger.logGenerateSuccess({
      goal: formData.goal,
      days: formData.days,
      stageCount: finalResult.stages?.length || 0,
      elapsedTime: endTime - startTime,
    });

    learningPath.value = {
      ...learningPath.value,
      ...finalResult,
      isStreaming: false,
      intensity: formData.intensity,
    };

    await fetchMembershipInfo();
  } catch (error) {
    LearningPathLogger.logGenerateError({
      goal: formData.goal,
      days: formData.days,
      error: error.message,
    });

    errorMsg.value = error.message;
    learningPath.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchMembershipInfo();

  const queryGoal = route.query.goal;
  const queryDays = route.query.days;

  if (queryGoal && formRef.value) {
    formRef.value.goal = queryGoal;
  }

  if (queryDays && formRef.value) {
    formRef.value.days = parseInt(queryDays);
  }
});
</script>

<style scoped>
.learning-path-generate {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

.learning-path-generate::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(114, 9, 183, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(247, 37, 133, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.v-enter-active,
.v-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary {
  background-color: #42b983;
  color: white;
}
</style>
