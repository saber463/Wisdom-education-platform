# 修复切换账号后用户名显示问题

## 问题描述
用户反馈在切换测试账号后，部分页面的用户名没有跟随更新，仍然显示为旧名字或者测试相关的默认名称（如“李同学”、“王老师”），甚至有些地方被用户识别成了类似于“测试加长（测试账号/测试家长）”这样的字眼。

## 根本原因分析
1. **数据源的静态默认值问题**：
   - 数据库中的默认测试账号名称为偏开发测试的命名（如 `测试学生`、`测试家长`），导致用户体验不真实。
   - 前端角色面板组件（`StudentDashboard.vue` 和 `TeacherDashboard.vue`）内部采用了**硬编码**的用户名，如 `name: '李同学'` 和 `name: '王老师'`。这导致即使用户切换了账号，控制台仪表盘里显示的欢迎信息依然是固定死的名字。
   
2. **状态更新流程**：
   - 用户登录后，虽然 `userStore` 中 `userInfo.username` 已经成功获取并保存，但由于仪表盘组件没有绑定该响应式数据，导致页面未能正确响应账号的切换。

## 修复方案

### 1. 动态绑定用户名状态
修改 `StudentDashboard.vue` 和 `TeacherDashboard.vue`，将硬编码的用户名替换为来自 `userStore` 的响应式数据：
- **引入 User Store**：
  ```javascript
  import { useUserStore } from '@/store/user';
  const userStore = useUserStore();
  ```
- **使用 computed 计算属性进行绑定**：
  ```javascript
  // StudentDashboard.vue
  const profile = computed(() => ({
    name: userStore.userInfo?.username || '同学',
    avatar: userStore.userInfo?.avatar || 'https://picsum.photos/seed/student_me/56/56',
    ...
  }));

  // TeacherDashboard.vue
  const profile = computed(() => ({
    name: userStore.userInfo?.username || '老师',
    avatar: userStore.userInfo?.avatar || 'https://picsum.photos/seed/teacher1/56/56',
    ...
  }));
  ```

### 2. 更新数据库和种子文件中的用户名
为了提升界面的真实感，不再使用诸如“测试学生”、“测试家长”之类的名字。
- 更新了当前 MongoDB 中四个测试账号（student1@test.com, teacher1@test.com, parent1@test.com, vip1@test.com）的 `username`：
  - 学生测试号：更新为 `林晓宇`
  - 教师测试号：更新为 `张明哲`
  - 家长测试号：更新为 `王建国`
  - VIP测试号：更新为 `赵小悦`
- 更新了后端的种子脚本 `server/utils/seedTestUsers.js`，以便后续重置数据库时默认就是这些真实名称。

## 验证与测试
- 现在点击“学生登录”快速登录时，学生控制台会显示“👋 你好，林晓宇！”。
- 切换到“教师登录”时，教师控制台会显示“👨‍🏫 张明哲”。
- 所有的用户名显示都已经实现了和当前登录账号数据的动态双向绑定，不再存在信息不一致的情况。
