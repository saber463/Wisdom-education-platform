<template>
  <div class="algo-viz-page min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
      <!-- 页面头部 -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            算法可视化实验室
          </h1>
          <p class="text-gray-400 mt-1">通过交互式动画深入理解经典算法原理</p>
        </div>
        <div class="flex items-center gap-3">
          <select 
            v-model="selectedAlgo" 
            class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-all"
          >
            <option v-for="algo in algorithms" :key="algo.id" :value="algo.id">
              {{ algo.name }}
            </option>
          </select>
          <button 
            @click="resetArray" 
            class="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="随机重置数据"
          >
            <i class="fa fa-sync-alt" :class="{ 'fa-spin': isSorting }"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：可视化画布 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="glass-card p-4 md:p-8 min-h-[450px] flex items-end justify-center overflow-x-auto overflow-y-hidden bar-container">
            <div 
              v-for="(val, idx) in array" 
              :key="idx"
              class="flex flex-col items-center justify-end h-full transition-all duration-300 relative group"
              :style="{ width: barWidth, margin: `0 ${barMargin}px` }"
            >
              <!-- 数值显示 (顶部浮动 - 可选) -->
              <div 
                v-if="arraySize <= 25"
                class="absolute -top-8 text-[10px] font-bold text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ val }}
              </div>

              <!-- 柱状图 -->
              <div 
                class="array-bar w-full rounded-t-md transition-all duration-300 shadow-sm relative"
                :style="{ 
                  height: `${val * 3}px`, 
                  backgroundColor: getBarColor(idx),
                  boxShadow: activeIndices.includes(idx) ? '0 0 15px rgba(96, 165, 250, 0.6)' : 'none'
                }"
              >
                <!-- 进度高亮 -->
                <div 
                  v-if="activeIndices.includes(idx)"
                  class="absolute inset-0 bg-white/20 animate-pulse rounded-t-md"
                ></div>
              </div>

              <!-- 底部数值显示 -->
              <div class="h-8 flex flex-col items-center justify-start mt-2 w-full">
                <span 
                  v-if="arraySize <= 40" 
                  class="text-[11px] font-mono transition-all duration-200 select-none"
                  :class="[
                    activeIndices.includes(idx) ? 'text-blue-400 font-extrabold scale-110' : 
                    sortedIndices.includes(idx) ? 'text-emerald-400' : 'text-gray-500'
                  ]"
                >
                  {{ val }}
                </span>
                <!-- 数据量大时显示索引或点 -->
                <div 
                  v-else-if="idx % 5 === 0" 
                  class="flex flex-col items-center gap-1"
                >
                  <div class="w-1 h-1 rounded-full bg-gray-600"></div>
                  <span class="text-[8px] text-gray-600 font-mono">{{ val }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 控制面板 -->
          <div class="glass-card p-6 flex flex-wrap items-center justify-center gap-6">
            <!-- 目标值显示 (二分搜索或线性搜索) -->
            <div v-if="selectedAlgo === 'binarySearch' || selectedAlgo === 'linearSearch'" class="w-full flex justify-center mb-2">
              <div class="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-bold animate-bounce">
                🎯 寻找目标: {{ targetValue }}
              </div>
            </div>

            <div class="flex items-center gap-4">
              <button 
                @click="startSort" 
                :disabled="isSorting"
                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <i class="fa fa-play"></i> 开始演示
              </button>
              <button 
                @click="stopSort" 
                :disabled="!isSorting"
                class="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-xl font-medium transition-all"
              >
                停止
              </button>
            </div>

            <div class="flex items-center gap-6 text-sm text-gray-400">
              <div class="flex flex-col gap-2">
                <label>演示速度: {{ speed }}ms</label>
                <input type="range" v-model="speed" min="10" max="500" step="10" class="accent-blue-500" />
              </div>
              <div class="flex flex-col gap-2">
                <label>数据量: {{ arraySize }}</label>
                <input type="range" v-model="arraySize" min="10" max="100" step="5" @input="resetArray" class="accent-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：算法详情与伪代码 -->
        <div class="space-y-6">
          <div class="glass-card p-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              <i class="fa fa-info-circle text-blue-400"></i> 算法说明
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-4">
              {{ currentAlgoInfo.desc }}
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <div class="text-xs text-gray-500">时间复杂度</div>
                <div class="text-blue-400 font-mono">{{ currentAlgoInfo.time }}</div>
              </div>
              <div class="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <div class="text-xs text-gray-500">空间复杂度</div>
                <div class="text-emerald-400 font-mono">{{ currentAlgoInfo.space }}</div>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              <i class="fa fa-code text-purple-400"></i> 伪代码
            </h3>
            <div class="bg-gray-900 rounded-lg p-4 font-mono text-xs leading-relaxed text-purple-300">
              <pre><code>{{ currentAlgoInfo.pseudo }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';

const algorithms = [
  { id: 'bubble', name: '冒泡排序 (Bubble Sort)' },
  { id: 'selection', name: '选择排序 (Selection Sort)' },
  { id: 'insertion', name: '插入排序 (Insertion Sort)' },
  { id: 'shell', name: '希尔排序 (Shell Sort)' },
  { id: 'quick', name: '快速排序 (Quick Sort)' },
  { id: 'merge', name: '归并排序 (Merge Sort)' },
  { id: 'heap', name: '堆排序 (Heap Sort)' },
  { id: 'binarySearch', name: '二分搜索 (Binary Search)' },
  { id: 'counting', name: '计数排序 (Counting Sort)' },
  { id: 'radix', name: '基数排序 (Radix Sort)' },
  { id: 'linearSearch', name: '线性搜索 (Linear Search)' }
];

const algoData = {
  bubble: {
    desc: '【故事背景】：想象一群小朋友排队领糖果，但是个子高的挡住了后面的视线。于是老师让相邻的小朋友两两比较，高的往后站。这样一轮下来，最高的小朋友就像水里的气泡一样，“浮”到了队伍的最后面。',
    time: 'O(n²)',
    space: 'O(1)',
    pseudo: `// 冒泡排序：大鱼吃小鱼，大泡浮水面
for i from 0 to n-1:
  // 每一轮都能确定一个最大的数在末尾
  for j from 0 to n-i-1:
    // 如果左边比右边大，就交换位置
    if arr[j] > arr[j+1]:
      swap(arr[j], arr[j+1])`
  },
  selection: {
    desc: '【故事背景】：在一堆乱糟糟的扑克牌里，你打算找出最小的那一张。你先假设第一张是最小的，然后扫描全场，一旦发现更小的就记住它的位置。扫完一遍后，把这张真正的“全场最小”和第一张交换。这就是“精英选拔制”。',
    time: 'O(n²)',
    space: 'O(1)',
    pseudo: `// 选择排序：地毯式搜索，选拔全场最小
for i from 0 to n-1:
  min_idx = i // 假设当前是最小的
  for j from i+1 to n:
    // 发现更小的，记录它的位置
    if arr[j] < arr[min_idx]:
      min_idx = j
  // 将找到的真正最小值换到前面
  swap(arr[i], arr[min_idx])`
  },
  insertion: {
    desc: '【故事背景】：就像你正在摸扑克牌。手里已经有一排排好序的牌了，每摸一张新牌，你都会从右向左看，把它插到合适的位置。如果新牌比左边的牌小，左边的牌就得往后挪个坑，直到找到新牌的归宿。',
    time: 'O(n²)',
    space: 'O(1)',
    pseudo: `// 插入排序：摸牌入手，找准坑位
for i from 1 to n:
  key = arr[i] // 刚摸到的新牌
  j = i - 1
  // 把比新牌大的牌都往后挪一个位置
  while j >= 0 and arr[j] > key:
    arr[j + 1] = arr[j]
    j = j - 1
  // 找到空位，插入新牌
  arr[j + 1] = key`
  },
  shell: {
    desc: '【故事背景】：希尔排序是插入排序的“远程升级版”。它不再只比较相邻的牌，而是先设定一个间隔（增量），跨步比较。通过这种“远距离打击”，能让数据快速移动到它大概该去的地方，最后再进行一次细致的相邻插入。',
    time: 'O(n log² n)',
    space: 'O(1)',
    pseudo: `// 希尔排序：跨步飞跃，远程归位
for gap = n/2 down to 1:
  // 对每一个增量间隔进行插入排序
  for i from gap to n-1:
    temp = arr[i]
    j = i
    while j >= gap and arr[j-gap] > temp:
      arr[j] = arr[j-gap]
      j -= gap
    arr[j] = temp`
  },
  quick: {
    desc: '【故事背景】：这是算法界的“闪电侠”。它找一个“基准点”（就像班长），让比班长矮的站左边，高的站右边。然后左右两边各自再找小班长，继续分裂。这种“分而治之”的方法效率极高。',
    time: 'O(n log n)',
    space: 'O(log n)',
    pseudo: `// 快速排序：找个班长，左右开弓
func quicksort(arr, low, high):
  if low < high:
    // 分区：比基准小的在左，大的在右
    p = partition(arr, low, high)
    // 递归处理左半部分
    quicksort(arr, low, p - 1)
    // 递归处理右半部分
    quicksort(arr, p + 1, high)`
  },
  merge: {
    desc: '【故事背景】：归并排序像是一场完美的联姻。先把队伍拆成两半，直到拆成单个人，然后两两合并。在合并时，我们有条不紊地比较两个小队的领头人，谁小谁先进新队伍。它虽然费空间，但非常稳定且公平。',
    time: 'O(n log n)',
    space: 'O(n)',
    pseudo: `// 归并排序：先分后合，强强联手
func mergesort(arr):
  if n <= 1: return arr
  // 拆分成左右两半
  mid = n / 2
  left = mergesort(arr[0...mid])
  right = mergesort(arr[mid...n])
  // 合并两个有序数组
  return merge(left, right)`
  },
  heap: {
    desc: '【故事背景】：想象一个金字塔（大顶堆），塔尖永远是权力最大（数值最高）的人。我们先把所有数建成一个堆，然后把塔尖的大王和塔底的小兵交换，让大王退位（移出排序）。接着让剩下的兵重新选出新大王。',
    time: 'O(n log n)',
    space: 'O(1)',
    pseudo: `// 堆排序：构建金字塔，大王退位
// 1. 先把数组建成大顶堆
buildHeap(arr)
for i from n-1 down to 1:
  // 2. 将最大的数(堆顶)换到末尾
  swap(arr[0], arr[i])
  // 3. 调整剩下的堆，选出新大王
  heapify(arr, 0, i)`
  },
  binarySearch: {
    desc: '【故事背景】：在字典里找一个单词，你会先翻到中间。如果中间的单词比你要找的小，你就去右半边找；否则去左半边。每次都能砍掉一半的可能性！注意：它要求数据必须是排好序的。',
    time: 'O(log n)',
    space: 'O(1)',
    pseudo: `// 二分搜索：拦腰斩断，极速锁定
while low <= high:
  mid = (low + high) / 2
  if arr[mid] == target:
    return mid // 找到了！
  else if arr[mid] < target:
    low = mid + 1 // 去右边
  else:
    high = mid - 1 // 去左边`
  },
  counting: {
    desc: '【故事背景】：想象你在统计选票。你准备了一排盒子，每个盒子代表一个数字。每看到一个数，就在对应的盒子里丢一颗豆子。最后，你只需要按顺序把盒子里的豆子倒出来，数字就排好序了。它不需要两两比较，速度飞快，但只适合数字范围不大的情况。',
    time: 'O(n + k)',
    space: 'O(k)',
    pseudo: `// 计数排序：统计票数，按盒倒出
count = array of zeros(max_val + 1)
// 1. 统计每个数字出现的次数
for num in arr:
  count[num]++
// 2. 根据统计结果重新填充数组
idx = 0
for i from 0 to max_val:
  while count[i] > 0:
    arr[idx++] = i
    count[i]--`
  },
  radix: {
    desc: '【故事背景】：就像给信件分拣。先看邮编的最后一位，按 0-9 分类；再看倒数第二位，重新分类... 如此往复。每一轮分拣都基于前一轮的结果，最后所有信件都会按邮编从小到大排好。这是一种“按位开挂”的排序方式。',
    time: 'O(d * (n + r))',
    space: 'O(n + r)',
    pseudo: `// 基数排序：逐位分拣，聚沙成塔
for digit_pos from 1 to max_digits:
  // 按当前位(个位、十位...)将数放入 0-9 的桶中
  distribute_to_buckets(arr, digit_pos)
  // 按桶的顺序收集回原数组
  collect_from_buckets(arr)`
  },
  linearSearch: {
    desc: '【故事背景】：这是最原始但也最可靠的方法。就像在人群中寻找一个朋友，你从第一个人开始看，一个一个对比，直到找到那个熟悉的面孔或者看完了所有人。它不要求数据有序，但效率较低。',
    time: 'O(n)',
    space: 'O(1)',
    pseudo: `// 线性搜索：地毯式排查
for i from 0 to n-1:
  if arr[i] == target:
    return i // 找到了！
return -1 // 没找到`
  }
};

const selectedAlgo = ref('bubble');
const array = ref([]);
const arraySize = ref(30);
const speed = ref(50);
const isSorting = ref(false);
const activeIndices = ref([]); // 当前比较的索引
const sortedIndices = ref([]); // 已排序的索引

const currentAlgoInfo = computed(() => algoData[selectedAlgo.value]);

// 响应式计算柱状图宽度和间距
const barWidth = computed(() => {
  if (arraySize.value <= 20) return '30px';
  if (arraySize.value <= 40) return '20px';
  if (arraySize.value <= 60) return '12px';
  return '6px';
});

const barMargin = computed(() => {
  if (arraySize.value <= 20) return 6;
  if (arraySize.value <= 40) return 3;
  if (arraySize.value <= 60) return 2;
  return 1;
});

const resetArray = () => {
  if (isSorting.value) return;
  const newArr = [];
  for (let i = 0; i < arraySize.value; i++) {
    newArr.push(Math.floor(Math.random() * 100) + 10);
  }
  array.value = newArr;
  activeIndices.value = [];
  sortedIndices.value = [];
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getBarColor = (idx) => {
  if (activeIndices.value.includes(idx)) return '#60a5fa'; // 蓝色 - 激活
  if (sortedIndices.value.includes(idx)) return '#34d399'; // 绿色 - 已完成
  return '#334155'; // 灰色 - 默认
};const targetValue = ref(0);

const startSort = async () => {
  isSorting.value = true;
  sortedIndices.value = [];
  
  if (selectedAlgo.value === 'binarySearch' || selectedAlgo.value === 'linearSearch') {
    targetValue.value = array.value[Math.floor(Math.random() * array.value.length)];
  }

  if (selectedAlgo.value === 'bubble') await bubbleSort();  else if (selectedAlgo.value === 'selection') await selectionSort();
  else if (selectedAlgo.value === 'insertion') await insertionSort();
  else if (selectedAlgo.value === 'shell') await shellSort();
  else if (selectedAlgo.value === 'quick') await quickSort(0, array.value.length - 1);
  else if (selectedAlgo.value === 'merge') await mergeSort(0, array.value.length - 1);
  else if (selectedAlgo.value === 'heap') await heapSort();
  else if (selectedAlgo.value === 'binarySearch') await binarySearch();
  else if (selectedAlgo.value === 'counting') await countingSort();
  else if (selectedAlgo.value === 'radix') await radixSort();
  else if (selectedAlgo.value === 'linearSearch') await linearSearch();

  isSorting.value = false;
  activeIndices.value = [];
  if (selectedAlgo.value !== 'binarySearch' && selectedAlgo.value !== 'linearSearch') {
    sortedIndices.value = Array.from({ length: array.value.length }, (_, i) => i);
  }
  ElMessage.success('演示完成！');
};

const stopSort = () => {
  isSorting.value = false;
  resetArray();
};

const linearSearch = async () => {
  const n = array.value.length;
  const target = targetValue.value;
  ElMessage.info(`目标值: ${target}，开始线性搜索...`);

  for (let i = 0; i < n; i++) {
    if (!isSorting.value) return;
    activeIndices.value = [i];
    await sleep(speed.value);

    if (array.value[i] === target) {
      sortedIndices.value = [i];
      ElMessage.success(`找到目标值 ${target} 在索引 ${i}`);
      return;
    }
  }
  ElMessage.warning(`未找到目标值 ${target}`);
};

const bubbleSort = async () => {
  const n = array.value.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (!isSorting.value) return;
      activeIndices.value = [j, j + 1];
      await sleep(speed.value);
      if (array.value[j] > array.value[j + 1]) {
        [array.value[j], array.value[j + 1]] = [array.value[j + 1], array.value[j]];
      }
    }
    sortedIndices.value.push(n - i - 1);
  }
};

const selectionSort = async () => {
  const n = array.value.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (!isSorting.value) return;
      activeIndices.value = [i, j, minIdx];
      await sleep(speed.value);
      if (array.value[j] < array.value[minIdx]) {
        minIdx = j;
      }
    }
    [array.value[i], array.value[minIdx]] = [array.value[minIdx], array.value[i]];
    sortedIndices.value.push(i);
  }
};

