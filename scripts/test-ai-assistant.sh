#!/bin/bash

# AI助手本地测试脚本

echo "🚀 启动AI助手本地测试..."
echo ""

# 检查GEMINI_API_KEY是否配置
if ! grep -q "GEMINI_API_KEY" apps/api/.env; then
    echo "❌ 错误: GEMINI_API_KEY 未在 apps/api/.env 中配置"
    echo ""
    echo "请按照以下步骤配置："
    echo "1. 访问 https://makersuite.google.com/app/apikey"
    echo "2. 创建API密钥"
    echo "3. 在 apps/api/.env 文件中添加："
    echo "   GEMINI_API_KEY=your_actual_api_key"
    echo ""
    exit 1
fi

echo "✅ GEMINI_API_KEY 已配置"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 构建shared包
echo "🔨 构建共享包..."
cd packages/shared && pnpm build && cd ../..

# 启动开发服务器
echo ""
echo "🎯 启动开发服务器..."
echo ""
echo "前端将运行在: http://localhost:3000"
echo "后端API运行在: http://localhost:8080"
echo ""
echo "打开浏览器访问 http://localhost:3000/dashboard 并点击右下角的 ✨ 按钮"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

pnpm dev

