# 登录失败排查与修复文档 (V2.0)

## 1. 前端 API 基准路径 (Base URL) 检查报告

### 配置详情
- **配置文件**: [request.ts](file:///d:/edu-ai-platform-web/Wisdom-education-platform/frontend/src/utils/request.ts)
- **基准路径 (baseURL)**: `/api`
- **代理配置**: [vite.config.ts](file:///d:/edu-ai-platform-web/Wisdom-education-platform/frontend/vite.config.ts)
  - `/api` 代理目标: `http://localhost:3000` (默认) 或环境变量 `VITE_API_BASE_URL`
- **登录请求路径**: `/auth/login` (实际请求 URL 为 `/api/auth/login`)

### 诊断结论
前端配置符合项目规范，Vite 代理将所有以 `/api` 开头的请求转发到后端服务的 3000 端口。

---

## 2. 后端 CORS 允许源配置检查报告

### 配置详情
- **配置文件**: [index.ts](file:///d:/edu-ai-platform-web/Wisdom-education-platform/backend/src/index.ts)
- **允许源 (allowedOrigins)**: 
  - 开发环境: `['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173']`
  - 生产环境: 由环境变量 `FRONTEND_URL` 指定，默认为 `http://localhost:5173`
- **配置参数**:
  - `credentials: true` (允许携带 Cookie/认证信息)
  - `methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`
  - `allowedHeaders: ['Content-Type', 'Authorization']`

### 诊断结论
CORS 配置正确，允许前端开发服务器 (端口 5173) 的跨域请求。

---

## 3. 登录接口限流与安全中间件排查报告

### 限流策略 (Rate Limiting)
- **配置文件**: [rate-limit.ts](file:///d:/edu-ai-platform-web/Wisdom-education-platform/backend/src/middleware/rate-limit.ts)
- **严格限流 (strictRateLimit)**: 每分钟最多 10 次请求。
- **作用范围**: 应用于 `/api/auth/login` 和 `/api/auth/register`。
- **触发表现**: 若超过限制，服务器将返回 `429 Too Many Requests`。

### 安全中间件 (Security Middleware)
- **配置文件**: [index.ts](file:///d:/edu-ai-platform-web/Wisdom-education-platform/backend/src/index.ts)
- **中间件列表**:
  - `helmet()`: 设置各种 HTTP 安全头。
  - `xss()`: 清理用户输入，防止 XSS 攻击。
  - `hpp()`: 防止 HTTP 参数污染。
- **认证拦截**: 登录接口 (`/api/auth/login`) **未** 使用 `authenticateToken` 中间件，符合逻辑。

### 诊断结论
限流和安全配置正常，未发现误拦截登录请求的情况。

---

## 4. `learning-ai-platform/client` 部署后登录失败排查与修复建议

### 4.1 问题现象
将 `learning-ai-platform/client` 项目的 `dist` 产物部署到服务器后，用户无法正常登录，前端控制台可能出现 `404 Not Found` 错误，指向 `/api/auth/login`。

### 4.2 问题分析
`learning-ai-platform/client` 项目的前端配置默认期望后端运行在 4001 端口，并且其 `vite.config.js` 中的代理目标也是 4001。然而，您提到的后端 `Wisdom-education-platform/backend` 默认运行在 3000 端口。

当 `learning-ai-platform/client` 的 `dist` 文件部署到服务器时，如果服务器没有正确配置反向代理将 `/api` 请求转发到 `http://localhost:3000` (即 `Wisdom-education-platform/backend` 的实际端口)，就会导致 404 错误。

### 4.3 修复建议

#### 方案一：修改前端配置 (推荐)
在 `learning-ai-platform/client` 项目中，创建一个 `.env.production` 文件（如果不存在），并根据您的实际后端部署情况，设置 `VITE_API_BASE_URL` 环境变量。

1.  **创建或修改 `.env.production` 文件**:
    在 `d:\edu-ai-platform-web\Wisdom-education-platform\learning-ai-platform\client\` 目录下创建或修改 `.env.production` 文件，添加以下内容：
    ```
    VITE_API_BASE_URL=http://your-backend-domain.com/api
    ```
    *   **`http://your-backend-domain.com`**: 替换为您的后端服务实际部署的域名或 IP 地址。
    *   如果前端和后端部署在同一台服务器上，并且后端运行在 3000 端口，可以设置为 `http://localhost:3000/api`。
    *   **重要**: 确保 `VITE_API_BASE_URL` 包含 `/api` 后缀，因为前端的 `axios` 实例的 `baseURL` 已经设置为 `/api`。

2.  **重新构建前端项目**:
    在 `d:\edu-ai-platform-web\Wisdom-education-platform\learning-ai-platform\client\` 目录下运行构建命令：
    ```bash
    npm run build
    ```
    这将生成新的 `dist` 产物，其中 API 请求的基准路径将使用 `.env.production` 中配置的值。

3.  **重新部署新的 `dist` 产物到服务器**。

#### 方案二：修改后端端口
如果您希望前端保持默认配置，可以将 `Wisdom-education-platform/backend` 的运行端口修改为 4001。

1.  **修改后端 `.env` 文件**:
    在 `d:\edu-ai-platform-web\Wisdom-education-platform\backend\` 目录下创建或修改 `.env` 文件，添加或修改 `PORT` 环境变量：
    ```
    PORT=4001
    ```

2.  **重启后端服务**。

#### 方案三：配置服务器反向代理 (Nginx 示例)
如果前端和后端部署在不同的服务器上，或者您希望通过 Nginx 统一管理请求，您需要在服务器上配置 Nginx 或其他反向代理，将所有 `/api` 的请求转发到后端实际运行的端口。

1.  **修改 Nginx 配置文件**:
    在您的 Nginx 配置文件中 (例如 `/etc/nginx/sites-available/your-frontend-domain.conf`)，添加或修改 `/api` 的 `location` 块，将其代理到后端服务。
    ```nginx
    server {
        listen 80;
        server_name your-frontend-domain.com; # 替换为您的前端域名

        location / {
            root /path/to/your/learning-ai-platform/client/dist; # 前端 dist 目录的绝对路径
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://localhost:3000; # 替换为后端服务实际运行的地址和端口
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    *   **`your-frontend-domain.com`**: 替换为您的前端域名。
    *   **`/path/to/your/learning-ai-platform/client/dist`**: 替换为 `learning-ai-platform/client` 项目 `dist` 目录在服务器上的绝对路径。
    *   **`http://localhost:3000`**: 替换为后端服务实际运行的地址和端口。

2.  **测试并重新加载 Nginx 配置**:
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### 4.4 进一步排查建议
- **检查后端服务日志**: 登录失败时，后端服务通常会打印详细的错误日志，这有助于定位问题。
- **浏览器开发者工具**: 检查网络请求 (Network tab)，查看 `/api/auth/login` 请求的实际 URL、状态码和响应内容。
- **服务器防火墙**: 确保服务器防火墙允许外部访问前端端口 (通常是 80 或 443) 以及 Nginx 能够访问后端端口 (例如 3000)。

---

## 5. 修复建议 (如果问题持续)
- 检查 `backend` 目录下是否存在 `.env` 文件，确认 `PORT` 环境变量是否被错误设置为其他值。
- 在后端 `index.ts` 中添加全局 404 处理，记录未匹配路由的详细日志。
