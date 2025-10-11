#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 🧹 清理端口和缓存 ===${NC}"
echo ""

# 停止所有相关进程
echo -e "${YELLOW}⏹️  停止所有Node进程...${NC}"
killall -9 node 2>/dev/null && echo -e "${GREEN}✅ Node进程已清理${NC}" || echo -e "${GREEN}✅ 无需清理进程${NC}"

# 等待端口释放
sleep 2

# 检查端口是否已释放
echo ""
echo -e "${YELLOW}🔍 检查端口状态...${NC}"
PORT_3000=$(lsof -ti:3000 2>/dev/null)
PORT_8080=$(lsof -ti:8080 2>/dev/null)

if [ -n "$PORT_3000" ] || [ -n "$PORT_8080" ]; then
    echo -e "${RED}⚠️  端口仍被占用，强制清理...${NC}"
    [ -n "$PORT_3000" ] && kill -9 $PORT_3000 2>/dev/null
    [ -n "$PORT_8080" ] && kill -9 $PORT_8080 2>/dev/null
    sleep 1
fi

echo -e "${GREEN}✅ 端口 3000 和 8080 已释放${NC}"

# 清理缓存 - 使用后台进程避免卡住
echo ""
echo -e "${YELLOW}🗑️  清理构建缓存...${NC}"

# 清理 .next 目录（重要：避免 undici 模块错误）
if [ -d "apps/web/.next" ]; then
    echo "  ⏳ 清理 .next..."
    rm -rf apps/web/.next 2>/dev/null &
    CLEAN_PID=$!
    sleep 2
    if kill -0 $CLEAN_PID 2>/dev/null; then
        kill -9 $CLEAN_PID 2>/dev/null
    fi
    wait $CLEAN_PID 2>/dev/null
    echo "  ✓ 清理 .next 完成"
fi

# 清理 dist 目录
if [ -d "apps/api/dist" ]; then
    rm -rf apps/api/dist 2>/dev/null && echo "  ✓ 清理 dist"
fi

# 清理 cache 目录
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache 2>/dev/null && echo "  ✓ 清理 cache"
fi

echo -e "${GREEN}✅ 缓存已清理${NC}"

# 增加文件描述符限制
echo ""
echo -e "${YELLOW}⚙️  配置系统限制...${NC}"
ulimit -n 65536
echo -e "${GREEN}✅ 文件描述符限制: $(ulimit -n)${NC}"

# 检查并安装依赖（如果需要）
echo ""
echo -e "${YELLOW}📦 检查依赖...${NC}"
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}⏳ 安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖已存在${NC}"
fi

# 编译 shared 包
echo ""
echo -e "${BLUE}=== 📦 编译共享包 ===${NC}"
echo ""
cd packages/shared && pnpm build && cd ../..
echo -e "${GREEN}✅ Shared 包编译完成${NC}"

# 启动服务
echo ""
echo -e "${BLUE}=== 🚀 启动开发服务 ===${NC}"
echo ""

# 创建日志目录
mkdir -p .logs

# 启动 API 服务
echo -e "${YELLOW}🔧 启动 API 服务 (端口 8080)...${NC}"
cd apps/api && pnpm dev > ../../.logs/api.log 2>&1 &
API_PID=$!
cd ../..
sleep 3

# 检查 API 是否启动成功
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API 服务已启动${NC}"
else
    echo -e "${RED}❌ API 服务启动失败，请查看日志: .logs/api.log${NC}"
    exit 1
fi

# 启动 Web 服务
echo -e "${YELLOW}🌐 启动 Web 服务 (端口 3000)...${NC}"
cd apps/web && pnpm dev > ../../.logs/web.log 2>&1 &
WEB_PID=$!
cd ../..

# 等待 Web 服务编译
echo -e "${YELLOW}⏳ 等待 Web 服务编译...${NC}"
for i in {1..30}; do
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web 服务已启动${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Web 服务启动超时，请查看日志: .logs/web.log${NC}"
        exit 1
    fi
done

# 启动成功
echo ""
echo -e "${GREEN}=== ✨ 开发环境已就绪 ===${NC}"
echo ""
echo -e "  ${BLUE}📱 前端:${NC} http://localhost:3000"
echo -e "  ${BLUE}🔌 API:${NC}  http://localhost:8080"
echo ""
echo -e "  ${YELLOW}📋 日志文件:${NC}"
echo -e "    - API: .logs/api.log"
echo -e "    - Web: .logs/web.log"
echo ""
echo -e "  ${YELLOW}💡 提示:${NC}"
echo -e "    - 使用 ${GREEN}tail -f .logs/api.log${NC} 查看API日志"
echo -e "    - 使用 ${GREEN}tail -f .logs/web.log${NC} 查看Web日志"
echo -e "    - 使用 ${GREEN}./dev-stop.sh${NC} 停止所有服务"
echo ""

# 保持脚本运行，等待用户中断
echo -e "${YELLOW}按 Ctrl+C 停止所有服务...${NC}"
echo ""

# 捕获 SIGINT 信号 (Ctrl+C)
trap "echo ''; echo -e '${YELLOW}正在停止服务...${NC}'; killall node 2>/dev/null; echo -e '${GREEN}✅ 已停止所有服务${NC}'; exit 0" SIGINT

# 持续显示日志
tail -f .logs/web.log .logs/api.log 2>/dev/null

