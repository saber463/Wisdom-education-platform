<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="!currentPath" class="text-center py-10">
      <ErrorMessage message="暂无学习路径，请先生成专属学习计划" />
      <router-link to="/learning-path/generate" class="btn-primary mt-4 inline-block">
        生成学习路径
      </router-link>
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-bold text-dark mb-2">
          {{ currentPath.goal }}
        </h2>
        <p class="text-gray-600">
          学习周期：{{ currentPath.totalDays }}天（{{ currentPath.startDate }} -
          {{ currentPath.endDate }}）
        </p>
      </div>

      <div class="card mb-8">
        <div class="p-6">
          <h3 class="text-xl font-bold text-dark mb-4">学习路径总结</h3>
          <p class="text-gray-700">
            {{ currentPath.summary }}
          </p>

          <div class="mt-6">
            <h4 class="font-semibold text-lg mb-3">推荐学习资源</h4>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="(resource, idx) in allResources"
                :key="idx"
                class="px-3 py-1 bg-neutral rounded-full text-sm"
              >
                <a :href="resource.url" target="_blank" class="hover:text-primary">{{
                  resource.name
                }}</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <div v-for="(stage, stageIdx) in currentPath.stages" :key="stageIdx">
          <div class="card">
            <div class="p-6">
              <h3 class="text-lg font-bold text-dark mb-4">
                {{ stage.name }}
              </h3>
              <p class="text-gray-700 mb-6">
                {{ stage.description }}
              </p>

              <div class="space-y-4">
                <div v-for="(day, dayIdx) in stage.days" :key="dayIdx">
                  <div class="border-l-4 border-primary pl-4 py-2">
                    <h4 class="text-md font-semibold text-dark mb-2">
                      {{ day.day }}. {{ day.content }}
                      <button
                        v-if="!isCompleted(day.day)"
                        class="btn btn-primary btn-sm ml-2"
                        @click="updateProgress(day.day)"
                      >
                        标记完成
                      </button>
                      <span v-else class="text-success ml-2"> ✓ 已完成 </span>
                    </h4>

                    <div class="mt-2">
                      <h5 class="font-medium mb-2">推荐资源</h5>
                      <div class="flex flex-wrap gap-2">
                        <a
                          v-for="(resource, resIdx) in day.recommendedResources"
                          :key="resIdx"
                          :href="resource.url"
                          target="_blank"
                          class="px-2 py-1 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors"
                        >
                          {{ resource.name }}（{{ resource.type }}）
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLearningStore } from '@/store/learning';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/store/notification';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

const learningStore = useLearningStore();
const router = useRouter();
const notificationStore = useNotificationStore();

// 当前学习路径
const currentPath = computed(() => learningStore.currentPath);

// 所有推荐资源（去重）
const allResources = computed(() => {
  if (!currentPath.value?.stages) return [];
  const resources = [];
  const resourceMap = new Map();

  currentPath.value.stages.forEach(stage => {
    (stage.days || []).forEach(day => {
      (day.recommendedResources || []).forEach(resource => {
        if (!resourceMap.has(resource.name)) {
          resourceMap.set(resource.name, resource);
          resources.push(resource);
        }
      });
    });
  });

  return resources;
});

// 检查某天是否已完成
const isCompleted = day => {
  return learningStore.learningProgress[day] === true;
};

// 更新学习进度
const updateProgress = day => {
  learningStore.updateProgress(day);
  notificationStore.success(`第${day}天学习任务已标记为完成！`);
};

// 如果没有路径，3秒后自动跳转到生成页
if (!currentPath.value) {
  setTimeout(() => {
    router.push('/learning-path/generate');
  }, 3000);
}
</script>
