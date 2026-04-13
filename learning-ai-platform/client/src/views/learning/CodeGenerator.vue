<template>
  <div class="code-generator-page">
    <!-- 页面标题 -->
    <div class="bg-gradient-to-r from-tech-blue via-tech-purple to-tech-pink text-white py-14 px-4 relative overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div class="container mx-auto max-w-7xl relative z-10 text-center">
        <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
          <i class="fa fa-code text-tech-blue" /> 在线代码生成器
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-4">算法代码生成器</h1>
        <p class="text-white/80 text-lg max-w-2xl mx-auto">
          支持 6 大算法类别 × 6 种编程语言，一键生成标准实现代码，助力算法学习与面试准备
        </p>
      </div>
    </div>

    <div class="container mx-auto max-w-7xl px-4 py-8">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">

        <!-- 左侧：算法选择面板 -->
        <div class="xl:col-span-1 space-y-4">
          <!-- 语言选择 -->
          <div class="glass-card rounded-2xl p-5">
            <h3 class="font-bold text-white mb-3 flex items-center gap-2">
              <i class="fa fa-globe text-tech-blue" /> 编程语言
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="lang in languages"
                :key="lang.id"
                :class="[
                  'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                  selectedLang === lang.id
                    ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white border-transparent shadow-neon-blue'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-tech-blue/30',
                ]"
                @click="selectedLang = lang.id"
              >
                <i :class="lang.icon" class="mr-1" />{{ lang.name }}
              </button>
            </div>
          </div>

          <!-- 算法分类 -->
          <div class="glass-card rounded-2xl p-5">
            <h3 class="font-bold text-white mb-3 flex items-center gap-2">
              <i class="fa fa-sitemap text-tech-purple" /> 算法分类
            </h3>
            <div class="space-y-1">
              <button
                v-for="category in algorithmCategories"
                :key="category.id"
                :class="[
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-tech-blue/30 to-tech-purple/30 text-white border border-tech-blue/40'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white',
                ]"
                @click="selectCategory(category.id)"
              >
                <span class="text-base">{{ category.icon }}</span>
                {{ category.name }}
                <span class="ml-auto text-xs text-gray-500">{{ category.algorithms.length }}</span>
              </button>
            </div>
          </div>

          <!-- 算法列表 -->
          <div v-if="selectedCategory" class="glass-card rounded-2xl p-5">
            <h3 class="font-bold text-white mb-3 flex items-center gap-2">
              <i class="fa fa-list text-tech-pink" /> 选择算法
            </h3>
            <div class="space-y-1">
              <button
                v-for="algo in currentCategory?.algorithms"
                :key="algo.id"
                :class="[
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  selectedAlgo === algo.id
                    ? 'bg-gradient-to-r from-tech-pink/20 to-tech-purple/20 text-white border border-tech-pink/30 font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                ]"
                @click="selectAlgorithm(algo.id)"
              >
                {{ algo.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 中间：代码展示区 -->
        <div class="xl:col-span-2">
          <div class="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
            <!-- 代码标题栏 -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
              <div class="flex items-center gap-3">
                <div class="flex gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-red-400" />
                  <div class="w-3 h-3 rounded-full bg-yellow-400" />
                  <div class="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span class="text-sm text-gray-400 font-mono">
                  {{ currentAlgoInfo?.name || '请选择算法' }}.{{ langExtensions[selectedLang] }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{{ currentLang?.name }}</span>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-tech-blue/20 hover:bg-tech-blue/30 text-tech-blue rounded-lg text-sm transition-colors"
                  @click="copyCode"
                >
                  <i class="fa" :class="copied ? 'fa-check' : 'fa-copy'" />
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- 代码内容 -->
            <div class="flex-1 overflow-auto p-5 bg-[#0d1117]">
              <pre v-if="currentCode" class="text-sm leading-relaxed"><code :class="`language-${selectedLang}`" v-html="highlightedCode" /></pre>
              <div v-else class="flex flex-col items-center justify-center h-64 text-gray-500">
                <i class="fa fa-code text-5xl mb-4 text-white/10" />
                <p class="text-lg text-white/30">← 请从左侧选择算法分类和算法</p>
                <p class="text-sm text-white/20 mt-2">支持 6 种编程语言输出</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：算法说明面板 -->
        <div class="xl:col-span-1 space-y-4">
          <div v-if="currentAlgoInfo" class="glass-card rounded-2xl p-5">
            <h3 class="font-bold text-white mb-4 flex items-center gap-2">
              <i class="fa fa-info-circle text-tech-blue" /> 算法说明
            </h3>
            <div class="space-y-4">
              <div>
                <h4 class="text-tech-blue font-semibold text-sm mb-1">算法名称</h4>
                <p class="text-white font-medium">{{ currentAlgoInfo.name }}</p>
              </div>
              <div>
                <h4 class="text-tech-blue font-semibold text-sm mb-1">算法描述</h4>
                <p class="text-gray-300 text-sm leading-relaxed">{{ currentAlgoInfo.description }}</p>
              </div>
              <div>
                <h4 class="text-tech-blue font-semibold text-sm mb-2">复杂度分析</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                    <span class="text-gray-400 text-sm">时间复杂度</span>
                    <span class="text-tech-green font-mono text-sm font-bold">{{ currentAlgoInfo.timeComplexity }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                    <span class="text-gray-400 text-sm">空间复杂度</span>
                    <span class="text-tech-purple font-mono text-sm font-bold">{{ currentAlgoInfo.spaceComplexity }}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="text-tech-blue font-semibold text-sm mb-2">难度等级</h4>
                <div class="flex gap-1">
                  <span
                    v-for="i in 5"
                    :key="i"
                    :class="[
                      'w-6 h-2 rounded-full',
                      i <= currentAlgoInfo.difficulty
                        ? 'bg-gradient-to-r from-tech-blue to-tech-purple'
                        : 'bg-white/10',
                    ]"
                  />
                  <span class="text-xs text-gray-400 ml-2">{{ difficultyLabels[currentAlgoInfo.difficulty - 1] }}</span>
                </div>
              </div>
              <div>
                <h4 class="text-tech-blue font-semibold text-sm mb-2">应用场景</h4>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in currentAlgoInfo.tags"
                    :key="tag"
                    class="px-2 py-0.5 bg-tech-blue/10 text-tech-blue rounded text-xs border border-tech-blue/20"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速导航卡片 -->
          <div v-else class="glass-card rounded-2xl p-5">
            <h3 class="font-bold text-white mb-4 flex items-center gap-2">
              <i class="fa fa-rocket text-tech-purple" /> 快速开始
            </h3>
            <div class="space-y-3">
              <div
                v-for="category in algorithmCategories"
                :key="category.id"
                class="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                @click="selectCategory(category.id); selectAlgorithm(category.algorithms[0].id)"
              >
                <span class="text-xl">{{ category.icon }}</span>
                <div>
                  <p class="text-white text-sm font-medium">{{ category.name }}</p>
                  <p class="text-gray-500 text-xs">{{ category.algorithms.length }} 个算法</p>
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
import { ref, computed } from 'vue';

// ============================================================
// 语言配置
// ============================================================
const languages = [
  { id: 'python', name: 'Python', icon: 'fa fa-python' },
  { id: 'javascript', name: 'JavaScript', icon: 'fa fa-js' },
  { id: 'java', name: 'Java', icon: 'fa fa-coffee' },
  { id: 'cpp', name: 'C++', icon: 'fa fa-code' },
  { id: 'go', name: 'Go', icon: 'fa fa-forward' },
  { id: 'rust', name: 'Rust', icon: 'fa fa-gear' },
];

const langExtensions = {
  python: 'py', javascript: 'js', java: 'java', cpp: 'cpp', go: 'go', rust: 'rs',
};

const difficultyLabels = ['入门', '简单', '中等', '困难', '专家'];

// ============================================================
// 算法数据库（6类 × 多算法 × 6语言）
// ============================================================
const codeTemplates = {
  // ── 排序算法 ──────────────────────────────────────────────
  bubble_sort: {
    python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # 已排序，提前退出
    return arr

# 测试
arr = [64, 34, 25, 12, 22, 11, 90]
print("排序结果:", bubble_sort(arr))`,
    javascript: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // 提前退出优化
  }
  return arr;
}

// 测试
const arr = [64, 34, 25, 12, 22, 11, 90];
console.log('排序结果:', bubbleSort(arr));`,
    java: `public class BubbleSort {
    public static int[] bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        return arr;
    }

    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(arr);
        System.out.println(java.util.Arrays.toString(arr));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(arr);
    for (int x : arr) cout << x << " ";
    return 0;
}`,
    go: `package main

import "fmt"

func bubbleSort(arr []int) []int {
    n := len(arr)
    for i := 0; i < n; i++ {
        swapped := false
        for j := 0; j < n-i-1; j++ {
            if arr[j] > arr[j+1] {
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = true
            }
        }
        if !swapped {
            break
        }
    }
    return arr
}

func main() {
    arr := []int{64, 34, 25, 12, 22, 11, 90}
    fmt.Println("排序结果:", bubbleSort(arr))
}`,
    rust: `fn bubble_sort(arr: &mut Vec<i32>) {
    let n = arr.len();
    for i in 0..n {
        let mut swapped = false;
        for j in 0..n - i - 1 {
            if arr[j] > arr[j + 1] {
                arr.swap(j, j + 1);
                swapped = true;
            }
        }
        if !swapped { break; }
    }
}

fn main() {
    let mut arr = vec![64, 34, 25, 12, 22, 11, 90];
    bubble_sort(&mut arr);
    println!("排序结果: {:?}", arr);
}`,
  },
  quick_sort: {
    python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

# 测试
arr = [3, 6, 8, 10, 1, 2, 1]
print("排序结果:", quick_sort(arr))`,
    javascript: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

console.log(quickSort([3, 6, 8, 10, 1, 2, 1]));`,
    java: `import java.util.Arrays;

public class QuickSort {
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }

    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] <= pivot) {
                i++;
                int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
            }
        }
        int temp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = temp;
        return i + 1;
    }

    public static void main(String[] args) {
        int[] arr = {3, 6, 8, 10, 1, 2, 1};
        quickSort(arr, 0, arr.length - 1);
        System.out.println(Arrays.toString(arr));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) swap(arr[++i], arr[j]);
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {3, 6, 8, 10, 1, 2, 1};
    quickSort(arr, 0, arr.size() - 1);
    for (int x : arr) cout << x << " ";
}`,
    go: `package main

import "fmt"

func quickSort(arr []int, low, high int) {
    if low < high {
        pi := partition(arr, low, high)
        quickSort(arr, low, pi-1)
        quickSort(arr, pi+1, high)
    }
}

func partition(arr []int, low, high int) int {
    pivot := arr[high]
    i := low - 1
    for j := low; j < high; j++ {
        if arr[j] <= pivot {
            i++
            arr[i], arr[j] = arr[j], arr[i]
        }
    }
    arr[i+1], arr[high] = arr[high], arr[i+1]
    return i + 1
}

func main() {
    arr := []int{3, 6, 8, 10, 1, 2, 1}
    quickSort(arr, 0, len(arr)-1)
    fmt.Println(arr)
}`,
    rust: `fn quick_sort(arr: &mut Vec<i32>, low: usize, high: usize) {
    if low < high {
        let pi = partition(arr, low, high);
        if pi > 0 { quick_sort(arr, low, pi - 1); }
        quick_sort(arr, pi + 1, high);
    }
}

fn partition(arr: &mut Vec<i32>, low: usize, high: usize) -> usize {
    let pivot = arr[high];
    let mut i = low;
    for j in low..high {
        if arr[j] <= pivot {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, high);
    i
}

fn main() {
    let mut arr = vec![3, 6, 8, 10, 1, 2, 1];
    let n = arr.len() - 1;
    quick_sort(&mut arr, 0, n);
    println!("{:?}", arr);
}`,
  },
  merge_sort: {
    python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

print(merge_sort([38, 27, 43, 3, 9, 82, 10]))`,
    javascript: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  return merge(mergeSort(arr.slice(0, mid)), mergeSort(arr.slice(mid)));
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));`,
    java: `import java.util.Arrays;

public class MergeSort {
    public static int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
        return merge(left, right);
    }

    static int[] merge(int[] l, int[] r) {
        int[] res = new int[l.length + r.length];
        int i = 0, j = 0, k = 0;
        while (i < l.length && j < r.length)
            res[k++] = l[i] <= r[j] ? l[i++] : r[j++];
        while (i < l.length) res[k++] = l[i++];
        while (j < r.length) res[k++] = r[j++];
        return res;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(mergeSort(new int[]{38,27,43,3,9,82,10})));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> merge(vector<int>& l, vector<int>& r) {
    vector<int> res;
    int i = 0, j = 0;
    while (i < (int)l.size() && j < (int)r.size())
        res.push_back(l[i] <= r[j] ? l[i++] : r[j++]);
    while (i < (int)l.size()) res.push_back(l[i++]);
    while (j < (int)r.size()) res.push_back(r[j++]);
    return res;
}

vector<int> mergeSort(vector<int> arr) {
    if (arr.size() <= 1) return arr;
    int mid = arr.size() / 2;
    auto l = mergeSort(vector<int>(arr.begin(), arr.begin() + mid));
    auto r = mergeSort(vector<int>(arr.begin() + mid, arr.end()));
    return merge(l, r);
}

int main() {
    vector<int> arr = {38, 27, 43, 3, 9, 82, 10};
    arr = mergeSort(arr);
    for (int x : arr) cout << x << " ";
}`,
    go: `package main

import "fmt"

func mergeSort(arr []int) []int {
    if len(arr) <= 1 { return arr }
    mid := len(arr) / 2
    return merge(mergeSort(arr[:mid]), mergeSort(arr[mid:]))
}

func merge(l, r []int) []int {
    res := []int{}
    i, j := 0, 0
    for i < len(l) && j < len(r) {
        if l[i] <= r[j] { res = append(res, l[i]); i++ } else { res = append(res, r[j]); j++ }
    }
    res = append(res, l[i:]...)
    res = append(res, r[j:]...)
    return res
}

func main() { fmt.Println(mergeSort([]int{38, 27, 43, 3, 9, 82, 10})) }`,
    rust: `fn merge_sort(arr: Vec<i32>) -> Vec<i32> {
    if arr.len() <= 1 { return arr; }
    let mid = arr.len() / 2;
    let left = merge_sort(arr[..mid].to_vec());
    let right = merge_sort(arr[mid..].to_vec());
    merge(left, right)
}

fn merge(l: Vec<i32>, r: Vec<i32>) -> Vec<i32> {
    let mut res = vec![];
    let (mut i, mut j) = (0, 0);
    while i < l.len() && j < r.len() {
        if l[i] <= r[j] { res.push(l[i]); i += 1; } else { res.push(r[j]); j += 1; }
    }
    res.extend_from_slice(&l[i..]);
    res.extend_from_slice(&r[j..]);
    res
}

fn main() { println!("{:?}", merge_sort(vec![38, 27, 43, 3, 9, 82, 10])); }`,
  },
  // ── 搜索算法 ──────────────────────────────────────────────
  binary_search: {
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
    return -1  # 未找到

# 测试
arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
target = 7
result = binary_search(arr, target)
print(f"目标 {target} 在索引: {result}")`,
    javascript: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log('索引:', binarySearch(arr, 7)); // 输出: 3`,
    java: `public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
        System.out.println("索引: " + binarySearch(arr, 7));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
    cout << "索引: " << binarySearch(arr, 7) << endl;
    return 0;
}`,
    go: `package main

import "fmt"

func binarySearch(arr []int, target int) int {
    left, right := 0, len(arr)-1
    for left <= right {
        mid := left + (right-left)/2
        if arr[mid] == target { return mid }
        if arr[mid] < target { left = mid + 1 } else { right = mid - 1 }
    }
    return -1
}

func main() {
    arr := []int{1, 3, 5, 7, 9, 11, 13, 15, 17, 19}
    fmt.Println("索引:", binarySearch(arr, 7))
}`,
    rust: `fn binary_search(arr: &[i32], target: i32) -> i32 {
    let (mut left, mut right) = (0i32, arr.len() as i32 - 1);
    while left <= right {
        let mid = left + (right - left) / 2;
        if arr[mid as usize] == target { return mid; }
        else if arr[mid as usize] < target { left = mid + 1; }
        else { right = mid - 1; }
    }
    -1
}

fn main() {
    let arr = vec![1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    println!("索引: {}", binary_search(&arr, 7));
}`,
  },
  bfs: {
    python: `from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    result = []

    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return result

# 测试图
graph = {
    'A': ['B', 'C'],
    'B': ['D', 'E'],
    'C': ['F'],
    'D': [], 'E': [], 'F': []
}
print("BFS遍历:", bfs(graph, 'A'))`,
    javascript: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return result;
}

const graph = { A: ['B','C'], B: ['D','E'], C: ['F'], D: [], E: [], F: [] };
console.log('BFS:', bfs(graph, 'A'));`,
    java: `import java.util.*;

public class BFS {
    public static List<String> bfs(Map<String, List<String>> graph, String start) {
        List<String> result = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.offer(start);
        visited.add(start);
        while (!queue.isEmpty()) {
            String node = queue.poll();
            result.add(node);
            for (String nb : graph.getOrDefault(node, List.of())) {
                if (!visited.contains(nb)) { visited.add(nb); queue.offer(nb); }
            }
        }
        return result;
    }
}`,
    cpp: `#include <iostream>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;

vector<string> bfs(unordered_map<string, vector<string>>& graph, string start) {
    vector<string> result;
    unordered_set<string> visited;
    queue<string> q;
    q.push(start); visited.insert(start);
    while (!q.empty()) {
        string node = q.front(); q.pop();
        result.push_back(node);
        for (auto& nb : graph[node])
            if (!visited.count(nb)) { visited.insert(nb); q.push(nb); }
    }
    return result;
}`,
    go: `package main

import "fmt"

func bfs(graph map[string][]string, start string) []string {
    visited := map[string]bool{start: true}
    queue := []string{start}
    result := []string{}
    for len(queue) > 0 {
        node := queue[0]; queue = queue[1:]
        result = append(result, node)
        for _, nb := range graph[node] {
            if !visited[nb] { visited[nb] = true; queue = append(queue, nb) }
        }
    }
    return result
}

func main() {
    graph := map[string][]string{"A": {"B","C"}, "B": {"D","E"}, "C": {"F"}}
    fmt.Println("BFS:", bfs(graph, "A"))
}`,
    rust: `use std::collections::{HashMap, HashSet, VecDeque};

fn bfs(graph: &HashMap<&str, Vec<&str>>, start: &str) -> Vec<String> {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    let mut result = vec![];
    queue.push_back(start);
    visited.insert(start);
    while let Some(node) = queue.pop_front() {
        result.push(node.to_string());
        if let Some(neighbors) = graph.get(node) {
            for &nb in neighbors {
                if !visited.contains(nb) { visited.insert(nb); queue.push_back(nb); }
            }
        }
    }
    result
}`,
  },
  dfs: {
    python: `def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    result = [start]
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            result.extend(dfs(graph, neighbor, visited))
    return result

graph = {'A': ['B','C'], 'B': ['D','E'], 'C': ['F'], 'D': [], 'E': [], 'F': []}
print("DFS遍历:", dfs(graph, 'A'))`,
    javascript: `function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  const result = [start];
  for (const neighbor of graph[start] || []) {
    if (!visited.has(neighbor)) {
      result.push(...dfs(graph, neighbor, visited));
    }
  }
  return result;
}

const graph = { A: ['B','C'], B: ['D','E'], C: ['F'], D: [], E: [], F: [] };
console.log('DFS:', dfs(graph, 'A'));`,
    java: `import java.util.*;

public class DFS {
    static List<String> result = new ArrayList<>();
    static Set<String> visited = new HashSet<>();

    public static void dfs(Map<String, List<String>> graph, String node) {
        visited.add(node);
        result.add(node);
        for (String nb : graph.getOrDefault(node, List.of()))
            if (!visited.contains(nb)) dfs(graph, nb);
    }
}`,
    cpp: `#include <iostream>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;

void dfs(unordered_map<string, vector<string>>& g, string node,
         unordered_set<string>& vis, vector<string>& res) {
    vis.insert(node); res.push_back(node);
    for (auto& nb : g[node])
        if (!vis.count(nb)) dfs(g, nb, vis, res);
}`,
    go: `package main

import "fmt"

func dfs(graph map[string][]string, node string, visited map[string]bool, result *[]string) {
    visited[node] = true
    *result = append(*result, node)
    for _, nb := range graph[node] {
        if !visited[nb] { dfs(graph, nb, visited, result) }
    }
}

func main() {
    graph := map[string][]string{"A": {"B","C"}, "B": {"D","E"}, "C": {"F"}}
    result := []string{}
    dfs(graph, "A", map[string]bool{}, &result)
    fmt.Println("DFS:", result)
}`,
    rust: `use std::collections::{HashMap, HashSet};

fn dfs(graph: &HashMap<&str, Vec<&str>>, node: &str,
       visited: &mut HashSet<String>, result: &mut Vec<String>) {
    visited.insert(node.to_string());
    result.push(node.to_string());
    if let Some(neighbors) = graph.get(node) {
        for &nb in neighbors {
            if !visited.contains(nb) { dfs(graph, nb, visited, result); }
        }
    }
}`,
  },
  // ── 动态规划 ──────────────────────────────────────────────
  fibonacci: {
    python: `def fibonacci_dp(n):
    """动态规划求斐波那契数列 - O(n)时间 O(1)空间"""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# 记忆化递归版本
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_memo(n):
    if n <= 1: return n
    return fibonacci_memo(n-1) + fibonacci_memo(n-2)

# 测试
for i in range(10):
    print(f"F({i}) = {fibonacci_dp(i)}")`,
    javascript: `// 动态规划版本 - O(n)时间 O(1)空间
function fibonacci(n) {
  if (n <= 1) return n;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// 记忆化版本
const memo = new Map();
function fibMemo(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n-1) + fibMemo(n-2);
  memo.set(n, result);
  return result;
}

for (let i = 0; i < 10; i++) console.log(\`F(\${i}) = \${fibonacci(i)}\`);`,
    java: `public class Fibonacci {
    // 动态规划 O(n) 时间 O(1) 空间
    public static long fibonacci(int n) {
        if (n <= 1) return n;
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long temp = a + b; a = b; b = temp;
        }
        return b;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++)
            System.out.printf("F(%d) = %d%n", i, fibonacci(i));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

long long fibonacci(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long long temp = a + b; a = b; b = temp;
    }
    return b;
}

int main() {
    for (int i = 0; i < 10; i++)
        cout << "F(" << i << ") = " << fibonacci(i) << endl;
}`,
    go: `package main

import "fmt"

func fibonacci(n int) int64 {
    if n <= 1 { return int64(n) }
    a, b := int64(0), int64(1)
    for i := 2; i <= n; i++ {
        a, b = b, a+b
    }
    return b
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Printf("F(%d) = %d\n", i, fibonacci(i))
    }
}`,
    rust: `fn fibonacci(n: u64) -> u64 {
    if n <= 1 { return n; }
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let temp = a + b; a = b; b = temp;
    }
    b
}

fn main() {
    for i in 0..10 {
        println!("F({}) = {}", i, fibonacci(i));
    }
}`,
  },
  knapsack: {
    python: `def knapsack_01(weights, values, capacity):
    """0/1背包问题 - 动态规划"""
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            # 不选第i件物品
            dp[i][w] = dp[i-1][w]
            # 选第i件物品（如果装得下）
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w-weights[i-1]] + values[i-1])

    return dp[n][capacity]

weights = [1, 3, 4, 5]
values  = [1, 4, 5, 7]
capacity = 7
print(f"最大价值: {knapsack_01(weights, values, capacity)}")`,
    javascript: `function knapsack01(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({length: n+1}, () => new Array(capacity+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i-1][w];
      if (weights[i-1] <= w)
        dp[i][w] = Math.max(dp[i][w], dp[i-1][w-weights[i-1]] + values[i-1]);
    }
  }
  return dp[n][capacity];
}

const weights = [1,3,4,5], values = [1,4,5,7], capacity = 7;
console.log('最大价值:', knapsack01(weights, values, capacity));`,
    java: `public class Knapsack {
    public static int knapsack01(int[] w, int[] v, int C) {
        int n = w.length;
        int[][] dp = new int[n+1][C+1];
        for (int i = 1; i <= n; i++)
            for (int c = 0; c <= C; c++) {
                dp[i][c] = dp[i-1][c];
                if (w[i-1] <= c) dp[i][c] = Math.max(dp[i][c], dp[i-1][c-w[i-1]] + v[i-1]);
            }
        return dp[n][C];
    }
    public static void main(String[] args) {
        System.out.println(knapsack01(new int[]{1,3,4,5}, new int[]{1,4,5,7}, 7));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int knapsack01(vector<int>& w, vector<int>& v, int C) {
    int n = w.size();
    vector<vector<int>> dp(n+1, vector<int>(C+1, 0));
    for (int i = 1; i <= n; i++)
        for (int c = 0; c <= C; c++) {
            dp[i][c] = dp[i-1][c];
            if (w[i-1] <= c) dp[i][c] = max(dp[i][c], dp[i-1][c-w[i-1]] + v[i-1]);
        }
    return dp[n][C];
}`,
    go: `package main

import "fmt"

func knapsack01(weights, values []int, capacity int) int {
    n := len(weights)
    dp := make([][]int, n+1)
    for i := range dp { dp[i] = make([]int, capacity+1) }
    for i := 1; i <= n; i++ {
        for c := 0; c <= capacity; c++ {
            dp[i][c] = dp[i-1][c]
            if weights[i-1] <= c {
                v := dp[i-1][c-weights[i-1]] + values[i-1]
                if v > dp[i][c] { dp[i][c] = v }
            }
        }
    }
    return dp[n][capacity]
}

func main() {
    fmt.Println(knapsack01([]int{1,3,4,5}, []int{1,4,5,7}, 7))
}`,
    rust: `fn knapsack_01(weights: &[usize], values: &[i32], capacity: usize) -> i32 {
    let n = weights.len();
    let mut dp = vec![vec![0i32; capacity + 1]; n + 1];
    for i in 1..=n {
        for c in 0..=capacity {
            dp[i][c] = dp[i-1][c];
            if weights[i-1] <= c {
                let v = dp[i-1][c - weights[i-1]] + values[i-1];
                if v > dp[i][c] { dp[i][c] = v; }
            }
        }
    }
    dp[n][capacity]
}

fn main() {
    println!("{}", knapsack_01(&[1,3,4,5], &[1,4,5,7], 7));
}`,
  },
  // ── 贪心算法 ──────────────────────────────────────────────
  coin_change: {
    python: `def coin_change_greedy(coins, amount):
    """贪心算法（适用于标准货币体系）"""
    coins.sort(reverse=True)
    result = []
    for coin in coins:
        while amount >= coin:
            result.append(coin)
            amount -= coin
    return result if amount == 0 else []

def coin_change_dp(coins, amount):
    """动态规划（通用解）"""
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for i in range(coin, amount + 1):
            dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1

coins = [1, 5, 10, 25]
amount = 41
print(f"贪心方案: {coin_change_greedy(coins[:], amount)}")
print(f"最少硬币数(DP): {coin_change_dp(coins, amount)}")`,
    javascript: `// 贪心算法（标准货币体系）
function coinChangeGreedy(coins, amount) {
  coins.sort((a, b) => b - a);
  const result = [];
  for (const coin of coins) {
    while (amount >= coin) { result.push(coin); amount -= coin; }
  }
  return amount === 0 ? result : [];
}

// 动态规划（通用）
function coinChangeDP(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins)
    for (let i = coin; i <= amount; i++)
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log('贪心:', coinChangeGreedy([1,5,10,25], 41));
console.log('DP最少数:', coinChangeDP([1,5,10,25], 41));`,
    java: `import java.util.Arrays;

public class CoinChange {
    public static int coinChangeDP(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int coin : coins)
            for (int i = coin; i <= amount; i++)
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        return dp[amount] > amount ? -1 : dp[amount];
    }
    public static void main(String[] args) {
        System.out.println(coinChangeDP(new int[]{1,5,10,25}, 41));
    }
}`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int coinChangeDP(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins)
        for (int i = coin; i <= amount; i++)
            dp[i] = min(dp[i], dp[i - coin] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
    go: `package main

import "fmt"

func coinChangeDP(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := range dp { dp[i] = amount + 1 }
    dp[0] = 0
    for _, coin := range coins {
        for i := coin; i <= amount; i++ {
            if dp[i-coin]+1 < dp[i] { dp[i] = dp[i-coin] + 1 }
        }
    }
    if dp[amount] > amount { return -1 }
    return dp[amount]
}

func main() { fmt.Println(coinChangeDP([]int{1,5,10,25}, 41)) }`,
    rust: `fn coin_change_dp(coins: &[i32], amount: i32) -> i32 {
    let n = (amount + 1) as usize;
    let mut dp = vec![amount + 1; n];
    dp[0] = 0;
    for &coin in coins {
        for i in (coin as usize)..n {
            if dp[i - coin as usize] + 1 < dp[i] { dp[i] = dp[i - coin as usize] + 1; }
        }
    }
    if dp[amount as usize] > amount { -1 } else { dp[amount as usize] }
}

fn main() { println!("{}", coin_change_dp(&[1, 5, 10, 25], 41)); }`,
  },
  // ── 数据结构 ──────────────────────────────────────────────
  linked_list: {
    python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node; return
        curr = self.head
        while curr.next: curr = curr.next
        curr.next = node

    def reverse(self):
        prev, curr = None, self.head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev, curr = curr, nxt
        self.head = prev

    def to_list(self):
        result, curr = [], self.head
        while curr: result.append(curr.val); curr = curr.next
        return result

ll = LinkedList()
for v in [1, 2, 3, 4, 5]: ll.append(v)
print("原始:", ll.to_list())
ll.reverse()
print("反转:", ll.to_list())`,
    javascript: `class ListNode {
  constructor(val = 0, next = null) { this.val = val; this.next = next; }
}

class LinkedList {
  constructor() { this.head = null; }

  append(val) {
    const node = new ListNode(val);
    if (!this.head) { this.head = node; return; }
    let curr = this.head;
    while (curr.next) curr = curr.next;
    curr.next = node;
  }

  reverse() {
    let [prev, curr] = [null, this.head];
    while (curr) {
      const nxt = curr.next;
      curr.next = prev;
      [prev, curr] = [curr, nxt];
    }
    this.head = prev;
  }

  toArray() {
    const result = [];
    let curr = this.head;
    while (curr) { result.push(curr.val); curr = curr.next; }
    return result;
  }
}

const ll = new LinkedList();
[1,2,3,4,5].forEach(v => ll.append(v));
console.log('原始:', ll.toArray());
ll.reverse();
console.log('反转:', ll.toArray());`,
    java: `public class LinkedList {
    static class Node { int val; Node next; Node(int v) { val = v; } }
    Node head;

    void append(int val) {
        Node n = new Node(val);
        if (head == null) { head = n; return; }
        Node c = head; while (c.next != null) c = c.next; c.next = n;
    }

    void reverse() {
        Node prev = null, curr = head;
        while (curr != null) { Node nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; }
        head = prev;
    }
}`,
    cpp: `#include <iostream>
using namespace std;
struct Node { int val; Node* next; Node(int v) : val(v), next(nullptr) {} };

class LinkedList {
public:
    Node* head = nullptr;
    void append(int val) {
        Node* n = new Node(val);
        if (!head) { head = n; return; }
        Node* c = head; while (c->next) c = c->next; c->next = n;
    }
    void reverse() {
        Node *prev = nullptr, *curr = head;
        while (curr) { Node* nxt = curr->next; curr->next = prev; prev = curr; curr = nxt; }
        head = prev;
    }
};`,
    go: `package main

import "fmt"

type Node struct { Val int; Next *Node }

func reverse(head *Node) *Node {
    var prev *Node
    curr := head
    for curr != nil {
        nxt := curr.Next; curr.Next = prev; prev = curr; curr = nxt
    }
    return prev
}

func main() {
    head := &Node{1, &Node{2, &Node{3, &Node{4, &Node{5, nil}}}}}
    head = reverse(head)
    for n := head; n != nil; n = n.Next { fmt.Print(n.Val, " ") }
}`,
    rust: `#[derive(Debug)]
struct ListNode { val: i32, next: Option<Box<ListNode>> }

impl ListNode {
    fn new(val: i32) -> Self { ListNode { val, next: None } }
}

fn reverse(mut head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
    let mut prev = None;
    while let Some(mut node) = head {
        head = node.next.take();
        node.next = prev;
        prev = Some(node);
    }
    prev
}`,
  },
  // ── 数学算法 ──────────────────────────────────────────────
  sieve_of_eratosthenes: {
    python: `def sieve_of_eratosthenes(n):
    """埃拉托斯特尼筛法求质数"""
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i*i, n + 1, i):
                is_prime[j] = False

    return [i for i, prime in enumerate(is_prime) if prime]

primes = sieve_of_eratosthenes(100)
print(f"100以内的质数({len(primes)}个):", primes)`,
    javascript: `function sieveOfEratosthenes(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) isPrime[j] = false;
    }
  }
  return isPrime.map((v, i) => v ? i : -1).filter(v => v !== -1);
}

const primes = sieveOfEratosthenes(100);
console.log(\`100以内质数(\${primes.length}个):\`, primes);`,
    java: `import java.util.*;

public class Sieve {
    public static List<Integer> sieve(int n) {
        boolean[] isPrime = new boolean[n + 1];
        Arrays.fill(isPrime, true);
        isPrime[0] = isPrime[1] = false;
        for (int i = 2; (long)i*i <= n; i++)
            if (isPrime[i])
                for (int j = i*i; j <= n; j += i) isPrime[j] = false;
        List<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= n; i++) if (isPrime[i]) primes.add(i);
        return primes;
    }
    public static void main(String[] args) { System.out.println(sieve(100)); }
}`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

vector<int> sieve(int n) {
    vector<bool> isPrime(n+1, true);
    isPrime[0] = isPrime[1] = false;
    for (int i = 2; (long long)i*i <= n; i++)
        if (isPrime[i]) for (int j = i*i; j <= n; j += i) isPrime[j] = false;
    vector<int> primes;
    for (int i = 2; i <= n; i++) if (isPrime[i]) primes.push_back(i);
    return primes;
}`,
    go: `package main

import "fmt"

func sieve(n int) []int {
    isPrime := make([]bool, n+1)
    for i := 2; i <= n; i++ { isPrime[i] = true }
    for i := 2; i*i <= n; i++ {
        if isPrime[i] { for j := i*i; j <= n; j += i { isPrime[j] = false } }
    }
    primes := []int{}
    for i := 2; i <= n; i++ { if isPrime[i] { primes = append(primes, i) } }
    return primes
}

func main() { fmt.Println(sieve(100)) }`,
    rust: `fn sieve(n: usize) -> Vec<usize> {
    let mut is_prime = vec![true; n + 1];
    is_prime[0] = false;
    if n > 0 { is_prime[1] = false; }
    let mut i = 2;
    while i * i <= n {
        if is_prime[i] {
            let mut j = i * i;
            while j <= n { is_prime[j] = false; j += i; }
        }
        i += 1;
    }
    (2..=n).filter(|&x| is_prime[x]).collect()
}

fn main() { println!("{:?}", sieve(100)); }`,
  },
};

// ============================================================
// 算法分类配置
// ============================================================
const algorithmCategories = ref([
  {
    id: 'sorting',
    name: '排序算法',
    icon: '🔢',
    algorithms: [
      { id: 'bubble_sort', name: '冒泡排序', timeComplexity: 'O(n²)', spaceComplexity: 'O(1)', difficulty: 1, description: '通过相邻元素比较交换，将最大元素逐步"冒泡"到末尾。经典入门排序算法，有提前退出优化。', tags: ['入门', '比较排序', '稳定'] },
      { id: 'quick_sort', name: '快速排序', timeComplexity: 'O(n log n)', spaceComplexity: 'O(log n)', difficulty: 3, description: '选取基准元素，将数组分为两部分递归排序。平均性能最优的比较排序算法，实际应用广泛。', tags: ['分治', '递归', '面试高频'] },
      { id: 'merge_sort', name: '归并排序', timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)', difficulty: 3, description: '分治策略：将数组分成两半分别排序后合并。保证最坏情况性能，适合大数据集和外部排序。', tags: ['分治', '稳定', '链表排序'] },
    ],
  },
  {
    id: 'search',
    name: '搜索算法',
    icon: '🔍',
    algorithms: [
      { id: 'binary_search', name: '二分搜索', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', difficulty: 2, description: '在有序数组中通过不断折半缩小搜索范围，高效查找目标值。是面试中最常考的基础算法之一。', tags: ['有序数组', '面试高频', '分治'] },
      { id: 'bfs', name: '广度优先搜索', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', difficulty: 3, description: '从起点逐层扩展，先访问离起点近的节点。适用于求最短路径、层序遍历、连通分量等问题。', tags: ['图论', '树遍历', '最短路径'] },
      { id: 'dfs', name: '深度优先搜索', timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)', difficulty: 3, description: '从起点沿一条路径深入，直到无法继续再回溯。适用于连通性检测、路径查找、拓扑排序等。', tags: ['图论', '回溯', '连通性'] },
    ],
  },
  {
    id: 'dp',
    name: '动态规划',
    icon: '📊',
    algorithms: [
      { id: 'fibonacci', name: '斐波那契数列', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', difficulty: 1, description: 'DP经典入门题：F(n)=F(n-1)+F(n-2)。展示了从暴力递归→记忆化→空间优化的完整DP思路。', tags: ['DP入门', '记忆化', '滚动数组'] },
      { id: 'knapsack', name: '0/1背包问题', timeComplexity: 'O(n×W)', spaceComplexity: 'O(n×W)', difficulty: 4, description: 'N件物品、限重W背包，求最大价值。DP核心模型，变种包括完全背包、多重背包等。', tags: ['DP核心', '组合优化', '面试高频'] },
    ],
  },
  {
    id: 'greedy',
    name: '贪心算法',
    icon: '💰',
    algorithms: [
      { id: 'coin_change', name: '硬币兑换', timeComplexity: 'O(n×amount)', spaceComplexity: 'O(amount)', difficulty: 2, description: '求凑成目标金额的最少硬币数。展示贪心（标准币制）与DP（通用）两种解法的对比。', tags: ['贪心', 'DP', '面试经典'] },
    ],
  },
  {
    id: 'data_structure',
    name: '数据结构',
    icon: '🏗️',
    algorithms: [
      { id: 'linked_list', name: '链表操作', timeComplexity: 'O(n)', spaceComplexity: 'O(1)', difficulty: 2, description: '实现链表的基础操作：创建节点、追加元素、链表反转。链表是面试高频考点，理解指针操作至关重要。', tags: ['链表', '指针', '面试高频'] },
    ],
  },
  {
    id: 'math',
    name: '数学算法',
    icon: '🧮',
    algorithms: [
      { id: 'sieve_of_eratosthenes', name: '质数筛', timeComplexity: 'O(n log log n)', spaceComplexity: 'O(n)', difficulty: 2, description: '埃拉托斯特尼筛法：高效求n以内所有质数。比逐一判断快得多，是数学算法的经典代表。', tags: ['数论', '质数', '筛法'] },
    ],
  },
]);

// ============================================================
// 状态
// ============================================================
const selectedLang = ref('python');
const selectedCategory = ref('');
const selectedAlgo = ref('');
const copied = ref(false);

const currentLang = computed(() => languages.find(l => l.id === selectedLang.value));
const currentCategory = computed(() => algorithmCategories.value.find(c => c.id === selectedCategory.value));
const currentAlgoInfo = computed(() => currentCategory.value?.algorithms.find(a => a.id === selectedAlgo.value));
const currentCode = computed(() => codeTemplates[selectedAlgo.value]?.[selectedLang.value] || '');

// 简单语法高亮（关键词着色）
const highlightedCode = computed(() => {
  if (!currentCode.value) return '';
  const code = currentCode.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const keywordMap = {
    python: /\b(def|class|return|if|else|elif|for|while|in|not|and|or|import|from|True|False|None|lambda|with|as|yield|break|continue|pass)\b/g,
    javascript: /\b(function|const|let|var|return|if|else|for|while|of|in|new|class|import|export|default|true|false|null|undefined|async|await|=>)\b/g,
    java: /\b(public|private|protected|static|void|class|new|return|if|else|for|while|int|long|String|boolean|import|extends|implements|true|false|null)\b/g,
    cpp: /\b(int|long|void|class|struct|new|return|if|else|for|while|include|using|namespace|std|auto|const|true|false|nullptr|vector|string)\b/g,
    go: /\b(func|var|const|return|if|else|for|range|package|import|type|struct|interface|true|false|nil|make|len|append|fmt)\b/g,
    rust: /\b(fn|let|mut|pub|use|struct|impl|trait|return|if|else|for|while|in|match|Some|None|true|false|Vec|String|println)\b/g,
  };

  const lang = selectedLang.value;
  const pattern = keywordMap[lang] || keywordMap.javascript;

  return code
    .replace(pattern, '<span style="color:#ff79c6;font-weight:600">$&</span>')
    .replace(/(#[^\n]*|\/\/[^\n]*)/g, '<span style="color:#6272a4;font-style:italic">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#f1fa8c">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#bd93f9">$1</span>');
});

function selectCategory(id) {
  selectedCategory.value = id;
  selectedAlgo.value = '';
}

function selectAlgorithm(id) {
  selectedAlgo.value = id;
}

async function copyCode() {
  if (!currentCode.value) return;
  try {
    await navigator.clipboard.writeText(currentCode.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // fallback
    const el = document.createElement('textarea');
    el.value = currentCode.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
}
</script>

<style scoped>
.code-generator-page {
  min-height: 100vh;
  background: var(--tech-bg, #0f0f1a);
}

pre {
  margin: 0;
  white-space: pre;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #f8f8f2;
}

code { display: block; }

.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.shadow-neon-blue { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
</style>
