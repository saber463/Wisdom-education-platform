<template>
  <div class="code-generator-container">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面头部 -->
      <div class="text-center mb-10">
        <h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tech-blue to-tech-purple mb-4">
          代码生成器
        </h1>
        <p class="text-gray-400 text-lg">选择编程语言，探索交互式代码示例与可视化工具</p>
      </div>

      <!-- 语言选择标签 -->
      <div class="flex flex-wrap justify-center gap-3 mb-10">
        <button
          v-for="lang in languages"
          :key="lang.id"
          :class="[
            'px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105',
            selectedLanguage === lang.id
              ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg shadow-tech-blue/30'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-tech-blue/30'
          ]"
          @click="selectLanguage(lang.id)"
        >
          <span class="mr-2">{{ lang.icon }}</span>
          {{ lang.name }}
        </button>
      </div>

      <!-- 代码生成器内容 -->
      <div v-if="currentLangConfig" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：代码预览 -->
        <div class="glass-card rounded-2xl overflow-hidden">
          <div class="bg-gray-900/80 px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span class="text-gray-400 text-sm">{{ currentLangConfig.fileName }}</span>
            <button
              class="text-gray-400 hover:text-white transition-colors"
              @click="copyCode"
            >
              <i class="fa fa-copy mr-1" /> 复制
            </button>
          </div>
          <div class="p-6 overflow-x-auto">
            <pre class="text-sm leading-relaxed"><code v-html="highlightedCode"></code></pre>
          </div>
        </div>

        <!-- 右侧：交互区域 -->
        <div class="glass-card rounded-2xl p-6">
          <h3 class="text-xl font-bold text-white mb-6 flex items-center">
            <i :class="`fa fa-${currentLangConfig.icon} mr-2 text-tech-blue`" />
            {{ currentLangConfig.title }}
          </h3>

          <!-- 交互输入 -->
          <div class="space-y-6">
            <!-- 输入参数 -->
            <div v-for="param in currentLangConfig.params" :key="param.name">
              <label class="block text-gray-300 mb-2 text-sm font-medium">
                {{ param.label }}
              </label>
              <input
                v-if="param.type === 'text'"
                v-model="param.value"
                :placeholder="param.placeholder"
                class="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-tech-blue/50 focus:ring-2 focus:ring-tech-blue/20 transition-all"
              />
              <select
                v-else-if="param.type === 'select'"
                v-model="param.value"
                class="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tech-blue/50 transition-all"
              >
                <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <textarea
                v-else-if="param.type === 'textarea'"
                v-model="param.value"
                :placeholder="param.placeholder"
                rows="3"
                class="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-tech-blue/50 focus:ring-2 focus:ring-tech-blue/20 transition-all resize-none"
              />
            </div>

            <!-- 生成按钮 -->
            <button
              class="w-full py-4 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-bold rounded-xl hover:from-tech-blue/90 hover:to-tech-purple/90 transition-all transform hover:scale-[1.02] shadow-lg shadow-tech-blue/30"
              @click="generateCode"
            >
              <i class="fa fa-code mr-2" /> 生成代码
            </button>
          </div>

          <!-- 可视化区域 -->
          <div v-if="currentLangConfig.visualizer" class="mt-8">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
              <i class="fa fa-play-circle mr-2 text-tech-purple" />
              可视化结果
            </h4>
            <div class="bg-gray-900/50 rounded-xl p-6 border border-white/10" v-html="visualizedResult" />
          </div>
        </div>
      </div>

      <!-- 学习资源 -->
      <div v-if="currentLangConfig" class="mt-12 glass-card rounded-2xl p-8">
        <h3 class="text-2xl font-bold text-white mb-6">
          <i class="fa fa-bookmark text-tech-purple mr-2" />
          {{ currentLangConfig.resourceTitle }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="resource in currentLangConfig.resources"
            :key="resource.url"
            :href="resource.url"
            target="_blank"
            class="block p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-white/10 hover:border-tech-blue/30 transition-all group"
          >
            <div class="flex items-center justify-between">
              <span class="text-gray-300 group-hover:text-tech-blue transition-colors">
                {{ resource.title }}
              </span>
              <i class="fa fa-external-link text-gray-500 group-hover:text-tech-blue" />
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useNotificationStore } from '@/store/notification';

const notificationStore = useNotificationStore();

