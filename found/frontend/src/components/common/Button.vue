<template>
  <button
    :class="[
      'font-medium px-4 py-2 rounded-lg transition-all duration-300 relative overflow-hidden group',
      type === 'primary'
        ? 'bg-gradient-to-r from-primary to-accent text-white hover:from-tech-blue hover:to-primary shadow-md hover:shadow-neon-blue hover:scale-105'
        : '',
      type === 'secondary'
        ? 'bg-white dark:bg-white/5 text-primary border border-primary dark:border-tech-blue hover:bg-primary/10 dark:hover:bg-white/10 dark:text-tech-blue backdrop-blur-sm'
        : '',
      disabled ? 'opacity-70 cursor-not-allowed grayscale' : '',
      size === 'sm' ? 'text-sm px-3 py-1' : '',
      size === 'lg' ? 'text-lg px-6 py-3' : '',
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span class="relative z-10 flex items-center justify-center">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: val => ['primary', 'secondary'].includes(val),
  },
  size: {
    type: String,
    default: 'md',
    validator: val => ['sm', 'md', 'lg'].includes(val),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>
