<template>
  <div class="page-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-text">
          EduAI
        </div>
        <div class="sidebar-logo-sub">
          智慧教育平台 V2.0
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-title">
          学习中心
        </div>
        <router-link
          to="/student/dashboard"
          class="sidebar-item"
        >
          <HomeIcon class="nav-icon" /><span>学习概览</span>
        </router-link>
        <router-link
          to="/student/courses"
          class="sidebar-item"
        >
          <BookOpenIcon class="nav-icon" /><span>课程中心</span>
        </router-link>
        <router-link
          to="/student/assignments"
          class="sidebar-item"
        >
          <DocumentTextIcon class="nav-icon" /><span>我的作业</span>
        </router-link>
        <div class="sidebar-section-title">
          工具
        </div>
        <router-link
          to="/student/code-editor"
          class="sidebar-item"
        >
          <CodeBracketIcon class="nav-icon" /><span>代码编辑器</span>
        </router-link>
        <router-link
          to="/student/community"
          class="sidebar-item active"
        >
          <FireIcon class="nav-icon" /><span>热点社区</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <header class="topbar">
        <div class="topbar-title">
          <FireIcon style="width:18px;height:18px;color:#f97316;display:inline;margin-right:6px;vertical-align:-3px" />
          AI教育热点社区
        </div>
        <div
          class="topbar-right"
          style="gap:10px"
        >
          <span
            class="badge badge-cyan"
            style="font-size:11px"
          >仅限教育·科技·编程内容 · 学习演示用途</span>
          <button
            class="btn-primary"
            style="padding:7px 16px;font-size:13px"
            @click="showPublishModal = true"
          >
            + 发布动态
          </button>
        </div>
      </header>

      <main class="page-container">
        <!-- 搜索 + 筛选 -->
        <div style="display:flex;gap:12px;margin-bottom:20px;align-items:center;flex-wrap:wrap">
          <div style="position:relative;flex:1;max-width:400px">
            <MagnifyingGlassIcon style="width:16px;height:16px;position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索教育热点、编程资讯..."
              style="width:100%;padding:9px 12px 9px 36px;border-radius:10px;border:1.5px solid rgba(148,163,184,0.3);font-size:13px;outline:none;transition:border-color 0.2s;background:#fff"
              @focus="($event.target as HTMLInputElement).style.borderColor='#06b6d4'"
              @blur="($event.target as HTMLInputElement).style.borderColor='rgba(148,163,184,0.3)'"
            >
          </div>
          <!-- 分类筛选 -->
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button
              v-for="cat in categories"
              :key="cat.id"
              style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;border:none"
              :style="selectedCategory === cat.id
                ? 'background:var(--gradient-primary);color:white'
                : 'background:#f1f5f9;color:#64748b'"
              @click="selectedCategory = cat.id"
            >
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>
          <!-- 排序 -->
          <select
            v-model="sortBy"
            style="padding:7px 12px;border-radius:10px;border:1.5px solid rgba(148,163,184,0.3);font-size:13px;outline:none;color:#64748b;background:#fff"
          >
            <option value="hot">
              按热度
            </option>
            <option value="time">
              按时间
            </option>
          </select>
        </div>

        <!-- 内容网格 -->
        <div style="display:grid;grid-template-columns:1fr 320px;gap:20px">
          <!-- 左：热点列表 -->
          <div>
            <!-- 置顶教师动态 -->
            <div
              v-if="teacherPosts.length"
              style="margin-bottom:16px"
            >
              <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;letter-spacing:1px">
                📌 教师动态
              </div>
              <div
                v-for="post in teacherPosts"
                :key="post.id"
                style="background:linear-gradient(135deg,rgba(6,182,212,0.05),rgba(139,92,246,0.05));border:1px solid rgba(6,182,212,0.15);border-radius:14px;padding:16px;margin-bottom:10px"
              >
                <div style="display:flex;gap:10px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;flex-shrink:0">
                    {{ post.author.charAt(0) }}
                  </div>
                  <div style="flex:1">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                      <span style="font-weight:600;font-size:13px">{{ post.author }}</span>
                      <span
                        class="badge badge-cyan"
                        style="font-size:10px"
                      >教师</span>
                      <span style="font-size:11px;color:#94a3b8">{{ post.timeAgo }}</span>
                    </div>
                    <div style="font-size:13px;color:#334155;line-height:1.6">
                      {{ post.content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 热点列表 -->
            <div style="display:flex;flex-direction:column;gap:12px">
              <div
                v-for="(item, idx) in filteredTopics"
                :key="item.id"
                style="background:white;border-radius:14px;border:1px solid rgba(148,163,184,0.15);padding:18px;transition:all 0.25s;cursor:pointer"
                @click="openTopic(item)"
                @mouseenter="($event.currentTarget as HTMLElement).style.borderColor='rgba(6,182,212,0.3)'"
                @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='rgba(148,163,184,0.15)'"
              >
                <div style="display:flex;gap:14px">
                  <!-- 排名 -->
                  <div
                    style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0"
                    :class="idx === 0 ? 'hot-rank-1' : idx === 1 ? 'hot-rank-2' : idx === 2 ? 'hot-rank-3' : 'hot-rank-n'"
                  >
                    {{ idx + 1 }}
                  </div>

                  <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
                      <div style="font-size:15px;font-weight:600;color:#0f172a;line-height:1.4;flex:1">
                        {{ item.title }}
                      </div>
                      <span
                        class="badge"
                        style="flex-shrink:0"
                        :class="`badge-${item.categoryColor}`"
                      >{{ item.category }}</span>
                    </div>
                    <div style="font-size:13px;color:#64748b;line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                      {{ item.summary }}
                    </div>
                    <!-- 元信息 + 操作 -->
                    <div style="display:flex;align-items:center;gap:12px">
                      <span style="font-size:12px;color:#94a3b8">{{ item.source }}</span>
                      <span style="font-size:12px;color:#94a3b8">{{ item.publishedAt }}</span>
                      <div style="margin-left:auto;display:flex;gap:8px">
                        <button
                          style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 10px;border-radius:6px;border:none;cursor:pointer;transition:all 0.2s"
                          :style="item.liked ? 'background:rgba(239,68,68,0.1);color:#ef4444' : 'background:#f8fafc;color:#64748b'"
                          @click.stop="toggleLike(item)"
                        >
                          {{ item.liked ? '❤️' : '🤍' }} {{ item.likes }}
                        </button>
                        <button
                          style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid rgba(148,163,184,0.2);cursor:pointer;background:transparent;color:#64748b"
                          @click.stop="openTopic(item)"
                        >
                          💬 {{ item.comments }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="filteredTopics.length === 0"
                style="text-align:center;padding:60px 20px;color:#94a3b8"
              >
                <div style="font-size:48px;margin-bottom:12px">
                  🔍
                </div>
                <div>暂无相关热点内容</div>
              </div>

              <!-- 加载更多 -->
              <button
                v-if="filteredTopics.length > 0"
                class="btn-ghost"
                style="width:100%;padding:12px;font-size:13px;margin-top:4px"
                @click="loadMore"
              >
                加载更多热点
              </button>
            </div>
          </div>

          <!-- 右：侧边栏 -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <!-- AI为你推荐 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <SparklesIcon style="width:14px;height:14px;color:#8b5cf6;display:inline;margin-right:4px" />
                  AI为你推荐
                </div>
              </div>
              <div
                class="card-body"
                style="padding-top:8px;display:flex;flex-direction:column;gap:10px"
              >
                <div
                  v-for="rec in aiRecommended"
                  :key="rec.id"
                  style="padding:10px;border-radius:10px;background:#f8fafc;cursor:pointer;transition:background 0.2s"
                  @click="openTopic(rec)"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background='#f0f9ff'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background='#f8fafc'"
                >
                  <div style="font-size:13px;font-weight:500;color:#1e293b;margin-bottom:4px;line-height:1.4">
                    {{ rec.title }}
                  </div>
                  <div style="font-size:11px;color:#94a3b8">
                    {{ rec.summary }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 热门分类 -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  热门分类
                </div>
              </div>
              <div
                class="card-body"
                style="padding-top:8px;display:flex;flex-direction:column;gap:8px"
              >
                <div
                  v-for="cat in categoryStats"
                  :key="cat.id"
                  style="display:flex;align-items:center;gap:10px;cursor:pointer"
                  @click="selectedCategory = cat.id"
                >
                  <span style="font-size:18px">{{ cat.icon }}</span>
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500;color:#1e293b">
                      {{ cat.label }}
                    </div>
                    <div style="height:4px;background:#f1f5f9;border-radius:2px;margin-top:4px;overflow:hidden">
                      <div
                        style="height:100%;border-radius:2px;transition:width 0.5s;background:var(--gradient-primary)"
                        :style="{ width: `${cat.percent}%` }"
                      />
                    </div>
                  </div>
                  <span style="font-size:12px;color:#94a3b8;font-weight:500">{{ cat.count }}</span>
                </div>
              </div>
            </div>

            <!-- 法律声明 -->
            <div style="background:rgba(148,163,184,0.08);border-radius:12px;padding:12px 14px;border:1px solid rgba(148,163,184,0.15)">
              <div style="font-size:11px;color:#94a3b8;line-height:1.7">
                ⚠️ 本社区内容来源于公开合法资讯平台，仅供学习交流演示使用，已过滤敏感及娱乐内容。超过7天的热点将自动清理。平台遵守 robots 协议，不以商业目的抓取任何内容。
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 话题详情弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="activeTopic"
          style="position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px"
          @click.self="activeTopic = null"
        >
          <div style="background:white;border-radius:20px;width:660px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column">
            <div style="padding:24px;border-bottom:1px solid rgba(148,163,184,0.15)">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="flex:1">
                  <span
                    class="badge"
                    :class="`badge-${activeTopic.categoryColor}`"
                    style="margin-bottom:8px"
                  >{{ activeTopic.category }}</span>
                  <div style="font-size:18px;font-weight:700;color:#0f172a;line-height:1.4">
                    {{ activeTopic.title }}
                  </div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:6px">
                    {{ activeTopic.source }} · {{ activeTopic.publishedAt }}
                  </div>
                </div>
                <button
                  style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:20px;padding:4px"
                  @click="activeTopic = null"
                >
                  ✕
                </button>
              </div>
            </div>
            <div style="padding:24px;overflow-y:auto;flex:1">
              <p style="font-size:14px;color:#334155;line-height:1.8;margin-bottom:20px">
                {{ activeTopic.summary }}
              </p>
              <!-- AI总结 -->
              <div
                class="ai-panel"
                style="margin-bottom:20px"
              >
                <div class="ai-panel-title">
                  <SparklesIcon style="width:14px;height:14px" /> AI学习要点
                </div>
                <div class="ai-message">
                  {{ activeTopic.aiSummary }}
                </div>
              </div>
              <!-- 评论区 -->
              <div style="margin-top:20px">
                <div style="font-size:14px;font-weight:600;margin-bottom:14px">
                  评论 ({{ activeTopic.comments }})
                </div>
                <div style="display:flex;gap:10px;margin-bottom:16px">
                  <input
                    v-model="commentInput"
                    type="text"
                    placeholder="发表你的看法..."
                    style="flex:1;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(148,163,184,0.3);font-size:13px;outline:none"
                    @keyup.enter="postComment"
                    @focus="($event.target as HTMLInputElement).style.borderColor='#06b6d4'"
                    @blur="($event.target as HTMLInputElement).style.borderColor='rgba(148,163,184,0.3)'"
                  >
                  <button
                    class="btn-primary"
                    style="padding:8px 16px;font-size:13px"
                    @click="postComment"
                  >
                    发送
                  </button>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px">
                  <div
                    v-for="comment in topicComments"
                    :key="comment.id"
                    style="display:flex;gap:10px"
                  >
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;flex-shrink:0">
                      {{ comment.author.charAt(0) }}
                    </div>
                    <div style="flex:1;background:#f8fafc;border-radius:10px;padding:10px 12px">
                      <div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:4px">
                        {{ comment.author }} <span style="color:#94a3b8;font-weight:400">· {{ comment.timeAgo }}</span>
                      </div>
                      <div style="font-size:13px;color:#334155">
                        {{ comment.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 发布动态弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPublishModal"
          style="position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px"
          @click.self="showPublishModal = false"
        >
          <div style="background:white;border-radius:20px;width:520px;padding:28px">
            <div style="font-size:18px;font-weight:700;margin-bottom:16px">
              发布动态
            </div>
            <textarea
              v-model="publishContent"
              placeholder="分享你的学习心得、技术见解..."
              style="width:100%;min-height:120px;padding:12px;border-radius:10px;border:1.5px solid rgba(148,163,184,0.3);font-size:13px;resize:none;outline:none;line-height:1.7"
            />
            <div style="font-size:12px;color:#94a3b8;margin:8px 0 16px">
              内容将经过AI审核，过滤不当内容。禁止发布与教育无关的内容。
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button
                class="btn-ghost"
                @click="showPublishModal = false"
              >
                取消
              </button>
              <button
                class="btn-primary"
                :disabled="!publishContent.trim()"
                @click="publishPost"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import {
  HomeIcon, BookOpenIcon, DocumentTextIcon, CodeBracketIcon,
  FireIcon, SparklesIcon, MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

interface HotTopic {
  id: number; title: string; summary: string; category: string; categoryColor: string
  source: string; publishedAt: string; heat: string; likes: number; comments: number
  liked: boolean; aiSummary: string
}

// ===== 分类配置 =====
const categories = [
  { id: 'all', label: '全部', icon: '🌐' },
  { id: 'ai', label: 'AI前沿', icon: '🤖' },
  { id: 'code', label: '编程语言', icon: '💻' },
  { id: 'contest', label: '竞赛资讯', icon: '🏆' },
  { id: 'research', label: '学术研究', icon: '📚' },
  { id: 'career', label: '就业职场', icon: '💼' },
]

const categoryStats = ref([
  { id: 'ai', label: 'AI前沿', icon: '🤖', count: 128, percent: 85 },
  { id: 'code', label: '编程语言', icon: '💻', count: 96, percent: 65 },
  { id: 'contest', label: '竞赛资讯', icon: '🏆', count: 67, percent: 45 },
  { id: 'research', label: '学术研究', icon: '📚', count: 54, percent: 36 },
])

const selectedCategory = ref('all')
const searchQuery = ref('')
const sortBy = ref('hot')

// ===== 热点数据（实际从后端获取，此处为演示数据）=====
const topics = ref<HotTopic[]>([
  { id: 1, title: '国产大模型DeepSeek-R2正式发布，推理能力超越主流闭源商业模型', summary: '深度求索发布新一代推理模型R2，在数学、编程、逻辑推理等基准测试上全面超越同量级模型。开源策略持续推进，为教育领域AI应用降本增效。', category: 'AI前沿', categoryColor: 'violet', source: 'DeepSeek官方', publishedAt: '2小时前', heat: '128.3万', likes: 3241, comments: 567, liked: false, aiSummary: '要点：开源大模型持续进化，教育平台可借助低成本高性能AI能力实现个性化学习推荐、自动批改等功能，降低技术壁垒。' },
  { id: 2, title: 'Python 4.0核心特性公布：GIL正式移除，多线程并发性能提升10倍', summary: 'Python指导委员会确认4.0版本将默认禁用GIL，同时引入新的内存管理机制。对数据处理、并发编程等场景影响重大，编程教学需要及时更新。', category: '编程语言', categoryColor: 'cyan', source: 'Python官方博客', publishedAt: '5小时前', heat: '89.2万', likes: 2156, comments: 423, liked: false, aiSummary: '要点：GIL移除是Python历史性变革，并发编程模型将根本性改变。学生需提前了解线程安全、内存模型等概念，为4.0迁移做准备。' },
  { id: 3, title: '2026全国大学生计算机设计大赛报名正式开启，AI+教育赛道首次独立', summary: '本届大赛新增"AI+教育应用"专项赛道，重点考察大模型应用、个性化学习系统、智能评测等创新方向。报名截止5月31日。', category: '竞赛资讯', categoryColor: 'success', source: '教育部竞赛官网', publishedAt: '1天前', heat: '67.4万', likes: 1893, comments: 334, liked: true, aiSummary: '要点：本次大赛与本平台功能高度契合，代码分析、防刷课、错题推送等AI功能均可参赛。建议整理核心功能文档，准备参赛材料。' },
  { id: 4, title: 'MIT开源图神经网络教育推荐系统，冷启动问题准确率提升40%', summary: 'MIT媒体实验室发布EduGNN框架，通过知识图谱与学习行为图的双路融合，有效解决新用户推荐冷启动问题。', category: '学术研究', categoryColor: 'warning', source: 'MIT Media Lab', publishedAt: '2天前', heat: '45.1万', likes: 1234, comments: 218, liked: false, aiSummary: '要点：图神经网络在教育推荐中的应用，与本平台知识点画像+协同过滤推荐方向一致，可参考其知识图谱构建方法。' },
  { id: 5, title: 'Rust语言连续9年荣获Stack Overflow最受喜爱编程语言，就业薪资排名第2', summary: 'Stack Overflow 2026开发者调查结果显示，Rust以78%的喜爱率再次夺冠，薪资中位数12万美元，仅次于Go语言。', category: '编程语言', categoryColor: 'cyan', source: 'Stack Overflow', publishedAt: '3天前', heat: '41.8万', likes: 2087, comments: 389, liked: false, aiSummary: '要点：Rust的系统编程优势在WebAssembly、嵌入式、操作系统等领域持续发酵，建议有余力的同学在掌握Python/Java基础后探索Rust。' },
  { id: 6, title: '教育部发布2026年高校AI素养评测标准，纳入大学生综合测评', summary: '新标准要求2027年前，所有高校在校生需完成不低于32学时的AI基础素养课程，并通过统一评测。', category: '竞赛资讯', categoryColor: 'success', source: '教育部', publishedAt: '4天前', heat: '38.5万', likes: 1567, comments: 276, liked: false, aiSummary: '要点：AI素养正式纳入高校综合测评，直接影响学分和综合测评成绩。本平台AI编程训练模块可作为核心学习工具。' },
])

const teacherPosts = ref([
  { id: 't1', author: '李志远老师', content: '同学们，下周作业涉及二叉树的DFS与BFS，建议提前在代码编辑器中练习，重点理解递归与队列的应用场景。有疑问在评论区留言！', timeAgo: '30分钟前' },
])

// ===== 筛选与排序 =====
const filteredTopics = computed(() => {
  let result = topics.value
  if (selectedCategory.value !== 'all') {
    const catMap: Record<string, string[]> = {
      ai: ['AI前沿'], code: ['编程语言'], contest: ['竞赛资讯'], research: ['学术研究'], career: ['就业职场'],
    }
    result = result.filter(t => catMap[selectedCategory.value]?.includes(t.category))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q))
  }
  if (sortBy.value === 'hot') {
    result = [...result].sort((a, b) => parseFloat(b.heat) - parseFloat(a.heat))
  }
  return result
})

const aiRecommended = computed((): HotTopic[] => [
  { id: 101, title: '基于Transformer的代码补全技术在教学中的应用', summary: '匹配你的学习方向：Python · 算法', category: 'ai', categoryColor: 'cyan', source: 'AI推荐', publishedAt: '', heat: '88', likes: 0, comments: 0, liked: false, aiSummary: '' },
  { id: 102, title: '动态规划可视化学习工具开源发布', summary: '与你的薄弱知识点相关：算法设计', category: 'code', categoryColor: 'violet', source: 'AI推荐', publishedAt: '', heat: '75', likes: 0, comments: 0, liked: false, aiSummary: '' },
])

// ===== 交互 =====
function toggleLike(item: HotTopic) {
  item.liked = !item.liked
  item.likes += item.liked ? 1 : -1
}

const activeTopic = ref<HotTopic | null>(null)
const commentInput = ref('')
const topicComments = ref([
  { id: 1, author: '张同学', content: '非常有用的资讯，和我们课程内容完全对上了！', timeAgo: '1小时前' },
  { id: 2, author: '王同学', content: 'GIL移除对我们写并发代码影响很大，需要重新学习。', timeAgo: '2小时前' },
])

function openTopic(item: HotTopic) {
  activeTopic.value = item
  commentInput.value = ''
}

function postComment() {
  const content = commentInput.value.trim()
  if (!content) return
  // 敏感词过滤（简化版，实际在后端进行）
  const BLOCKED = ['广告', '色情', '赌博', '刷课']
  if (BLOCKED.some(w => content.includes(w))) {
    ElMessage.warning('评论内容含有不当内容，已被过滤')
    return
  }
  topicComments.value.unshift({ id: Date.now(), author: '我', content, timeAgo: '刚刚' })
  if (activeTopic.value) activeTopic.value.comments++
  commentInput.value = ''
  ElMessage.success('评论发布成功')
}

function loadMore() {
  ElMessage.info('加载更多热点...')
}

const showPublishModal = ref(false)
const publishContent = ref('')

async function publishPost() {
  if (!publishContent.value.trim()) return
  try {
    await request.post('/community/posts', { content: publishContent.value })
    ElMessage.success('动态发布成功，已通过AI内容审核')
  } catch {
    // 离线演示
    ElMessage.success('动态发布成功')
  }
  showPublishModal.value = false
  publishContent.value = ''
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
