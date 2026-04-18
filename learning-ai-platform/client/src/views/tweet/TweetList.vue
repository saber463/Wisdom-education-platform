<template>
  <div class="tweet-list-container">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h2
          class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue to-tech-purple"
        >
          学习社区
        </h2>
        <router-link to="/tweets/publish" class="btn-primary">
          <i class="fa fa-pencil mr-2" /> 发布推文
        </router-link>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 推文列表 -->
        <div class="lg:col-span-2">
          <div class="glass-card">
            <div class="p-6">
              <div v-if="loading" class="flex justify-center items-center py-12">
                <div
                  class="w-12 h-12 border-4 border-gray-200 border-t-4 border-tech-blue rounded-full animate-spin"
                />
              </div>
              <div v-else-if="tweets.length === 0" class="text-center py-12 text-gray-500">
                <i class="fa fa-comments text-4xl mb-4" />
                <p>暂无推文，快来发布第一条吧！</p>
              </div>
              <div v-else>
                <TweetCard v-for="tweet in tweets" :key="tweet.id" :tweet="tweet" />
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="lg:col-span-1">
          <div class="glass-card sticky top-24">
            <div class="p-6">
              <h3 class="text-xl font-bold text-dark mb-6 flex items-center">
                <i class="fa fa-fire text-orange-500 mr-2" />热门话题
              </h3>
              <div class="space-y-3">
                <router-link
                  :to="'/topic/1'"
                  class="block px-4 py-3 bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 rounded-xl hover:from-tech-blue/20 hover:to-tech-purple/20 transition-all duration-300 border border-transparent hover:border-tech-blue/30"
                >
                  <i class="fa fa-fire text-orange-500 mr-2" /># 计算机一级考试
                </router-link>
                <router-link
                  :to="'/topic/2'"
                  class="block px-4 py-3 bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 rounded-xl hover:from-tech-blue/20 hover:to-tech-purple/20 transition-all duration-300 border border-transparent hover:border-tech-blue/30"
                >
                  <i class="fa fa-fire text-orange-500 mr-2" /># 英语四级备考
                </router-link>
                <router-link
                  :to="'/topic/3'"
                  class="block px-4 py-3 bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 rounded-xl hover:from-tech-blue/20 hover:to-tech-purple/20 transition-all duration-300 border border-transparent hover:border-tech-blue/30"
                >
                  <i class="fa fa-fire text-orange-500 mr-2" /># Vue3 实战
                </router-link>
                <router-link
                  :to="'/topic/4'"
                  class="block px-4 py-3 bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 rounded-xl hover:from-tech-blue/20 hover:to-tech-purple/20 transition-all duration-300 border border-transparent hover:border-tech-blue/30"
                >
                  <i class="fa fa-fire text-orange-500 mr-2" /># 数据分析学习
                </router-link>
                <router-link
                  :to="'/topic/5'"
                  class="block px-4 py-3 bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 rounded-xl hover:from-tech-blue/20 hover:to-tech-purple/20 transition-all duration-300 border border-transparent hover:border-tech-blue/30"
                >
                  <i class="fa fa-fire text-orange-500 mr-2" /># 前端面试技巧
                </router-link>
              </div>

              <div class="mt-8">
                <h3 class="text-xl font-bold text-dark mb-6 flex items-center">
                  <i class="fa fa-users text-tech-purple mr-2" />推荐博主
                </h3>
                <div class="space-y-4">
                  <div
                    class="flex items-center p-3 bg-gradient-to-r from-tech-blue/5 to-tech-purple/5 rounded-xl border border-white/10 hover:border-tech-blue/30 transition-all duration-300"
                  >
                    <router-link :to="'/user/1'" class="mr-3">
                      <img
                        src="https://picsum.photos/100/100?random=30"
                        alt="博主头像"
                        class="w-12 h-12 rounded-full border-2 border-tech-blue/30"
                      />
                    </router-link>
                    <div class="flex-1">
                      <router-link
                        :to="'/user/1'"
                        class="font-medium hover:text-tech-blue transition-colors"
                      >
                        前端开发工程师
                      </router-link>
                      <p class="text-gray-500 text-sm">@frontend_dev</p>
                    </div>
                    <button class="btn-secondary text-sm px-4 py-2 rounded-lg">关注</button>
                  </div>
                  <div
                    class="flex items-center p-3 bg-gradient-to-r from-tech-blue/5 to-tech-purple/5 rounded-xl border border-white/10 hover:border-tech-blue/30 transition-all duration-300"
                  >
                    <router-link :to="'/user/2'" class="mr-3">
                      <img
                        src="https://picsum.photos/100/100?random=31"
                        alt="博主头像"
                        class="w-12 h-12 rounded-full border-2 border-tech-purple/30"
                      />
                    </router-link>
                    <div class="flex-1">
                      <router-link
                        :to="'/user/2'"
                        class="font-medium hover:text-tech-purple transition-colors"
                      >
                        英语学习达人
                      </router-link>
                      <p class="text-gray-500 text-sm">@english_master</p>
                    </div>
                    <button class="btn-secondary text-sm px-4 py-2 rounded-lg">关注</button>
                  </div>
                </div>
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
import TweetCard from '@/components/business/TweetCard.vue';
import { tweetApi } from '@/utils/api';
import { useUserStore } from '@/store/user';

