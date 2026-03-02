<template>
  <div class="user-profile-page">
    <div class="container mx-auto px-4 py-8">
      <!-- 博主个人信息头部 -->
      <div class="glass-card p-8 mb-8">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            :src="userData.avatar"
            alt="博主头像"
            class="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
          />
          <div class="flex-grow">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h1 class="text-2xl font-bold text-white">
                  {{ userData.name }}
                </h1>
                <p class="text-gray-400 mt-1">@{{ userData.username }}</p>
              </div>
              <button class="mt-4 md:mt-0 btn-primary px-6 py-2">
                <i class="fa fa-plus mr-1" /> 关注
              </button>
            </div>
            <p class="text-gray-300 mb-4">
              {{ userData.bio }}
            </p>
            <div class="flex space-x-8">
              <div>
                <span class="font-bold text-white">{{ userData.followers }}</span>
                <span class="text-gray-400 ml-1">粉丝</span>
              </div>
              <div>
                <span class="font-bold text-white">{{ userData.following }}</span>
                <span class="text-gray-400 ml-1">关注</span>
              </div>
              <div>
                <span class="font-bold text-white">{{ userData.tweetsCount }}</span>
                <span class="text-gray-400 ml-1">推文</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- 内容部分 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧边栏：博主信息 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 博主领域 -->
          <div class="glass-card">
            <div class="p-6">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center">
                <i class="fa fa-briefcase mr-2 text-tech-blue" /> 专业领域
              </h2>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(field, index) in userData.fields"
                  :key="index"
                  class="px-3 py-1 bg-tech-blue/20 text-tech-blue rounded-full text-sm border border-tech-blue/30"
                >
                  {{ field }}
                </span>
              </div>
            </div>
          </div>

          <!-- 学习成就 -->
          <div class="glass-card">
            <div class="p-6">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center">
                <i class="fa fa-trophy mr-2 text-tech-blue" /> 学习成就
              </h2>
              <div class="space-y-3">
                <div class="flex items-center">
                  <i class="fa fa-certificate text-tech-blue text-xl mr-3" />
                  <div>
                    <p class="font-medium text-white">
                      {{ userData.achievements.certificates }}
                    </p>
                    <p class="text-sm text-gray-400">获得证书</p>
                  </div>
                </div>
                <div class="flex items-center">
                  <i class="fa fa-book text-tech-blue text-xl mr-3" />
                  <div>
                    <p class="font-medium text-white">
                      {{ userData.achievements.courses }}
                    </p>
                    <p class="text-sm text-gray-400">完成课程</p>
                  </div>
                </div>
                <div class="flex items-center">
                  <i class="fa fa-users text-tech-blue text-xl mr-3" />
                  <div>
                    <p class="font-medium text-white">
                      {{ userData.achievements.followers }}
                    </p>
                    <p class="text-sm text-gray-400">影响力</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：博主发布的推文 -->
        <div class="lg:col-span-2">
          <div class="glass-card">
            <div class="p-6">
              <h2 class="text-xl font-bold text-white mb-6 flex items-center">
                <i class="fa fa-comment mr-2 text-tech-blue" /> 发布的推文
              </h2>
              <div class="space-y-6">
                <TweetCard v-for="tweet in userData.tweets" :key="tweet.id" :tweet="tweet" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import TweetCard from '@/components/business/TweetCard.vue';

const route = useRoute();
const userData = ref({
  id: '1',
  name: '前端开发工程师',
  username: 'frontend_dev',
  avatar: 'https://picsum.photos/100/100?random=30',
  bio: '专注于前端开发，热爱Vue.js和React，分享前端开发经验和技术干货。',
  followers: 12580,
  following: 156,
  tweetsCount: 89,
  fields: ['前端开发', 'Vue.js', 'React', 'JavaScript'],
  achievements: {
    certificates: '高级前端开发工程师',
    courses: 24,
    followers: '1.2万+',
  },
  tweets: [],
});