// 1. 基础数据定义
const languages = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'sql', name: 'SQL', icon: '🗃️' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'regex', name: '正则表达式', icon: '🔍' },
];

const selectedLanguage = ref('python');
const selectedLanguageData = ref(null);

// 2. 语言详细配置 (必须在 computed/watch 之前定义)
const languageConfigs = {
  python: {
    title: 'Python 正则表达式可视化',
    icon: 'code',
    fileName: 'regex_tester.py',
    params: [
      { name: 'pattern', label: '正则表达式', type: 'text', value: '\\d{3}-\\d{4}', placeholder: '例如: \\d{3}-\\d{4}' },
      { name: 'testString', label: '测试字符串', type: 'textarea', value: '我的电话是 123-4567 和 987-6543', placeholder: '输入要测试的字符串' }
    ],
    visualizer: true,
    resourceTitle: 'Python 学习资源',
    resources: [
      { title: 'Python 官方文档', url: 'https://docs.python.org/3/' },
      { title: '正则表达式HOWTO', url: 'https://docs.python.org/3/howto/regex.html' }
    ],
    generate: (p) => `import re\n\n# 定义正则表达式模式\npattern = r"${p.pattern}"\n# 待测试的原始字符串\ntext = """${p.testString}"""\n\n# re.findall 返回所有匹配项的列表\nmatches = re.findall(pattern, text)\nprint(f"找到的匹配项: {matches}")\n\n# 遍历匹配迭代器以获取位置信息\nfor match in re.finditer(pattern, text):\n    print(f"匹配: '{match.group()}' 位置: {match.span()}")`,
    visualize: (p) => {
      try {
        const regex = new RegExp(p.pattern, 'g');
        const matches = [...p.testString.matchAll(regex)];
        if (!matches.length) return '<div class="text-yellow-400 p-4 border border-dashed border-yellow-500/30 rounded-xl">⚠️ 未找到匹配项，请尝试修改正则表达式</div>';
        
        let html = '<div class="space-y-3">';
        matches.forEach((m, i) => {
          html += `<div class="flex items-center gap-4 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <span class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">${i+1}</span>
            <div class="flex-1">
              <div class="text-emerald-400 font-mono font-bold text-sm">"${m[0]}"</div>
              <div class="text-gray-500 text-[10px] mt-1 italic">起始索引: ${m.index} | 结束索引: ${m.index + m[0].length}</div>
            </div>
            <i class="fa fa-check-circle text-emerald-500"></i>
          </div>`;
        });
        html += '</div>';
        return html;
      } catch (e) { return `<div class="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400 text-sm">❌ 正则语法错误: ${e.message}</div>`; }
    }
  },
  javascript: {
    title: 'JavaScript 闭包与内存可视化',
    icon: 'code',
    fileName: 'closure.js',
    params: [{ name: 'type', label: '核心原理', type: 'select', value: 'closure', options: [{value:'closure', label:'闭包 (Closure)'}, {value:'promise', label:'异步 (Promise)'}]}],
    visualizer: true,
    resourceTitle: 'JS 进阶资源',
    resources: [{ title: 'MDN: 闭包详解', url: 'https://developer.mozilla.org/' }],
    generate: (p) => p.type === 'closure' ? 
      `function createCounter() {\n  let count = 0; // 私有变量，被锁定在闭包中\n  return () => ++count;\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2` :
      `// Promise 代表一个尚未完成但预期会完成的操作\nconst fetchData = new Promise((resolve) => {\n  setTimeout(() => resolve("数据加载成功"), 2000);\n});\n\nfetchData.then(res => console.log(res));`,
    visualize: (p) => p.type === 'closure' ? `
      <div class="space-y-4">
        <div class="flex items-center justify-center gap-8 py-4">
          <div class="relative w-24 h-24 rounded-2xl border-2 border-dashed border-blue-500/50 flex flex-col items-center justify-center">
            <span class="text-[10px] text-blue-400 absolute -top-3 bg-[#0f172a] px-2">外部作用域</span>
            <div class="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center animate-pulse">
              <span class="text-xs font-bold text-blue-400">Closure</span>
            </div>
          </div>
          <i class="fa fa-arrow-right text-gray-600"></i>
          <div class="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <div class="text-[10px] text-emerald-400 mb-1">私有变量</div>
            <div class="text-sm font-mono text-white">count: 0</div>
          </div>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed text-center">闭包使得函数可以"记住"并访问其定义时的词法作用域，即使该函数在当前作用域之外执行。</p>
      </div>
    ` : `<div class="flex flex-col items-center py-6">
        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div class="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style="width: 100%"></div>
        </div>
        <div class="flex justify-between w-full text-[10px] text-gray-500">
          <span>PENDING</span>
          <span class="text-blue-400">RESOLVING...</span>
          <span>FULFILLED</span>
        </div>
      </div>`
  },
  java: {
    title: 'Java 集合框架',
    icon: 'mug-hot',
    fileName: 'Main.java',
    params: [{ name: 'type', label: '集合', type: 'select', value: 'list', options: [{value:'list', label:'ArrayList'}]}],
    visualizer: false,
    resourceTitle: 'Java 资源',
    resources: [{ title: 'Java Docs', url: 'https://docs.oracle.com/' }],
    generate: () => `List<String> list = new ArrayList<>();`
  },
  sql: {
    title: 'SQL 查询练习',
    icon: 'database',
    fileName: 'query.sql',
    params: [{ name: 'table', label: '表名', type: 'text', value: 'users' }],
    visualizer: true,
    resourceTitle: 'SQL 资源',
    resources: [{ title: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' }],
    generate: (p) => `SELECT * FROM ${p.table} LIMIT 10;`,
    visualize: (p) => `<div class="text-gray-300">正在从表 ${p.table} 中查询数据...</div>`
  },
  css: {
    title: 'CSS 动画预览',
    icon: 'paint-brush',
    fileName: 'style.css',
    params: [{ name: 'anim', label: '动画', type: 'select', value: 'fade', options: [{value:'fade', label:'渐变'}]}],
    visualizer: true,
    resourceTitle: 'CSS 资源',
    resources: [{ title: 'CSS Tricks', url: 'https://css-tricks.com/' }],
    generate: () => `@keyframes fade { from { opacity: 0; } to { opacity: 1; } }`,
    visualize: () => `<div class="w-16 h-16 bg-blue-500 rounded animate-pulse mx-auto"></div>`
  },
  regex: {
    title: '正则表达式工具',
    icon: 'search',
    fileName: 'regex.js',
    params: [{ name: 'p', label: '模式', type: 'text', value: '\\d+' }, { name: 's', label: '文本', type: 'text', value: '123' }],
    visualizer: true,
    resourceTitle: '正则资源',
    resources: [{ title: 'Regex101', url: 'https://regex101.com/' }],
    generate: (p) => `const regex = /${p.p}/;`,
    visualize: (p) => `<div class="text-green-400">测试结果: ${new RegExp(p.p).test(p.s)}</div>`
  }
};

// 3. 计算属性与监听
const currentLangConfig = computed(() => {
  return selectedLanguageData.value || languageConfigs[selectedLanguage.value];
});

const highlightedCode = computed(() => {
  if (!currentLangConfig.value?.generate) return '';
  const p = currentLangConfig.value.params.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {});
  return currentLangConfig.value.generate(p);
});

const visualizedResult = computed(() => {
  if (!currentLangConfig.value?.visualize || !currentLangConfig.value.visualizer) {
    return '<div class="text-gray-500 text-center">暂无预览</div>';
  }
  const p = currentLangConfig.value.params.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {});
  return currentLangConfig.value.visualize(p);
});

// 4. 方法定义
const selectLanguage = (langId) => {
  selectedLanguage.value = langId;
  selectedLanguageData.value = { ...languageConfigs[langId] };
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(highlightedCode.value);
    notificationStore.addNotification({ title: '成功', content: '代码已复制', type: 'success' });
  } catch (err) {
    console.error('复制失败:', err);
  }
};

const generateCode = () => {
  // 强制触发更新
  const temp = selectedLanguage.value;
  selectedLanguage.value = '';
  setTimeout(() => { selectedLanguage.value = temp; }, 0);
  notificationStore.addNotification({ title: '完成', content: '代码已重新生成', type: 'info' });
};

// 5. 初始化
onMounted(() => {
  selectLanguage('python');
});
</script>

<style scoped>
.code-generator-container {
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

code {
  color: #e5e7eb;
  font-family: monospace;
}

pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>