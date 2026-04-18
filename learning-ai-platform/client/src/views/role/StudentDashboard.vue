<template>
  <div class="student-dashboard">
    <!-- 欢迎条 -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <img :src="profile.avatar" class="profile-avatar" />
        <div>
          <div class="welcome-text">👋 你好，{{ profile.name }}！</div>
          <div class="welcome-sub">今天已学习 <b>{{ profile.todayMinutes }}</b> 分钟 · 坚持第 <b>{{ profile.streak }}</b> 天</div>
        </div>
      </div>
      <div class="xp-bar-wrap">
        <div class="xp-label">经验值 {{ profile.xp }} / {{ profile.nextXp }}</div>
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: (profile.xp / profile.nextXp * 100) + '%' }" />
        </div>
        <div class="xp-level">Lv.{{ profile.level }} 编程新秀</div>
      </div>
    </div>

    <!-- 算法可视化面板 -->
    <section class="algo-panel">
      <div class="algo-header">
        <div class="algo-title-wrap">
          <span class="algo-title">⚡ 算法运行可视化</span>
          <span class="algo-subtitle">实时观察算法执行过程，理解每一步变化</span>
        </div>
        <div class="algo-controls">
          <!-- 算法选择 -->
          <div class="algo-select-wrap">
            <button
              v-for="a in algoList"
              :key="a.id"
              class="algo-btn"
              :class="{ active: selectedAlgo === a.id }"
              @click="selectAlgo(a.id)"
            >{{ a.label }}</button>
          </div>
          <!-- 速度控制 -->
          <div class="speed-wrap">
            <span class="speed-label">速度</span>
            <input v-model="speed" type="range" min="1" max="5" class="speed-slider" />
            <span class="speed-val">{{ ['', '极慢', '慢', '正常', '快', '极快'][speed] }}</span>
          </div>
        </div>
      </div>

      <div class="algo-body">
        <!-- 可视化区域 -->
        <div class="viz-area">
          <div class="viz-title">{{ currentAlgo.label }} — {{ animState }}</div>

          <!-- 数组条形图 -->
          <div v-if="['bubble','selection','insertion','quick','merge'].includes(selectedAlgo)" class="bars-container">
            <div
              v-for="(item, idx) in vizArray"
              :key="idx"
              class="bar-wrap"
            >
              <div
                class="bar"
                :style="{ height: (item.val / maxVal * 180) + 'px' }"
                :class="{
                  'bar-comparing': item.state === 'comparing',
                  'bar-swapping':  item.state === 'swapping',
                  'bar-sorted':    item.state === 'sorted',
                  'bar-pivot':     item.state === 'pivot',
                  'bar-default':   item.state === 'default',
                }"
              />
              <div class="bar-val">{{ item.val }}</div>
            </div>
          </div>

          <!-- 搜索可视化 -->
          <div v-else-if="selectedAlgo === 'binary'" class="search-container">
            <div class="search-array">
              <div
                v-for="(item, idx) in vizArray"
                :key="idx"
                class="search-cell"
                :class="{
                  'cell-left':      item.state === 'left',
                  'cell-right':     item.state === 'right',
                  'cell-mid':       item.state === 'mid',
                  'cell-found':     item.state === 'found',
                  'cell-eliminated':item.state === 'eliminated',
                }"
              >
                <div class="cell-val">{{ item.val }}</div>
                <div class="cell-label">
                  {{ item.state === 'left' ? 'L' : item.state === 'right' ? 'R' : item.state === 'mid' ? 'M' : '' }}
                </div>
              </div>
            </div>
            <div class="search-info">
              目标值: <b class="text-tech-blue">{{ searchTarget }}</b> &nbsp;|&nbsp;
              当前步骤: <b class="text-tech-purple">{{ animState }}</b>
            </div>
          </div>

          <!-- 链表可视化 -->
          <div v-else-if="selectedAlgo === 'linked'" class="linked-container">
            <div class="linked-row">
              <template v-for="(node, idx) in linkedList" :key="idx">
                <div class="linked-node" :class="{ 'node-active': node.active, 'node-new': node.isNew }">
                  <div class="node-val">{{ node.val }}</div>
                  <div class="node-ptr">→</div>
                </div>
              </template>
              <div class="linked-null">NULL</div>
            </div>
            <div class="linked-info">{{ animState }}</div>
          </div>

          <!-- DP 斐波那契可视化 -->
          <div v-else-if="selectedAlgo === 'fib'" class="dp-container">
            <div class="dp-row">
              <div
                v-for="(item, idx) in dpTable"
                :key="idx"
                class="dp-cell"
                :class="{
                  'dp-computing': item.state === 'computing',
                  'dp-done':      item.state === 'done',
                  'dp-current':   item.state === 'current',
                }"
              >
                <div class="dp-idx">F({{ idx }})</div>
                <div class="dp-val">{{ item.val === null ? '?' : item.val }}</div>
              </div>
            </div>
            <div class="dp-formula" v-if="dpFormula">{{ dpFormula }}</div>
          </div>

          <!-- 播放控制 -->
          <div class="playbar">
            <button class="play-btn" @click="resetAnim">⏮ 重置</button>
            <button class="play-btn primary" @click="togglePlay">
              {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
            </button>
            <button class="play-btn" @click="stepForward" :disabled="isPlaying">⏭ 下一步</button>
            <button class="play-btn" @click="randomize">🎲 随机数据</button>
            <span class="step-count">步骤 {{ currentStep }} / {{ totalSteps }}</span>
          </div>
        </div>

        <!-- 右侧：伪代码 + 说明 -->
        <div class="code-panel">
          <div class="pseudo-title">📝 伪代码</div>
          <div class="pseudo-code">
            <div
              v-for="(line, idx) in currentAlgo.pseudoCode"
              :key="idx"
              class="pseudo-line"
              :class="{ 'pseudo-active': idx === activePseudoLine }"
            >
              <span class="line-no">{{ idx + 1 }}</span>
              <span class="line-text">{{ line }}</span>
            </div>
          </div>

          <div class="algo-info-box">
            <div class="info-row">
              <span class="info-label">时间复杂度</span>
              <span class="info-val time">{{ currentAlgo.timeO }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">空间复杂度</span>
              <span class="info-val space">{{ currentAlgo.spaceO }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">稳定性</span>
              <span class="info-val">{{ currentAlgo.stable }}</span>
            </div>
          </div>

          <div class="step-log">
            <div class="log-title">📋 执行日志</div>
            <div class="log-body" ref="logBody">
              <div v-for="(log, i) in stepLogs.slice(-12)" :key="i" class="log-entry" :class="{ 'log-latest': i === Math.min(11, stepLogs.length - 1) }">
                <span class="log-step">{{ log.step }}</span>
                <span class="log-msg">{{ log.msg }}</span>
              </div>
              <div v-if="stepLogs.length === 0" class="log-empty">点击播放开始演示...</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="main-layout">
      <!-- 左列 -->
      <div class="col-a">
        <!-- 学习任务 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">📋 学习任务</span>
            <span class="task-count">{{ tasks.filter(t => !t.done).length }} 待完成</span>
          </div>
          <div class="task-list">
            <div class="task-item" v-for="task in tasks" :key="task.id" :class="{ done: task.done }">
              <img :src="task.image" class="task-img" />
              <div class="task-info">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-meta">
                  <span class="task-subject">{{ task.subject }}</span>
                  <span>截止 {{ task.deadline }}</span>
                </div>
                <div class="task-progress-bar">
                  <div class="task-fill" :style="{ width: task.progress + '%' }" />
                </div>
              </div>
              <div class="task-pct">{{ task.progress }}%</div>
            </div>
          </div>
        </section>

        <!-- 错题推送 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">🔴 错题推送</span>
            <span class="wrong-badge">需要复习</span>
          </div>
          <div class="wrong-list">
            <div class="wrong-item" v-for="q in wrongQuestions" :key="q.id">
              <div class="wrong-sub">{{ q.subject }}</div>
              <div class="wrong-q">{{ q.question }}</div>
              <div class="wrong-footer">
                <span class="wrong-my">我的答案：{{ q.myAnswer }}</span>
                <span class="wrong-correct">正确：{{ q.correct }}</span>
                <button class="btn-review">重做</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 中列 -->
      <div class="col-b">
        <!-- 今日计划 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">⏰ 今日计划</span>
          </div>
          <div class="plan-items">
            <div class="plan-row" v-for="p in todayPlan" :key="p.id" :class="{ active: p.active, done: p.done }">
              <div class="plan-time-dot">
                <div class="dot" />
                <div class="dot-line" v-if="p.id < todayPlan.length" />
              </div>
              <div class="plan-content">
                <div class="plan-name">{{ p.name }}</div>
                <div class="plan-duration">{{ p.time }} · {{ p.duration }}分钟</div>
              </div>
              <span class="plan-icon">{{ p.done ? '✅' : p.active ? '🟡' : '⭕' }}</span>
            </div>
          </div>
        </section>

        <!-- 排行榜 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">🏆 班级排行榜</span>
            <span class="period-badge">本周</span>
          </div>
          <div class="rank-list">
            <div class="rank-item" v-for="(r, idx) in rankList" :key="r.id" :class="{ 'is-me': r.isMe }">
              <div class="rank-no" :class="['rank-' + (idx + 1)]">
                {{ idx < 3 ? ['🥇','🥈','🥉'][idx] : idx + 1 }}
              </div>
              <img :src="r.avatar" class="rank-avatar" />
              <div class="rank-info">
                <div class="rank-name">{{ r.name }} <span v-if="r.isMe" class="me-tag">我</span></div>
                <div class="rank-score">{{ r.score }} 分</div>
              </div>
              <div class="rank-bar-wrap">
                <div class="rank-bar">
                  <div class="rank-fill" :style="{ width: (r.score / rankList[0].score * 100) + '%' }" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右列 -->
      <div class="col-c">
        <!-- 成就徽章 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">🎖 我的成就</span>
            <span class="badge-total">{{ badges.filter(b => b.unlocked).length }}/{{ badges.length }}</span>
          </div>
          <div class="badges-grid">
            <div class="badge-item" v-for="b in badges" :key="b.id" :class="{ locked: !b.unlocked }" :title="b.name">
              <div class="badge-icon">{{ b.icon }}</div>
              <div class="badge-name">{{ b.name }}</div>
              <div v-if="b.unlocked" class="badge-glow" />
            </div>
          </div>
        </section>

        <!-- 学习统计 -->
        <section class="card">
          <div class="card-header">
            <span class="card-title">📈 学习统计</span>
          </div>
          <div class="stat-grid">
            <div class="mini-stat" v-for="s in myStats" :key="s.label">
              <div class="mini-icon">{{ s.icon }}</div>
              <div class="mini-value">{{ s.value }}</div>
              <div class="mini-label">{{ s.label }}</div>
            </div>
          </div>
          <!-- 每日学习柱状图（简单版） -->
          <div class="week-chart">
            <div class="chart-label">本周学习时长（分钟）</div>
            <div class="bar-chart">
              <div class="bar-col" v-for="d in weekData" :key="d.day">
                <div class="bar" :style="{ height: (d.mins / 120 * 80) + 'px', background: d.today ? '#00f2ff' : '#7209b740' }" />
                <div class="bar-day">{{ d.day }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

// ─── 算法可视化 ──────────────────────────────────────────────

const algoList = [
  { id: 'bubble',    label: '冒泡排序' },
  { id: 'selection', label: '选择排序' },
  { id: 'insertion', label: '插入排序' },
  { id: 'quick',     label: '快速排序' },
  { id: 'merge',     label: '归并排序' },
  { id: 'binary',    label: '二分搜索' },
  { id: 'linked',    label: '链表操作' },
  { id: 'fib',       label: 'DP斐波那契' },
];

const algoDefs = {
  bubble: {
    label: '冒泡排序', timeO: 'O(n²)', spaceO: 'O(1)', stable: '✅ 稳定',
    pseudoCode: [
      'for i = 0 to n-1:',
      '  for j = 0 to n-i-2:',
      '    if arr[j] > arr[j+1]:',
      '      swap(arr[j], arr[j+1])',
      '  mark arr[n-i-1] as sorted',
      'end',
    ],
  },
  selection: {
    label: '选择排序', timeO: 'O(n²)', spaceO: 'O(1)', stable: '❌ 不稳定',
    pseudoCode: [
      'for i = 0 to n-1:',
      '  minIdx = i',
      '  for j = i+1 to n-1:',
      '    if arr[j] < arr[minIdx]:',
      '      minIdx = j',
      '  swap(arr[i], arr[minIdx])',
      'end',
    ],
  },
  insertion: {
    label: '插入排序', timeO: 'O(n²)', spaceO: 'O(1)', stable: '✅ 稳定',
    pseudoCode: [
      'for i = 1 to n-1:',
      '  key = arr[i]',
      '  j = i - 1',
      '  while j >= 0 and arr[j] > key:',
      '    arr[j+1] = arr[j]',
      '    j = j - 1',
      '  arr[j+1] = key',
    ],
  },
  quick: {
    label: '快速排序', timeO: 'O(n log n)', spaceO: 'O(log n)', stable: '❌ 不稳定',
    pseudoCode: [
      'quickSort(arr, lo, hi):',
      '  if lo < hi:',
      '    pivot = arr[hi]  ← 选基准',
      '    i = lo - 1',
      '    for j = lo to hi-1:',
      '      if arr[j] <= pivot: swap(arr[++i], arr[j])',
      '    swap(arr[i+1], arr[hi])',
      '    quickSort(arr, lo, i)',
      '    quickSort(arr, i+2, hi)',
    ],
  },
  merge: {
    label: '归并排序', timeO: 'O(n log n)', spaceO: 'O(n)', stable: '✅ 稳定',
    pseudoCode: [
      'mergeSort(arr, l, r):',
      '  if l >= r: return',
      '  mid = (l + r) / 2',
      '  mergeSort(arr, l, mid)',
      '  mergeSort(arr, mid+1, r)',
      '  merge(arr, l, mid, r)',
      'merge: 比较并合并两个子数组',
    ],
  },
  binary: {
    label: '二分搜索', timeO: 'O(log n)', spaceO: 'O(1)', stable: '— 搜索',
    pseudoCode: [
      'binarySearch(arr, target):',
      '  left = 0, right = n - 1',
      '  while left <= right:',
      '    mid = (left + right) / 2',
      '    if arr[mid] == target: return mid',
      '    else if arr[mid] < target: left = mid + 1',
      '    else: right = mid - 1',
      '  return -1  // 未找到',
    ],
  },
  linked: {
    label: '链表插入/删除', timeO: 'O(n)', spaceO: 'O(1)', stable: '— 链式结构',
    pseudoCode: [
      'insertNode(pos, val):',
      '  node = new Node(val)',
      '  cur = head',
      '  move to pos-1',
      '  node.next = cur.next',
      '  cur.next = node',
      'deleteNode(pos):',
      '  cur.next = cur.next.next',
    ],
  },
  fib: {
    label: 'DP斐波那契', timeO: 'O(n)', spaceO: 'O(n)', stable: '— 动态规划',
    pseudoCode: [
      'fib(n):',
      '  dp[0] = 0, dp[1] = 1',
      '  for i = 2 to n:',
      '    dp[i] = dp[i-1] + dp[i-2]',
      '  return dp[n]',
      '',
      '// 状态转移方程:',
      '// F(n) = F(n-1) + F(n-2)',
    ],
  },
};

const selectedAlgo = ref('bubble');
const currentAlgo = computed(() => algoDefs[selectedAlgo.value]);

// 数组状态
const genArray = (n = 12) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 15);

const rawArray = ref(genArray());
const vizArray = ref([]);
const maxVal = computed(() => Math.max(...vizArray.value.map(v => v.val), 1));

// 搜索
const searchTarget = ref(0);

// 链表
const linkedList = ref([]);

// DP
const dpTable = ref([]);
const dpFormula = ref('');

// 动画控制
const isPlaying = ref(false);
const currentStep = ref(0);
const totalSteps = ref(0);
const animState = ref('准备就绪');
const activePseudoLine = ref(-1);
const speed = ref(3);
const stepLogs = ref([]);
const logBody = ref(null);
let animTimer = null;

// 预计算的动画帧
const frames = ref([]);

// ─── 初始化可视化数组 ───────────────────────────────────────
const initViz = () => {
  if (['bubble','selection','insertion','quick','merge'].includes(selectedAlgo.value)) {
    vizArray.value = rawArray.value.map(v => ({ val: v, state: 'default' }));
  } else if (selectedAlgo.value === 'binary') {
    const sorted = [...rawArray.value].sort((a, b) => a - b).slice(0, 14);
    searchTarget.value = sorted[Math.floor(Math.random() * sorted.length)];
    vizArray.value = sorted.map(v => ({ val: v, state: 'default' }));
  } else if (selectedAlgo.value === 'linked') {
    linkedList.value = [10, 25, 37, 48, 62].map(v => ({ val: v, active: false, isNew: false }));
  } else if (selectedAlgo.value === 'fib') {
    dpTable.value = Array.from({ length: 10 }, (_, i) => ({ val: i < 2 ? i : null, state: i < 2 ? 'done' : 'default' }));
    dpFormula.value = '';
  }
};

// ─── 生成所有算法帧 ─────────────────────────────────────────
const buildFrames = () => {
  const arr = vizArray.value.map(v => v.val);
  const f = [];

  if (selectedAlgo.value === 'bubble') {
    const a = [...arr];
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        f.push({ type: 'compare', i: j, j: j + 1, arr: [...a], pseudoLine: 2, msg: `比较 arr[${j}]=${a[j]} 与 arr[${j+1}]=${a[j+1]}` });
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          f.push({ type: 'swap', i: j, j: j + 1, arr: [...a], pseudoLine: 3, msg: `交换 → arr[${j}]=${a[j]}, arr[${j+1}]=${a[j+1]}` });
        }
      }
      f.push({ type: 'sorted', sorted: a.length - 1 - i, arr: [...a], pseudoLine: 4, msg: `位置 ${a.length-1-i} 已排序 ✓` });
    }
  }

  if (selectedAlgo.value === 'selection') {
    const a = [...arr];
    for (let i = 0; i < a.length; i++) {
      let minIdx = i;
      f.push({ type: 'scan_start', i, arr: [...a], pseudoLine: 1, msg: `从位置 ${i} 开始寻找最小值` });
      for (let j = i + 1; j < a.length; j++) {
        f.push({ type: 'compare', i: minIdx, j, arr: [...a], pseudoLine: 3, msg: `比较 arr[${j}]=${a[j]} 与当前最小 arr[${minIdx}]=${a[minIdx]}` });
        if (a[j] < a[minIdx]) { minIdx = j; f.push({ type: 'new_min', minIdx, arr: [...a], pseudoLine: 4, msg: `新最小值: arr[${minIdx}]=${a[minIdx]}` }); }
      }
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      f.push({ type: 'swap', i, j: minIdx, arr: [...a], pseudoLine: 5, msg: `交换 arr[${i}] ↔ arr[${minIdx}]` });
      f.push({ type: 'sorted', sorted: i, arr: [...a], pseudoLine: 6, msg: `位置 ${i} 固定 ✓` });
    }
  }

  if (selectedAlgo.value === 'insertion') {
    const a = [...arr];
    for (let i = 1; i < a.length; i++) {
      const key = a[i];
      f.push({ type: 'key', i, arr: [...a], pseudoLine: 1, msg: `取出 key = arr[${i}] = ${key}` });
      let j = i - 1;
      while (j >= 0 && a[j] > key) {
        f.push({ type: 'shift', j, arr: [...a], pseudoLine: 4, msg: `arr[${j}]=${a[j]} > key=${key}，右移` });
        a[j + 1] = a[j];
        j--;
      }
      a[j + 1] = key;
      f.push({ type: 'insert', pos: j + 1, arr: [...a], pseudoLine: 6, msg: `插入 key=${key} 到位置 ${j+1}` });
    }
    f.push({ type: 'done', arr: [...a], pseudoLine: -1, msg: '排序完成 ✅' });
  }

  if (selectedAlgo.value === 'quick') {
    const a = [...arr];
    const qs = (lo, hi) => {
      if (lo >= hi) return;
      const pivot = a[hi];
      f.push({ type: 'pivot', pivot: hi, arr: [...a], pseudoLine: 2, msg: `选基准 pivot = arr[${hi}] = ${pivot}` });
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        f.push({ type: 'compare', i: j, j: hi, arr: [...a], pseudoLine: 4, msg: `arr[${j}]=${a[j]} vs pivot=${pivot}` });
        if (a[j] <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; f.push({ type: 'swap', i, j, arr: [...a], pseudoLine: 5, msg: `交换 arr[${i}]↔arr[${j}]` }); }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      f.push({ type: 'partition', pos: i + 1, arr: [...a], pseudoLine: 6, msg: `pivot 就位于 ${i+1}` });
      qs(lo, i); qs(i + 2, hi);
    };
    qs(0, a.length - 1);
    f.push({ type: 'done', arr: [...a], pseudoLine: -1, msg: '快速排序完成 ✅' });
  }

  if (selectedAlgo.value === 'merge') {
    const a = [...arr];
    const ms = (l, r) => {
      if (l >= r) return;
      const mid = Math.floor((l + r) / 2);
      f.push({ type: 'divide', l, r, mid, arr: [...a], pseudoLine: 2, msg: `分割 [${l}..${r}] → [${l}..${mid}] + [${mid+1}..${r}]` });
      ms(l, mid); ms(mid + 1, r);
      // merge
      const tmp = a.slice(l, r + 1);
      let li = 0, ri = mid - l + 1, k = l;
      while (li <= mid - l && ri <= r - l) {
        f.push({ type: 'merge_compare', a: l + li, b: l + ri, arr: [...a], pseudoLine: 6, msg: `归并: 比较 ${tmp[li]} 与 ${tmp[ri]}` });
        if (tmp[li] <= tmp[ri]) { a[k++] = tmp[li++]; } else { a[k++] = tmp[ri++]; }
        f.push({ type: 'merge_write', pos: k - 1, arr: [...a], pseudoLine: 6, msg: `写入 arr[${k-1}] = ${a[k-1]}` });
      }
      while (li <= mid - l) { a[k++] = tmp[li++]; }
      while (ri <= r - l) { a[k++] = tmp[ri++]; }
      f.push({ type: 'merged', l, r, arr: [...a], pseudoLine: 6, msg: `归并完成 [${l}..${r}]` });
    };
    ms(0, a.length - 1);
    f.push({ type: 'done', arr: [...a], pseudoLine: -1, msg: '归并排序完成 ✅' });
  }

  if (selectedAlgo.value === 'binary') {
    const sorted = vizArray.value.map(v => v.val);
    const target = searchTarget.value;
    let left = 0, right = sorted.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      f.push({ type: 'bs_step', left, right, mid, arr: sorted, pseudoLine: 3, msg: `left=${left}, right=${right}, mid=${mid}, arr[mid]=${sorted[mid]}` });
      if (sorted[mid] === target) {
        f.push({ type: 'bs_found', pos: mid, arr: sorted, pseudoLine: 4, msg: `✅ 找到目标 ${target} 在索引 ${mid}` });
        break;
      } else if (sorted[mid] < target) {
        f.push({ type: 'bs_right', left: mid + 1, arr: sorted, pseudoLine: 5, msg: `arr[mid]=${sorted[mid]} < target=${target}，移动 left → ${mid+1}` });
        left = mid + 1;
      } else {
        f.push({ type: 'bs_left', right: mid - 1, arr: sorted, pseudoLine: 6, msg: `arr[mid]=${sorted[mid]} > target=${target}，移动 right → ${mid-1}` });
        right = mid - 1;
      }
    }
    if (left > right) f.push({ type: 'bs_notfound', arr: sorted, pseudoLine: 7, msg: `❌ 未找到目标 ${target}` });
  }

  if (selectedAlgo.value === 'linked') {
    const ops = [
      { type: 'll_start', msg: '初始链表：10 → 25 → 37 → 48 → 62 → NULL', list: [10,25,37,48,62], active: -1, isNew: -1 },
      { type: 'll_traverse', msg: '从头部开始遍历...', list: [10,25,37,48,62], active: 0, isNew: -1, pseudoLine: 3 },
      { type: 'll_traverse', msg: '移动到节点 25...', list: [10,25,37,48,62], active: 1, isNew: -1, pseudoLine: 3 },
      { type: 'll_traverse', msg: '移动到节点 37（插入位置前一节点）', list: [10,25,37,48,62], active: 2, isNew: -1, pseudoLine: 4 },
      { type: 'll_insert', msg: '创建新节点 42，插入到 37 和 48 之间', list: [10,25,37,42,48,62], active: 3, isNew: 3, pseudoLine: 5 },
      { type: 'll_del_start', msg: '现在删除节点 25：移动指针到头部', list: [10,25,37,42,48,62], active: 0, isNew: -1, pseudoLine: 7 },
      { type: 'll_traverse', msg: '找到节点 25 的前驱：节点 10', list: [10,25,37,42,48,62], active: 0, isNew: -1, pseudoLine: 7 },
      { type: 'll_delete', msg: '执行删除：10.next = 37，节点 25 被移除', list: [10,37,42,48,62], active: 0, isNew: -1, pseudoLine: 8 },
      { type: 'll_done', msg: '链表操作完成 ✅', list: [10,37,42,48,62], active: -1, isNew: -1, pseudoLine: -1 },
    ];
    ops.forEach((op, i) => f.push({ ...op, step: i }));
  }

  if (selectedAlgo.value === 'fib') {
    const n = 9;
    const dp = Array(n + 1).fill(null);
    dp[0] = 0; dp[1] = 1;
    f.push({ type: 'fib_init', dp: [...dp], pseudoLine: 1, msg: 'F(0)=0, F(1)=1（基础情况）' });
    for (let i = 2; i <= n; i++) {
      f.push({ type: 'fib_computing', i, dp: [...dp], pseudoLine: 3, msg: `计算 F(${i}) = F(${i-1}) + F(${i-2}) = ${dp[i-1]} + ${dp[i-2]}` });
      dp[i] = dp[i - 1] + dp[i - 2];
      f.push({ type: 'fib_done', i, dp: [...dp], pseudoLine: 3, msg: `F(${i}) = ${dp[i]} ✓` });
    }
    f.push({ type: 'fib_complete', dp: [...dp], pseudoLine: 4, msg: `斐波那契数列计算完成，F(${n}) = ${dp[n]}` });
  }

  frames.value = f;
  totalSteps.value = f.length;
};

