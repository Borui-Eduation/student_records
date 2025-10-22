# GitHub Actions 自动部署设置指南

## 📋 概述

现在项目已配置为自动部署：
- **Vercel**: 自动部署前端（Web）
- **Cloud Run**: 自动部署后端（API）

每次推送到 `main` 分支时，两者都会自动部署。

## 🔧 设置步骤

### 1. 获取 GCP 服务账号密钥

首先需要创建一个用于 GitHub Actions 的服务账号密钥：

```bash
# 1. 创建服务账号（如果还没有）
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment" \
  --project=borui-education-c6666

# 2. 授予必要权限
gcloud projects add-iam-policy-binding borui-education-c6666 \
  --member="serviceAccount:github-actions@borui-education-c6666.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding borui-education-c6666 \
  --member="serviceAccount:github-actions@borui-education-c6666.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding borui-education-c6666 \
  --member="serviceAccount:github-actions@borui-education-c6666.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding borui-education-c6666 \
  --member="serviceAccount:github-actions@borui-education-c6666.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 3. 创建并下载密钥
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@borui-education-c6666.iam.gserviceaccount.com

# 密钥文件 github-actions-key.json 会保存在当前目录
```

### 2. 在 GitHub 设置 Secrets

1. 打开你的 GitHub 仓库: https://github.com/Borui-Eduation/student_records

2. 点击 **Settings** → **Secrets and variables** → **Actions**

3. 点击 **New repository secret**

4. 添加以下 Secret：

   **名称**: `GCP_SA_KEY`
   
   **值**: 打开 `github-actions-key.json` 文件，复制全部内容粘贴到这里
   
   ```bash
   # 在终端查看文件内容（复制输出）
   cat github-actions-key.json
   ```

5. 点击 **Add secret** 保存

### 3. 删除本地密钥文件（安全考虑）

```bash
# 设置完成后，立即删除本地密钥文件
rm github-actions-key.json

# 确保不会提交到 Git
echo "github-actions-key.json" >> .gitignore
```

## ✅ 验证部署

设置完成后：

1. **推送代码到 GitHub**:
   ```bash
   git add .
   git commit -m "feat: enable automatic Cloud Run deployment"
   git push origin main
   ```

2. **查看部署状态**:
   - 访问 GitHub 仓库
   - 点击 **Actions** 标签
   - 查看 "Deploy to Cloud Run" workflow 运行状态

3. **部署成功标志**:
   - ✅ GitHub Actions 显示绿色勾选
   - 🚀 在 Actions 页面可以看到部署 URL
   - 📍 Cloud Run 服务已更新

## 🎯 使用方式

### 自动部署（推荐）
每次推送到 `main` 分支会自动触发：
```bash
git push origin main
```

### 手动触发
如果需要手动触发部署：

1. 访问 GitHub Actions 页面
2. 选择 "Deploy to Cloud Run" workflow
3. 点击 "Run workflow" 按钮
4. 选择 `main` 分支
5. 点击 "Run workflow"

## 📊 监控部署

### GitHub Actions 日志
- 访问仓库的 Actions 标签查看详细日志
- 每个步骤都有详细输出
- 失败时会显示具体错误信息

### Cloud Run 控制台
- 访问: https://console.cloud.google.com/run?project=borui-education-c6666
- 查看服务版本历史
- 监控流量和性能

## 🔍 故障排除

### 部署失败？

1. **检查 Secret 设置**:
   - 确认 `GCP_SA_KEY` 已正确设置
   - 密钥 JSON 格式完整

2. **检查 GCP 权限**:
   ```bash
   # 验证服务账号权限
   gcloud projects get-iam-policy borui-education-c6666 \
     --flatten="bindings[].members" \
     --filter="bindings.members:github-actions@borui-education-c6666.iam.gserviceaccount.com"
   ```

3. **查看 Actions 日志**:
   - 点击失败的 workflow
   - 展开失败的步骤查看错误详情

### 常见错误

- **权限不足**: 确认服务账号有所有必需的角色
- **构建失败**: 检查代码是否有 TypeScript 错误
- **密钥过期**: 重新生成服务账号密钥

## 🚀 优势

✅ **自动化**: 无需手动运行部署脚本
✅ **可追溯**: 每次部署都有完整日志
✅ **并行部署**: Vercel 和 Cloud Run 同时部署
✅ **回滚简单**: 可以轻松回滚到任何历史版本
✅ **一致性**: 每次部署使用相同的流程

## 📝 注意事项

- 🔒 **密钥安全**: 永远不要将 GCP 密钥提交到 Git
- ⏱️ **部署时间**: Cloud Run 部署通常需要 3-5 分钟
- 💰 **成本**: GitHub Actions 公开仓库免费，私有仓库有免费额度
- 🔄 **缓存**: 使用 pnpm 缓存加速构建

## 🆘 需要帮助？

如果遇到问题：
1. 查看 GitHub Actions 日志
2. 检查 Cloud Run 日志
3. 验证 GCP 服务账号权限
4. 确认所有 Secrets 已正确设置

