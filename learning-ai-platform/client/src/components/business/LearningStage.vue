<template>
  <div class="border border-gray-700 rounded-lg p-5 hover:border-gray-500 transition-colors bg-gray-800/50">
    <div class="flex items-center mb-3">
      <span
        class="bg-gradient-to-r from-tech-blue to-tech-purple text-white w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold"
      >
        {{ stage.day || index + 1 }}
      </span>
      <div class="flex-1">
        <h4 class="font-bold text-lg text-white flex items-center">
          <i class="fa fa-book mr-2 text-blue-400" />
          {{ stage.title || `学习第${index + 1}天，学习核心内容` }}
        </h4>
      </div>
      <span class="text-gray-300 text-sm bg-gray-700 px-3 py-1 rounded-full flex items-center">
        <i class="fa fa-clock-o mr-1" />
        {{ stage.duration || intensityMap[intensity].match(/\d+-\d+/)[0] + '分钟' }}
      </span>
    </div>

    <div class="ml-14 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
      <div class="mb-3">
        <h5 class="font-medium text-white flex items-center mb-2">
          <i class="fa fa-list-ul text-blue-400 mr-2" />
          学习内容
        </h5>
        <p class="text-gray-300 leading-relaxed">
          {{ stage.content || '该日学习内容：按计划完成对应知识点学习与练习' }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div class="bg-gray-800 rounded p-3 flex items-start border border-gray-700">
          <i class="fa fa-calendar-check-o text-green-400 mt-1 mr-3" />
          <div>
            <h6 class="text-sm font-medium text-white">学习计划</h6>
            <ul class="text-sm text-gray-400 mt-1 space-y-1">
              <li>1. 观看相关视频教程 (30-45分钟)</li>
              <li>2. 阅读学习资料 (20-30分钟)</li>
              <li>3. 完成实践练习 (40-60分钟)</li>
            </ul>
          </div>
        </div>

        <div class="bg-gray-800 rounded p-3 flex items-start border border-gray-700">
          <i class="fa fa-clock-o text-purple-400 mt-1 mr-3" />
          <div>
            <h6 class="text-sm font-medium text-white">时间安排</h6>
            <ul class="text-sm text-gray-400 mt-1 space-y-1">
              <li>• 上午：视频学习 + 笔记整理</li>
              <li>• 下午：实践练习 + 问题解决</li>
              <li>• 晚上：复习巩固 + 总结反思</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="stage.resources && stage.resources.length > 0" class="mt-4">
        <h5 class="font-medium text-white flex items-center mb-2">
          <i class="fa fa-link text-orange-400 mr-2" />
          推荐资源
        </h5>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="(resource, resIdx) in stage.resources"
            :key="resIdx"
            :href="resource.url"
            target="_blank"
            class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm hover:bg-blue-500/30 transition-colors flex items-center"
          >
            <i class="fa fa-external-link mr-1" />
            {{ resource.name }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stage: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  intensity: {
    type: String,
    default: 'medium',
  },
});

const intensityMap = {
  low: '轻松（30-60分钟/天）',
  medium: '适中（60-90分钟/天）',
  high: '高强度（90-120分钟/天）',
};
</script>