// ─── 应用某帧到可视化状态 ───────────────────────────────────
const applyFrame = (frameIdx) => {
  if (frameIdx < 0 || frameIdx >= frames.value.length) return;
  const fr = frames.value[frameIdx];
  activePseudoLine.value = fr.pseudoLine ?? -1;
  animState.value = fr.msg || '';

  // 添加日志
  stepLogs.value.push({ step: frameIdx + 1, msg: fr.msg });
  nextTick(() => { if (logBody.value) logBody.value.scrollTop = logBody.value.scrollHeight; });

  // 更新可视化
  if (['bubble','selection','insertion','quick','merge'].includes(selectedAlgo.value) && fr.arr) {
    const len = fr.arr.length;
    vizArray.value = fr.arr.map((v, idx) => {
      let state = 'default';
      if (fr.type === 'compare' && (idx === fr.i || idx === fr.j)) state = 'comparing';
      else if (fr.type === 'swap' && (idx === fr.i || idx === fr.j)) state = 'swapping';
      else if (fr.type === 'sorted' && idx >= fr.sorted) state = 'sorted';
      else if (fr.type === 'pivot' && idx === fr.pivot) state = 'pivot';
      else if (fr.type === 'partition' && idx === fr.pos) state = 'pivot';
      else if (fr.type === 'done') state = 'sorted';
      else if (fr.type === 'key' && idx === fr.i) state = 'pivot';
      else if (fr.type === 'merge_compare' && (idx === fr.a || idx === fr.b)) state = 'comparing';
      else if (fr.type === 'merge_write' && idx === fr.pos) state = 'swapping';
      else if (fr.type === 'merged') state = 'sorted';
      return { val: v, state };
    });
  }

  if (selectedAlgo.value === 'binary' && fr.arr) {
    vizArray.value = fr.arr.map((v, idx) => {
      let state = 'default';
      if (fr.type === 'bs_step') {
        if (idx < fr.left || idx > fr.right) state = 'eliminated';
        else if (idx === fr.left) state = 'left';
        else if (idx === fr.right) state = 'right';
        else if (idx === fr.mid) state = 'mid';
      } else if (fr.type === 'bs_found' && idx === fr.pos) state = 'found';
      else if (fr.type === 'bs_right' && idx < fr.left) state = 'eliminated';
      else if (fr.type === 'bs_left' && fr.right !== undefined && idx > fr.right) state = 'eliminated';
      else if (fr.type === 'bs_notfound') state = 'eliminated';
      return { val: v, state };
    });
  }

  if (selectedAlgo.value === 'linked' && fr.list) {
    linkedList.value = fr.list.map((v, idx) => ({
      val: v,
      active: idx === fr.active,
      isNew: idx === fr.isNew,
    }));
  }

  if (selectedAlgo.value === 'fib' && fr.dp) {
    dpTable.value = fr.dp.map((v, i) => ({
      val: v,
      state: fr.type === 'fib_computing' && i === fr.i ? 'computing'
           : fr.type === 'fib_done' && i === fr.i ? 'current'
           : v !== null ? 'done' : 'default',
    }));
    if (fr.type === 'fib_computing') dpFormula.value = `F(${fr.i}) = F(${fr.i-1}) + F(${fr.i-2})`;
    else if (fr.type === 'fib_done') dpFormula.value = `F(${fr.i}) = ${fr.dp[fr.i]} ✓`;
    else if (fr.type === 'fib_complete') dpFormula.value = `完成！${fr.msg}`;
  }
};

