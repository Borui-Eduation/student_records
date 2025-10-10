#!/bin/bash

# Quick Test Script
# 快速测试脚本
#
# 使用方法:
#   chmod +x scripts/run-tests.sh
#   ./scripts/run-tests.sh

set -e

echo "🧪 Student Record System - Quick Test"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取项目根目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# 检查测试类型
echo "请选择测试类型:"
echo "1) 本地服务器测试"
echo "2) 生产环境测试"
read -p "请输入选项 (1 或 2): " TEST_TYPE

if [ "$TEST_TYPE" == "1" ]; then
    API_URL="http://localhost:8080"
    WEB_URL="http://localhost:3000"
    echo ""
    echo "🏠 测试本地环境..."
elif [ "$TEST_TYPE" == "2" ]; then
    read -p "请输入 API URL (例: https://student-record-api-xxx.run.app): " API_URL
    read -p "请输入前端 URL (例: https://your-app.vercel.app): " WEB_URL
    echo ""
    echo "☁️  测试生产环境..."
else
    echo -e "${RED}❌ 无效的选项${NC}"
    exit 1
fi

echo "======================================"
echo ""

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "测试 $name... "
    
    if response=$(curl -s -f "$url" 2>/dev/null); then
        if [ -z "$expected" ] || echo "$response" | grep -q "$expected"; then
            echo -e "${GREEN}✅ 通过${NC}"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ 失败 (响应不匹配)${NC}"
            echo "期望包含: $expected"
            echo "实际响应: $response"
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ 失败 (无法连接)${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. 后端测试
echo "📡 后端 API 测试"
echo "--------------------------------"
test_endpoint "健康检查" "$API_URL/health" "ok"
echo ""

# 2. 前端测试
echo "🌐 前端测试"
echo "--------------------------------"
if curl -s -f "$WEB_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端可访问${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ 前端无法访问${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# 3. CORS 测试
echo "🔒 CORS 测试"
echo "--------------------------------"
echo -n "测试 CORS 配置... "
CORS_HEADER=$(curl -s -I -H "Origin: $WEB_URL" "$API_URL/health" | grep -i "access-control-allow-origin" || true)
if [ -n "$CORS_HEADER" ]; then
    echo -e "${GREEN}✅ CORS 已配置${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  CORS 可能未正确配置${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# 4. 响应时间测试
echo "⚡ 性能测试"
echo "--------------------------------"
echo -n "测试 API 响应时间... "
START_TIME=$(date +%s%N)
curl -s -f "$API_URL/health" > /dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $DURATION -lt 1000 ]; then
    echo -e "${GREEN}✅ ${DURATION}ms (优秀)${NC}"
    PASSED=$((PASSED + 1))
elif [ $DURATION -lt 2000 ]; then
    echo -e "${YELLOW}⚠️  ${DURATION}ms (可接受)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ ${DURATION}ms (太慢)${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# 5. SSL/HTTPS 测试（仅生产环境）
if [ "$TEST_TYPE" == "2" ]; then
    echo "🔐 安全测试"
    echo "--------------------------------"
    
    echo -n "测试 HTTPS... "
    if [[ "$API_URL" == https://* ]] && [[ "$WEB_URL" == https://* ]]; then
        echo -e "${GREEN}✅ HTTPS 已启用${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ 未使用 HTTPS${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# 测试总结
echo "======================================"
echo "📊 测试总结"
echo "======================================"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "总计: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置${NC}"
    exit 1
fi


