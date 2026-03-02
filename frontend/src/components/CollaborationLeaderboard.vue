<template>
  <el-card class="leaderboard-card">
    <template #header>
      <h3>协作排行榜</h3>
    </template>
    <el-table :data="leaderboard" stripe>
      <el-table-column type="index" label="排名" width="60" />
      <el-table-column prop="partner_name" label="伙伴名称" />
      <el-table-column prop="completed_tasks" label="完成任务数" />
      <el-table-column label="排名">
        <template #default="{ row }">
          <el-tag v-if="row.rank === 1" type="danger">🥇</el-tag>
          <el-tag v-else-if="row.rank === 2" type="warning">🥈</el-tag>
          <el-tag v-else-if="row.rank === 3" type="info">🥉</el-tag>
          <span v-else>第{{ row.rank }}名</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
interface LeaderboardItem {
  user_id: number
  partner_name: string
  completed_tasks: number
  rank: number
}

interface Props {
  leaderboard: LeaderboardItem[]
}

defineProps<Props>()
</script>

<style scoped>
.leaderboard-card {
  @apply mb-4;
}
</style>

