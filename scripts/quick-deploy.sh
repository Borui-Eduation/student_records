#!/bin/bash

# Quick Deploy Script
# 快速部署脚本
# 
# 使用方法:
#   chmod +x scripts/quick-deploy.sh
#   ./scripts/quick-deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 Student Record System - Quick Deploy"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 未安装${NC}"
        echo "请先安装: $2"
        exit 1
    else
        echo -e "${GREEN}✅ $1 已安装${NC}"
    fi
}

echo "📋 检查依赖..."
check_command "node" "https://nodejs.org/"
check_command "pnpm" "npm install -g pnpm"
check_command "gcloud" "https://cloud.google.com/sdk/docs/install"
check_command "docker" "https://docs.docker.com/get-docker/"
echo ""

# 获取项目根目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "📦 项目路径: $PROJECT_ROOT"
echo ""

# 询问部署类型
echo "请选择部署类型:"
echo "1) 本地测试（快速，无需云服务）"
echo "2) 完整云端部署（需要 Google Cloud + Vercel）"
read -p "请输入选项 (1 或 2): " DEPLOY_TYPE

if [ "$DEPLOY_TYPE" == "1" ]; then
    echo ""
    echo "🏠 开始本地测试部署..."
    echo "========================================"
    
    # 安装依赖
    echo ""
    echo "📥 安装依赖..."
    pnpm install
    
    # 构建 shared 包
    echo ""
    echo "🔨 构建 shared 包..."
    cd packages/shared
    pnpm build
    cd "$PROJECT_ROOT"
    
    # 检查环境变量文件
    if [ ! -f "apps/web/.env.local" ]; then
        echo ""
        echo "⚙️  创建前端环境变量文件..."
        cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENV=development

# 本地测试用（临时配置）
NEXT_PUBLIC_FIREBASE_API_KEY=test-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
EOF
        echo -e "${GREEN}✅ 已创建 apps/web/.env.local${NC}"
    fi
    
    if [ ! -f "apps/api/.env" ]; then
        echo ""
        echo "⚙️  创建后端环境变量文件..."
        read -p "请输入您的管理员邮箱: " ADMIN_EMAIL
        cat > apps/api/.env << EOF
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAILS=$ADMIN_EMAIL
EOF
        echo -e "${GREEN}✅ 已创建 apps/api/.env${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ 本地测试环境准备完成！${NC}"
    echo ""
    echo "🎉 接下来的步骤:"
    echo "1. 启动开发服务器: pnpm dev"
    echo "2. 访问前端: http://localhost:3000"
    echo "3. 访问后端健康检查: http://localhost:8080/health"
    echo ""
    
    read -p "是否现在启动开发服务器? (y/n): " START_DEV
    if [ "$START_DEV" == "y" ] || [ "$START_DEV" == "Y" ]; then
        echo ""
        echo "🚀 启动开发服务器..."
        pnpm dev
    fi
    
elif [ "$DEPLOY_TYPE" == "2" ]; then
    echo ""
    echo "☁️  开始云端部署..."
    echo "========================================"
    
    # 获取项目配置
    echo ""
    echo "📝 请输入配置信息:"
    read -p "Google Cloud 项目 ID (例: student-record-demo-2024): " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ 项目 ID 不能为空${NC}"
        exit 1
    fi
    
    read -p "区域 (默认: asia-east1): " REGION
    REGION=${REGION:-asia-east1}
    
    read -p "管理员邮箱: " ADMIN_EMAIL
    
    # 设置 gcloud 项目
    echo ""
    echo "⚙️  配置 Google Cloud..."
    gcloud config set project $PROJECT_ID
    
    # 询问是否需要创建 GCP 资源
    echo ""
    read -p "是否需要创建 Google Cloud 资源? (首次部署选 y) (y/n): " CREATE_RESOURCES
    
    if [ "$CREATE_RESOURCES" == "y" ] || [ "$CREATE_RESOURCES" == "Y" ]; then
        echo ""
        echo "🏗️  创建 Google Cloud 资源..."
        
        # 启用 API
        echo "启用必要的 API..."
        gcloud services enable \
            firestore.googleapis.com \
            storage-api.googleapis.com \
            cloudkms.googleapis.com \
            run.googleapis.com \
            cloudbuild.googleapis.com \
            secretmanager.googleapis.com
        
        # 创建 Firestore
        echo "创建 Firestore 数据库..."
        gcloud firestore databases create --region=$REGION || echo "Firestore 已存在"
        
        # 创建 Cloud Storage 存储桶
        echo "创建 Cloud Storage 存储桶..."
        gsutil mb -l $REGION gs://$PROJECT_ID || echo "存储桶已存在"
        
        # 配置 CORS
        echo "配置 CORS..."
        cat > /tmp/cors.json << 'EOF'
