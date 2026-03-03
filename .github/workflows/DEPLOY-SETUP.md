# 部署服务器配置与 GitHub Secrets 说明

部署工作流 `deploy.yml` 通过 SSH 将构建产物推送到你的服务器。若出现 **「The ssh-private-key argument is empty」**，说明仓库中尚未配置部署所需的 GitHub Secrets。按以下步骤完成配置即可。

---

## 一、必配的 GitHub Secrets

在 GitHub 仓库中：**Settings → Secrets and variables → Actions**，点击 **New repository secret**，添加以下密钥（名称必须一致）：

| Secret 名称 | 是否必填 | 说明 |
|-------------|----------|------|
| **SSH_PRIVATE_KEY** | ✅ 必填 | 用于 SSH 登录部署服务器的**私钥**完整内容（见下方生成方式） |
| **DEPLOY_HOST** | ✅ 必填 | 部署服务器地址，如 `192.168.1.100` 或 `deploy.example.com` |
| **DEPLOY_USER** | ✅ 必填 | SSH 登录用户名，如 `ubuntu`、`root`、`deploy` |
| **DEPLOY_PATH** | 可选 | 服务器上项目根目录，默认 `/var/www/edu-platform` |
| **DEPLOY_PORT** | 可选 | SSH 端口，默认 `22` |
| **VITE_API_BASE_URL** | 可选 | 前端构建时使用的后端 API 地址，如 `https://api.example.com` |
| **VITE_AI_SERVICE_URL** | 可选 | 前端构建时使用的 AI 服务地址，如 `https://ai.example.com` |

**SSH_PRIVATE_KEY 为空时**，部署步骤中的 `webfactory/ssh-agent` 会报错，部署不会执行。务必先配置 `SSH_PRIVATE_KEY`、`DEPLOY_HOST`、`DEPLOY_USER`。

---

## 二、生成 SSH 密钥并配置到服务器

### 1. 本地生成专用于部署的密钥对（仅做一次）

在本地或任意一台机器上执行（无需密码即可，方便 CI 使用）：

```bash
# 算法使用 ed25519（推荐）或 rsa
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
```

会得到两个文件：

- `deploy_key` → **私钥**，完整内容复制到 GitHub Secret **SSH_PRIVATE_KEY**
- `deploy_key.pub` → **公钥**，放到部署服务器的 `~/.ssh/authorized_keys` 中

### 2. 将公钥添加到部署服务器

用你**平时登录服务器的方式**登录到部署机，然后执行：

```bash
# 若没有 .ssh 目录则先创建
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 把 deploy_key.pub 的内容追加到 authorized_keys（将下面一行替换为实际公钥内容）
echo "这里粘贴 deploy_key.pub 的完整一行内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

也可以直接上传公钥文件后执行：

```bash
cat deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 将私钥填入 GitHub

- 用文本编辑器打开本地的 `deploy_key`（私钥），**复制全部内容**（包含 `-----BEGIN ... KEY-----` 和 `-----END ... KEY-----`）。
- 在仓库 **Settings → Secrets and variables → Actions** 中新建 Secret：
  - **Name**：`SSH_PRIVATE_KEY`
  - **Value**：粘贴私钥完整内容
- 保存后，部署工作流即可使用该密钥。

---

## 三、部署服务器环境建议

部署脚本会通过 SSH 执行命令并用到 `rsync`、`scp`，建议在服务器上具备：

1. **SSH 可登录**：已配置好上述公钥，且 `DEPLOY_USER` 对该用户。
2. **部署目录可写**：  
   - 默认 `DEPLOY_PATH` 为 `/var/www/edu-platform`，若不存在，脚本会尝试 `sudo mkdir -p` 创建。  
   - 若使用非 root 用户，建议事先在该用户下创建目录并赋予权限，或保证该用户有 sudo 权限。
3. **Node.js**：部署后会在服务器上执行 `npm ci --production` 或 `npm install --production`，需已安装 Node.js（推荐 18+）。
4. **可选**：若使用 PM2 管理后端进程，请先安装并配置好；工作流会尝试 `pm2 restart edu-platform-backend` 或 `pm2 start ...`。

无需在服务器上预置 Git 仓库，构建产物由 GitHub Actions 通过 SSH/rsync 直接传到服务器。

---

## 四、CI/CD 中与部署相关的命令与触发方式

### 触发部署的方式

- **Push 到受保护分支**：向 `main` 或 `master` 分支推送代码时，会自动运行 `deploy.yml`（先 build，再 deploy）。
- **打 tag**：推送以 `v` 开头的 tag（如 `v1.0.0`）时也会触发部署。
- **手动触发**：在 GitHub 仓库 **Actions** 页选择工作流 **「部署到生产服务器」**，点击 **Run workflow**，选择分支后运行。

### 仅本地/CI 测试（不部署）

若只想跑测试或构建、不部署，使用常规 CI 即可，无需配置上述 Secrets：

```bash
# 本地：后端快速测试
cd backend && npm run test:fast

# 本地：前端构建（不部署）
cd frontend && npm run build:ci

# 推送分支后由 ci.yml / full-test.yml 自动跑测试
git push origin your-branch
```

部署**仅**在运行 `deploy.yml` 且配置了 `SSH_PRIVATE_KEY`、`DEPLOY_HOST`、`DEPLOY_USER` 时才会执行。

---

## 五、检查是否配置成功

1. 在 **Settings → Secrets and variables → Actions** 中确认存在：
   - `SSH_PRIVATE_KEY`
   - `DEPLOY_HOST`
   - `DEPLOY_USER`
2. 到 **Actions** 页手动运行一次 **「部署到生产服务器」**，查看部署 job 的日志：
   - 若仍报 `The ssh-private-key argument is empty`，说明 `SSH_PRIVATE_KEY` 未保存或名称拼写错误。
   - 若报权限或连接拒绝，请检查服务器 SSH 端口、防火墙、以及 `authorized_keys` 与 `DEPLOY_USER` 是否一致。

---

## 六、安全建议

- 部署专用密钥**不要**带密码（`-N ""`），仅用于 CI 部署。
- 私钥只存放在 GitHub Secrets 中，不要提交到仓库或写入日志。
- 服务器上建议禁用密码登录、只允许密钥登录，并限制 `authorized_keys` 的权限（仅部署所需命令）。
- 生产环境建议使用独立部署用户（如 `deploy`），并限制其 sudo 权限范围。

配置完成后，再次运行部署工作流即可正常使用 `webfactory/ssh-agent` 并完成部署。