// ─── 播放控制 ──────────────────────────────────────────────
const speedMs = computed(() => [0, 1200, 800, 450, 200, 60][speed.value]);

const togglePlay = () => {
  if (isPlaying.value) { clearInterval(animTimer); isPlaying.value = false; return; }
  if (currentStep.value >= totalSteps.value) resetAnim();
  isPlaying.value = true;
  animTimer = setInterval(() => {
    if (currentStep.value >= totalSteps.value) { clearInterval(animTimer); isPlaying.value = false; return; }
    applyFrame(currentStep.value);
    currentStep.value++;
  }, speedMs.value);
};

watch(speed, () => {
  if (isPlaying.value) { clearInterval(animTimer); togglePlay(); }
});

const stepForward = () => {
  if (currentStep.value < totalSteps.value) { applyFrame(currentStep.value); currentStep.value++; }
};

const resetAnim = () => {
  clearInterval(animTimer);
  isPlaying.value = false;
  currentStep.value = 0;
  activePseudoLine.value = -1;
  animState.value = '准备就绪';
  stepLogs.value = [];
  initViz();
};

const randomize = () => {
  rawArray.value = genArray();
  resetAnim();
  buildFrames();
};

const selectAlgo = (id) => {
  selectedAlgo.value = id;
  resetAnim();
  buildFrames();
};

