<template>
  <div class="roadmap-container p-6">
    <!-- 路线图标题 -->
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-white mb-2">
        <i class="fa fa-code-branch mr-2 text-tech-blue"></i>
        开发者学习路线图
      </h2>
      <p class="text-gray-400">选择你的学习方向，获取完整的技能图谱</p>
    </div>

    <!-- 路线图类型选择 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div
        v-for="roadmap in roadmapList"
        :key="roadmap.id"
        @click="selectRoadmap(roadmap)"
        :class="[
          'p-4 rounded-xl cursor-pointer transition-all duration-300 border-2',
          selectedRoadmap?.id === roadmap.id
            ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
        ]"
      >
        <div class="text-center">
          <!-- 首字母/首文字生成图标 -->
          <div
            :style="{ backgroundColor: getAvatarColor(roadmap.name) }"
            class="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold shadow-lg"
          >
            {{ getInitials(roadmap.name) }}
          </div>
          <h3 class="font-medium text-white">{{ roadmap.name }}</h3>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <i class="fa fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
      <p class="text-gray-400">正在加载路线图...</p>
    </div>

    <!-- 路线图详情 -->
    <div v-else-if="currentRoadmap" class="roadmap-detail">
      <!-- 路线图头部 -->
      <div class="bg-gray-800/80 rounded-xl p-6 border border-gray-700 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              :style="{ backgroundColor: getAvatarColor(currentRoadmap.title) }"
              class="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
            >
              {{ getInitials(currentRoadmap.title) }}
            </div>
            <div>
              <h3 class="text-2xl font-bold text-white">{{ currentRoadmap.title }}</h3>
              <p class="text-gray-400">{{ currentRoadmap.description }}</p>
            </div>
          </div>
          <button
            @click="generateWithAI"
            class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center whitespace-nowrap"
          >
            <i class="fa fa-magic mr-2"></i>
            AI生成学习路径
          </button>
        </div>
      </div>

      <!-- 技能层级 -->
      <div class="space-y-6">
        <div
          v-for="(level, levelIndex) in currentRoadmap.levels"
          :key="levelIndex"
          class="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
        >
          <div class="flex items-center mb-4">
            <span
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold',
                levelIndex === 0 ? 'bg-green-500/20 text-green-400' :
                levelIndex === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              ]"
            >
              {{ levelIndex + 1 }}
            </span>
            <h4 class="text-xl font-bold text-white">{{ level.name }}</h4>
          </div>

          <!-- 技能标签 -->
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(skill, skillIndex) in level.skills"
              :key="skillIndex"
              class="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm border border-gray-600 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
              @click="showSkillDetail(skill, level.name)"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>

      <!-- AI生成的学习路径 -->
      <div v-if="aiLearningPath" class="mt-8">
        <h3 class="text-xl font-bold text-white mb-4">
          <i class="fa fa-magic mr-2 text-purple-400"></i>
          AI生成的学习路径
        </h3>
        <div class="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
          <div class="mb-4">
            <h4 class="text-lg font-medium text-white">{{ aiLearningPath.title }}</h4>
            <p class="text-gray-400 text-sm mt-1">{{ aiLearningPath.summary }}</p>
          </div>

          <div v-if="aiLearningPath.stages && aiLearningPath.stages.length" class="space-y-4">
            <div
              v-for="(stage, index) in aiLearningPath.stages"
              :key="index"
              class="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <div class="flex items-center mb-2">
                <span class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                  {{ stage.day }}
                </span>
                <span class="font-medium text-white">{{ stage.title }}</span>
              </div>
              <p class="text-gray-400 text-sm ml-8">{{ stage.content }}</p>
              <div v-if="stage.topics" class="flex flex-wrap gap-1 mt-2 ml-8">
                <span
                  v-for="topic in stage.topics"
                  :key="topic"
                  class="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs"
                >
                  {{ topic }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 默认提示 -->
    <div v-else class="text-center py-12 text-gray-500">
      <i class="fa fa-map text-4xl mb-4"></i>
      <p>请选择一个路线图查看详情</p>
    </div>

    <!-- 技能详情弹窗 -->
    <div v-if="showSkillModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" @click.self="closeSkillModal">
      <div class="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 border border-gray-700 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              :style="{ backgroundColor: getAvatarColor(selectedSkill?.name) }"
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            >
              {{ getInitials(selectedSkill?.name) }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">{{ selectedSkill?.name }}</h3>
              <p class="text-sm text-gray-400">{{ selectedSkill?.level }}</p>
            </div>
          </div>
          <button @click="closeSkillModal" class="text-gray-400 hover:text-white transition-colors">
            <i class="fa fa-times text-xl"></i>
          </button>
        </div>

        <div class="bg-gray-700/50 rounded-lg p-4 mb-4">
          <p class="text-gray-300">{{ selectedSkill?.description }}</p>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-400 mb-2">学习资源</h4>
          <div class="flex flex-wrap gap-2">
            <span v-for="resource in selectedSkill?.resources" :key="resource" class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
              {{ resource }}
            </span>
          </div>
        </div>

        <button
          @click="generatePathForSkill"
          class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <i class="fa fa-magic mr-2"></i>
          针对此技能生成学习路径
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  name: 'RoadmapDisplay',
  data() {
    return {
      roadmapList: [],
      selectedRoadmap: null,
      currentRoadmap: null,
      loading: false,
      aiLearningPath: null,
      showSkillModal: false,
      selectedSkill: null,
      skillDetails: {
        'HTML/CSS基础': { description: '学习HTML标签、CSS选择器、盒模型、Flexbox布局等基础知识，为前端开发打下坚实基础。', resources: ['MDN文档', 'CSS Tricks', 'B站视频教程'] },
        'JavaScript基础': { description: '掌握变量、数据类型、函数、DOM操作、事件处理等JavaScript核心概念。', resources: ['MDN JavaScript', '红宝书', '你不知道的JS'] },
        'Git版本控制': { description: '学习Git基本操作、分支管理、代码合并与冲突解决，掌握团队协作必备技能。', resources: ['Git官方文档', 'Git Pro', '廖雪峰Git教程'] },
        'DOM操作': { description: '理解DOM树结构，学会使用JavaScript操作页面元素，实现动态交互效果。', resources: ['MDN DOM', 'jQuery文档', '前端进阶'] },
        'CSS布局': { description: '掌握浮动、定位、Flexbox、Grid等布局技术，实现各种复杂页面结构。', resources: ['CSS权威指南', 'Flexboxfroggy', 'Grid Garden'] },
        '现代CSS': { description: '学习CSS变量、动画、过渡、媒体查询等现代CSS特性，提升页面表现力。', resources: ['CSS新特性', '动画库', 'Tailwind CSS'] },
        '前端框架(React/Vue)': { description: '掌握主流前端框架的使用，提高开发效率，构建单页应用。', resources: ['Vue3文档', 'React18', '官方教程'] },
        '状态管理': { description: '学习Vuex/Pinia/Redux等状态管理方案，管理复杂应用的数据流。', resources: ['Pinia文档', 'Redux中文网', '状态管理实战'] },
        'TypeScript': { description: '掌握TypeScript类型系统，提升代码质量和开发体验。', resources: ['TS官方文档', 'TypeScript Deep Dive'] },
        'API调用': { description: '学习fetch/axios进行网络请求，处理RESTful API接口。', resources: ['Axios文档', 'RESTful API设计'] },
        '一门编程语言': { description: '选择一门后端语言深入学习，如Java、Python、Go、Node.js等。', resources: ['Java狂神', 'Python官方', 'Go语言圣经'] },
        '数据结构基础': { description: '学习数组、链表、栈、队列、树等基础数据结构及其应用场景。', resources: ['数据结构与算法', 'LeetCode', '算法导论'] },
        '数据库基础': { description: '掌握SQL基础、数据库设计、索引优化等核心概念。', resources: ['MySQL必知必会', 'Redis设计与实现'] },
        'API设计': { description: '学习RESTful API设计原则，规范后端接口设计。', resources: ['RESTful API指南', '接口设计规范'] },
        '认证与授权': { description: '学习JWT、OAuth等身份认证机制，保障系统安全。', resources: ['JWT文档', 'OAuth2.0'] },
        '缓存': { description: '掌握Redis/Memcached等缓存技术，提升系统性能。', resources: ['Redis文档', '缓存设计原则'] },
        '消息队列': { description: '学习RabbitMQ/Kafka等消息中间件，实现系统解耦。', resources: ['RabbitMQ教程', 'Kafka权威指南'] },
        '微服务': { description: '理解微服务架构思想，学习服务拆分与治理。', resources: ['微服务设计', 'Spring Cloud'] },
        '容器化': { description: '掌握Docker容器技术，实现应用标准化部署。', resources: ['Docker官方文档', '容器化实战'] },
        'Linux基础': { description: '学习Linux命令行、系统管理、Shell脚本编写。', resources: ['鸟哥的Linux私房菜', 'Linux命令大全'] },
        'Shell脚本': { description: '掌握Bash脚本编写，自动化运维任务。', resources: ['Linux Shell脚本攻略'] },
        '网络基础': { description: '理解TCP/IP协议、HTTP/HTTPS、DNS等网络基础知识。', resources: ['TCP/IP详解', '网络是怎么连接的'] },
        'Docker基础': { description: '学习Docker镜像、容器、数据卷、网络等核心概念。', resources: ['Docker实战', 'Docker三剑客'] },
        'Kubernetes': { description: '掌握K8s集群管理、Pods、Services、Deployments等。', resources: ['K8s官方文档', 'Kubernetes权威指南'] },
        'CI/CD': { description: '学习持续集成与持续部署，自动化构建发布流程。', resources: ['Jenkins', 'GitHub Actions'] },
        '监控与日志': { description: '掌握ELK、Grafana等监控日志系统，及时发现问题。', resources: ['ELK Stack', 'Prometheus'] },
        'Python基础语法': { description: '学习Python基本语法、数据类型、控制结构等入门知识。', resources: ['Python官方教程', '简明Python教程'] },
        '数据结构': { description: '掌握Python列表、元组、字典、集合等内置数据结构。', resources: ['Python数据结构', 'LeetCode刷题'] },
        '函数与模块': { description: '学习函数定义、参数传递、模块导入与打包。', resources: ['Python官方文档'] },
        '文件操作': { description: '掌握Python读写文件、处理CSV/JSON等数据格式。', resources: ['Python文件操作'] },
        'OOP基础': { description: '理解面向对象编程思想，类、对象、继承、多态。', resources: ['Python面向对象'] },
        'Java基础语法': { description: '学习Java变量、数据类型、运算符、控制语句等基础语法。', resources: ['Java核心技术', 'Oracle官方文档'] },
        'OOP概念': { description: '理解面向对象三大特性：封装、继承、多态。', resources: ['设计模式', 'Java面向对象'] },
        '集合框架': { description: '掌握List、Set、Map等集合接口及实现类的使用。', resources: ['Java集合框架', '源码分析'] },
        '异常处理': { description: '学习Java异常体系、try-catch-finally、自定义异常。', resources: ['Java异常处理'] },
        'Java8新特性': { description: '掌握Lambda表达式、Stream API、Optional等新特性。', resources: ['Java8实战', 'Stream指南'] },
      }
    };
  },
  mounted() {
    this.fetchRoadmapList();
  },
  methods: {
    // 获取首字母/首文字
    getInitials(name) {
      if (!name) return '?';
      // 中文取第一个字，英文取前两个字母
      if (/[\u4e00-\u9fa5]/.test(name)) {
        return name.charAt(0);
      }
      return name.substring(0, 2).toUpperCase();
    },
    // 根据名称生成颜色
    getAvatarColor(name) {
      if (!name) return '#6366f1';
      const colors = [
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e', '#ef4444', '#f97316',
        '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1'
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    },
    async fetchRoadmapList() {
      try {
        const response = await axios.get('/api/roadmaps/list');
        if (response.data.success) {
          this.roadmapList = response.data.data;
        }
      } catch (error) {
        console.error('获取路线图列表失败:', error);
      }
    },
    async selectRoadmap(roadmap) {
      this.selectedRoadmap = roadmap;
      this.loading = true;
      this.aiLearningPath = null;

      try {
        const response = await axios.get(`/api/roadmaps/detail/${roadmap.id}`);
        if (response.data.success) {
          this.currentRoadmap = response.data.data;
        }
      } catch (error) {
        console.error('获取路线图详情失败:', error);
      } finally {
        this.loading = false;
      }
    },
    showSkillDetail(skillName, levelName) {
      this.selectedSkill = {
        name: skillName,
        level: levelName,
        description: this.skillDetails[skillName]?.description || `系统学习${skillName}相关知识，掌握核心理论和实践技能。`,
        resources: this.skillDetails[skillName]?.resources || ['官方文档', '在线教程', '实践项目']
      };
      this.showSkillModal = true;
    },
    closeSkillModal() {
      this.showSkillModal = false;
      this.selectedSkill = null;
    },
    generatePathForSkill() {
      if (!this.selectedSkill) return;
      // 跳转到学习路径生成页面
      const router = window.router || this.$router;
      if (router) {
        router.push({
          path: '/learning-path/generate',
          query: { goal: this.selectedSkill.name, days: 7 }
        });
      }
      this.closeSkillModal();
    },
    async generateWithAI() {
      if (!this.selectedRoadmap) return;

      this.loading = true;
      try {
        const response = await axios.post('/api/roadmaps/generate', {
          goal: this.selectedRoadmap.id,
          days: 7,
          intensity: 'medium',
          includeRoadmap: true
        });

        if (response.data.success) {
          this.aiLearningPath = response.data.data;
        }
      } catch (error) {
        console.error('AI生成失败:', error);
        alert('AI生成失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.roadmap-container {
  min-height: 100%;
}
</style>
