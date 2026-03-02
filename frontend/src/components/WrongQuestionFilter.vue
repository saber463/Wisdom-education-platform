<template>
  <el-card class="filter-card">
    <el-form
      :model="filters"
      inline
    >
      <el-form-item label="视频">
        <el-select
          v-model="filters.lesson_id"
          placeholder="选择视频"
          clearable
          @change="$emit('filter-change', filters)"
        >
          <el-option
            v-for="lesson in lessons"
            :key="lesson.id"
            :label="lesson.title"
            :value="lesson.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="知识点">
        <el-select
          v-model="filters.knowledge_point_id"
          placeholder="选择知识点"
          clearable
          @change="$emit('filter-change', filters)"
        >
          <el-option
            v-for="point in knowledgePoints"
            :key="point.id"
            :label="point.name"
            :value="point.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="resetFilters">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Filters {
  lesson_id?: number
  knowledge_point_id?: number
  start_date?: string
  end_date?: string
}

const filters = ref<Filters>({})
const dateRange = ref<[Date, Date] | null>(null)

const lessons = ref<Record<string, unknown>[]>([])
const knowledgePoints = ref<Record<string, unknown>[]>([])

defineEmits<{
  'filter-change': [filters: Filters]
}>()

function handleDateChange(dates: [Date, Date] | null) {
  if (dates) {
    filters.value.start_date = dates[0].toISOString().split('T')[0]
    filters.value.end_date = dates[1].toISOString().split('T')[0]
  } else {
    filters.value.start_date = undefined
    filters.value.end_date = undefined
  }
}

function resetFilters() {
  filters.value = {}
  dateRange.value = null
}
</script>

<style scoped>
.filter-card {
  @apply mb-4;
}
</style>

