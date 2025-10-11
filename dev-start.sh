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

# 清理缓存
echo ""
echo -e "${YELLOW}🗑️  清理构建缓存...${NC}"
rm -rf apps/web/.next 2>/dev/null
rm -rf apps/api/dist 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
echo -e "${GREEN}✅ 缓存已清理${NC}"

# 增加文件描述符限制
echo ""
echo -e "${YELLOW}⚙️  配置系统限制...${NC}"
ulimit -n 65536
echo -e "${GREEN}✅ 文件描述符限制: $(ulimit -n)${NC}"

# 启动服务
echo ""
echo -e "${BLUE}=== 🚀 启动开发服务 ===${NC}"
echo ""
echo -e "${YELLOW}正在启动前端和后端...${NC}"
echo ""

pnpm dev

