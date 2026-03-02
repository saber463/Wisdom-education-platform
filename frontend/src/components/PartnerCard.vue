<template>
  <el-card
    class="partner-card"
    shadow="hover"
  >
    <div class="partner-header">
      <el-avatar
        :src="partner.partner_avatar"
        :size="80"
      />
      <div class="partner-info">
        <h3>{{ partner.partner_name }}</h3>
        <p class="signature">
          {{ partner.partner_signature }}
        </p>
        <el-tag
          :type="getAbilityTagType(partner.learning_ability_tag)"
          size="small"
        >
          {{ getAbilityTagText(partner.learning_ability_tag) }}
        </el-tag>
        <div class="partner-level">
          <span>等级：{{ partner.partner_level }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
interface Partner {
  partner_id: number
  partner_name: string
  partner_avatar: string
  partner_signature: string
  learning_ability_tag: 'efficient' | 'steady' | 'basic'
  partner_level?: number
}

interface Props {
  partner: Partner
}

defineProps<Props>()

function getAbilityTagType(tag: string): string {
  switch (tag) {
    case 'efficient':
      return 'success'
    case 'steady':
      return 'info'
    case 'basic':
      return 'warning'
    default:
      return 'info'
  }
}

function getAbilityTagText(tag: string): string {
  switch (tag) {
    case 'efficient':
      return '高效型'
    case 'steady':
      return '稳健型'
    case 'basic':
      return '基础型'
    default:
      return tag
  }
}
</script>

<style scoped>
.partner-card {
  @apply mb-4;
}

.partner-header {
  @apply flex items-start gap-4;
}

.partner-info {
  @apply flex-1;
}

.partner-info h3 {
  @apply text-xl font-bold text-gray-800 mb-2;
}

.signature {
  @apply text-gray-600 mb-2;
}

.partner-level {
  @apply mt-2 text-sm text-gray-500;
}
</style>