// 初始化
initViz();
buildFrames();

onBeforeUnmount(() => clearInterval(animTimer));

// ─── 学生Dashboard原有数据 ─────────────────────────────────

import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const profile = computed(() => ({
  name: userStore.userInfo?.username || '同学',
  avatar: userStore.userInfo?.avatar || 'https://picsum.photos/seed/student_me/56/56',
  todayMinutes: 134,
  streak: 21,
  xp: 3420,
  nextXp: 5000,
  level: 8,
}));

const tasks = ref([
  { id: 1, name: 'Python第10章：面向对象编程', subject: 'Python', deadline: '今天', progress: 80, done: false, image: 'https://picsum.photos/seed/task1/60/45' },
  { id: 2, name: '数学作业：导数与微分', subject: '数学', deadline: '今天 23:59', progress: 30, done: false, image: 'https://picsum.photos/seed/task2/60/45' },
  { id: 3, name: '英语阅读：科技文章', subject: '英语', deadline: '明天', progress: 100, done: true, image: 'https://picsum.photos/seed/task3/60/45' },
  { id: 4, name: '物理：简谐运动练习题', subject: '物理', deadline: '明天', progress: 60, done: false, image: 'https://picsum.photos/seed/task4/60/45' },
  { id: 5, name: '数据结构：链表实现', subject: '编程', deadline: '后天', progress: 20, done: false, image: 'https://picsum.photos/seed/task5/60/45' },
  { id: 6, name: '化学：氧化还原反应', subject: '化学', deadline: '周三', progress: 0, done: false, image: 'https://picsum.photos/seed/task6/60/45' },
  { id: 7, name: '语文：古诗文背诵', subject: '语文', deadline: '周四', progress: 100, done: true, image: 'https://picsum.photos/seed/task7/60/45' },
  { id: 8, name: '历史：近代史要点整理', subject: '历史', deadline: '周四', progress: 45, done: false, image: 'https://picsum.photos/seed/task8/60/45' },
  { id: 9, name: '算法竞赛题：贪心算法', subject: '竞赛', deadline: '周五', progress: 10, done: false, image: 'https://picsum.photos/seed/task9/60/45' },
  { id: 10, name: '英语写作：科技议论文', subject: '英语', deadline: '下周一', progress: 0, done: false, image: 'https://picsum.photos/seed/task10/60/45' },
]);