const insertionSort = async () => {
  const n = array.value.length;
  sortedIndices.value = [0];
  for (let i = 1; i < n; i++) {
    let key = array.value[i];
    let j = i - 1;
    activeIndices.value = [i];
    while (j >= 0 && array.value[j] > key) {
      if (!isSorting.value) return;
      activeIndices.value = [j, j + 1];
      await sleep(speed.value);
      array.value[j + 1] = array.value[j];
      j = j - 1;
    }
    array.value[j + 1] = key;
    sortedIndices.value.push(i);
  }
};

const shellSort = async () => {
  const n = array.value.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      if (!isSorting.value) return;
      let temp = array.value[i];
      let j = i;
      activeIndices.value = [i, j - gap];
      await sleep(speed.value);
      while (j >= gap && array.value[j - gap] > temp) {
        if (!isSorting.value) return;
        array.value[j] = array.value[j - gap];
        j -= gap;
        activeIndices.value = [j, i];
        await sleep(speed.value);
      }
      array.value[j] = temp;
    }
  }
};

const quickSort = async (low, high) => {
  if (!isSorting.value) return;
  if (low < high) {
    const pIdx = await partition(low, high);
    await quickSort(low, pIdx - 1);
    await quickSort(pIdx + 1, high);
  }
};

const partition = async (low, high) => {
  const pivot = array.value[high];
  let i = low - 1;
  activeIndices.value = [high];
  for (let j = low; j < high; j++) {
    if (!isSorting.value) return;
    activeIndices.value = [j, high, i + 1];
    await sleep(speed.value);
    if (array.value[j] < pivot) {
      i++;
      [array.value[i], array.value[j]] = [array.value[j], array.value[i]];
    }
  }
  [array.value[i + 1], array.value[high]] = [array.value[high], array.value[i + 1]];
  return i + 1;
};

