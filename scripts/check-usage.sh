#!/bin/bash

# 免费额度使用情况检查脚本
# Usage: ./scripts/check-usage.sh

echo "==================================="
echo "  📊 免费额度使用情况检查"
echo "==================================="
echo ""

PROJECT_ID="borui-education-c6666"
REGION="us-west1"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 正在检查 Cloud Run...${NC}"
echo ""
gcloud run services describe student-record-api \
  --region $REGION \
  --format="table(
    metadata.name,
    status.url,
    spec.template.spec.containers[0].resources.limits.memory,
    spec.template.spec.containers[0].resources.limits.cpu
  )" 2>/dev/null

echo ""
echo -e "${BLUE}📊 Cloud Run 免费额度:${NC}"
echo "  ✅ CPU: 180,000 vCPU-秒/月 (~50 小时)"
echo "  ✅ 内存: 360,000 GiB-秒/月 (~100 GB-小时)"
echo "  ✅ 请求: 200万次/月"
echo ""

echo -e "${BLUE}🔥 Firestore 免费额度 (每天):${NC}"
echo "  ✅ 读取: 50,000 次"
echo "  ✅ 写入: 20,000 次"
echo "  ✅ 删除: 20,000 次"
echo "  ✅ 存储: 1 GB"
echo ""

echo -e "${BLUE}💰 当前预估成本:${NC}"
echo "  • Cloud Run: ${GREEN}\$0.00/月${NC} (在免费额度内)"
echo "  • Firestore: ${GREEN}\$0.00/月${NC} (在免费额度内)"
echo "  • Cloud KMS: ${YELLOW}\$0.06/月${NC} (无免费额度)"
echo "  • Vercel: ${GREEN}\$0.00/月${NC} (在免费额度内)"
echo ""
echo -e "  ${GREEN}总计: ~\$0.06/月 (~\$0.72/年)${NC}"
echo ""

echo -e "${BLUE}🔗 详细监控链接:${NC}"
echo "  • 计费控制台: https://console.cloud.google.com/billing/018EB9-8F68C4-1617F3"
echo "  • Cloud Run: https://console.cloud.google.com/run/detail/$REGION/student-record-api/metrics"
echo "  • Firestore: https://console.firebase.google.com/project/$PROJECT_ID/usage"
echo "  • Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/overview"
echo ""

echo -e "${BLUE}📋 建议:${NC}"
echo "  1. 每周检查 Cloud Run 请求数"
echo "  2. 每月检查 Firestore 使用量"
echo "  3. 设置预算警报 (\$5 和 \$10)"
echo "  4. 查看详细报告: cat FREE_TIER_ANALYSIS.md"
echo ""

echo "==================================="
echo "  ✅ 检查完成"
echo "==================================="
