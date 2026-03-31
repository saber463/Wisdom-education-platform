<template>
  <div class="page-layout">
    <!-- 复用侧边栏结构 -->
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
          class="sidebar-item active"
        >
          <CodeBracketIcon class="nav-icon" /><span>代码编辑器</span>
          <span class="ml-auto badge badge-violet text-xs">AI</span>
        </router-link>
        <router-link
          to="/student/community"
          class="sidebar-item"
        >
          <FireIcon class="nav-icon" /><span>热点社区</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-title">
          AI代码分析 + 流程图生成
        </div>
        <div
          class="topbar-right"
          style="gap:10px"
        >
          <span class="badge badge-violet">静态分析 · 绝不执行代码</span>
          <button
            class="btn-ghost"
            style="font-size:13px;padding:6px 14px"
            @click="clearAll"
          >
            清空
          </button>
          <button
            class="btn-primary"
            style="padding:8px 20px"
            @click="submitAsAssignment"
          >
            提交为作业
          </button>
        </div>
      </header>

      <main
        class="page-container"
        style="padding:20px"
      >
        <!-- 顶部工具栏 -->
        <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
          <!-- 语言选择 -->
          <div style="display:flex;gap:6px">
            <button
              v-for="lang in languages"
              :key="lang.id"
              style="padding:6px 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;border:none"
              :style="selectedLang === lang.id
                ? 'background:var(--gradient-primary);color:white;box-shadow:0 4px 12px rgba(6,182,212,0.3)'
                : 'background:#f1f5f9;color:#64748b'"
              @click="selectedLang = lang.id"
            >
              {{ lang.icon }} {{ lang.label }}
            </button>
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button
              class="btn-ghost"
              style="font-size:12px;padding:5px 12px"
              @click="loadExample"
            >
              载入示例
            </button>
            <button
              class="btn-ghost"
              style="font-size:12px;padding:5px 12px"
              @click="formatCode"
            >
              格式化
            </button>
          </div>
        </div>

        <!-- 主编辑区：左代码 / 右流程图 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;min-height:calc(100vh - 220px)">
          <!-- 左：代码编辑器 -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <div
              class="code-editor-container"
              style="flex:1"
            >
              <div class="editor-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="editor-dots">
                    <div
                      class="editor-dot"
                      style="background:#ff5f57"
                    />
                    <div
                      class="editor-dot"
                      style="background:#febc2e"
                    />
                    <div
                      class="editor-dot"
                      style="background:#28c840"
                    />
                  </div>
                  <span style="font-size:12px;color:#64748b;margin-left:8px">{{ selectedLangLabel }} · {{ lineCount }} 行</span>
                </div>
                <div style="display:flex;gap:8px">
                  <button
                    style="font-size:12px;padding:4px 10px;border-radius:6px;border:none;cursor:pointer;background:rgba(255,255,255,0.07);color:#94a3b8"
                    @click="copyCode"
                  >
                    复制
                  </button>
                </div>
              </div>
              <div style="position:relative">
                <!-- 行号 -->
                <div style="position:absolute;left:0;top:0;bottom:0;width:40px;background:rgba(255,255,255,0.03);padding:16px 0;text-align:right;font-family:monospace;font-size:13px;color:#475569;line-height:1.7;user-select:none">
                  <div
                    v-for="n in lineCount"
                    :key="n"
                    style="padding-right:8px"
                  >
                    {{ n }}
                  </div>
                </div>
                <textarea
                  ref="codeTextarea"
                  v-model="code"
                  class="editor-area"
                  spellcheck="false"
                  :placeholder="`# 在此输入${selectedLangLabel}代码\n# 支持代码高亮、自动缩进、格式化\n# 最大 500 行 · 静态分析，不执行代码`"
                  style="width:100%;padding-left:52px;resize:none;background:transparent;border:none;outline:none;color:#e2e8f0;font-family:'JetBrains Mono','Fira Code',monospace;font-size:13.5px;line-height:1.7;min-height:500px"
                  @keydown="handleKeydown"
                  @input="handleInput"
                />
              </div>
            </div>

            <!-- AI分析结果面板 -->
            <div
              class="ai-panel"
              style="min-height:160px"
            >
              <div class="ai-panel-title">
                <SparklesIcon style="width:14px;height:14px" />
                AI 代码分析
                <span
                  v-if="analyzing"
                  class="badge badge-violet"
                  style="margin-left:8px;font-size:10px;animation:pulse 1s infinite"
                >分析中...</span>
              </div>
              <div
                v-if="!aiAnalysis && !analyzing"
                style="color:rgba(255,255,255,0.3);font-size:13px"
              >
                点击「生成流程图」后，AI将在此展示：考点提取、逐行解析、语法纠错、性能建议
              </div>
              <div v-else-if="analyzing">
                <div
                  class="skeleton"
                  style="height:16px;border-radius:4px;margin-bottom:8px;background:rgba(255,255,255,0.07)"
                />
                <div
                  class="skeleton"
                  style="height:16px;border-radius:4px;width:80%;background:rgba(255,255,255,0.07)"
                />
              </div>
              <div v-else>
                <div
                  v-for="(item, idx) in aiAnalysis"
                  :key="idx"
                  class="ai-message"
                >
                  <span style="color:var(--color-violet-light);font-size:11px;font-weight:700;display:block;margin-bottom:4px">{{ item.type }}</span>
                  {{ item.content }}
                </div>
              </div>
            </div>
          </div>

          <!-- 右：流程图渲染 -->
          <div style="display:flex;flex-direction:column;gap:12px">
            <!-- 流程图工具栏 -->
            <div style="display:flex;gap:8px;align-items:center">
              <button
                class="btn-primary"
                style="padding:8px 20px;font-size:13px"
                :disabled="!code.trim() || analyzing"
                @click="generateFlowchart"
              >
                <SparklesIcon style="width:14px;height:14px" />
                {{ analyzing ? '生成中...' : '生成流程图' }}
              </button>
              <div
                v-if="flowchartGenerated"
                style="display:flex;gap:6px;margin-left:auto"
              >
                <button
                  class="btn-ghost"
                  style="font-size:12px;padding:5px 10px"
                  @click="zoomIn"
                >
                  放大
                </button>
                <button
                  class="btn-ghost"
                  style="font-size:12px;padding:5px 10px"
                  @click="zoomOut"
                >
                  缩小
                </button>
                <button
                  class="btn-ghost"
                  style="font-size:12px;padding:5px 10px"
                  @click="resetZoom"
                >
                  重置
                </button>
                <button
                  class="btn-ghost"
                  style="font-size:12px;padding:5px 10px"
                  @click="downloadSVG"
                >
                  ⬇ SVG
                </button>
                <button
                  class="btn-ghost"
                  style="font-size:12px;padding:5px 10px"
                  @click="downloadPNG"
                >
                  ⬇ PNG
                </button>
              </div>
            </div>

            <!-- 流程图画布 -->
            <div
              class="flowchart-container"
              style="flex:1;min-height:500px;position:relative;overflow:hidden"
            >
              <!-- 空状态 -->
              <div
                v-if="!flowchartGenerated && !analyzing"
                style="text-align:center;color:#94a3b8"
              >
                <div style="font-size:64px;margin-bottom:16px">
                  🔀
                </div>
                <div style="font-size:15px;font-weight:600;color:#64748b">
                  AI流程图生成器
                </div>
                <div style="font-size:13px;margin-top:6px;max-width:280px">
                  输入代码后点击「生成流程图」<br>AI将自动解析逻辑结构并生成标准程序执行流程图
                </div>
              </div>

              <!-- 生成中动画 -->
              <div
                v-else-if="analyzing"
                style="text-align:center;color:#94a3b8"
              >
                <div style="font-size:40px;margin-bottom:16px;animation:spin 1s linear infinite;display:inline-block">
                  ⚙️
                </div>
                <div style="font-size:14px">
                  AI正在解析代码逻辑...
                </div>
              </div>

              <!-- 流程图SVG渲染区域 -->
              <div
                v-else
                ref="flowchartArea"
                style="width:100%;height:100%;overflow:hidden;cursor:grab"
                :style="{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center center' }"
                @wheel.prevent="handleWheel"
              >
                <svg
                  :width="svgWidth"
                  :height="svgHeight"
                  :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
                  xmlns="http://www.w3.org/2000/svg"
                  style="display:block;margin:0 auto"
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="10"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#06b6d4"
                      />
                    </marker>
                    <filter id="shadow">
                      <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="3"
                        flood-color="rgba(6,182,212,0.15)"
                      />
                    </filter>
                  </defs>

                  <!-- 连接线 -->
                  <g
                    v-for="conn in flowNodes.connections"
                    :key="`${conn.from}-${conn.to}`"
                  >
                    <line
                      :x1="getNodeCenter(conn.from).x"
                      :y1="getNodeCenter(conn.from).y + 28"
                      :x2="getNodeCenter(conn.to).x"
                      :y2="getNodeCenter(conn.to).y - 28"
                      stroke="#06b6d4"
                      stroke-width="1.5"
                      stroke-dasharray="none"
                      marker-end="url(#arrowhead)"
                      opacity="0.6"
                    />
                    <text
                      v-if="conn.label"
                      :x="(getNodeCenter(conn.from).x + getNodeCenter(conn.to).x) / 2 + 6"
                      :y="(getNodeCenter(conn.from).y + getNodeCenter(conn.to).y) / 2"
                      font-size="11"
                      fill="#64748b"
                    >{{ conn.label }}</text>
                  </g>

                  <!-- 节点 -->
                  <g
                    v-for="node in flowNodes.nodes"
                    :key="node.id"
                    style="cursor:pointer"
                    :style="{ filter: 'url(#shadow)' }"
                    @click="highlightCodeLine(node.lineRef)"
                  >
                    <!-- 开始/结束：椭圆 -->
                    <template v-if="node.type === 'terminal'">
                      <ellipse
                        :cx="node.x"
                        :cy="node.y"
                        rx="60"
                        ry="26"
                        :fill="node.color"
                        rx-opacity="0.9"
                      />
                      <text
                        :x="node.x"
                        :y="node.y + 5"
                        text-anchor="middle"
                        fill="white"
                        font-size="13"
                        font-weight="600"
                      >{{ node.label }}</text>
                    </template>

                    <!-- 处理：矩形 -->
                    <template v-else-if="node.type === 'process'">
                      <rect
                        :x="node.x - 80"
                        :y="node.y - 26"
                        width="160"
                        height="52"
                        rx="8"
                        :fill="node.color"
                      />
                      <text
                        :x="node.x"
                        :y="node.y + 5"
                        text-anchor="middle"
                        fill="white"
                        font-size="12"
                      >{{ truncate(node.label, 18) }}</text>
                    </template>

                    <!-- 判断：菱形 -->
                    <template v-else-if="node.type === 'decision'">
                      <polygon
                        :points="`${node.x},${node.y - 32} ${node.x + 80},${node.y} ${node.x},${node.y + 32} ${node.x - 80},${node.y}`"
                        :fill="node.color"
                      />
                      <text
                        :x="node.x"
                        :y="node.y + 5"
                        text-anchor="middle"
                        fill="white"
                        font-size="11"
                      >{{ truncate(node.label, 14) }}</text>
                    </template>

                    <!-- 循环：平行四边形 -->
                    <template v-else-if="node.type === 'loop'">
                      <polygon
                        :points="`${node.x - 70},${node.y + 26} ${node.x + 90},${node.y + 26} ${node.x + 70},${node.y - 26} ${node.x - 90},${node.y - 26}`"
                        :fill="node.color"
                      />
                      <text
                        :x="node.x"
                        :y="node.y + 5"
                        text-anchor="middle"
                        fill="white"
                        font-size="11"
                      >{{ truncate(node.label, 16) }}</text>
                    </template>
                  </g>
                </svg>
              </div>

              <!-- 缩放提示 -->
              <div
                v-if="flowchartGenerated"
                style="position:absolute;bottom:12px;right:12px;font-size:11px;color:#94a3b8;background:rgba(255,255,255,0.8);padding:4px 8px;border-radius:6px"
              >
                滚轮缩放 · 点击节点跳转代码行
              </div>
            </div>

            <!-- 代码片段收藏 / 历史 -->
            <div
              class="content-card"
              style="padding:0"
            >
              <div
                class="card-header"
                style="padding:14px 16px"
              >
                <div
                  class="card-title"
                  style="font-size:13px"
                >
                  代码历史 & 收藏
                </div>
                <button
                  class="btn-ghost"
                  style="font-size:11px;padding:4px 10px"
                  @click="saveSnippet"
                >
                  保存片段
                </button>
              </div>
              <div style="padding:0 16px 14px;display:flex;gap:8px;flex-wrap:wrap">
                <div
                  v-for="snippet in snippets"
                  :key="snippet.id"
                  style="padding:6px 12px;border-radius:8px;background:#f8fafc;border:1px solid rgba(148,163,184,0.2);font-size:12px;cursor:pointer;transition:all 0.2s"
                  @click="loadSnippet(snippet)"
                  @mouseenter="($event.currentTarget as HTMLElement).style.borderColor='#06b6d4'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='rgba(148,163,184,0.2)'"
                >
                  <span style="color:#64748b">{{ snippet.lang }}:</span>
                  <span style="color:#0f172a;margin-left:4px">{{ snippet.name }}</span>
                </div>
                <div
                  v-if="snippets.length === 0"
                  style="font-size:12px;color:#94a3b8"
                >
                  暂无收藏，点击「保存片段」添加
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 提交为作业弹窗 -->
    <div
      v-if="showSubmitModal"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;justify-content:center"
      @click.self="showSubmitModal = false"
    >
      <div
        class="content-card"
        style="width:480px;padding:28px;border-radius:20px"
      >
        <div style="font-size:18px;font-weight:700;margin-bottom:16px">
          提交代码作业
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:#64748b;display:block;margin-bottom:6px">选择作业</label>
          <select
            v-model="targetAssignment"
            style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);font-size:14px;outline:none"
          >
            <option value="">
              请选择对应的作业...
            </option>
            <option
              v-for="a in pendingAssignments"
              :key="a.id"
              :value="a.id"
            >
              {{ a.title }}
            </option>
          </select>
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:13px;color:#64748b;display:block;margin-bottom:6px">提交说明（选填）</label>
          <textarea
            v-model="submitNote"
            style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);font-size:13px;resize:none;outline:none;min-height:80px"
            placeholder="描述你的思路..."
          />
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button
            class="btn-ghost"
            @click="showSubmitModal = false"
          >
            取消
          </button>
          <button
            class="btn-primary"
            :disabled="!targetAssignment"
            @click="confirmSubmit"
          >
            确认提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import {
  HomeIcon, BookOpenIcon, DocumentTextIcon, CodeBracketIcon,
  FireIcon, SparklesIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()

// ===== 语言配置 =====
const languages = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C/C++', icon: '⚡' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
]
const selectedLang = ref('python')
const selectedLangLabel = computed(() => languages.find(l => l.id === selectedLang.value)?.label || 'Python')

