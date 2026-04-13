<template>
  <div class="mt-4 p-3 rounded-lg backdrop-blur-sm" :class="alertClass">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i :class="iconClass" />
        <span :class="textClass">{{ message }}</span>
      </div>
      <router-link to="/membership" :class="linkClass">
        {{ linkText }} <i class="fa fa-arrow-right ml-1" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'warning',
    validator: value => ['warning', 'error', 'info'].includes(value),
  },
  message: {
    type: String,
    required: true,
  },
  linkText: {
    type: String,
    default: '了解更多',
  },
});

const alertClass = computed(() => {
  return {
    warning: 'bg-orange-500/10 border border-orange-500/20',
    error: 'bg-red-500/10 border border-red-500/20',
    info: 'bg-blue-500/10 border border-blue-500/20',
  }[props.type];
});

const iconClass = computed(() => {
  return {
    warning: 'fa fa-exclamation-triangle text-orange-400',
    error: 'fa fa-times-circle text-red-400',
    info: 'fa fa-info-circle text-blue-400',
  }[props.type];
});

const textClass = computed(() => {
  return {
    warning: 'text-sm text-orange-300',
    error: 'text-sm text-red-300',
    info: 'text-sm text-blue-300',
  }[props.type];
});

const linkClass = computed(() => {
  return {
    warning: 'text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors',
    error: 'text-sm text-red-400 hover:text-red-300 font-medium transition-colors',
    info: 'text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors',
  }[props.type];
});
</script>
