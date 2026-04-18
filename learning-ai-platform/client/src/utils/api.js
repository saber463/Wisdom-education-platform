import axios from 'axios';
import config from '../config';
import { safeLocalStorage, useUserStore } from '../store/user';
import router from '../router';
import { ElMessage } from 'element-plus';

// 登录操作标记，用于避免在登录过程中误判401错误
let isLoginOperation = false;

const api = axios.create({
  baseURL: config.api.baseUrl, // 使用配置中的API基础路径
});

// 添加请求拦截器
api.interceptors.request.use(
  axiosConfig => {
    // 从本地存储获取Token - 每次请求都获取最新值
    const token = safeLocalStorage.get(`${config.storagePrefix}token`);
    if (token) {
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }

    // 添加CSRF Token到POST/PUT/DELETE请求
    const csrfToken = localStorage.getItem('csrf_token');
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(axiosConfig.method?.toLowerCase())) {
      axiosConfig.headers['X-CSRF-Token'] = csrfToken;
    }

    return axiosConfig;
  },
  error => Promise.reject(error)
);

// 添加响应拦截器
api.interceptors.response.use(
  // 成功处理函数：直接返回response.data
  response => response.data,
  // 错误处理函数
  async error => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;

      // 提取错误信息和错误码
      const errorMessage = data.message || '请求失败';
      const errorCode = data.errorCode;

      // 根据错误码处理错误
      switch (errorCode) {
        case 'AUTH_TOKEN_MISSING':
        case 'AUTH_TOKEN_INVALID':
        case 'AUTH_TOKEN_EXPIRED':
          // 401未授权 - 清除用户信息并跳转到登录页
          // 但如果在登录操作过程中，暂时忽略401错误
          if (isLoginOperation) {
            return Promise.reject(error);
          }

          try {
            const userStore = useUserStore();
            if (userStore.clearAllUserData) {
              userStore.clearAllUserData();
            } else {
              safeLocalStorage.remove(`${config.storagePrefix}token`);
              safeLocalStorage.remove(`${config.storagePrefix}user`);
            }
          } catch {
            safeLocalStorage.remove(`${config.storagePrefix}token`);
            safeLocalStorage.remove(`${config.storagePrefix}user`);
          }

          // 如果不是在登录页面，跳转到登录页面
          if (router.currentRoute.value.name !== 'Login') {
            router.push({
              name: 'Login',
              query: { redirect: router.currentRoute.value.fullPath },
            });
          }
          ElMessage.error('登录已过期，请重新登录');
          break;
        case 'PERMISSION_DENIED':
          // 403禁止访问
          ElMessage.error('您没有权限执行此操作');
          break;
        case 'RESOURCE_NOT_FOUND':
          ElMessage.error('请求的资源不存在');
          break;
        case 'RESOURCE_CONFLICT':
          ElMessage.error('资源冲突，请检查后重新提交');
          break;
        case 'VALIDATION_ERROR':
          ElMessage.error('请求参数验证失败');
          break;
        case 'INTERNAL_SERVER_ERROR':
        case 'DATABASE_ERROR':
          ElMessage.error('服务器内部错误，请稍后重试');
          break;
        case 'FILE_UPLOAD_ERROR':
          ElMessage.error('文件上传失败，请检查文件后重试');
          break;
        case 'API_RATE_LIMIT_EXCEEDED':
          ElMessage.error('请求过于频繁，请稍后重试');
          break;
        default:
          // 其他错误状态
          if (status >= 400 && status < 500) {
            ElMessage.error(errorMessage);
          }

          if (status >= 500) {
            ElMessage.error('服务器错误，请稍后重试');
          }
          break;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络错误，请检查您的网络连接');
    } else {
      // 请求配置错误
      ElMessage.error('请求配置错误');
    }

    // 继续抛出错误，让调用方处理
    return Promise.reject(error);
  }
);

// 标记登录操作开始
export const startLoginOperation = () => {
  isLoginOperation = true;
};

// 标记登录操作结束
export const endLoginOperation = () => {
  isLoginOperation = false;
};