const wrongQuestions = ref([
  { id: 1, subject: '数学', question: '已知f(x)=x²-2x+1，f\'(x)在x=1处的值为？', myAnswer: '2', correct: '0' },
  { id: 2, subject: '英语', question: 'The committee ___ divided in their opinions.', myAnswer: 'is', correct: 'were' },
  { id: 3, subject: '物理', question: '轻弹簧压缩10cm时弹力为5N，弹簧的劲度系数为？', myAnswer: '0.5 N/m', correct: '50 N/m' },
  { id: 4, subject: '化学', question: 'Na与水反应，0.1mol Na生成H₂多少mol？', myAnswer: '0.1', correct: '0.05' },
  { id: 5, subject: 'Python', question: 'list.sort() 与 sorted(list) 的区别？', myAnswer: '无区别', correct: 'sort原地排序，sorted返回新列表' },
]);

const todayPlan = ref([
  { id: 1, name: '英语晨读', time: '07:30', duration: 20, done: true, active: false },
  { id: 2, name: 'Python作业', time: '08:30', duration: 60, done: true, active: false },
  { id: 3, name: '数学练习', time: '14:00', duration: 45, done: false, active: true },
  { id: 4, name: '物理预习', time: '16:00', duration: 30, done: false, active: false },
  { id: 5, name: '英语写作', time: '19:30', duration: 40, done: false, active: false },
]);