const tweets = ref([]);
const loading = ref(false);
const userStore = useUserStore();

const STORAGE_KEY = 'learning_tweets';
const MAX_TWEETS = 50;

const sampleTweets = [
  {
    id: 1,
    userId: '1',
    username: '前端开发工程师',
    userAvatar: 'https://picsum.photos/seed/tw1/100/100',
    content:
      '今天学习了 Vue 3 的 Composition API，感觉比 Options API 更灵活！推荐大家试试看。#Vue3 #前端开发',
    images: ['https://picsum.photos/seed/tw1img/600/350'],
    tags: ['Vue3', '前端开发'],
    likes: 128,
    comments: 32,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    category: '前端开发',
  },
  {
    id: 2,
    userId: '2',
    username: '英语学习达人',
    userAvatar: 'https://picsum.photos/seed/tw2/100/100',
    content:
      '英语四级备考小技巧：每天坚持听30分钟英语新闻，一个月后听力会有明显提升！#英语四级 #学习技巧',
    tags: ['英语四级', '学习技巧'],
    likes: 256,
    comments: 58,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    category: '英语学习',
  },
  {
    id: 3,
    userId: '3',
    username: '数据分析师',
    userAvatar: 'https://picsum.photos/seed/tw3/100/100',
    content:
      'Python 数据分析实战：使用 Pandas 处理 Excel 数据，效率提升10倍！分享一个小技巧给大家。#数据分析 #Python',
    images: ['https://picsum.photos/seed/tw3img/600/350'],
    tags: ['数据分析', 'Python'],
    likes: 189,
    comments: 41,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    category: '数据分析',
  },
  {
    id: 4,
    userId: '4',
    username: '算法爱好者',
    userAvatar: 'https://picsum.photos/seed/tw4/100/100',
    content:
      '今天刷了5道 LeetCode 困难题，感觉脑子不够用了😂 不过解题思路清晰了很多！#算法 #LeetCode',
    tags: ['算法', 'LeetCode'],
    likes: 312,
    comments: 67,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    category: '算法',
  },
  {
    id: 5,
    userId: '5',
    username: '全栈开发者',
    userAvatar: 'https://picsum.photos/seed/tw5/100/100',
    content:
      'Node.js + Express + MongoDB 搭建后端服务，性能优化心得：使用连接池、缓存和索引优化。#后端开发 #NodeJS',
    tags: ['后端开发', 'NodeJS'],
    likes: 234,
    comments: 52,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    category: '后端开发',
  },
  {
    id: 6,
    userId: '6',
    username: 'React工程师',
    userAvatar: 'https://picsum.photos/seed/tw6/100/100',
    content: 'React 18新特性深度解析：并发模式、useTransition、Suspense改进，性能优化实战。#React18 #前端',
    images: ['https://picsum.photos/seed/tw6img/600/350'],
    tags: ['React18', '前端'],
    likes: 445,
    comments: 88,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    category: '前端开发',
  },
  {
    id: 7,
    userId: '7',
    username: 'Java架构师',
    userAvatar: 'https://picsum.photos/seed/tw7/100/100',
    content: 'Spring Boot 3.x + Spring Security 6 权限管理最佳实践，JWT + Redis实现无状态认证体系。#Java #SpringBoot',
    tags: ['Java', 'SpringBoot'],
    likes: 367,
    comments: 73,
    createdAt: new Date(Date.now() - 25200000).toISOString(),
    category: '后端开发',
  },
  {
    id: 8,
    userId: '8',
    username: 'AI学习者',
    userAvatar: 'https://picsum.photos/seed/tw8/100/100',
    content: 'PyTorch训练第一个神经网络，识别手写数字准确率达到99.1%！AI入门真的不难，分享完整代码。#深度学习 #PyTorch',
    images: ['https://picsum.photos/seed/tw8img/600/350'],
    tags: ['深度学习', 'PyTorch'],
    likes: 892,
    comments: 145,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    category: 'AI/机器学习',
  },
  {
    id: 9,
    userId: '9',
    username: '产品经理转型',
    userAvatar: 'https://picsum.photos/seed/tw9/100/100',
    content: '0基础转行前端6个月的学习路径总结：HTML→CSS→JS→Vue3→项目→面试，附详细资源清单！#转行 #前端学习',
    tags: ['转行', '前端学习'],
    likes: 1256,
    comments: 234,
    createdAt: new Date(Date.now() - 32400000).toISOString(),
    category: '学习方法',
  },
  {
    id: 10,
    userId: '10',
    username: 'DevOps工程师',
    userAvatar: 'https://picsum.photos/seed/tw10/100/100',
    content: 'Kubernetes集群搭建完整教程：从单节点到多节点，配合Helm Chart一键部署微服务！#K8s #DevOps #云原生',
    images: ['https://picsum.photos/seed/tw10img/600/350'],
    tags: ['K8s', 'DevOps'],
    likes: 528,
    comments: 96,
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    category: 'DevOps',
  },
];

