# 认证Token获取和使用指南

## 目录

1. [Token概述](#token概述)
2. [获取Token的方法](#获取token的方法)
   - [方法一：使用图形化工具](#方法一使用图形化工具)
   - [方法二：浏览器控制台](#方法二浏览器控制台)
   - [方法三：环境变量](#方法三环境变量)
3. [使用Token进行API测试](#使用token进行api测试)
4. [常见问题和解决方案](#常见问题和解决方案)

## Token概述

本系统使用JWT(JSON Web Token)进行用户身份验证。用户登录成功后，系统会生成一个token并存储在浏览器的localStorage中。API请求需要在Authorization头部携带此token。

## 获取Token的方法

### 方法一：使用图形化工具

1. 确保你已经登录系统
2. 访问本地测试页面：http://localhost:63079/get-token.html
3. 点击"获取Token"按钮
4. 复制显示的token值

### 方法二：浏览器控制台

1. 在系统中登录
2. 按F12打开开发者工具
3. 切换到Console标签
4. 执行以下JavaScript代码：

```javascript
// 尝试不同的键名获取token
const possibleKeys = ['learning_ai_token', 'token', 'authToken', 'accessToken'];

let token = null;
for (const key of possibleKeys) {
  token = localStorage.getItem(key);
  if (token) {
    console.log(`在键 '${key}' 中找到token:`, token);
    break;
  }
}

if (!token) {
  console.log('未找到token，请检查登录状态或键名');
}
```

### 方法三：环境变量

在运行测试脚本前设置环境变量：

**Windows (CMD):**

```cmd
set LEARNING_AI_TOKEN=your_token_here && node test-notification-final.cjs
```

**Windows (PowerShell):**

```powershell
$env:LEARNING_AI_TOKEN="your_token_here"; node test-notification-final.cjs
```

**Mac/Linux:**

```bash
export LEARNING_AI_TOKEN=your_token_here && node test-notification-final.cjs
```

## 使用Token进行API测试

### 使用测试脚本

我们提供了几种测试脚本：

1. **test-notification-final.cjs** - 接受命令行参数的测试脚本

   ```bash
   node test-notification-final.cjs YOUR_TOKEN_HERE
   ```

2. **test-notification-auto.cjs** - 从环境变量获取token的测试脚本
   ```bash
   export LEARNING_AI_TOKEN=your_token_here && node test-notification-auto.cjs
   ```

### 手动测试API

使用curl命令测试API：

```bash
# 获取未读通知数量
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:4001/api/notifications/unread-count

# 获取通知列表
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:4001/api/notifications
```

## 常见问题和解决方案

### 1. "未找到认证Token"错误

**问题原因：** 用户未登录或token键名不正确

**解决方案：**

- 确保已在浏览器中登录系统
- 检查localStorage中的token键名
- 使用图形化工具或控制台脚本查找正确的键名

### 2. "401 Unauthorized"错误

**问题原因：** Token无效或已过期

**解决方案：**

- 重新登录系统获取新的token
- 确保复制的token完整无误
- 检查token是否在有效期范围内

### 3. "网络连接错误"

**问题原因：** API服务器未运行或网络问题

**解决方案：**

- 确认服务器正在运行（http://localhost:4001）
- 检查网络连接
- 确认API端点地址正确

### 4. "CORS错误"

**问题原因：** 浏览器安全策略阻止跨域请求

**解决方案：**

- 确保服务器已正确配置CORS
- 使用相同的域名和端口进行测试
- 检查服务器日志确认CORS配置

## 技术细节

### Token存储机制

Token在登录成功后存储在localStorage中：

- 键名：`learning_ai_token`
- 存储位置：浏览器localStorage
- 有效期：根据JWT设置（通常为几小时到几天）

### API认证流程

1. 客户端发送登录请求
2. 服务器验证凭据并生成JWT
3. 服务器返回token给客户端
4. 客户端将token存储在localStorage中
5. 后续API请求在Authorization头部携带token
6. 服务器验证token有效性并处理请求

### 安全注意事项

- 不要在代码中硬编码token
- 不要将token存储在cookie中（除非有特殊安全措施）
- 定期刷新token以增强安全性
- 在用户登出时清除localStorage中的token