const rankList = ref([
  { id: 1, name: '张晓明', score: 2850, avatar: 'https://picsum.photos/seed/r1/32/32', isMe: false },
  { id: 2, name: '李同学', score: 2640, avatar: 'https://picsum.photos/seed/student_me/32/32', isMe: true },
  { id: 3, name: '王雨晴', score: 2520, avatar: 'https://picsum.photos/seed/r3/32/32', isMe: false },
  { id: 4, name: '陈浩', score: 2380, avatar: 'https://picsum.photos/seed/r4/32/32', isMe: false },
  { id: 5, name: '刘思源', score: 2210, avatar: 'https://picsum.photos/seed/r5/32/32', isMe: false },
  { id: 6, name: '杨明君', score: 2050, avatar: 'https://picsum.photos/seed/r6/32/32', isMe: false },
  { id: 7, name: '赵小红', score: 1980, avatar: 'https://picsum.photos/seed/r7/32/32', isMe: false },
  { id: 8, name: '周建华', score: 1820, avatar: 'https://picsum.photos/seed/r8/32/32', isMe: false },
  { id: 9, name: '吴春燕', score: 1740, avatar: 'https://picsum.photos/seed/r9/32/32', isMe: false },
  { id: 10, name: '郑俊豪', score: 1650, avatar: 'https://picsum.photos/seed/r10/32/32', isMe: false },
]);

const badges = ref([
  { id: 1, icon: '🔥', name: '连续21天', unlocked: true },
  { id: 2, icon: '💻', name: '编程达人', unlocked: true },
  { id: 3, icon: '🧮', name: '数学之星', unlocked: true },
  { id: 4, icon: '📚', name: '阅读100本', unlocked: true },
  { id: 5, icon: '🏆', name: '竞赛冠军', unlocked: true },
  { id: 6, icon: '⚡', name: '极速答题', unlocked: true },
  { id: 7, icon: '🌍', name: '英语能手', unlocked: false },
  { id: 8, icon: '🔬', name: '实验达人', unlocked: false },
  { id: 9, icon: '🎯', name: '百发百中', unlocked: true },
  { id: 10, icon: '🚀', name: '冲刺高手', unlocked: false },
]);

const myStats = ref([
  { icon: '⏱', value: '284h', label: '累计学习' },
  { icon: '✅', value: '198', label: '完成任务' },
  { icon: '📝', value: '86', label: '平均分' },
  { icon: '🔥', value: '21天', label: '连续打卡' },
]);

const weekData = ref([
  { day: '周一', mins: 90, today: false },
  { day: '周二', mins: 120, today: false },
  { day: '周三', mins: 65, today: false },
  { day: '周四', mins: 110, today: false },
  { day: '周五', mins: 85, today: false },
  { day: '周六', mins: 100, today: false },
  { day: '今天', mins: 134, today: true },
]);
</script>

<style scoped>
.student-dashboard {
  padding: 24px;
  background: var(--bg-base);
  min-height: 100vh;
  color: var(--text-primary);
}

/* 欢迎条 */
.welcome-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  padding: 20px 28px;
  margin-bottom: 24px;
}
.welcome-left { display: flex; align-items: center; gap: 16px; }
.profile-avatar { width: 52px; height: 52px; border-radius: 50%; border: 2px solid var(--accent); object-fit: cover; box-shadow: var(--shadow-glow-accent); }
.welcome-text { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.welcome-sub { font-size: 13px; color: var(--text-secondary); }
.welcome-sub b { color: var(--accent); }
.xp-bar-wrap { margin-left: auto; min-width: 220px; }
.xp-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.xp-bar { height: 8px; background: var(--bg-elevated); border-radius: 4px; overflow: hidden; }
.xp-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; transition: width 0.6s; }
.xp-level { font-size: 12px; color: var(--primary-light); margin-top: 6px; text-align: right; }