// 用户相关API
export const userApi = {
  // 注册
  register: userData => api.post('/auth/register', userData),
  // 登录
  login: credentials => api.post('/auth/login', credentials),
  // 获取当前用户信息
  getCurrentUser: () => api.get('/users/info'),
  // 检查邮箱是否存在
  checkEmail: email => api.get('/auth/check-email', { params: { email } }),
  // 更新用户资料
  updateProfile: userData => api.put('/users/update-profile', userData),
  // 更新密码
  updatePassword: passwordData => api.put('/users/update-password', passwordData),
  // 忘记密码
  forgotPassword: email => api.post('/auth/forgot-password', { email }),
  // 重置密码
  resetPassword: data => api.put('/auth/reset-password', data),
  // 获取浏览历史
  getBrowseHistory: () => api.get('/history'),
  // 添加浏览历史
  addBrowseHistory: record => api.post('/history', record),
  // 清除浏览历史
  clearBrowseHistory: () => api.delete('/history'),
  // 删除浏览历史记录
  removeBrowseHistoryItem: params => api.delete('/history/item', { params }),
  // 更新头像
  updateAvatar: avatarUrl => api.put('/users/update-avatar', { avatar: avatarUrl }),
  // 上传头像文件
  uploadAvatar: formData => api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // 获取预设头像列表
  getPresetAvatars: params => api.get('/users/preset-avatars', { params }),
};

// 帖子相关API
export const tweetApi = {
  // 发布推文
  publish: (data, apiConfig = {}) => api.post('/tweets', data, apiConfig),
  // 获取推文列表
  getList: params => api.get('/tweets', { params }),
  // 点赞
  like: (id, liked) => api.post(`/tweets/${id}/like`, { liked }),
  // 评论
  comment: (id, data) => api.post(`/tweets/${id}/comments`, data),
  // 回复评论
  reply: (tweetId, commentId, data) =>
    api.post(`/tweets/${tweetId}/comments/${commentId}/reply`, data),
  // 评论点赞
  likeComment: (tweetId, commentId, data = {}) =>
    api.post(`/tweets/${tweetId}/comments/${commentId}/like`, data),
  // 分享
  share: id => api.post(`/tweets/${id}/share`),
  // 删除帖子
  delete: id => api.delete(`/tweets/${id}`),
  // 获取当前用户的帖子列表
  getUserList: params => api.get('/tweets/user/list', { params }),
};

// 收藏相关API
export const favoriteApi = {
  // 添加收藏
  add: (resourceId, resourceType = 'Product', collectionName = '默认收藏夹') =>
    api.post('/favorites', { resourceId, resourceType, collectionName }),
  // 取消收藏
  remove: (resourceId, resourceType = 'Product') =>
    api.delete(`/favorites/${resourceType}/${resourceId}`),
  // 检查是否收藏
  check: (resourceId, resourceType = 'Product') =>
    api.get(`/favorites/check/${resourceType}/${resourceId}`),
};

// 学习小组相关API
export const groupApi = {
  // 获取小组列表
  getList: params => api.get('/groups', { params }),
  // 获取用户加入的小组
  getUserGroups: params => api.get('/groups/user', { params }),
  // 创建小组
  create: data => api.post('/groups', data),
  // 获取小组详情
  getDetail: id => api.get(`/groups/${id}`),
  // 更新小组
  update: (id, data) => api.put(`/groups/${id}`, data),
  // 删除小组
  delete: id => api.delete(`/groups/${id}`),
  // 加入小组
  join: (id, data = {}) => api.post(`/groups/${id}/join`, data),
  // 退出小组
  leave: id => api.post(`/groups/${id}/leave`),
  // 获取小组帖子
  getPosts: (id, params) => api.get(`/groups/${id}/posts`, { params }),
  // 创建小组帖子
  createPost: (id, data) => api.post(`/groups/${id}/posts`, data),
  // 点赞小组帖子
  likePost: (id, postId) => api.post(`/groups/${id}/posts/${postId}/like`),
  // 添加评论
  addComment: (id, postId, data) => api.post(`/groups/${id}/posts/${postId}/comments`, data),
  // 获取评论列表
  getComments: (id, postId, params) =>
    api.get(`/groups/${id}/posts/${postId}/comments`, { params }),
};

