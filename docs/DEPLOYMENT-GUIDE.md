# 部署指南

## 概述

本文档描述了学习平台的生产环境部署流程。

## 环境要求

### 服务器要求
- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+) 或 Windows Server 2019+
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **磁盘**: 100GB以上（SSD推荐）

### 软件要求
- **Node.js**: 18.x 或更高版本
- **MySQL**: 8.0 或更高版本
- **MongoDB**: 5.0 或更高版本
- **Redis**: 6.0 或更高版本
- **Nginx**: 1.18+ (可选，用于反向代理)

## 部署步骤

### 1. 环境准备

#### 1.1 安装Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 1.2 安装MySQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

#### 1.3 安装MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# CentOS/RHEL
sudo yum install -y mongodb-org
```

#### 1.4 安装Redis
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. 数据库配置

#### 2.1 MySQL配置
```bash
# 登录MySQL
sudo mysql -u root -p

# 创建数据库
CREATE DATABASE edu_education_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'edu_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON edu_education_platform.* TO 'edu_user'@'localhost';
FLUSH PRIVILEGES;

# 执行数据库迁移脚本
mysql -u edu_user -p edu_education_platform < backend/sql/learning-platform-integration-tables.sql
```

#### 2.2 MongoDB配置
```bash
# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 创建数据库和用户（可选）
mongo
use edu_education_platform
db.createUser({
  user: "edu_user",
  pwd: "your_password",
  roles: [{ role: "readWrite", db: "edu_education_platform" }]
})
```

#### 2.3 Redis配置
```bash
# 编辑Redis配置
sudo nano /etc/redis/redis.conf

# 设置密码（可选）
requirepass your_redis_password

# 重启Redis
sudo systemctl restart redis
```

### 3. 应用部署

#### 3.1 克隆代码
```bash
git clone <repository_url>
cd edu-ai-platform-web
```

#### 3.2 安装依赖
```bash
# 后端
cd backend
npm install --production

# 前端
cd ../frontend
npm install --production
npm run build
```

#### 3.3 配置环境变量

创建 `backend/.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=edu_user
DB_PASSWORD=your_password
DB_NAME=edu_education_platform

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/edu_education_platform

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# 服务端口
PORT=3000

# AI服务配置
AI_SERVICE_ADDRESS=localhost:50051

# 生产环境标识
NODE_ENV=production
```

#### 3.4 启动服务

**方式1: 使用PM2（推荐）**
```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start src/index.ts --name edu-backend --interpreter ts-node

# 启动前端服务（如果需要）
cd ../frontend
pm2 start npm --name edu-frontend -- start

# 保存PM2配置
pm2 save
pm2 startup
```

**方式2: 使用systemd**
```bash
# 创建服务文件
sudo nano /etc/systemd/system/edu-backend.service
```

服务文件内容：
```ini
[Unit]
Description=Edu AI Platform Backend
After=network.target mysql.service mongod.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/edu-ai-platform-web/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl start edu-backend
sudo systemctl enable edu-backend
```

### 4. Nginx配置（可选）

创建Nginx配置文件 `/etc/nginx/sites-available/edu-platform`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/edu-ai-platform-web/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/edu-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. HTTPS配置（可选）

使用Let's Encrypt获取免费SSL证书：
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. 监控和日志

#### 6.1 PM2监控
```bash
pm2 monit
pm2 logs
```

#### 6.2 日志配置
日志文件位置：
- 应用日志: `backend/logs/`
- Nginx日志: `/var/log/nginx/`
- MySQL日志: `/var/log/mysql/`
- MongoDB日志: `/var/log/mongodb/`

### 7. 备份策略

#### 7.1 MySQL备份
```bash
# 创建备份脚本
cat > /usr/local/bin/backup-mysql.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u edu_user -p'your_password' edu_education_platform > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-mysql.sh

# 添加到crontab（每天凌晨2点备份）
crontab -e
0 2 * * * /usr/local/bin/backup-mysql.sh
```

#### 7.2 MongoDB备份
```bash
# 创建备份脚本
cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db edu_education_platform --out $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} +
EOF

chmod +x /usr/local/bin/backup-mongodb.sh

# 添加到crontab
0 3 * * * /usr/local/bin/backup-mongodb.sh
```

## 性能优化

### 1. 数据库优化
- 添加适当的索引
- 配置连接池大小
- 启用查询缓存

### 2. Redis缓存
- 配置内存限制
- 设置合适的过期时间
- 使用持久化策略

### 3. 应用优化
- 启用Gzip压缩
- 配置CDN（用于静态资源）
- 使用负载均衡（多实例部署）

## 故障排查

### 常见问题

1. **服务无法启动**
   - 检查端口是否被占用
   - 检查数据库连接
   - 查看日志文件

2. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证用户名密码
   - 检查防火墙设置

3. **性能问题**
   - 检查数据库查询性能
   - 查看Redis缓存命中率
   - 监控服务器资源使用

## 安全建议

1. **防火墙配置**
   - 只开放必要端口（80, 443, 22）
   - 限制数据库访问IP

2. **定期更新**
   - 更新系统补丁
   - 更新依赖包
   - 更新数据库版本

3. **访问控制**
   - 使用强密码
   - 启用SSH密钥认证
   - 配置fail2ban

## 维护计划

- **每日**: 检查服务状态、查看错误日志
- **每周**: 检查磁盘空间、备份验证
- **每月**: 性能分析、安全审计、依赖更新

