<template>
  <div>
    <label class="block text-white mb-2 font-medium">学习目标</label>
    <input
      :value="modelValue"
      type="text"
      class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-blue/50 focus:border-tech-blue/50 transition-all"
      placeholder="例如：30天通过计算机一级考试、1个月通过英语四级、2个月拿下教师资格证"
      @input="handleInput"
    />
    <p v-if="!modelValue.trim() && isFormTouched" class="text-red-400 text-sm mt-1">
      学习目标不能为空
    </p>

    <div class="mt-3">
      <label class="block text-white mb-2 text-sm font-medium">快捷选择目标</label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <label
          v-for="(target, index) in quickTargets"
          :key="index"
          class="flex items-center p-2 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 bg-white/5 transition-colors"
        >
          <input
            type="radio"
            :value="target"
            :checked="selectedTarget === target"
            class="mr-2"
            @change="handleQuickTargetChange"
          />
          <span class="text-sm text-gray-300">{{ target }}</span>
        </label>
      </div>
    </div>

    <div class="mt-2 text-sm text-gray-400">
      <p>
        支持的证书类型包括：计算机类、英语类（四六级、雅思、托福等）、会计类（CPA、ACCA等）、教师类（教师资格证）、设计类（平面设计、UI设计等）
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  quickTargets: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'input']);

const isFormTouched = ref(false);
const selectedTarget = ref('');

watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      selectedTarget.value = '';
    }
  }
);

const handleInput = event => {
  isFormTouched.value = true;
  emit('update:modelValue', event.target.value);
  emit('input', event.target.value);
};

const handleQuickTargetChange = event => {
  selectedTarget.value = event.target.value;
  emit('update:modelValue', event.target.value);
  emit('input', event.target.value);
};
</script>
