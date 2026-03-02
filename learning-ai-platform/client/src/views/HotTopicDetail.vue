<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 话题标题和元信息 -->
    <div class="glass-card p-8 mb-8">
      <div class="flex items-center mb-6">
        <i class="fa fa-fire text-orange-500 text-3xl mr-4" />
        <h1 class="text-3xl font-bold text-dark dark:text-white">
          {{ topicData.title }}
        </h1>
      </div>
      <p class="text-gray-600 dark:text-gray-300 text-lg mb-4">
        {{ topicData.description }}
      </p>
      <div class="flex items-center text-sm text-gray-500">
        <span class="mr-6"><i class="fa fa-eye mr-1" />{{ topicData.views }} 浏览</span>
        <span><i class="fa fa-comment mr-1" />{{ topicData.discussions }} 讨论</span>
      </div>
    </div>

    <!-- 话题内容部分 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 主要内容 -->
      <div class="lg:col-span-2 space-y-8">
        <!-- 热门讨论 -->
        <div class="card">
          <div class="p-6">
            <h2 class="text-xl font-bold text-dark mb-6 flex items-center">
              <i class="fa fa-comments mr-2 text-primary" /> 热门讨论
            </h2>
            <div class="space-y-6">
              <!-- 讨论项 -->
              <div
                v-for="(discussion, index) in topicData.discussionsList"
                :key="index"
                class="border-b border-gray-100 pb-6 last:border-0"
              >
                <div class="flex items-start mb-3">
                  <img
                    :src="discussion.author.avatar"
                    alt="用户头像"
                    class="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div class="flex items-center">
                      <h4 class="font-medium">
                        {{ discussion.author.name }}
                      </h4>
                      <span class="text-xs text-gray-400 ml-2">{{ discussion.createTime }}</span>
                    </div>
                    <p class="text-gray-600 mt-2">
                      {{ discussion.content }}
                    </p>
                  </div>
                </div>
                <!-- 互动按钮 -->
                <div class="flex items-center text-sm text-gray-500">
                  <button class="flex items-center mr-6 hover:text-primary transition-colors">
                    <i class="fa fa-thumbs-up mr-1" /> {{ discussion.likes }}
                  </button>
                  <button class="flex items-center mr-6 hover:text-primary transition-colors">
                    <i class="fa fa-comment-o mr-1" /> 回复
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关资源 -->
        <div class="card">
          <div class="p-6">
            <h2 class="text-xl font-bold text-dark mb-6 flex items-center">
              <i class="fa fa-book mr-2 text-primary" /> 相关学习资源
            </h2>
            <div class="space-y-4">
              <div
                v-for="(resource, index) in topicData.resources"
                :key="index"
                class="flex items-start"
              >
                <div
                  class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl mr-4"
                >
                  {{ resource.type === 'article' ? '文' : resource.type === 'video' ? '视' : '书' }}
                </div>
                <div>
                  <h3 class="font-medium hover:text-primary transition-colors cursor-pointer">
                    {{ resource.title }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ resource.description }}
                  </p>
                  <div class="text-xs text-gray-400 mt-2">
                    {{ resource.author }} | {{ resource.views }} 浏览
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 话题简介 -->
        <div class="card">
          <div class="p-6">
            <h2 class="text-lg font-bold text-dark mb-4">话题简介</h2>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-gray-500">分类：</span>
                <span class="font-medium">{{ topicData.category }}</span>
              </div>
              <div>
                <span class="text-gray-500">热度：</span>
                <span class="font-medium text-orange-500">{{ topicData.hotLevel }}</span>
              </div>
              <div>
                <span class="text-gray-500">相关标签：</span>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span
                    v-for="(tag, index) in topicData.tags"
                    :key="index"
                    class="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >#{{ tag }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关话题 -->
        <div class="card">
          <div class="p-6">
            <h2 class="text-lg font-bold text-dark mb-4">相关话题</h2>
            <div class="space-y-3">
              <div
                v-for="(relatedTopic, index) in topicData.relatedTopics"
                :key="index"
                class="flex items-center"
              >
                <i class="fa fa-fire text-orange-500 text-sm mr-2" />
                <router-link
                  :to="'/topic/' + relatedTopic.id"
                  class="hover:text-primary transition-colors truncate"
                >
                  {{ relatedTopic.title }}
                </router-link>
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

