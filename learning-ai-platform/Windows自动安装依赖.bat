@echo off

echo ============================================
echo 学习AI平台 - 自动安装依赖脚本
echo ============================================
echo.

rem 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误：未检测到Node.js，请先安装Node.js 16或以上版本！
    pause
    exit /b 1
)

rem 显示Node.js和npm版本
echo 正在检查Node.js和npm版本...
node --version
echo.
npm --version
echo.

rem 设置npm镜像为淘宝镜像，加速国内用户的安装
echo 正在配置npm镜像...
npm config set registry https://registry.npmmirror.com/
echo npm镜像配置完成！
echo.

rem 检查MongoDB是否安装和运行
where mongod >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 警告：未检测到MongoDB，请确保MongoDB已安装并正在运行！
    echo 请访问 https://www.mongodb.com/try/download/community 下载安装
    pause
) else (
    echo MongoDB已安装
    echo.
)

rem 安装前端依赖
echo 正在安装前端(client)依赖...
cd client
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo 前端依赖安装失败，请检查网络连接后重试！
    echo 尝试使用yarn安装...
    call yarn install
    if %ERRORLEVEL% neq 0 (
        echo 前端依赖安装失败，请检查网络连接后重试！
        pause
        exit /b 1
    )
) echo 前端依赖安装完成！
echo.

rem 返回项目根目录
cd ..

rem 安装后端依赖
echo 正在安装后端(server)依赖...
cd server
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo 后端依赖安装失败，请检查网络连接后重试！
    echo 尝试使用yarn安装...
    call yarn install
    if %ERRORLEVEL% neq 0 (
        echo 后端依赖安装失败，请检查网络连接后重试！
        pause
        exit /b 1
    )
) echo 后端依赖安装完成！
echo.

rem 返回项目根目录
cd ..

echo ============================================
echo 环境变量配置提示
echo ============================================
echo 请根据需要配置以下环境变量文件：
echo 1. 根目录创建 .env 文件（复制 .env.example 并填写API密钥）
echo 2. server目录创建 .env 文件（复制 server/.env.example 并填写配置）
echo 3. client目录创建 .env 文件（复制 client/.env.example 并填写配置）
echo.

rem 复制.env.example文件（如果不存在）
if not exist ".env" (
    echo 正在创建 .env 文件...
    copy ".env.example" ".env" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo 无法创建 .env 文件，请手动创建！
    ) else (
        echo .env 文件创建成功，请填写API密钥！
    )
)

if not exist "server\.env" (
    echo 正在创建 server/.env 文件...
    copy "server\.env" "server\.env.example" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo 无法创建 server/.env 文件，请手动创建！
    ) else (
        echo server/.env 文件创建成功，请检查配置！
    )
)

if not exist "client\.env" (
    echo 正在创建 client/.env 文件...
    copy "client\.env.example" "client\.env" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo 无法创建 client/.env 文件，请手动创建！
    ) else (
        echo client/.env 文件创建成功，请检查配置！
    )
)
echo.

echo ============================================
echo 依赖安装完成！
echo ============================================
echo.
echo 请按照以下步骤启动项目：
echo 1. 启动前端：
echo    - 打开新的终端窗口
echo    - 进入client目录：cd client
echo    - 执行命令：npm run dev
echo    - 访问地址：http://localhost:3000（默认，端口可能自动调整）
echo.
echo 2. 启动后端：
echo    - 打开另一个新的终端窗口
echo    - 进入server目录：cd server
echo    - 执行命令：npm run dev
echo    - 后端服务将在 http://localhost:4001 运行
echo.
echo 注意：需同时启动前端和后端，项目才能正常运行！
echo.
echo ============================================
echo 测试账号信息
echo ============================================
echo 可以使用以下测试账号登录：
echo 1. 账号：test@example.com，密码：Test@123
echo 2. 账号：testuser1@example.com，密码：Test@1234
echo 3. 账号：testuser2@example.com，密码：Test@1234
echo.
echo 最新功能：
echo - 修复了用户中心积分显示问题
echo - 实现了浏览历史记录功能
echo - 优化了AI学习路径生成
echo - 修复了推文列表获取失败问题
echo - 创建了知识库页面
echo.
echo ============================================
echo 项目运行后可访问：
echo - 首页：http://localhost:3000
echo - 测试登录：http://localhost:3000/test-login
echo - 学习路径：http://localhost:3000/learning/generate
echo - 用户中心：http://localhost:3000/user/profile
echo.
echo 按任意键退出...
pause >nul