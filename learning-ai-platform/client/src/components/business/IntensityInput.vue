<template>
  <div>
    <label class="block text-white mb-2 font-medium">学习强度</label>
    <select
      :value="modelValue"
      class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue/50 transition-all"
      @change="handleChange"
    >
      <option value="low">轻松（30-60分钟/天）</option>
      <option value="medium" selected>适中（60-90分钟/天）</option>
      <option value="high">高强度（90-120分钟/天）</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'medium',
  },
});

const emit = defineEmits(['update:modelValue']);

const handleChange = event => {
  emit('update:modelValue', event.target.value);
};
</script>