// 模拟不同博主的数据
const loadUserData = () => {
  const userId = route.params.id;

  // 根据ID加载不同博主的数据
  switch (userId) {
    case '1':
      // 前端开发工程师
      userData.value = {
        id: '1',
        name: '前端开发工程师',
        username: 'frontend_dev',
        avatar: 'https://picsum.photos/100/100?random=30',
        bio: '专注于前端开发，热爱Vue.js和React，分享前端开发经验和技术干货。',
        followers: 12580,
        following: 156,
        tweetsCount: 89,
        fields: ['前端开发', 'Vue.js', 'React', 'JavaScript'],
        achievements: {
          certificates: '高级前端开发工程师',
          courses: 24,
          followers: '1.2万+',
        },
        tweets: [
          {
            id: '101',
            author: {
              name: '前端开发工程师',
              avatar: 'https://picsum.photos/100/100?random=30',
              username: 'frontend_dev',
            },
            content:
              'Vue 3 Composition API详解：如何利用ref、reactive和computed构建响应式应用。ref用于处理基本类型的响应式数据，reactive用于处理对象类型的响应式数据，而computed则用于创建派生状态。这些API提供了更灵活的方式来组织组件逻辑，特别是在复杂组件中。与Options API相比，Composition API可以更好地复用逻辑代码，并且具有更好的类型推断支持。#Vue3 #前端开发 #CompositionAPI',
            likes: 356,
            comments: 42,
            shares: 89,
            createTime: '3小时前',
          },
          {
            id: '102',
            author: {
              name: '前端开发工程师',
              avatar: 'https://picsum.photos/100/100?random=30',
              username: 'frontend_dev',
            },
            content:
              '前端性能优化的几个关键点：1. 减少HTTP请求：合并CSS和JavaScript文件，使用CSS Sprites，延迟加载不必要的资源。2. 优化资源加载：使用CDN，启用缓存，压缩图片和文件。3. 代码优化：减少DOM操作，避免使用eval，优化循环和条件判断。4. 渲染优化：使用虚拟DOM，减少重排和重绘，使用CSS动画代替JavaScript动画。5. 网络优化：使用HTTP/2，启用GZIP压缩，减少Cookie大小。#前端性能 #优化技巧 #WebPerformance',
            likes: 218,
            comments: 31,
            shares: 56,
            createTime: '1天前',
          },
          {
            id: '103',
            author: {
              name: '前端开发工程师',
              avatar: 'https://picsum.photos/100/100?random=30',
              username: 'frontend_dev',
            },
            content:
              'TypeScript入门教程：为什么要使用TypeScript？TypeScript是JavaScript的超集，提供了类型系统和面向对象编程的特性，可以帮助开发人员在编码阶段发现潜在的错误，提高代码的可维护性和可读性。如何定义类型、接口和泛型？类型注解可以为变量、函数参数和返回值指定类型；接口可以定义对象的结构；泛型可以创建可重用的组件。TypeScript在React和Vue项目中的应用越来越广泛，许多大型项目都采用了TypeScript来提高开发效率和代码质量。#TypeScript #前端开发 #类型系统',
            likes: 423,
            comments: 57,
            shares: 128,
            createTime: '2天前',
          },
          {
            id: '104',
            author: {
              name: '前端开发工程师',
              avatar: 'https://picsum.photos/100/100?random=30',
              username: 'frontend_dev',
            },
            content:
              'React Hooks深度解析：Hooks是React 16.8引入的新特性，允许在函数组件中使用状态和生命周期方法。useState用于管理组件状态，useEffect用于处理副作用，useContext用于访问上下文，useReducer用于处理复杂状态逻辑，useMemo和useCallback用于优化性能。Hooks的出现使得函数组件可以完成类组件的所有功能，并且代码更加简洁和易于理解。使用Hooks时需要注意避免在循环、条件或嵌套函数中调用Hooks，以确保Hooks的调用顺序一致。#React #Hooks #前端开发',
            likes: 589,
            comments: 78,
            shares: 167,
            createTime: '3天前',
          },
          {
            id: '105',
            author: {
              name: '前端开发工程师',
              avatar: 'https://picsum.photos/100/100?random=30',
              username: 'frontend_dev',
            },
            content:
              '响应式设计最佳实践：响应式设计是一种网页设计方法，可以使网页在不同设备上（如桌面、平板和手机）都能良好显示。关键技术包括媒体查询、弹性布局、流式网格和相对单位。在设计响应式网页时，需要考虑内容优先级，确保重要内容在小屏幕上依然可见；使用断点来适配不同屏幕尺寸；优化图片和媒体资源，以提高加载速度；测试不同设备和浏览器，确保兼容性。响应式设计已经成为现代网页设计的标准，对于提高用户体验至关重要。#响应式设计 #移动端优化 #Web设计',
            likes: 345,
            comments: 45,
            shares: 92,
            createTime: '5天前',
          },
        ],
      };
      break;
    case '2':
      // 英语学习达人
      userData.value = {
        id: '2',
        name: '英语学习达人',
        username: 'english_master',
        avatar: 'https://picsum.photos/100/100?random=31',
        bio: '专注于英语学习方法和技巧分享，帮助大家高效提高英语水平。',
        followers: 21345,
        following: 89,
        tweetsCount: 156,
        fields: ['英语学习', '四六级', '托福雅思', '口语练习'],
        achievements: {
          certificates: '英语专业八级',
          courses: 36,
          followers: '2.1万+',
        },
        tweets: [
          {
            id: '201',
            author: {
              name: '英语学习达人',
              avatar: 'https://picsum.photos/100/100?random=31',
              username: 'english_master',
            },
            content:
              '英语听力提升技巧：每天30分钟精听练习，先完整听一遍，了解大意；再逐句听写，遇到听不懂的地方反复听；最后对照原文纠正错误，重点学习发音和连读。推荐使用VOA和BBC听力材料，VOA慢速英语适合初学者，BBC标准英语适合有一定基础的学习者。此外，看英文电影和电视剧也是提高听力的好方法，可以先看带字幕的版本，逐渐过渡到无字幕版本。坚持练习，听力水平会有显著提高。#英语听力 #学习方法 #VOA',
            likes: 589,
            comments: 92,
            shares: 215,
            createTime: '4小时前',
          },
          {
            id: '202',
            author: {
              name: '英语学习达人',
              avatar: 'https://picsum.photos/100/100?random=31',
              username: 'english_master',
            },
            content:
              '英语四级写作模板分享：开头段可以使用引言法、问题法或数据法，吸引读者注意力；中间段需要有明确的主题句和支持细节，可以使用举例、对比或因果关系等论证方法；结尾段需要总结全文，重申观点。常用句型包括：In recent years, ... has become a hot topic; There are several reasons for this phenomenon; From my point of view, ... 掌握这些模板和句型可以快速提高写作分数，但也要注意灵活运用，避免生搬硬套。#英语四级 #写作技巧 #模板',
            likes: 762,
            comments: 134,
            shares: 356,
            createTime: '1天前',
          },
          {
            id: '203',
            author: {
              name: '英语学习达人',
              avatar: 'https://picsum.photos/100/100?random=31',
              username: 'english_master',
            },
            content:
              '如何高效背单词？推荐使用艾宾浩斯遗忘曲线，根据遗忘规律安排复习时间：第一次复习在学习后15-30分钟，第二次复习在学习后1天，第三次复习在学习后3天，第四次复习在学习后7天，第五次复习在学习后15天。同时结合语境记忆，将单词放在句子中学习，更容易记住单词的用法。使用单词卡片或背单词APP可以提高背单词的效率，如百词斩、扇贝单词等。每天坚持背单词，积累词汇量，英语水平会逐渐提高。#背单词 #英语学习 #艾宾浩斯',
            likes: 428,
            comments: 76,
            shares: 189,
            createTime: '3天前',
          },
          {
            id: '204',
            author: {
              name: '英语学习达人',
              avatar: 'https://picsum.photos/100/100?random=31',
              username: 'english_master',
            },
            content:
              '英语口语练习方法：每天练习口语30分钟，可以找语伴一起练习，也可以自己练习。练习内容包括日常对话、复述新闻或故事、角色扮演等。注意模仿地道的发音和语调，可以通过听录音或看视频来学习。不要害怕犯错，犯错是学习的一部分，勇敢开口说英语。此外，学习一些常用的口语表达和俚语，可以使口语更加自然流畅。坚持练习，口语水平会有明显提高。#英语口语 #练习方法 #地道表达',
            likes: 654,
            comments: 108,
            shares: 276,
            createTime: '4天前',
          },
          {
            id: '205',
            author: {
              name: '英语学习达人',
              avatar: 'https://picsum.photos/100/100?random=31',
              username: 'english_master',
            },
            content:
              '英语阅读技巧：快速阅读时，注意抓住关键词和主题句，不要逐字逐句阅读；精读时，要理解文章的细节和深层含义，学习新单词和语法结构。扩大阅读量，阅读不同类型的文章，如新闻、小说、散文等，可以提高阅读速度和理解能力。遇到不认识的单词，可以通过上下文猜测词义，不要频繁查字典，影响阅读流畅性。定期做阅读练习，提高阅读水平。#英语阅读 #技巧 #阅读量',
            likes: 512,
            comments: 87,
            shares: 203,
            createTime: '6天前',
          },
        ],
      };
      break;
    default:
      // 默认使用前端开发工程师的数据
      break;
  }
};

onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
.user-profile-page {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, var(--tech-blue), var(--tech-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 242, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 255, 0.4);
}
</style>