const mergeSort = async (l, r) => {
  if (!isSorting.value) return;
  if (l < r) {
    const m = Math.floor(l + (r - l) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
  }
};

const merge = async (l, m, r) => {
  let n1 = m - l + 1;
  let n2 = r - m;
  let L = array.value.slice(l, m + 1);
  let R = array.value.slice(m + 1, r + 1);

  let i = 0, j = 0, k = l;
  while (i < n1 && j < n2) {
    if (!isSorting.value) return;
    activeIndices.value = [l + i, m + 1 + j];
    await sleep(speed.value);
    if (L[i] <= R[j]) {
      array.value[k] = L[i];
      i++;
    } else {
      array.value[k] = R[j];
      j++;
    }
    k++;
  }
  while (i < n1) {
    if (!isSorting.value) return;
    array.value[k] = L[i];
    i++; k++;
    await sleep(speed.value);
  }
  while (j < n2) {
    if (!isSorting.value) return;
    array.value[k] = R[j];
    j++; k++;
    await sleep(speed.value);
  }
};

const heapSort = async () => {
  const n = array.value.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(n, i);
  }
  for (let i = n - 1; i > 0; i--) {
    if (!isSorting.value) return;
    activeIndices.value = [0, i];
    await sleep(speed.value);
    [array.value[0], array.value[i]] = [array.value[i], array.value[0]];
    sortedIndices.value.push(i);
    await heapify(i, 0);
  }
};

