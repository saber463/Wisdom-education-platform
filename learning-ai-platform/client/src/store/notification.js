import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { notificationApi } from '../utils/api';

export const useNotificationStore = defineStore('notification', {
  state: () => {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      currentPage: 1,
      hasMore: false,
    };
  },

  getters: {
    /**
     * 获取所有通知
     */
    allNotifications: state => state.notifications,

    /**
     * 获取未读通知数量
     */
    unreadNotificationsCount: state => state.unreadCount,

    /**
     * 获取未读通知列表
     */
    unreadNotifications: state =>
      state.notifications.filter(notification => notification && !notification.read),

    /**
     * 获取已读通知列表
     */
    readNotifications: state =>
      state.notifications.filter(notification => notification && notification.read),
  },

  actions: {
    /**
     * 从API获取所有通知
     */
    async fetchNotifications(page = 1) {
      this.loading = true;
      try {
        if (!useUserStore().isLogin) {
          this.loading = false;
          return;
        }

        const response = await notificationApi.getList({ page, limit: 20 });

        if (response && response.success && response.data) {
          const { notifications = [], unreadCount = 0 } = response.data;

          if (page === 1) {
            this.notifications = notifications;
          } else {
            this.notifications = [...this.notifications, ...notifications];
          }

          this.unreadCount = unreadCount;
          this.currentPage = page;
          this.hasMore = notifications.length === 20;
        }
      } catch {
      } finally {
        this.loading = false;
      }
    },

    async fetchUnreadCount() {
      try {
        if (!useUserStore().isLogin) {
          return;
        }

        const response = await notificationApi.getUnreadCount();

        if (response && response.success && response.data) {
          this.unreadCount = response.data.unreadCount || 0;
        }
      } catch {}
    },

    /**
     * 添加新通知
     * @param {Object} notification - 通知信息 { title, content, type, link? }
     */
    async addNotification(notification) {
      try {
        if (!notification?.title || !notification?.content) {
          throw new Error('通知必须包含标题和内容');
        }

        const userStore = useUserStore();

        if (!userStore.isLogin) {
          return false;
        }

        this.loading = true;
        const response = await notificationApi.add(notification);
        const newNotification = response?.data?.notification || response?.data || notification;

        this.notifications.unshift(newNotification);
        this.unreadCount++;

        return newNotification;
      } catch {
        return false;
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(notificationId) {
      try {
        const userStore = useUserStore();

        if (!userStore.isLogin) {
          return false;
        }

        const notification = this.notifications.find(
          n => n.id === notificationId || n._id === notificationId
        );
        if (notification) {
          notification.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }

        const _response = await notificationApi.markAsRead(notificationId);
        return true;
      } catch {
        const notification = this.notifications.find(
          n => n.id === notificationId || n._id === notificationId
        );
        if (notification) {
          notification.read = false;
          this.unreadCount++;
        }
        return false;
      }
    },

    async markAllAsRead() {
      try {
        const userStore = useUserStore();

        if (!userStore.isLogin) {
          return false;
        }

        this.notifications.forEach(notification => {
          notification.read = true;
        });
        this.unreadCount = 0;

        await notificationApi.markAllAsRead();
        return true;
      } catch {
        await this.fetchNotifications();
        return false;
      }
    },

    /**
     * 清空所有通知
     */
    async clearAllNotifications() {
      try {
        const userStore = useUserStore();
        if (!userStore.isLogin) return false;

        this.notifications = [];
        this.unreadCount = 0;

        await notificationApi.clearAll();
        return true;
      } catch (error) {
        console.error('清空通知失败:', error);
        return false;
      }
    },

    async deleteNotification(notificationId) {
      try {
        const userStore = useUserStore();

        if (!userStore.isLogin) {
          return false;
        }

        const index = this.notifications.findIndex(
          n => n.id === notificationId || n._id === notificationId
        );
        if (index !== -1) {
          const notification = this.notifications[index];
          this.notifications.splice(index, 1);
          if (!notification.read) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        }

        await notificationApi.delete(notificationId);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * 模拟接收通知（用于测试）
     * @param {Object} options - 通知选项
     */
    simulateNotification(options = {}) {
      const defaultTypes = [
        {
          type: 'like',
          title: '点赞通知',
          content: '有人点赞了你的学习路径',
          link: '/learning/detail',
        },
        { type: 'comment', title: '评论通知', content: '有人评论了你的帖子', link: '/community' },
        { type: 'follow', title: '关注通知', content: '有人关注了你', link: '/user/profile' },
        { type: 'system', title: '系统通知', content: '学习路径推荐已更新', link: '/learning' },
        { type: 'message', title: '消息通知', content: '你有一条新消息', link: '/message' },
      ];

      const randomType = defaultTypes[Math.floor(Math.random() * defaultTypes.length)];

      const newNotification = this.addNotification({
        ...randomType,
        ...options,
      });

      console.log('模拟通知已添加:', newNotification);
      return newNotification;
    },

    /**
     * 获取所有通知（用于调试）
     */
    getAllNotifications() {
      return this.notifications;
    },

    /**
     * 显示成功通知
     * @param {string} content - 成功消息内容
     */
    success(content) {
      return this.addNotification({
        title: '成功',
        content,
        type: 'success',
      });
    },

    /**
     * 显示错误通知
     * @param {string} content - 错误消息内容
     */
    error(content) {
      return this.addNotification({
        title: '错误',
        content,
        type: 'error',
      });
    },

    /**
     * 显示信息通知
     * @param {string} content - 信息消息内容
     */
    info(content) {
      return this.addNotification({
        title: '提示',
        content,
        type: 'system',
      });
    },

    /**
     * 显示警告通知
     * @param {string} content - 警告消息内容
     */
    warning(content) {
      return this.addNotification({
        title: '警告',
        content,
        type: 'warning',
      });
    },

    /**
     * 清空所有通知
     */
    async clearAllNotifications() {
      try {
        // 检查用户是否已登录
        const userStore = useUserStore();

        if (!userStore.isLogin) {
          // 用户未登录，只清空本地状态
          console.warn('用户未登录，只清空本地通知');
          this.notifications = [];
          this.unreadCount = 0;
          return false;
        }

        // 更新本地状态
        this.notifications = [];
        this.unreadCount = 0;

        // 调用后端API清空所有通知
        await notificationApi.clearAll();
        return true;
      } catch (error) {
        console.error('清空所有通知失败:', error);
        // 恢复本地状态
        await this.fetchNotifications();
        return false;
      }
    },
  },
});
