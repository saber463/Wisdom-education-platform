# 部署配置指南

## GitHub Actions 部署配置

### 必需的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets（Settings > Secrets and variables > Actions）：

#### 1. SSH 连接配置

- **`SSH_PRIVATE_KEY`**: 用于连接服务器的SSH私钥
  ```bash
  # 生成SSH密钥对（如果还没有）
  ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
  
  # 将私钥内容复制到 GitHub Secrets
  cat ~/.ssh/id_rsa
  
  # 将公钥添加到服务器
  ssh-copy-id user@your-server.com
  # 或者手动添加
  cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
  ```

#### 2. 服务器信息

- **`DEPLOY_HOST`**: 服务器IP地址或域名
  ```
  例如: 192.168.1.100 或 deploy.example.com
  ```

- **`DEPLOY_USER`**: SSH登录用户名
  ```
  例如: deploy 或 root
  ```

- **`DEPLOY_PATH`**: 部署路径（可选，默认: `/var/www/edu-platform`）
  ```
  例如: /var/www/edu-platform
  ```

- **`DEPLOY_PORT`**: SSH端口（可选，默认: `22`）
  ```
  例如: 22 或 2222
  ```

#### 3. 前端环境变量（可选）

- **`VITE_API_BASE_URL`**: 前端API基础URL
  ```
  例如: https://api.example.com
  ```

- **`VITE_AI_SERVICE_URL`**: AI服务URL
  ```
  例如: https://ai.example.com
  ```

### 服务器准备

#### 1. 安装 Node.js

```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2. 安装 Nginx（用于前端）

```bash
sudo apt-get update
sudo apt-get install -y nginx

# 配置Nginx（见下方配置示例）
sudo nano /etc/nginx/sites-available/edu-platform
```

#### 3. 安装 PM2（用于后端进程管理，可选）

```bash
sudo npm install -g pm2

# 启动后端服务
pm2 start /var/www/edu-platform/backend/dist/index.js --name edu-platform-backend
pm2 save
pm2 startup
```

#### 4. 配置 Nginx

创建 `/etc/nginx/sites-available/edu-platform`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /var/www/edu-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # AI服务代理
    location /ai {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/edu-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置防火墙

```bash
# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许SSH（如果使用非标准端口）
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable
```

### 部署流程

1. **自动部署**: 
   - 推送到 `main` 或 `master` 分支时自动触发
   - 创建版本标签（如 `v1.0.0`）时自动触发

2. **手动部署**:
   - 进入 GitHub Actions 页面
   - 选择 "部署到生产服务器" 工作流
   - 点击 "Run workflow"
   - 选择部署环境（production 或 staging）

3. **部署步骤**:
   - 构建后端和前端
   - 上传构建产物
   - 通过SSH连接到服务器
   - 备份现有部署
   - 部署新文件
   - 安装后端依赖
   - 重启服务
   - 健康检查

### 回滚

如果部署出现问题，可以手动回滚：

```bash
# SSH到服务器
ssh user@your-server.com

# 查看备份
ls -la /var/www/edu-platform_backup_*

# 恢复备份
sudo cp -r /var/www/edu-platform_backup_YYYYMMDD_HHMMSS/* /var/www/edu-platform/

# 重启服务
pm2 restart edu-platform-backend
# 或
sudo systemctl restart edu-platform-backend

# 重新加载Nginx
sudo nginx -s reload
```

### 监控和日志

#### PM2 监控

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs edu-platform-backend

# 查看监控
pm2 monit
```

#### Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 安全建议

1. **使用非root用户**: 创建专用部署用户
   ```bash
   sudo adduser deploy
   sudo usermod -aG sudo deploy
   ```

2. **SSH密钥认证**: 禁用密码登录
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 设置: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **HTTPS配置**: 使用 Let's Encrypt 配置SSL
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. **定期备份**: 设置自动备份脚本
   ```bash
   # 创建备份脚本
   # 添加到 crontab: 0 2 * * * /path/to/backup.sh
   ```

### 故障排除

#### 部署失败

1. 检查 GitHub Actions 日志
2. 验证 SSH 连接: `ssh -v user@host`
3. 检查服务器磁盘空间: `df -h`
4. 检查文件权限: `ls -la /var/www/edu-platform`

#### 服务无法启动

1. 检查端口占用: `netstat -tulpn | grep :3000`
2. 查看服务日志: `pm2 logs` 或 `journalctl -u service-name`
3. 检查环境变量: 确保 `.env` 文件配置正确
4. 验证依赖安装: `cd /var/www/edu-platform/backend && npm list`

#### 前端无法访问

1. 检查 Nginx 配置: `sudo nginx -t`
2. 检查文件权限: `sudo chown -R www-data:www-data /var/www/edu-platform/frontend`
3. 查看 Nginx 错误日志: `sudo tail -f /var/log/nginx/error.log`

### 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Nginx 文档](https://nginx.org/en/docs/)


