<template>
  <div>
    <label class="block text-white mb-2 font-medium">学习天数</label>
    <input
      :value="modelValue"
      type="number"
      min="1"
      max="180"
      class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue/50 transition-all"
      :class="{ error: hasError }"
      placeholder="输入1-180之间的整数"
      @input="handleInput"
    />
    <p v-if="hasError" class="text-red-400 text-sm mt-1">请输入1-180的正整数</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Number,
    default: 30,
  },
  hasError: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const handleInput = event => {
  const value = parseInt(event.target.value);
  emit('update:modelValue', isNaN(value) ? 0 : value);
};
</script>

<style scoped>
.error {
  border-color: #ef4444;
}
</style>
