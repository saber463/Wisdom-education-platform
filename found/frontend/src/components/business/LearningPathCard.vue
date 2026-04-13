<template>
  <div
    class="glass-card group cursor-pointer overflow-hidden hover:shadow-neon-blue transition-all duration-300 dark:bg-white/5"
    @click="handleClick"
  >
    <div class="relative h-36 overflow-hidden border-2 border-primary/30 rounded-t-lg">
      <img
        :src="path.cover"
        alt="学习路径封面"
        class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end"
      >
        <div class="p-4 w-full">
          <span
            class="inline-block text-xs px-2 py-1 rounded-full mb-2 backdrop-blur-md"
            :class="{
              'bg-green-500/80 text-white': path.difficulty === 'easy',
              'bg-yellow-500/80 text-white': path.difficulty === 'medium',
              'bg-red-500/80 text-white': path.difficulty === 'hard',
            }"
          >
            {{ getDifficultyText(path.difficulty) }}
          </span>
          <h3
            class="text-white font-bold text-lg line-clamp-2 group-hover:text-tech-blue transition-colors"
          >
            {{ path.title }}
          </h3>
        </div>
      </div>
    </div>
    <div class="p-4">
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {{ path.description }}
      </p>
      <div
        class="flex justify-between items-center border-t border-gray-100 dark:border-white/10 pt-3"
      >
        <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm">
          <i class="fa fa-clock-o mr-1" />
          <span>{{ path.totalDays }}天</span>
        </div>
        <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm">
          <i class="fa fa-users mr-1" />
          <span>{{ formatStudentCount(path.students) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  path: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click', props.path.id);
};

// 获取难度文本
const getDifficultyText = difficulty => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '较难',
  };
  return difficultyMap[difficulty] || difficulty;
};

// 格式化学生数量
const formatStudentCount = count => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count;
};
</script>

<style scoped>
/* Scoped styles replaced by Tailwind classes */
</style>
