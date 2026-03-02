<template>
  <div class="dynamic-toggle-switch">
    <el-switch
      v-model="enabled"
      :loading="loading"
      active-text="启用动态调整"
      inactive-text="关闭动态调整"
      @change="handleToggle"
    />
    <p class="description">
      {{ enabled ? '系统将根据您的学习情况自动调整学习路径' : '使用默认学习路径' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface Props {
  pathId: number
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const enabled = ref(props.modelValue)
const loading = ref(false)

watch(() => props.modelValue, (newVal) => {
  enabled.value = newVal
})

async function handleToggle(value: boolean) {
  loading.value = true
  try {
    const response = await request.put<{ code?: number; msg?: string }>('/ai-learning-path/toggle-dynamic', {
      learning_path_id: props.pathId,
      enabled: value
    })

    if (response.code === 200) {
      enabled.value = value
      emit('update:modelValue', value)
      ElMessage.success(value ? '已启用动态调整' : '已关闭动态调整')
    } else {
      ElMessage.error(response.msg || '操作失败')
      enabled.value = !value // 回滚
    }
  } catch (error: unknown) {
    console.error('切换动态调整失败:', error)
    const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg
    ElMessage.error(msg || '操作失败')
    enabled.value = !value // 回滚
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dynamic-toggle-switch {
  @apply flex items-center gap-4;
}

.description {
  @apply text-sm text-gray-600;
}
</style>