const initializeTweets = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    tweets.value = JSON.parse(stored);
  } else {
    tweets.value = sampleTweets;
    saveTweets();
  }
  // 按用户兴趣权重排序推文
  sortTweetsByInterest();
};

/**
 * 按用户兴趣权重排序推文
 * - 第一兴趣标签匹配的推文权重 × 3
 * - 其他兴趣标签匹配的推文权重 × 1.5
 * - 无匹配时按热度（likes）排序
 */
const sortTweetsByInterest = () => {
  const userInterests = userStore.userInfo?.learningInterests || [];

  if (userInterests.length === 0) {
    // 无兴趣数据，按热度排序
    tweets.value.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return;
  }

  const firstInterest = userInterests[0]; // 第一兴趣（最高权重）

  tweets.value.sort((a, b) => {
    const scoreA = calculateTweetScore(a, firstInterest, userInterests);
    const scoreB = calculateTweetScore(b, firstInterest, userInterests);

    // 分数相同时按热度排序
    if (scoreB === scoreA) {
      return (b.likes || 0) - (a.likes || 0);
    }
    return scoreB - scoreA;
  });
};

/**
 * 计算推文兴趣匹配分数
 */
const calculateTweetScore = (tweet, firstInterest, allInterests) => {
  let score = 0;
  const tags = tweet.tags || [];
  const category = tweet.category || '';

  // 检查是否匹配第一兴趣（最高权重 ×3）
  const isFirstMatch =
    tags.some(tag => tag.toLowerCase().includes(firstInterest.toLowerCase())) ||
    category.toLowerCase().includes(firstInterest.toLowerCase());

  if (isFirstMatch) {
    score += 3;
  }

  // 检查是否匹配其他兴趣（权重 ×1.5）
  allInterests.slice(1).forEach(interest => {
    const isMatch =
      tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
      category.toLowerCase().includes(interest.toLowerCase());
    if (isMatch) {
      score += 1.5;
    }
  });

  // 基础热度分数
  score += (tweet.likes || 0) / 100;

  return score;
};

const saveTweets = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tweets.value.slice(0, MAX_TWEETS)));
};

const fetchTweets = async () => {
  loading.value = true;
  try {
    const response = await tweetApi.getList();
    if (response.data && response.data.data && Array.isArray(response.data.data.list)) {
      tweets.value = response.data.data.list;
      saveTweets();
    } else if (response.data && Array.isArray(response.data.list)) {
      tweets.value = response.data.list;
      saveTweets();
    } else {
      initializeTweets();
    }
  } catch (error) {
    console.error('获取推文列表失败:', error);
    initializeTweets();
  } finally {
    loading.value = false;
  }
};

const fetchTweets = async () => {
  loading.value = true;
  try {
    const res = await tweetApi.getTweets({
      page: 1,
      limit: MAX_TWEETS,
      recommended: true, // 启用推荐算法
    });
    if (res.data.success) {
      tweets.value = res.data.data;
    }
  } catch (error) {
    console.error('获取推文失败，使用本地缓存:', error);
    initializeTweets();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTweets();
});  fetchTweets();
});
</script>

<style scoped>
.tweet-list-container {
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
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 255, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--tech-purple), var(--tech-pink));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(114, 9, 183, 0.3);
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(114, 9, 183, 0.5);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
