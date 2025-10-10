#!/bin/bash

# Vercel 前端部署脚本
# 最简单可靠的 Next.js 部署方案

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   部署前端到 Vercel${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}正在安装 Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}🚀 开始部署...${NC}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "  1. 如果是首次部署，会提示你登录 Vercel"
echo "  2. 选择项目设置时，使用默认值即可"
echo "  3. Root Directory 选择: apps/web"
echo ""

# 进入 web 目录部署
cd apps/web

# 设置环境变量
echo -e "${BLUE}📝 配置环境变量...${NC}"
vercel env add NEXT_PUBLIC_API_URL production << EOF
https://student-record-api-pxe74pgita-uw.a.run.app
EOF

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production << EOF
borui-education-c6666
EOF

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production << EOF
borui-education-c6666.firebaseapp.com
EOF

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production << EOF
borui-education-c6666.firebasestorage.app
EOF

vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production << EOF
AIzaSyAX5jhVczQ9dvHig3_h6fyRQHSRzub8olU
EOF

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production << EOF
629935238761
EOF

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production << EOF
1:629935238761:web:8877023b2a2195a6aefcf8
EOF

# 部署
echo -e "${BLUE}🚀 部署到 Vercel...${NC}"
vercel --prod

cd ../..

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   🎉 部署完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  下一步：更新后端 CORS 配置${NC}"
echo ""
echo -e "${BLUE}获取你的 Vercel URL后，运行:${NC}"
echo ""
echo "gcloud run services update student-record-api \\"
echo "  --region us-west1 \\"
echo "  --update-env-vars CORS_ORIGIN=https://your-app.vercel.app"
echo ""

