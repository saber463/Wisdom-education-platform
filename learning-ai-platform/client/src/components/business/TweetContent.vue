<template>
  <div>
    <p class="mb-3 text-white leading-relaxed">
      {{ tweet.content }}
    </p>
    <div v-if="tweet.images && tweet.images.length" class="grid grid-cols-2 gap-2 mb-3">
      <img
        v-for="img in tweet.images"
        :key="img"
        :src="img"
        class="w-full h-40 object-cover rounded-lg border border-white/10"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  tweet: {
    type: Object,
    required: true,
  },
});
</script>