// 测试相关API
export const testApi = {
  // 获取测试列表
  getList: params => api.get('/tests', { params }),
  // 获取测试详情
  getDetail: id => api.get(`/tests/${id}`),
  // 获取测试题目
  getQuestions: id => api.get(`/tests/${id}/questions`),
  // 提交测试
  submit: (id, data) => api.post(`/tests/${id}/submit`, data),
  // 获取知识点掌握度分析
  getKnowledgePointsAnalysis: () => api.get('/tests/knowledge-points/analysis'),
  // 获取测试结果详情
  getResultDetail: resultId => api.get(`/tests/results/${resultId}`),
};

// 错题本相关API
export const wrongQuestionApi = {
  // 获取错题列表
  getList: params => api.get('/wrong-questions', { params }),
  // 获取单个错题详情
  getDetail: id => api.get(`/wrong-questions/${id}`),
  // 更新错题（标记重点、添加笔记等）
  update: (id, data) => api.put(`/wrong-questions/${id}`, data),
  // 删除单个错题
  delete: id => api.delete(`/wrong-questions/${id}`),
  // 批量删除错题
  batchDelete: ids => api.delete('/wrong-questions/batch', { data: { ids } }),
  // 清空错题本
  clear: () => api.delete('/wrong-questions/clear'),
};

// 学习进度相关API
export const learningProgressApi = {
  // 获取学习进度
  getProgress: () => api.get('/learning-progress'),
  // 设置当前学习路径
  setCurrentPath: data => api.put('/learning-progress/current-path', data),
  // 更新学习进度
  updateProgress: data => api.put('/learning-progress/update', data),
  // 重置学习进度
  resetProgress: () => api.put('/learning-progress/reset'),
};

// 通知相关API
export const notificationApi = {
  // 获取通知列表
  getList: params => api.get('/notifications', { params }),
  // 获取未读数量
  getUnreadCount: () => api.get('/notifications/unread-count'),
  // 标记单条通知为已读
  markAsRead: id => api.put(`/notifications/${id}/read`),
  // 标记所有通知为已读
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  // 添加通知
  add: data => api.post('/notifications', data),
  // 删除通知
  delete: id => api.delete(`/notifications/${id}`),
  // 清空所有通知
  clearAll: () => api.delete('/notifications/clear-all'),
};

// AI相关API
export const aiApi = {
  // AI聊天
  chat: data => api.post('/ai/chat', data),
  // 生成学习路径
  generateLearningPath: (params, apiConfig = {}) =>
    api.post(
      '/ai/generate-plan',
      {
        goal: params.goal,
        daysNum: params.days, // 这里是正确的，后端期望daysNum
        intensity: params.intensity, // 添加学习强度参数
        // 不再传递userId，后端会从req.user._id获取
      },
      apiConfig
    ),
  knowledgePointsAnalysis: data => api.post('/ai/knowledge-points-analysis', data),
  // 生成图片
  generateImage: data => api.post('/ai/generate-image', data),
  // 获取图片生成状态
  getImageGenerationStatus: () => api.get('/ai/image-generation-status'),
};

// 知识库相关API
export const knowledgeBaseApi = {
  // 获取知识点树结构
  getKnowledgePointTree: params => api.get('/knowledge-points/tree', { params }),
  // 获取所有知识点
  getAllKnowledgePoints: params => api.get('/knowledge-points', { params }),
  // 获取单个知识点详情
  getKnowledgePointById: id => api.get(`/knowledge-points/${id}`),
  // 获取用户知识点掌握情况
  getUserKnowledgePoints: params => api.get('/knowledge-points/user', { params }),
  // 更新知识点掌握度
  updateKnowledgePointMastery: data => api.put('/knowledge-points/mastery', data),
  // 获取推荐知识点
  getRecommendedKnowledgePoints: () => api.get('/knowledge-points/recommended'),
};

export default api;
