#!/bin/bash

# Secret Manager 设置脚本
# 用于将敏感信息（如 API Keys）安全地存储到 Google Secret Manager

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置变量
PROJECT_ID="borui-education-c6666"
SERVICE_ACCOUNT="student-record-api@borui-education-c6666.iam.gserviceaccount.com"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Secret Manager 设置脚本${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 gcloud 是否已安装
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ 错误: gcloud CLI 未安装${NC}"
    echo "请访问: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 设置项目
echo -e "${BLUE}🔧 设置 Google Cloud 项目...${NC}"
gcloud config set project $PROJECT_ID
echo ""

# 启用 Secret Manager API
echo -e "${BLUE}🔑 启用 Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✅ Secret Manager API 已启用${NC}"
echo ""

# 提示输入 Gemini API Key
echo -e "${YELLOW}📝 请输入你的 Gemini API Key:${NC}"
echo "   (可以从 https://aistudio.google.com/apikey 获取)"
echo ""
read -s -p "Gemini API Key: " GEMINI_API_KEY
echo ""
echo ""

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ 错误: API Key 不能为空${NC}"
    exit 1
fi

# 创建或更新 Secret
echo -e "${BLUE}🔐 创建/更新 Secret...${NC}"

# 检查 Secret 是否已存在
if gcloud secrets describe gemini-api-key --project=$PROJECT_ID &> /dev/null; then
    echo "Secret 'gemini-api-key' 已存在，正在添加新版本..."
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
        --data-file=- \
        --project=$PROJECT_ID
else
    echo "创建新 Secret 'gemini-api-key'..."
    echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
        --data-file=- \
        --replication-policy="automatic" \
        --project=$PROJECT_ID
fi

echo -e "${GREEN}✅ Secret 已保存${NC}"
echo ""

# 授予服务账号访问权限
echo -e "${BLUE}🔓 授予服务账号访问权限...${NC}"
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID

echo -e "${GREEN}✅ 权限已配置${NC}"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   🎉 Secret 设置完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}下一步:${NC}"
echo "   运行 ./deploy-cloudrun.sh 部署应用"
echo ""
echo -e "${YELLOW}📌 Secret 信息:${NC}"
echo "   名称: gemini-api-key"
echo "   项目: $PROJECT_ID"
echo ""
echo -e "${BLUE}🔍 查看 Secret:${NC}"
echo "   gcloud secrets describe gemini-api-key --project=$PROJECT_ID"
echo ""
echo -e "${BLUE}🗑️  删除 Secret (如需要):${NC}"
echo "   gcloud secrets delete gemini-api-key --project=$PROJECT_ID"
echo ""

