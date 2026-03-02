<template>
  <div class="knowledge-mastery-chart">
    <div
      ref="chartContainer"
      class="chart-container"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

interface KnowledgeMastery {
  knowledge_point_id: number
  knowledge_point_name: string
  mastery_level: 'mastered' | 'consolidating' | 'weak'
  mastery_score: number
  evaluation_count: number
}

interface Props {
  masteryList: KnowledgeMastery[]
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  // 统计数据
  const mastered = props.masteryList.filter(m => m.mastery_level === 'mastered').length
  const consolidating = props.masteryList.filter(m => m.mastery_level === 'consolidating').length
  const weak = props.masteryList.filter(m => m.mastery_level === 'weak').length

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['已掌握', '待巩固', '薄弱']
    },
    series: [
      {
        name: '知识点掌握度',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个 ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: mastered, name: '已掌握', itemStyle: { color: '#67c23a' } },
          { value: consolidating, name: '待巩固', itemStyle: { color: '#e6a23c' } },
          { value: weak, name: '薄弱', itemStyle: { color: '#f56c6c' } }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
}

function updateChart() {
  if (!chartInstance) return
  initChart()
}

watch(() => props.masteryList, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.knowledge-mastery-chart {
  @apply w-full;
}

.chart-container {
  @apply w-full h-80;
}
</style>