const route = useRoute();
const topicData = ref({
  title: '计算机一级考试',
  description:
    '针对计算机一级考试（MS Office）的专项讨论和学习资源分享，涵盖Windows操作、Office办公软件、网络基础等核心考点。',
  views: 12580,
  discussions: 562,
  category: '计算机等级考试',
  hotLevel: '非常热门',
  tags: ['计算机一级', 'MS Office', '考试技巧', '学习资源'],
  discussionsList: [
    {
      author: {
        name: '小明同学',
        avatar: 'https://picsum.photos/100/100?random=40',
      },
      content:
        '马上要考计算机一级了，有没有大佬分享一下Word的操作技巧？特别是邮件合并这部分不太会。',
      likes: 32,
      createTime: '2天前',
    },
    {
      author: {
        name: '学习达人',
        avatar: 'https://picsum.photos/100/100?random=41',
      },
      content: '推荐大家使用未来教育的模拟软件，里面的题型和真题很接近，多练习几次肯定能过。',
      likes: 89,
      createTime: '1周前',
    },
    {
      author: {
        name: '编程新手',
        avatar: 'https://picsum.photos/100/100?random=42',
      },
      content: 'Excel的函数部分怎么学效率最高？有没有推荐的视频教程？',
      likes: 15,
      createTime: '3天前',
    },
  ],
  resources: [
    {
      title: '计算机一级考试通关指南',
      description: '详细介绍计算机一级考试的题型、考点和复习方法',
      author: '学习助手',
      views: 5680,
      type: 'article',
    },
    {
      title: 'MS Office操作技巧大全',
      description: '视频教程，从零开始学习Word、Excel和PowerPoint',
      author: '技术导师',
      views: 8920,
      type: 'video',
    },
    {
      title: '计算机一级真题解析',
      description: '近5年真题详细解析，帮助考生了解考试趋势',
      author: '考试专家',
      views: 3450,
      type: 'book',
    },
  ],
  relatedTopics: [
    { id: '2', title: '英语四级备考' },
    { id: '3', title: '计算机二级考试' },
    { id: '4', title: 'Office办公技巧' },
  ],
});

// 根据话题ID加载不同的话题数据
const loadTopicData = () => {
  const topicId = route.params.id;

  // 根据ID模拟不同的话题数据
  switch (topicId) {
    case '1':
      topicData.value.title = '计算机一级考试';
      topicData.value.description =
        '针对计算机一级考试（MS Office）的专项讨论和学习资源分享，涵盖Windows操作、Office办公软件、网络基础等核心考点。';
      break;
    case '2':
      topicData.value.title = '英语四级备考';
      topicData.value.description =
        '分享英语四级备考经验、学习方法和考试技巧，助力考生顺利通过考试。';
      topicData.value.tags = ['英语四级', '备考技巧', '听力训练', '阅读提升'];
      topicData.value.discussionsList = [
        {
          author: {
            name: '英语学习者',
            avatar: 'https://picsum.photos/100/100?random=50',
          },
          content: '四级听力怎么提高？总是听不清楚内容。',
          likes: 45,
          createTime: '1天前',
        },
        {
          author: {
            name: '四级高分通过者',
            avatar: 'https://picsum.photos/100/100?random=51',
          },
          content:
            '建议每天听30分钟VOA慢速英语，然后逐步过渡到常速。同时，多做真题听力，熟悉考试题型和语速。听的时候可以先盲听，再看原文，最后再听一遍巩固。',
          likes: 128,
          createTime: '1天前',
        },
        {
          author: {
            name: '备考小白',
            avatar: 'https://picsum.photos/100/100?random=52',
          },
          content: '词汇量不够怎么办？背了就忘。',
          likes: 67,
          createTime: '1天前',
        },
        {
          author: {
            name: '英语老师',
            avatar: 'https://picsum.photos/100/100?random=53',
          },
          content:
            '推荐使用艾宾浩斯记忆曲线背单词，每天坚持背新单词并复习旧单词。可以结合语境背单词，比如通过句子或文章来记忆，这样记得更牢。',
          likes: 203,
          createTime: '1天前',
        },
        {
          author: {
            name: '四级冲刺中',
            avatar: 'https://picsum.photos/100/100?random=54',
          },
          content: '阅读速度太慢，做不完题目怎么办？',
          likes: 89,
          createTime: '1天前',
        },
        {
          author: {
            name: '阅读达人',
            avatar: 'https://picsum.photos/100/100?random=55',
          },
          content:
            '可以练习快速阅读技巧，比如跳读和扫读。先看题目，再带着问题找答案。平时多做限时练习，提高阅读速度和准确率。',
          likes: 156,
          createTime: '1天前',
        },
      ];
      break;
    case '3':
      topicData.value.title = 'Vue3 实战';
      topicData.value.description =
        'Vue3框架的实战应用和开发技巧分享，包括Composition API、Teleport、Suspense等新特性。';
      topicData.value.tags = ['Vue3', '前端开发', 'Composition API', '实战项目'];
      break;
    case '4':
      topicData.value.title = '数据分析学习';
      topicData.value.description =
        '数据分析入门到精通，包括Excel、Python、SQL等工具的使用和数据可视化技巧。';
      topicData.value.tags = ['数据分析', 'Python', 'Excel', '数据可视化'];
      break;
    case '5':
      topicData.value.title = '前端面试技巧';
      topicData.value.description = '前端开发面试经验分享、常见问题解析和面试准备策略。';
      topicData.value.tags = ['前端面试', '面试技巧', '算法', '项目经验'];
      break;
    default:
      // 默认使用计算机一级考试的内容
      break;
  }
};

onMounted(() => {
  loadTopicData();
});
</script>