const heapify = async (n, i) => {
  let largest = i;
  let l = 2 * i + 1;
  let r = 2 * i + 2;

  if (l < n && array.value[l] > array.value[largest]) largest = l;
  if (r < n && array.value[r] > array.value[largest]) largest = r;

  if (largest !== i) {
    if (!isSorting.value) return;
    activeIndices.value = [i, largest];
    await sleep(speed.value);
    [array.value[i], array.value[largest]] = [array.value[largest], array.value[i]];
    await heapify(n, largest);
  }
};

const countingSort = async () => {
  const n = array.value.length;
  const max = Math.max(...array.value);
  const min = Math.min(...array.value);
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  
  // 1. 计数
  for (let i = 0; i < n; i++) {
    if (!isSorting.value) return;
    activeIndices.value = [i];
    count[array.value[i] - min]++;
    await sleep(speed.value);
  }

  // 2. 写回
  let idx = 0;
  for (let i = 0; i < range; i++) {
    while (count[i] > 0) {
      if (!isSorting.value) return;
      array.value[idx] = i + min;
      activeIndices.value = [idx];
      sortedIndices.value.push(idx);
      count[i]--;
      idx++;
      await sleep(speed.value);
    }
  }
};

const radixSort = async () => {
  const n = array.value.length;
  const max = Math.max(...array.value);
  
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    if (!isSorting.value) return;
    await countSortForRadix(n, exp);
  }
};

