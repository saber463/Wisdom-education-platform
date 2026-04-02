<template>
  <div class="weak-points-chart">
    <div
      ref="chartContainer"
      class="chart-container"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

interface WeakPoint {
  knowledge_point_id: number
  knowledge_point_name: string
  error_count: number
  error_rate: number
}

interface Props {
  weakPoints: WeakPoint[]
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  const top5 = props.weakPoints.slice(0, 5)
  const names = top5.map(p => p.knowledge_point_name)
  const errorCounts = top5.map(p => p.error_count)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '错题数'
    },
    series: [
      {
        name: '错题数',
        type: 'bar',
        data: errorCounts,
        itemStyle: {
          color: '#FF4B6E'
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

watch(() => props.weakPoints, () => {
  initChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.weak-points-chart {
  @apply w-full;
}

.chart-container {
  @apply w-full h-64;
}
</style>

