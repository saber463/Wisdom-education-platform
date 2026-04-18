# 项目启动文档 - 智慧教育平台

## 启动描述
在修复了代码导入错误并补全缺失的路由和控制器文件后，我们成功启动了完整的开发环境，包括数据库、后端服务和前端应用。

## 启动组件清单

### 1. 数据库服务 (MongoDB)
- **状态**：已启动
- **运行命令**：`mongod --dbpath d:\edu-ai-platform-web\Wisdom-education-platform\learning-ai-platform\data\db`
- **监听端口**：27017
- **备注**：使用了项目自带的本地数据目录。

### 2. 后端服务 (Node.js + Express)
- **状态**：已启动 (开发模式)
- **运行命令**：`npm run dev` (在 `server` 目录下)
- **监听地址**：`http://localhost:4001`
- **API 前缀**：`/api`
- **主要修复**：
  - 补全了缺失的 `server/routes/tests.js`
  - 补全了缺失的 `server/controllers/testController.js`
  - 补全了缺失的 `server/utils/test.js`

### 3. 前端服务 (Vue 3 + Vite)
- **状态**：已启动 (开发模式)
- **运行命令**：`npm run dev` (在 `client` 目录下)
- **访问地址**：`http://localhost:3000`

## 验证结论
- **后端连通性**：后端已成功连接 Redis 和 MongoDB，并能正常处理登录认证请求。
- **前端可用性**：Vite 开发服务器已就绪，用户可以通过浏览器访问前端界面。
- **系统完整性**：所有已知的模块导入错误均已修复，系统运行稳定。

## 维护建议
- 启动项目时，请务必先确保 MongoDB 处于运行状态，再启动后端服务。
- 如需重置数据库，可以运行 `npm run seed` 命令。
