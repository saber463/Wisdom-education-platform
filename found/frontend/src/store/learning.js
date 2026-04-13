import { defineStore } from 'pinia';
import { learningProgressApi } from '../utils/api';

export const useLearningStore = defineStore('learning', {
  state: () => ({
    currentPath: null,
    learningProgress: {},
    loading: false,
  }),
  actions: {
    async fetchLearningProgress() {
      try {
        this.loading = true;
        const response = await learningProgressApi.getProgress();
        const data = response.data;

        this.currentPath = data.currentPath || null;
        this.learningProgress = data.learningProgress || {};

        return true;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },

    async setCurrentPath(path) {
      try {
        this.loading = true;
        await learningProgressApi.setCurrentPath({ currentPath: path });
        this.currentPath = path;
        return true;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },

    async updateProgress(day) {
      try {
        this.loading = true;
        const newProgress = { ...this.learningProgress, [day]: true };
        await learningProgressApi.updateProgress({ learningProgress: newProgress });
        this.learningProgress = newProgress;
        return true;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },

    async resetProgress() {
      try {
        this.loading = true;
        await learningProgressApi.resetProgress();
        this.learningProgress = {};
        return true;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },

    async clearCurrentPath() {
      try {
        this.loading = true;
        await learningProgressApi.setCurrentPath({ currentPath: null });
        await learningProgressApi.resetProgress();
        this.currentPath = null;
        this.learningProgress = {};
        return true;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