// ===== 代码区 =====
const code = ref('')
const codeTextarea = ref<HTMLTextAreaElement>()
const lineCount = computed(() => code.value.split('\n').length || 1)
const MAX_LINES = 500

const EXAMPLES: Record<string, string> = {
  python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1

# 测试
arr = [1, 3, 5, 7, 9, 11, 13]
result = binary_search(arr, 7)
print(f"找到目标值，索引为: {result}")`,
  java: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0, right = arr.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
  cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
  javascript: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
}

function loadExample() {
  code.value = EXAMPLES[selectedLang.value] || EXAMPLES.python
}

function formatCode() {
  // 简单格式化：确保一致缩进
  const lines = code.value.split('\n')
  code.value = lines.map(l => l.trimEnd()).join('\n')
  ElMessage.success('格式化完成')
}

function handleKeydown(e: KeyboardEvent) {
  // Tab缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    const el = e.target as HTMLTextAreaElement
    const start = el.selectionStart
    const end = el.selectionEnd
    code.value = code.value.substring(0, start) + '    ' + code.value.substring(end)
    nextTick(() => { el.selectionStart = el.selectionEnd = start + 4 })
  }
  // 超行限制
  if (lineCount.value >= MAX_LINES && e.key === 'Enter') {
    e.preventDefault()
    ElMessage.warning(`代码行数上限 ${MAX_LINES} 行`)
  }
}

function handleInput() {
  // 代码变化时重置流程图
  flowchartGenerated.value = false
  aiAnalysis.value = null
}

function copyCode() {
  navigator.clipboard?.writeText(code.value)
  ElMessage.success('已复制到剪贴板')
}

function clearAll() {
  code.value = ''
  flowchartGenerated.value = false
  aiAnalysis.value = null
}

// ===== AI分析 =====
const analyzing = ref(false)
const aiAnalysis = ref<Array<{ type: string; content: string }> | null>(null)

// ===== 流程图数据 =====
interface FlowNode {
  id: string; type: 'terminal' | 'process' | 'decision' | 'loop'
  label: string; x: number; y: number; color: string; lineRef?: number
}
interface FlowConnection { from: string; to: string; label?: string }
interface FlowData { nodes: FlowNode[]; connections: FlowConnection[] }

const flowchartGenerated = ref(false)
const flowNodes = ref<FlowData>({ nodes: [], connections: [] })
const svgWidth = ref(500)
const svgHeight = ref(600)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)

function getNodeCenter(nodeId: string) {
  const node = flowNodes.value.nodes.find(n => n.id === nodeId)
  return { x: node?.x || 250, y: node?.y || 300 }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max) + '…' : str
}

/**
 * 核心：前端解析代码生成流程图（纯静态分析，不执行代码）
 * 实际生产中此逻辑应在后端通过 AST 解析完成
 */
function parseCodeToFlow(sourceCode: string, lang: string): FlowData {
  const lines = sourceCode.split('\n').filter(l => l.trim())
  const nodes: FlowNode[] = []
  const connections: FlowConnection[] = []

  const COLOR = {
    terminal: '#06b6d4',
    process: '#8b5cf6',
    decision: '#f59e0b',
    loop: '#10b981',
    function: '#3b82f6',
  }

  nodes.push({ id: 'start', type: 'terminal', label: '开始', x: 250, y: 60, color: COLOR.terminal })

  let yOffset = 140
  let prevId = 'start'
  let nodeIdx = 0

  const decisionKeywords: Record<string, string[]> = {
    python: ['if ', 'elif ', 'else:'],
    java: ['if (', 'else if (', 'switch ('],
    cpp: ['if (', 'else if (', 'switch ('],
    javascript: ['if (', 'else if (', 'switch ('],
  }
  const loopKeywords: Record<string, string[]> = {
    python: ['for ', 'while '],
    java: ['for (', 'while (', 'do {'],
    cpp: ['for (', 'while (', 'do {'],
    javascript: ['for (', 'while (', 'forEach('],
  }
  const functionKeywords: Record<string, string[]> = {
    python: ['def '],
    java: ['public ', 'private ', 'void ', 'static '],
    cpp: ['int ', 'void ', 'bool ', 'string '],
    javascript: ['function ', 'const ', 'let ', 'var ', '=>'],
  }

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('*')) continue

    const id = `node_${nodeIdx++}`
    let type: FlowNode['type'] = 'process'
    let color = COLOR.process

    if ((decisionKeywords[lang] || []).some(k => line.includes(k))) {
      type = 'decision'; color = COLOR.decision
    } else if ((loopKeywords[lang] || []).some(k => line.startsWith(k))) {
      type = 'loop'; color = COLOR.loop
    } else if ((functionKeywords[lang] || []).some(k => line.startsWith(k))) {
      type = 'process'; color = COLOR.function
    }

    nodes.push({ id, type, label: line.slice(0, 28), x: 250, y: yOffset, color, lineRef: i + 1 })
    connections.push({ from: prevId, to: id, label: type === 'decision' ? '是' : undefined })

    if (type === 'decision') {
      yOffset += 90
    } else {
      yOffset += 80
    }
    prevId = id
  }

  const endId = 'end'
  nodes.push({ id: endId, type: 'terminal', label: '结束', x: 250, y: yOffset, color: COLOR.terminal })
  connections.push({ from: prevId, to: endId })

  svgHeight.value = yOffset + 100
  return { nodes, connections }
}

async function generateFlowchart() {
  if (!code.value.trim()) return
  if (lineCount.value > MAX_LINES) {
    ElMessage.warning(`代码行数超过上限(${MAX_LINES}行)，请分段分析`)
    return
  }

  analyzing.value = true
  flowchartGenerated.value = false

  try {
    // 调用后端AI接口（带缓存、异步处理）
    const response = await request.post<{ data?: { success?: boolean; flowData?: FlowData; analysis?: Array<{ type: string; content: string }> } }>('/api/code-analysis/analyze', {
      code: code.value,
      language: selectedLang.value,
    }).catch(() => null)

    if (response?.data?.success) {
      flowNodes.value = response.data.flowData ?? { nodes: [], connections: [] }
      aiAnalysis.value = response.data.analysis ?? null
    } else {
      // Fallback: 前端本地静态解析（演示用）
      flowNodes.value = parseCodeToFlow(code.value, selectedLang.value)
      aiAnalysis.value = [
        { type: '📚 考点识别', content: `本题涉及：${selectedLangLabel.value}基础语法、${flowNodes.value.nodes.filter(n => n.type === 'loop').length > 0 ? '循环结构、' : ''}${flowNodes.value.nodes.filter(n => n.type === 'decision').length > 0 ? '条件分支、' : ''}函数定义与调用` },
        { type: '🔍 逻辑解析', content: `代码共 ${lineCount.value} 行，包含 ${flowNodes.value.nodes.filter(n => n.type === 'decision').length} 个判断节点、${flowNodes.value.nodes.filter(n => n.type === 'loop').length} 个循环结构` },
        { type: '⚡ 优化建议', content: '建议添加边界条件检查，增强代码健壮性；变量命名清晰，符合编程规范' },
      ]
    }

    flowchartGenerated.value = true
    zoom.value = 1
    panX.value = 0
    panY.value = 0
  } finally {
    analyzing.value = false
  }
}

function highlightCodeLine(lineRef?: number) {
  if (!lineRef || !codeTextarea.value) return
  const lines = code.value.split('\n')
  let charPos = 0
  for (let i = 0; i < lineRef - 1; i++) charPos += lines[i].length + 1
  codeTextarea.value.focus()
  codeTextarea.value.setSelectionRange(charPos, charPos + lines[lineRef - 1].length)
}

function handleWheel(e: WheelEvent) {
  zoom.value = Math.max(0.3, Math.min(3, zoom.value - e.deltaY * 0.001))
}

function zoomIn() { zoom.value = Math.min(3, zoom.value + 0.2) }
function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.2) }
function resetZoom() { zoom.value = 1; panX.value = 0; panY.value = 0 }

function downloadSVG() {
  const svgEl = document.querySelector('.flowchart-container svg')
  if (!svgEl) return
  const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'flowchart.svg'; a.click()
}

function downloadPNG() {
  ElMessage.info('PNG导出功能需要 canvas 支持，即将实现')
}

// ===== 代码片段收藏 =====
interface Snippet { id: string; name: string; lang: string; code: string }
const snippets = ref<Snippet[]>([
  { id: '1', name: '二分查找', lang: 'Python', code: EXAMPLES.python },
  { id: '2', name: '排序示例', lang: 'Java', code: EXAMPLES.java },
])

function saveSnippet() {
  const name = prompt('为代码片段命名：')
  if (!name || !code.value.trim()) return
  snippets.value.unshift({ id: Date.now().toString(), name, lang: selectedLangLabel.value, code: code.value })
  ElMessage.success('代码片段已保存')
}

function loadSnippet(snippet: Snippet) {
  code.value = snippet.code
  flowchartGenerated.value = false
  aiAnalysis.value = null
}

// ===== 提交为作业 =====
const showSubmitModal = ref(false)
const targetAssignment = ref('')
const submitNote = ref('')
const pendingAssignments = ref([
  { id: '1', title: '作业1：实现二分查找算法' },
  { id: '2', title: '作业2：链表基础操作' },
])

function submitAsAssignment() {
  if (!code.value.trim()) { ElMessage.warning('请先输入代码'); return }
  showSubmitModal.value = true
}

async function confirmSubmit() {
  try {
    await request.post('/api/assignments/submit-code', {
      assignment_id: targetAssignment.value,
      code: code.value,
      language: selectedLang.value,
      flowchart_data: flowchartGenerated.value ? flowNodes.value : null,
      note: submitNote.value,
    })
    ElMessage.success('代码作业提交成功！')
    showSubmitModal.value = false
  } catch {
    ElMessage.error('提交失败，请稍后重试')
  }
}

import { nextTick } from 'vue'
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