[
  {
    "origin": ["http://localhost:3000", "https://*.vercel.app"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
        gsutil cors set /tmp/cors.json gs://$PROJECT_ID
        rm /tmp/cors.json
        
        # 创建 KMS 密钥
        echo "创建 KMS 密钥..."
        gcloud kms keyrings create student-record-keyring --location=global || echo "密钥环已存在"
        gcloud kms keys create sensitive-data-key \
            --keyring=student-record-keyring \
            --location=global \
            --purpose=encryption \
            --rotation-period=90d || echo "密钥已存在"
        
        # 创建服务账号
        echo "创建服务账号..."
        SERVICE_ACCOUNT="student-record-api@${PROJECT_ID}.iam.gserviceaccount.com"
        
        gcloud iam service-accounts create student-record-api \
            --display-name="Student Record API" || echo "服务账号已存在"
        
        # 授予权限
        echo "授予服务账号权限..."
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/datastore.user"
        
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/storage.objectAdmin"
        
        gcloud kms keys add-iam-policy-binding sensitive-data-key \
            --keyring=student-record-keyring \
            --location=global \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
        
        echo -e "${GREEN}✅ Google Cloud 资源创建完成${NC}"
    fi
    
    # 部署后端到 Cloud Run
    echo ""
    echo "🚢 部署后端到 Cloud Run..."
    
    cd apps/api
    
    # 构建 Docker 镜像
    echo "构建 Docker 镜像..."
    docker build -t gcr.io/$PROJECT_ID/api:latest .
    
    # 推送镜像
    echo "推送镜像到 GCR..."
    gcloud auth configure-docker --quiet
    docker push gcr.io/$PROJECT_ID/api:latest
    
    # 部署到 Cloud Run
    echo "部署到 Cloud Run..."
    KMS_KEY_ID="projects/$PROJECT_ID/locations/global/keyRings/student-record-keyring/cryptoKeys/sensitive-data-key"
    SERVICE_ACCOUNT="student-record-api@${PROJECT_ID}.iam.gserviceaccount.com"
    
    gcloud run deploy student-record-api \
        --image gcr.io/$PROJECT_ID/api:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --service-account $SERVICE_ACCOUNT \
        --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIREBASE_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$PROJECT_ID,KMS_KEY_ID=$KMS_KEY_ID,ADMIN_EMAILS=$ADMIN_EMAIL" \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 0 \
        --timeout 60s
    
    # 获取 API URL
    API_URL=$(gcloud run services describe student-record-api \
        --region $REGION \
        --format="value(status.url)")
    
    echo ""
    echo -e "${GREEN}✅ 后端部署成功！${NC}"
    echo -e "${BLUE}API URL: $API_URL${NC}"
    
    # 测试 API
    echo ""
    echo "🧪 测试 API 连接..."
    if curl -f $API_URL/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API 健康检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  API 健康检查失败，请检查日志${NC}"
    fi
    
    cd "$PROJECT_ROOT"
    
    # 提供 Vercel 部署指引
    echo ""
    echo "========================================"
    echo -e "${GREEN}✅ 后端部署完成！${NC}"
    echo ""
    echo "📝 接下来部署前端到 Vercel:"
    echo ""
    echo "1. 推送代码到 GitHub (如果还没有):"
    echo "   git add -A"
    echo "   git commit -m 'Deploy to production'"
    echo "   git push"
    echo ""
    echo "2. 访问 Vercel: https://vercel.com/dashboard"
    echo ""
    echo "3. Import 项目，配置："
    echo "   - Framework: Next.js"
    echo "   - Root Directory: apps/web"
    echo "   - Build Command: cd ../.. && pnpm install && pnpm build --filter=web"
    echo ""
    echo "4. 添加环境变量:"
    echo "   NEXT_PUBLIC_API_URL=$API_URL"
    echo "   NEXT_PUBLIC_ENV=production"
    echo "   (还需添加 Firebase 配置，见 docs/DEPLOY_AND_TEST.md)"
    echo ""
    echo "5. 部署后，更新 Cloud Run 的 CORS:"
    echo "   gcloud run services update student-record-api \\"
    echo "     --region $REGION \\"
    echo "     --update-env-vars CORS_ORIGIN=https://your-vercel-app.vercel.app"
    echo ""
    echo "📖 完整部署指南: docs/DEPLOY_AND_TEST.md"
    echo ""
    
else
    echo -e "${RED}❌ 无效的选项${NC}"
    exit 1
fi

echo ""
echo "🎉 部署流程完成！"
echo ""

