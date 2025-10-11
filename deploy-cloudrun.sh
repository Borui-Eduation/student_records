#!/bin/bash

# Cloud Run 部署脚本
# 用于将后端 API 部署到 Google Cloud Run

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ID="borui-education-c6666"
SERVICE_NAME="student-record-api"
REGION="us-west1"
SERVICE_ACCOUNT="student-record-api@borui-education-c6666.iam.gserviceaccount.com"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Cloud Run 后端部署脚本${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 gcloud 是否已安装
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ 错误: gcloud CLI 未安装${NC}"
    echo "请访问: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 检查 pnpm 是否已安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
    echo "运行: npm install -g pnpm"
    exit 1
fi

# 确认项目配置
echo -e "${YELLOW}📋 项目配置:${NC}"
echo "  项目 ID: $PROJECT_ID"
echo "  服务名称: $SERVICE_NAME"
echo "  区域: $REGION"
echo "  服务账号: $SERVICE_ACCOUNT"
echo ""

# 设置 Google Cloud 项目
echo -e "${BLUE}🔧 设置 Google Cloud 项目...${NC}"
gcloud config set project $PROJECT_ID

# 步骤 1: 构建代码
echo -e "${BLUE}📦 步骤 1/4: 构建代码...${NC}"
echo "安装依赖..."
pnpm install

echo "构建 shared 包..."
cd packages/shared
pnpm build
cd ../..

echo "构建 API..."
cd apps/api
pnpm build
cd ../..

echo -e "${GREEN}✅ 代码构建完成${NC}"
echo ""

# 步骤 2: 启用必要的 API
echo -e "${BLUE}🔑 步骤 2/4: 确认 Google Cloud API 已启用...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✅ API 已启用${NC}"
echo ""

# 步骤 3: 使用 Cloud Build 构建并部署
echo -e "${BLUE}🚀 步骤 3/4: 构建 Docker 镜像并部署到 Cloud Run...${NC}"
echo "这可能需要 5-10 分钟..."
echo ""

# 使用根目录的 Dockerfile 进行构建和部署（已优化，跳过不必要的下载）
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIREBASE_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=${PROJECT_ID}-storage,KMS_KEY_RING=student-record-keyring,KMS_KEY_NAME=knowledge-base-key,KMS_LOCATION=$REGION,ADMIN_EMAILS=yao.s.1216@gmail.com,PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true,PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser,CORS_ORIGIN=https://record.borui.org^:^https://student-records-web.vercel.app" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60s \
  --port 8080

echo -e "${GREEN}✅ 部署完成${NC}"
echo ""

# 步骤 4: 获取服务 URL
echo -e "${BLUE}📍 步骤 4/4: 获取服务信息...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   🎉 部署成功！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}📍 API URL:${NC}"
echo "   $SERVICE_URL"
echo ""
echo -e "${BLUE}🧪 测试健康检查:${NC}"
echo "   curl $SERVICE_URL/health"
echo ""
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "   1. 将 API URL 配置到前端环境变量 NEXT_PUBLIC_API_URL"
echo "   2. 如果前端已部署，需要更新 CORS 配置:"
echo "      gcloud run services update $SERVICE_NAME \\"
echo "        --region $REGION \\"
echo "        --update-env-vars CORS_ORIGIN=https://your-frontend.vercel.app"
echo ""

# 测试健康检查
echo -e "${BLUE}🔍 正在测试 API...${NC}"
sleep 5  # 等待服务完全启动
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/health)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ API 健康检查通过！${NC}"
else
    echo -e "${RED}⚠️  警告: API 健康检查返回状态码 $HTTP_STATUS${NC}"
    echo "可能需要几分钟才能完全启动，请稍后再试。"
fi

echo ""
echo -e "${BLUE}📊 查看日志:${NC}"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo -e "${BLUE}🔄 更新部署:${NC}"
echo "   ./deploy-cloudrun.sh"
echo ""

