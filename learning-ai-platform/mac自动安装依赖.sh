#!/bin/bash

echo "============================================"
echo "AI智能学习助手 - 自动安装依赖脚本"
echo "============================================"
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误：未检测到Node.js，请先安装Node.js 16或以上版本！"
    exit 1
fi

# 显示Node.js和npm版本
echo "正在检查Node.js和npm版本..."
node --version
echo
npm --version
echo

# 设置npm镜像为淘宝镜像，加速国内用户的安装
echo "正在配置npm镜像..."
npm config set registry https://registry.npmmirror.com/
echo "npm镜像配置完成！"
echo

# 安装前端依赖
echo "正在安装前端(client)依赖..."
cd client
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "前端依赖安装失败，尝试使用yarn安装..."
    yarn install
    if [ $? -ne 0 ]; then
        echo "前端依赖安装失败，请检查网络连接后重试！"
        exit 1
    fi
fi
echo "前端依赖安装完成！"
echo

# 返回项目根目录
cd ..

# 安装后端依赖
echo "正在安装后端(server)依赖..."
cd server
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "后端依赖安装失败，尝试使用yarn安装..."
    yarn install
    if [ $? -ne 0 ]; then
        echo "后端依赖安装失败，请检查网络连接后重试！"
        exit 1
    fi
fi
echo "后端依赖安装完成！"
echo

# 返回项目根目录
cd ..

echo "============================================"
echo "依赖安装完成！"
echo "============================================"
echo
echo "请按照以下步骤启动项目："
echo "1. 启动前端："
echo "   - 打开新的终端窗口"
echo "   - 进入client目录：cd client"
echo "   - 执行命令：npm run dev"
echo "   - 访问地址：http://localhost:3000（如果被占用会自动切换端口）"
echo
echo "2. 启动后端："
echo "   - 打开另一个新的终端窗口"
echo "   - 进入server目录：cd server"
echo "   - 执行命令：npm run dev"
echo "   - 后端服务将在 http://localhost:3001 运行"
echo
echo "注意：需同时启动前端和后端，项目才能正常运行！"
echo
echo "最新功能："
echo "- 修复了购物车功能异常问题"
echo "- 实现了支付功能，支持微信、支付宝、银行卡三种支付方式"
echo "- 添加了支付倒计时功能"
echo "- 修复了提现功能异常问题"
echo "- 创建了知识库新页面"
echo
echo "使用指南请查看：使用指南必看谢谢.md"