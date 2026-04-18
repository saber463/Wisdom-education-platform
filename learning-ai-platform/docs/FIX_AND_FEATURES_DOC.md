# 修复及功能添加文档

## 一、登录后显示“测试家长/老师”硬编码名字的修复

### 问题排查
用户反馈登录后，虽然账号角色正确，但显示的用户名仍然是类似“测试家长”或“测试老师”等不真实的名字。
经过排查，前端代码在 `StudentDashboard.vue` 和 `TeacherDashboard.vue` 中已经动态绑定了 `userStore.userInfo.username`，不存在前端的硬编码。问题根源在于**数据库的初始化/测试数据脚本中硬编码了这些测试用户名**。

### 修复方案
修改了后端的四个初始化脚本文件：
1. `server/create-test-users.mjs`
2. `server/create-users-correct.mjs`
3. `server/create-users.mjs`
4. `server/fix-users.mjs`

将原有的测试账号默认名称更新为更具真实感的名称：
- `student1@test.com`：由“测试学生”改为“林晓宇”
- `teacher1@test.com`：由“李明哲”（部分旧版）统一规范为“张明哲”
- `parent1@test.com`：由“测试家长”改为“王建国”
- `vip1@test.com`：由“VIP会员”改为“赵小悦”

---

## 二、头像上传后消失问题的修复

### 问题排查
用户在个人中心上传头像时，提示“头像更新成功”，但在页面刷新后头像会恢复为默认或旧头像。
导致该问题的原因有两个：
1. **本地存储超限或格式问题**：前端原本将图片转为 `base64` 长字符串并调用 `updateAvatar` 接口。如果 `base64` 字符串过大（超过2MB的图片会产生近3MB的 base64 字符串），在写入 `localStorage` 时会被拦截（项目中限制了 5MB 的总存储，但长字符串处理不稳定），导致本地状态未能正确持久化。
2. **接口缓存未清除**：后端的 `/api/users/info` 接口在 `server/app.js` 中被全局配置了 Redis 缓存（默认1小时）。当用户更新了头像，数据库确实更新了，但刷新页面后，前端重新请求 `/api/users/info` 时命中缓存，获取到的依然是旧头像数据。

### 修复方案
1. **重构上传方式**：在 `UserCenter.vue` 中，将读取文件转换为 `base64` 的逻辑移除，改为使用 `FormData` 直接提交文件，并调用专用的文件上传接口 `/users/upload-avatar`。
2. **更新 API 调用**：在 `api.js` 中新增了 `uploadAvatar` 方法，配置了 `multipart/form-data` 请求头。
3. **禁用缓存**：在 `server/routes/userRoutes.js` 和 `server/routes/authRoutes.js` 中，为 `/info` 等实时性要求高的接口添加了 `redisCache.noCache()` 中间件，彻底解决了刷新页面读旧缓存的问题。

---

## 三、根据用户选择的语言/兴趣添加并展示预设头像

### 功能说明
个人中心中拥有“预测头像”面板，系统会根据用户的学习兴趣推荐相关的编程语言或方向的预设头像。

### 添加细节
1. 默认情况下，新用户的兴趣包含了 `javascript`、`python`、`web开发` 和 `机器学习`。
2. 后端的 `uploads/avatars/preset/` 目录下原本缺失对应“web开发”和“机器学习”分类的预设图片。
3. 通过 Node.js 脚本，动态生成并添加了包含 `WEB` 和 `AI` 文字标识的 SVG 矢量头像（如 `web开发-1.svg`、`机器学习-1.svg` 等）。
4. 结合后端 `getPresetAvatars` 接口的动态过滤逻辑，现在当用户打开个人中心并点击更换头像时，系统能精准地在“预测头像”分类下，展示与这几个兴趣完全匹配的 SVG 头像，从而提升了用户体验的个性化程度。