const countSortForRadix = async (n, exp) => {
  let output = new Array(n).fill(0);
  let count = new Array(10).fill(0);

  // 1. 计数当前位
  for (let i = 0; i < n; i++) {
    if (!isSorting.value) return;
    activeIndices.value = [i];
    let digit = Math.floor(array.value[i] / exp) % 10;
    count[digit]++;
    await sleep(speed.value / 2);
  }

  // 2. 累加计数
  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }

  // 3. 构建输出数组
  for (let i = n - 1; i >= 0; i--) {
    let digit = Math.floor(array.value[i] / exp) % 10;
    output[count[digit] - 1] = array.value[i];
    count[digit]--;
  }

  // 4. 写回原数组
  for (let i = 0; i < n; i++) {
    if (!isSorting.value) return;
    array.value[i] = output[i];
    activeIndices.value = [i];
    await sleep(speed.value);
  }
};

const binarySearch = async () => {
  // 先排序
  array.value.sort((a, b) => a - b);
  sortedIndices.value = [];
  const target = targetValue.value;
  ElMessage.info(`目标值: ${target}，开始二分搜索...`);
  
  let low = 0;
  let high = array.value.length - 1;
  while (low <= high) {
    if (!isSorting.value) return;
    let mid = Math.floor((low + high) / 2);
    activeIndices.value = [low, mid, high];
    await sleep(speed.value * 5); // 搜慢一点
    
    if (array.value[mid] === target) {
      sortedIndices.value = [mid];
      ElMessage.success(`找到目标值 ${target} 在索引 ${mid}`);
      return;
    }
    if (array.value[mid] < target) {
      for (let k = low; k <= mid; k++) sortedIndices.value.push(k); // 标记舍弃部分
      low = mid + 1;
    } else {
      for (let k = mid; k <= high; k++) sortedIndices.value.push(k); // 标记舍弃部分
      high = mid - 1;
    }
  }
};

onMounted(resetArray);
watch(selectedAlgo, resetArray);
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.bar-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.bar-container::-webkit-scrollbar {
  height: 6px;
}

.bar-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.array-bar {
  min-width: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

input[type="range"] {
  height: 6px;
  border-radius: 3px;
  cursor: pointer;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.1);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
}

@media (max-width: 768px) {
  .array-bar {
    min-width: 2px !important;
  }
}
</style>