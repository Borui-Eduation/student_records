#!/bin/bash

# 添加 Admin 用户脚本

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="borui-education-c6666"
SERVICE_NAME="student-record-api"
REGION="us-west1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   添加 Admin 用户${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 获取当前的 ADMIN_EMAILS
CURRENT_ADMINS=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format="value(spec.template.spec.containers[0].env[?(@.name=='ADMIN_EMAILS')].value)")

echo -e "${YELLOW}当前 Admin 用户:${NC}"
echo "$CURRENT_ADMINS"
echo ""

# 提示输入新的邮箱
echo -e "${YELLOW}请输入要添加的邮箱地址:${NC}"
read NEW_EMAIL

if [ -z "$NEW_EMAIL" ]; then
    echo -e "${YELLOW}❌ 没有输入邮箱，退出。${NC}"
    exit 1
fi

# 合并邮箱列表
NEW_ADMIN_LIST="$CURRENT_ADMINS,$NEW_EMAIL"

echo ""
echo -e "${YELLOW}新的 Admin 列表:${NC}"
echo "$NEW_ADMIN_LIST"
echo ""

# 确认
echo -e "${YELLOW}确认更新？(y/n)${NC}"
read CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${YELLOW}❌ 取消更新${NC}"
    exit 0
fi

# 更新环境变量
echo -e "${BLUE}🔄 更新环境变量...${NC}"

cat > /tmp/admin-env-vars.yaml << EOF
NODE_ENV: production
GOOGLE_CLOUD_PROJECT: $PROJECT_ID
FIREBASE_PROJECT_ID: $PROJECT_ID
GCS_BUCKET_NAME: ${PROJECT_ID}-storage
KMS_KEY_RING: student-record-keyring
KMS_KEY_NAME: knowledge-base-key
KMS_LOCATION: $REGION
ADMIN_EMAILS: "$NEW_ADMIN_LIST"
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser
CORS_ORIGIN: "https://record.borui.org,https://student-records-web.vercel.app"
EOF

gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --env-vars-file /tmp/admin-env-vars.yaml \
  --project $PROJECT_ID

rm -f /tmp/admin-env-vars.yaml

echo ""
echo -e "${GREEN}✅ Admin 用户添加成功！${NC}"
echo ""
echo -e "${BLUE}新的 Admin 列表:${NC}"
echo "$NEW_ADMIN_LIST"
echo ""
echo -e "${YELLOW}⚠️  用户需要重新登录才能获得 admin 权限${NC}"

