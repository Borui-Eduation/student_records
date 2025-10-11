#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ⏹️  停止开发服务 ===${NC}"
echo ""

# 显示当前占用端口的进程
echo -e "${YELLOW}🔍 查找占用端口的进程...${NC}"
PORT_3000=$(lsof -ti:3000 2>/dev/null)
PORT_8080=$(lsof -ti:8080 2>/dev/null)

if [ -z "$PORT_3000" ] && [ -z "$PORT_8080" ]; then
    echo -e "${GREEN}✅ 端口 3000 和 8080 空闲${NC}"
else
    echo ""
    [ -n "$PORT_3000" ] && echo -e "${YELLOW}端口 3000 被进程 $PORT_3000 占用${NC}"
    [ -n "$PORT_8080" ] && echo -e "${YELLOW}端口 8080 被进程 $PORT_8080 占用${NC}"
fi

# 停止所有Node进程
echo ""
echo -e "${YELLOW}⏹️  停止所有Node进程...${NC}"
killall -9 node 2>/dev/null

# 等待进程完全停止
sleep 2

# 验证端口已释放
echo ""
echo -e "${YELLOW}✓ 验证端口状态...${NC}"
if lsof -ti:3000,8080 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  某些端口仍被占用，再次清理...${NC}"
    lsof -ti:3000,8080 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo -e "${GREEN}✅ 所有服务已停止，端口已释放${NC}"
echo ""

