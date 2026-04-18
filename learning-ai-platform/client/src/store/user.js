import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import axios from 'axios';
import config from '@/config';
import { userApi, startLoginOperation, endLoginOperation } from '../utils/api';

// 封装localStorage安全读写工具函数
export const safeLocalStorage = {
  get(key) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_error) {
      console.error(`Failed to read ${key} from localStorage:`, _error);
      return null;
    }
  },
  set(key, value) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }

      // 检查数据大小，避免localStorage溢出
      const dataSize = new Blob([JSON.stringify(value)]).size;
      if (dataSize > 5 * 1024 * 1024) {
        // 5MB限制
        throw new Error('Data size exceeds localStorage limit (5MB)');
      }

      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write ${key} to localStorage:`, e);
    }
  },
  remove(key) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  },
  // 清除所有相关存储数据
  clearAll(prefix) {
    try {
      if (!localStorage) {
        throw new Error('localStorage is not available');
      }

      // 获取所有key并筛选出匹配前缀的
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  },
};

export const useUserStore = defineStore('user', {
  state: () => ({
    // 从localStorage加载初始值
    userInfo: safeLocalStorage.get(`${config.storagePrefix}user`) || null,
    browseHistory: [],
    points: 0, // 学习积分
    // 加载状态
    loading: false,
  }),
  getters: {
    /**
     * 判断用户是否已登录
     */
    isLogin: state => !!state.userInfo,

    /**
     * 判断用户是否已登录（别名，保持向后兼容）
     */
    isLoggedIn: state => !!state.userInfo,

    /**
     * 获取用户等级
     */
    userLevel: state => state.userInfo?.level || '入门',

    /**
     * 获取用户角色（增加演示环境硬核推断）
     */
    userRole: state => {
      // 修复账号切换逻辑：直接信赖后端返回的 role 字段，移除脆弱的邮箱关键字判断
      return state.userInfo?.role || 'student';
    },

    /**
     * 判断用户是否为VIP会员
     * 1. 教师账号自带 VIP 权限
     * 2. 指定测试账号拥有 VIP 权限
     * 3. 用户信息中有 isVIP 标记 (如家长为孩子购买后)
     */
    isVIP: state => {
      if (state.userInfo?.role === 'teacher') return true;
      if (state.userInfo?.isVIP) return true;
      const email = (state.userInfo?.email || '').toLowerCase();
      if (email.includes('teacher')) return true;
      const vipEmails = ['student1@test.com', 'vip_test@test.com'];
      return email && vipEmails.includes(email);
    },

    /**
     * 判断用户是否为中级
     */
    isIntermediate: state => state.userInfo?.level === '中级',

    /**
     * 格式化浏览历史
     * - 按时间降序排序（最新的在前）
     * - 转换时间为可读性格式
     */
    formattedHistory: state =>
      state.browseHistory
        .sort((a, b) => b.time - a.time)
        .map(item => ({
          ...item,
          timeStr: dayjs(item.time).format('YYYY-MM-DD HH:mm'),
        })),
  },
  actions: {
    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @param {string} role - 角色（student/teacher/parent）
     * @returns {Promise<Object>} 新用户信息（不含密码）
     * @throws {Error} 注册失败时抛出错误
     */
    async register(username, email, password, role = 'student') {
      // 标记登录操作开始
      startLoginOperation();
      try {
        // 数据验证
        if (!username || !email || !password) {
          throw new Error('用户名、邮箱和密码是必填项');
        }

        if (username.length < 3) {
          throw new Error('用户名长度不能少于3个字符');
        }

        if (password.length < 6) {
          throw new Error('密码长度不能少于6个字符');
        }

        // 验证密码复杂度
        if (!/[A-Z]/.test(password)) {
          throw new Error('密码必须包含至少一个大写字母');
        }

        if (!/[0-9]/.test(password)) {
          throw new Error('密码必须包含至少一个数字');
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('请输入有效的邮箱地址');
        }

        // 调用后端API注册
        const response = await userApi.register({ username, email, password, role });
        const { token, user: userDataFromBackend } = response;

        // 存储用户登录状态（不含密码）
        const userInfo = {
          id: userDataFromBackend._id,
          username: userDataFromBackend.username,
          email: userDataFromBackend.email,
          avatar:
            userDataFromBackend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDataFromBackend.username)}&background=random`,
          role: userDataFromBackend.role || 'student',
          isVIP: userDataFromBackend.isVIP || userDataFromBackend.role === 'teacher',
          createdAt: userDataFromBackend.createdAt || Date.now(),
          permissions: userDataFromBackend.permissions || ['user'],
          // 用户等级：入门 -> 中级（通过考试升级）
          level: userDataFromBackend.level || '入门',
          learningInterests: userDataFromBackend.learningInterests || [],
          learningStats: userDataFromBackend.learningStats || {
            totalStudyTime: 0,
            completedCourses: 0,
            currentCourses: 0,
            generatedPaths: 0,
          },
        };
        this.userInfo = userInfo;
        // 持久化存储到localStorage
        safeLocalStorage.set(`${config.storagePrefix}user`, userInfo);
        // 存储认证token
        safeLocalStorage.set(`${config.storagePrefix}token`, token);

        // 加载用户数据
        await this.loadUserData();

        return userInfo;
      } catch (error) {
        console.error('注册失败:', error);
        // 处理后端返回的错误信息
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      } finally {
        // 标记登录操作结束
        endLoginOperation();
      }
    },

    /**
     * 用户登录
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise<boolean>} 登录是否成功
     */
    async login(email, password) {
      this.loading = true;
      startLoginOperation();
      try {
        const response = await userApi.login({ email, password });
        const { token, user: userDataFromBackend } = response;

        // 修复：直接使用后端返回的角色，不在此处做邮箱关键字判断
        this.userInfo = {
          id: userDataFromBackend._id,
          username: userDataFromBackend.username,
          email: userDataFromBackend.email,
          avatar: userDataFromBackend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDataFromBackend.username)}&background=random`,
          role: userDataFromBackend.role || 'student',
          isVIP: userDataFromBackend.isVIP || userDataFromBackend.role === 'teacher',
          createdAt: userDataFromBackend.createdAt || new Date().toISOString(),
          permissions: userDataFromBackend.permissions || ['user'],
          level: userDataFromBackend.level || '入门',
          learningInterests: userDataFromBackend.learningInterests || [],
          learningStats: userDataFromBackend.learningStats || {
            totalStudyTime: 0,
            completedCourses: 0,
            currentCourses: 0,
            generatedPaths: 0,
          },
        };

        const userKey = `${config.storagePrefix}user`;
        const tokenKey = `${config.storagePrefix}token`;
        safeLocalStorage.set(userKey, this.userInfo);
        safeLocalStorage.set(tokenKey, token);

        // 仅加载周边数据，不重刷用户信息
        try {
          const historyResponse = await userApi.getBrowseHistory();
          if (historyResponse?.success && historyResponse.data?.list) {
            this.browseHistory = historyResponse.data.list;
          }
        } catch (e) { console.warn('加载浏览历史失败:', e); }

        return true;
      } catch (error) {
        throw new Error(error.response?.data?.message || '登录失败');
      } finally {
        this.loading = false;
        endLoginOperation();
      }
    },

    /**
     * 用户登出
     */
    async logout() {
      try {
        this.clearAllUserData();
      } catch (_error) {
        console.error('登出失败:', _error);
        throw _error;
      }
    },

    /**
     * 添加浏览历史记录
     * @param {Object} record - 浏览记录 { path, title?, ... }
     */
    async addBrowseHistory(record) {
      try {
        // 验证必要字段
        if (!record?.path) {
          throw new Error('浏览记录必须包含path字段');
        }

        // 构建有效记录（确保包含时间戳和必要字段）
        const validRecord = {
          ...record,
          time: record.time || Date.now(),
          id: record.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: record.title || '未命名页面',
        };

        // 调用API添加浏览历史
        const response = await userApi.addBrowseHistory(validRecord);
        const newRecord = response.data;

        // 移除相同路径的历史记录（去重）
        this.browseHistory = this.browseHistory.filter(item => item.path !== validRecord.path);

        // 添加到历史列表头部并限制最大长度（可配置）
        this.browseHistory.unshift(newRecord);
        const maxHistoryLength = 100;
        if (this.browseHistory.length > maxHistoryLength) {
          this.browseHistory = this.browseHistory.slice(0, maxHistoryLength);
        }
      } catch (_error) {
        console.error('添加浏览历史失败:', _error);
      }
    },

    /**
     * 清除浏览历史
     */
    async clearHistory() {
      try {
        await userApi.clearBrowseHistory();
        this.browseHistory = [];
      } catch (_error) {
        console.error('清除浏览历史失败:', _error);
        throw _error;
      }
    },

    /**
     * 移除单个浏览历史项
     * @param {string} id - 要移除的历史项ID
     */
    async removeBrowseHistory(id) {
      try {
        await userApi.removeBrowseHistoryItem({ id });
        this.browseHistory = this.browseHistory.filter(item => item.id !== id);
      } catch (_error) {
        console.error('移除浏览历史项失败:', _error);
        throw _error;
      }
    },

    /**
     * 清除所有用户数据（包括登录状态和历史记录）
     */
    clearAllUserData() {
      try {
        this.userInfo = null;
        this.browseHistory = [];
        safeLocalStorage.clearAll(config.storagePrefix);
      } catch (_error) {
        console.error('清除用户数据失败:', _error);
        throw _error;
      }
    },

    /**
     * 检查用户是否有特定权限
     * @param {string} permission - 要检查的权限
     * @returns {boolean} 是否有该权限
     */
    hasPermission(permission) {
      return this.userInfo?.permissions?.includes(permission) || false;
    },

    /**
     * 并行加载所有用户数据
     */
    /**
     * 加载用户数据
     */
    async loadUserData() {
      try {
        // 检查用户登录状态
        if (!this.isLoggedIn) {
          return;
        }

        // 检查token
        const token = safeLocalStorage.get(`${config.storagePrefix}token`);
        if (!token) {
          return;
        }

        // 并行加载浏览历史和用户信息
        const [historyResponse, userInfoResponse] = await Promise.all([
          userApi.getBrowseHistory(),
          userApi.getCurrentUser(),
        ]);

        // 验证响应数据
        if (!userInfoResponse) {
          console.error('用户信息响应为空');
          throw new Error('用户信息响应为空');
        }

        // 检查响应格式
        if (userInfoResponse.success === true && userInfoResponse.data) {
          // 标准格式：{ success: true, data: {...} }
          
          // 保留本地的 avatar 和其他重要字段（防止刷新后头像消失）
          const localAvatar = this.userInfo?.avatar;
          const localPermissions = this.userInfo?.permissions;
          const localLevel = this.userInfo?.level;
          const localLearningInterests = this.userInfo?.learningInterests;
          
          const rawUserInfo = userInfoResponse.data;
          
          // 修复：完全移除角色推断逻辑，直接信赖后端返回的 role
          this.userInfo = {
            ...rawUserInfo,
            role: rawUserInfo.role || 'student'
          };
          
          // 如果后端没有返回 avatar，保留本地 avatar
          if (!this.userInfo.avatar && localAvatar) {
            this.userInfo.avatar = localAvatar;
          }
          // 如果后端没有返回 permissions，保留本地 permissions
          if (!this.userInfo.permissions && localPermissions) {
            this.userInfo.permissions = localPermissions;
          }
          // 如果后端没有返回 level，保留本地 level
          if (!this.userInfo.level && localLevel) {
            this.userInfo.level = localLevel;
          }
          // 如果后端没有返回 learningInterests，保留本地 learningInterests
          if ((!this.userInfo.learningInterests || this.userInfo.learningInterests.length === 0) && localLearningInterests) {
            this.userInfo.learningInterests = localLearningInterests;
          }
        } else if (userInfoResponse._id || userInfoResponse.username) {
          // 直接用户对象格式：{ _id: ..., username: ... }
          
          // 保留本地的 avatar 和其他重要字段
          const localAvatar = this.userInfo?.avatar;
          const localPermissions = this.userInfo?.permissions;
          
          const rawUserInfo = userInfoResponse;
          
          this.userInfo = {
            ...rawUserInfo,
            role: rawUserInfo.role || 'student'
          };
          
          if (!this.userInfo.avatar && localAvatar) {
            this.userInfo.avatar = localAvatar;
          }
          if (!this.userInfo.permissions && localPermissions) {
            this.userInfo.permissions = localPermissions;
          }
        } else {
          throw new Error('用户信息响应格式无效');
        }

        // 更新浏览历史
        if (historyResponse && historyResponse.data && historyResponse.data.list) {
          this.browseHistory = historyResponse.data.list;
        }

        // 持久化用户信息到本地存储
        safeLocalStorage.set(`${config.storagePrefix}user`, this.userInfo);

        console.log('用户数据加载完成');
      } catch (error) {
        console.error('加载用户数据失败:', error);
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status,
        });

        // 如果是401错误，通常意味着令牌无效或用户已删除
        if (error.response?.status === 401) {
          const errorMessage = error.response?.data?.message || '';
          console.log('检测到认证失败或用户不存在，清除本地状态:', errorMessage);
          this.userInfo = null;
          this.browseHistory = [];
          safeLocalStorage.remove(`${config.storagePrefix}token`);
          safeLocalStorage.remove(`${config.storagePrefix}user`);
        }

        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新用户资料
     * @param {Object} profileData - 用户资料 { username, email, intro }
     * @returns {Promise<Object>} 更新后的用户信息
     * @throws {Error} 更新失败时抛出错误
     */
    async updateUserProfile(profileData) {
      try {
        // 调用API更新用户资料
        const response = await userApi.updateProfile(profileData);
        const updatedUser = response.data.data;

        // 更新本地存储的用户信息
        this.userInfo = {
          ...this.userInfo,
          ...updatedUser,
        };
        safeLocalStorage.set(`${config.storagePrefix}user`, this.userInfo);

        return updatedUser;
      } catch (error) {
        console.error('更新用户资料失败:', error);
        // 处理后端返回的错误信息
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    },

    /**
     * 更新用户密码
     * @param {Object} passwordData - 密码数据 { oldPassword, newPassword, confirmPassword }
     * @returns {Promise<boolean>} 是否更新成功
     * @throws {Error} 更新失败时抛出错误
     */
    async updateUserPassword(passwordData) {
      try {
        // 数据验证
        if (
          !passwordData.oldPassword ||
          !passwordData.newPassword ||
          !passwordData.confirmPassword
        ) {
          throw new Error('旧密码、新密码和确认密码是必填项');
        }

        // 验证新密码与确认密码一致
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('两次输入的新密码不一致');
        }

        // 验证新密码与旧密码不同
        if (passwordData.newPassword === passwordData.oldPassword) {
          throw new Error('新密码不能与旧密码相同');
        }

        // 调用API更新密码
        await userApi.updatePassword(passwordData);

        return true;
      } catch (error) {
        console.error('更新密码失败:', error);
        // 处理后端返回的错误信息
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    },

    /**
     * 忘记密码
     * @param {string} email - 用户邮箱
     * @returns {Promise<boolean>} 是否发送成功
     * @throws {Error} 发送失败时抛出错误
     */
    async forgotPassword(email) {
      try {
        // 数据验证
        if (!email) {
          throw new Error('邮箱是必填项');
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('请输入有效的邮箱地址');
        }

        // 调用API发送密码重置邮件
        await userApi.forgotPassword(email);

        return true;
      } catch (error) {
        console.error('发送密码重置邮件失败:', error);
        // 处理后端返回的错误信息
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    },

    /**
     * 重置密码
     * @param {Object} resetData - 重置密码数据 { token, password, confirmPassword }
     * @returns {Promise<boolean>} 是否重置成功
     * @throws {Error} 重置失败时抛出错误
     */
    async resetPassword(resetData) {
      try {
        // 数据验证
        if (!resetData.token || !resetData.password || !resetData.confirmPassword) {
          throw new Error('令牌、新密码和确认密码是必填项');
        }

        // 验证新密码与确认密码一致
        if (resetData.password !== resetData.confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }

        // 调用API重置密码
        await userApi.resetPassword(resetData);

        return true;
      } catch (error) {
        console.error('重置密码失败:', error);
        // 处理后端返回的错误信息
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    },

    /**
     * 更新用户头像
     * @param {string} avatarUrl - 新头像URL
     * @returns {Promise<Object>} 更新后的用户信息
     * @throws {Error} 更新失败时抛出错误
     */
    async updateAvatar(avatarUrl) {
      try {
        // 更新用户头像URL
        if (!this.userInfo) {
          throw new Error('用户未登录');
        }

        // 调用API更新头像
        await userApi.updateAvatar(avatarUrl);
        // 更新本地用户信息
        this.userInfo = { ...this.userInfo, avatar: avatarUrl };
        safeLocalStorage.set(`${config.storagePrefix}user`, this.userInfo);

        return this.userInfo;
      } catch (error) {
        console.error('更新头像失败:', error);
        throw error;
      }
    },

    /**
     * 更新用户信息
     * @param {Object} newInfo - 新的用户信息
     * @returns {Promise<Object>} 更新后的用户信息
     * @throws {Error} 更新失败时抛出错误
     */
    async updateUserInfo(newInfo) {
      try {
        // 更新用户信息
        const updatedInfo = { ...this.userInfo, ...newInfo };
        this.userInfo = updatedInfo;

        // 持久化到localStorage
        safeLocalStorage.set(`${config.storagePrefix}user`, updatedInfo);

        return updatedInfo;
      } catch (error) {
        console.error('更新用户信息失败:', error);
        throw error;
      }
    },

    /**
     * 升级用户等级
     * @param {string} newLevel - 新等级（入门 -> 中级 -> 高级）
     * @returns {Promise<boolean>} 是否升级成功
     */
    async upgradeLevel(newLevel) {
      try {
        if (!this.userInfo) {
          throw new Error('用户未登录');
        }

        // 验证等级顺序
        const validLevels = ['入门', '中级', '高级'];
        const currentIndex = validLevels.indexOf(this.userInfo.level);
        const newIndex = validLevels.indexOf(newLevel);

        if (newIndex <= currentIndex) {
          throw new Error('只能升级到更高级别');
        }

        // 更新本地用户信息（前端先行，后续可调用API同步后端）
        this.userInfo = { ...this.userInfo, level: newLevel };
        safeLocalStorage.set(`${config.storagePrefix}user`, this.userInfo);

        return true;
      } catch (error) {
        console.error('升级用户等级失败:', error);
        throw error;
      }
    },
  },
});