/* 主布局：3列 */
.main-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.9fr;
  gap: 20px;
}
.col-a, .col-b, .col-c { display: flex; flex-direction: column; gap: 20px; }

/* 卡片 */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.task-count, .wrong-badge, .period-badge, .badge-total {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}
.task-count   { background: var(--warning-soft); color: var(--warning); }
.wrong-badge  { background: var(--danger-soft);  color: var(--danger); }
.period-badge { background: var(--accent-soft);  color: var(--accent); }
.badge-total  { background: var(--bg-elevated);  color: var(--text-muted); }

/* 任务列表 */
.task-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; }
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.task-item.done { opacity: 0.4; }
.task-img { width: 58px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.task-info { flex: 1; }
.task-name { font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 3px; }
.task-meta { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.task-subject {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}
.task-progress-bar { height: 3px; background: var(--bg-base); border-radius: 2px; }
.task-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 2px; }
.task-pct { font-size: 12px; font-weight: 700; color: var(--primary-light); white-space: nowrap; }

/* 错题 */
.wrong-list { display: flex; flex-direction: column; gap: 10px; }
.wrong-item {
  padding: 12px;
  background: var(--danger-soft);
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: var(--radius-md);
}
.wrong-sub { font-size: 11px; color: var(--danger); font-weight: 600; margin-bottom: 4px; }
.wrong-q { font-size: 12px; color: var(--text-primary); margin-bottom: 8px; line-height: 1.5; }
.wrong-footer { display: flex; align-items: center; gap: 12px; }
.wrong-my      { font-size: 11px; color: var(--danger); }
.wrong-correct { font-size: 11px; color: var(--success); }
.btn-review {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-review:hover { background: var(--danger-soft); }

/* 今日计划 */
.plan-items { display: flex; flex-direction: column; }
.plan-row { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; }
.plan-time-dot { display: flex; flex-direction: column; align-items: center; width: 20px; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
.plan-row.done   .dot { background: var(--success); }
.plan-row.active .dot { background: var(--accent); box-shadow: 0 0 8px var(--accent-glow); }
.dot-line { width: 2px; height: 26px; background: var(--border); margin-top: 2px; }
.plan-name     { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.plan-duration { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.plan-icon { margin-left: auto; font-size: 15px; }

/* 排行榜 */
.rank-list { display: flex; flex-direction: column; gap: 8px; }
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
}
.rank-item.is-me {
  background: var(--primary-soft);
  border-color: var(--border-accent);
}
.rank-no { width: 24px; font-size: 14px; text-align: center; }
.rank-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.rank-info { flex: 1; }
.rank-name  { font-size: 13px; color: var(--text-primary); font-weight: 500; }
.rank-score { font-size: 11px; color: var(--text-muted); }
.me-tag {
  background: var(--accent);
  color: var(--bg-base);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
  font-weight: 700;
}
.rank-bar-wrap { width: 80px; }
.rank-bar  { height: 3px; background: var(--bg-base); border-radius: 2px; }
.rank-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 2px; }

/* 成就 */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.badge-item {
  text-align: center;
  padding: 10px 4px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  position: relative;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}
.badge-item:hover { transform: translateY(-2px); border-color: var(--border-strong); }
.badge-item.locked { opacity: 0.3; filter: grayscale(1); }
.badge-icon { font-size: 22px; margin-bottom: 4px; }
.badge-name { font-size: 10px; color: var(--text-muted); }
.badge-glow {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-accent);
  animation: badge-pulse 2s infinite;
}
@keyframes badge-pulse {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.9; }
}

/* 统计 */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.mini-stat {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
}
.mini-icon  { font-size: 18px; margin-bottom: 4px; }
.mini-value { font-size: 16px; font-weight: 700; color: var(--primary-light); }
.mini-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* 周柱状图 */
.week-chart {}
.chart-label { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
.bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 90px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; }
.bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.4s; }
.bar-day { font-size: 10px; color: var(--text-muted); }

/* ═══════════════════════════════════════════════════════════
   算法可视化面板
   ═══════════════════════════════════════════════════════════ */
.algo-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  padding: 22px;
  margin-bottom: 24px;
}

.algo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.algo-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.algo-title    { font-size: 18px; font-weight: 800; color: var(--accent); }
.algo-subtitle { font-size: 12px; color: var(--text-muted); }

.algo-controls { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

.algo-select-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
.algo-btn {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.algo-btn:hover { border-color: var(--primary); color: var(--primary-light); background: var(--primary-soft); }
.algo-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-light);
  font-weight: 700;
  box-shadow: var(--shadow-glow-primary);
}

.speed-wrap { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.speed-label { font-size: 12px; color: var(--text-muted); }
.speed-slider {
  -webkit-appearance: none;
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-elevated);
  outline: none;
  cursor: pointer;
}
.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--primary-light);
  box-shadow: var(--shadow-glow-primary);
}
.speed-val { font-size: 12px; color: var(--primary-light); font-weight: 600; min-width: 28px; }

.algo-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 18px;
}

.viz-area {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.viz-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

/* ─── 排序条形图 ─── */
.bars-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 190px;
  padding: 0 4px;
}
.bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  gap: 3px;
}
.viz-area .bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  min-height: 6px;
  transition: height 0.22s ease, background 0.18s;
  background: rgba(99, 102, 241, 0.4);
}
.viz-area .bar.bar-default   { background: rgba(99, 102, 241, 0.4); }
.viz-area .bar.bar-comparing { background: var(--warning); box-shadow: 0 0 8px rgba(245,158,11,0.5); }
.viz-area .bar.bar-swapping  { background: var(--danger); box-shadow: 0 0 12px rgba(244,63,94,0.7); animation: bar-swap-pulse 0.25s ease; }
.viz-area .bar.bar-sorted    { background: var(--success); box-shadow: 0 0 8px rgba(16,185,129,0.4); }
.viz-area .bar.bar-pivot     { background: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }
@keyframes bar-swap-pulse {
  0%   { transform: scaleY(1.12); }
  60%  { transform: scaleY(0.92); }
  100% { transform: scaleY(1); }
}
.bar-val { font-size: 9px; color: var(--text-muted); text-align: center; }

