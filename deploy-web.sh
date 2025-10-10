#!/bin/bash

# Cloud Run 前端部署脚本（简化版）
# 使用 Cloud Run 自动检测和构建 Next.js

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置变量
PROJECT_ID="borui-education-c6666"
SERVICE_NAME="student-record-web"
REGION="us-west1"
API_URL="https://student-record-api-pxe74pgita-uw.a.run.app"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   前端部署到 Cloud Run${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ 错误: gcloud CLI 未安装${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 配置:${NC}"
echo "  项目: $PROJECT_ID"
echo "  服务: $SERVICE_NAME"
echo "  区域: $REGION"
echo "  后端: $API_URL"
echo ""

# 设置项目
gcloud config set project $PROJECT_ID

# 启用必要的 API
echo -e "${BLUE}🔑 启用 Google Cloud API...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID

# 创建临时 Dockerfile
echo -e "${BLUE}📦 准备构建配置...${NC}"
cat > Dockerfile.temp << 'DOCKER_EOF'
FROM node:20-slim

RUN npm install -g pnpm@9.12.2

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/apps/web
RUN pnpm build

EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
DOCKER_EOF

# 构建镜像
echo -e "${BLUE}🚀 构建并部署前端...${NC}"
echo "这可能需要 10-15 分钟..."
echo ""

IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# 创建 cloudbuild 配置
cat > cloudbuild.temp.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.temp', '-t', '$IMAGE_NAME', '.']
images:
  - '$IMAGE_NAME'
EOF

gcloud builds submit --config cloudbuild.temp.yaml .

# 部署到 Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT_ID}.firebaseapp.com,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.firebasestorage.app,NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAX5jhVczQ9dvHig3_h6fyRQHSRzub8olU,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=629935238761,NEXT_PUBLIC_FIREBASE_APP_ID=1:629935238761:web:8877023b2a2195a6aefcf8" \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60s

# 清理临时文件
rm -f Dockerfile.temp cloudbuild.temp.yaml

echo -e "${GREEN}✅ 部署完成${NC}"
echo ""

# 获取 URL
WEB_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   🎉 前端部署成功！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}🌐 前端 URL:${NC}"
echo "   $WEB_URL"
echo ""
echo -e "${YELLOW}⚠️  下一步：更新后端 CORS 配置${NC}"
echo ""
echo -e "${BLUE}运行以下命令允许前端访问后端:${NC}"
echo ""
echo "gcloud run services update student-record-api \\"
echo "  --region $REGION \\"
echo "  --update-env-vars CORS_ORIGIN=$WEB_URL"
echo ""
echo -e "${BLUE}📊 查看日志:${NC}"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""