/* ─── 二分搜索 ─── */
.search-container { display: flex; flex-direction: column; gap: 12px; }
.search-array { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 0; }
.search-cell {
  width: 42px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid var(--border-strong);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.28s;
}
.cell-val   { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.cell-label { font-size: 9px; font-weight: 800; color: var(--text-muted); }
.search-cell.cell-left  { border-color: var(--success); background: var(--success-soft); }
.search-cell.cell-right { border-color: var(--warning); background: var(--warning-soft); }
.search-cell.cell-mid   { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-4px); box-shadow: var(--shadow-glow-accent); }
.search-cell.cell-found { border-color: var(--success); background: rgba(16,185,129,0.25); transform: scale(1.1); box-shadow: 0 0 18px rgba(16,185,129,0.6); }
.search-cell.cell-eliminated { opacity: 0.22; filter: grayscale(0.8); }
.search-info { font-size: 12px; color: var(--text-secondary); padding: 7px 10px; background: var(--bg-surface); border-radius: 8px; }
.text-tech-blue   { color: var(--accent); }
.text-tech-purple { color: var(--primary-light); }

/* ─── 链表 ─── */
.linked-container { display: flex; flex-direction: column; gap: 14px; }
.linked-row { display: flex; align-items: center; flex-wrap: wrap; padding: 10px 0; }
.linked-node {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--border-strong);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  margin-right: 0;
}
.linked-node.node-active { border-color: var(--accent); box-shadow: var(--shadow-glow-accent); }
.linked-node.node-new    { border-color: var(--success); box-shadow: 0 0 12px rgba(16,185,129,0.5); animation: node-appear 0.35s ease; }
@keyframes node-appear {
  from { opacity: 0; transform: translateY(-8px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.node-val { padding: 9px 13px; font-size: 15px; font-weight: 700; color: var(--text-primary); background: var(--bg-elevated); }
.node-ptr { padding: 9px 7px; font-size: 14px; color: var(--text-muted); background: var(--bg-surface); display: flex; align-items: center; }
.linked-null { padding: 9px 13px; font-size: 12px; color: var(--text-muted); font-style: italic; display: flex; align-items: center; }
.linked-info { font-size: 12px; color: var(--text-secondary); }

/* ─── DP 斐波那契 ─── */
.dp-container { display: flex; flex-direction: column; gap: 12px; }
.dp-row { display: flex; flex-wrap: wrap; gap: 7px; padding: 6px 0; }
.dp-cell {
  width: 52px;
  height: 60px;
  border-radius: 10px;
  border: 2px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: all 0.3s;
}
.dp-idx { font-size: 10px; color: var(--text-muted); }
.dp-val { font-size: 16px; font-weight: 700; color: var(--text-muted); }
.dp-cell.dp-done { border-color: rgba(16,185,129,0.4); background: var(--success-soft); }
.dp-cell.dp-done .dp-val { color: var(--success); }
.dp-cell.dp-computing { border-color: var(--warning); background: var(--warning-soft); animation: dp-pop 0.28s ease; }
.dp-cell.dp-computing .dp-val { color: var(--warning); }
.dp-cell.dp-current { border-color: var(--accent); background: var(--accent-soft); transform: scale(1.08); box-shadow: var(--shadow-glow-accent); }
.dp-cell.dp-current .dp-val { color: var(--accent); }
@keyframes dp-pop {
  0%   { transform: scale(0.85); opacity: 0.5; }
  65%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
.dp-formula {
  font-size: 13px;
  color: var(--primary-light);
  font-weight: 600;
  padding: 7px 12px;
  background: var(--primary-soft);
  border-radius: 8px;
  text-align: center;
  min-height: 36px;
}

/* ─── 播放控制栏 ─── */
.playbar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.play-btn {
  padding: 6px 13px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.play-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary-light); background: var(--primary-soft); }
.play-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.play-btn.primary {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary-light);
}
.play-btn.primary:hover { background: var(--primary); color: #fff; }
.step-count { margin-left: auto; font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; }

/* ─── 伪代码面板 ─── */
.code-panel { display: flex; flex-direction: column; gap: 12px; }
.pseudo-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.pseudo-code {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  overflow: hidden;
}
.pseudo-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 12px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.7;
  transition: background 0.18s, color 0.18s;
  border-left: 3px solid transparent;
}
.pseudo-line .line-no { min-width: 16px; font-size: 10px; color: var(--border-strong); user-select: none; text-align: right; }
.pseudo-line .line-text { flex: 1; white-space: pre; }
.pseudo-line.pseudo-active {
  background: var(--primary-soft);
  color: var(--primary-light);
  border-left-color: var(--primary);
  font-weight: 600;
}
.pseudo-line.pseudo-active .line-no { color: var(--primary-light); }

/* ─── 算法信息框 ─── */
.algo-info-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.info-row { display: flex; align-items: center; justify-content: space-between; }
.info-label { font-size: 12px; color: var(--text-muted); }
.info-val { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 2px 8px; border-radius: 6px; }
.info-val.time  { color: var(--warning); background: var(--warning-soft); }
.info-val.space { color: var(--success); background: var(--success-soft); }
.info-val:not(.time):not(.space) { color: var(--text-secondary); background: var(--bg-surface); }

/* ─── 执行日志 ─── */
.step-log {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.log-title { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
.log-body { overflow-y: auto; display: flex; flex-direction: column; gap: 4px; max-height: 160px; }
.log-body::-webkit-scrollbar       { width: 3px; }
.log-body::-webkit-scrollbar-track { background: transparent; }
.log-body::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }
.log-entry {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 4px 6px;
  border-radius: 6px;
  background: var(--bg-elevated);
}
.log-entry.log-latest { background: var(--primary-soft); border: 1px solid var(--border-accent); }
.log-step { font-size: 10px; color: var(--primary-light); font-weight: 700; min-width: 20px; text-align: right; font-variant-numeric: tabular-nums; }
.log-msg  { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
.log-empty { font-size: 11px; color: var(--text-muted); text-align: center; padding: 18px 0; font-style: italic; }

/* ─── 响应式 ─── */
@media (max-width: 1100px) {
  .algo-body { grid-template-columns: 1fr; }
  .code-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
}
@media (max-width: 1300px) {
  .main-layout { grid-template-columns: 1fr 1fr; }
  .col-c { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 900px) {
  .main-layout { grid-template-columns: 1fr; }
  .col-c { grid-column: auto; display: flex; }
  .badges-grid { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 720px) {
  .algo-body { grid-template-columns: 1fr; }
  .code-panel { display: flex; flex-direction: column; }
  .algo-header { flex-direction: column; }
  .welcome-bar { flex-direction: column; }
}
</style>
