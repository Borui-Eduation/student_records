# AI助手系统 - 设置指南

## 概述

AI助手系统已成功集成到您的Student Record Management系统中，支持通过自然语言进行完整的数据库CRUD操作。

## 功能特性

✅ **自然语言解析** - 使用Google Gemini API解析中文指令
✅ **智能搜索** - 自动检查数据库中是否存在相关记录
✅ **自动创建** - 不存在的client、rate、sessionType会自动创建
✅ **多步操作** - 支持复杂的多步骤操作
✅ **安全确认** - 所有操作需用户确认后执行
✅ **完整审计** - 所有AI操作都有日志记录

## 系统架构

### 后端组件

1. **AI服务** (`apps/api/src/services/aiService.ts`)
   - Gemini API集成
   - 自然语言解析
   - 命令验证

2. **MCP执行器** (`apps/api/src/services/mcpExecutor.ts`)
   - 数据库操作执行
   - 智能搜索和创建
   - 事务处理

3. **AI Router** (`apps/api/src/routers/ai.ts`)
   - `ai.chat` - 解析自然语言
   - `ai.execute` - 执行命令
   - `ai.suggest` - 提供建议
   - `ai.status` - 检查状态

### 前端组件

1. **AIAssistant组件** (`apps/web/src/components/AIAssistant.tsx`)
   - 对话式UI
   - 消息历史
   - 确认对话框

2. **AI助手页面** (`apps/web/src/app/dashboard/ai-assistant/page.tsx`)
   - 专门的AI助手界面

3. **浮动按钮** (Dashboard布局)
   - 右下角快捷入口

## 配置步骤

### 1. 获取Gemini API密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的API密钥
3. 复制API密钥

### 2. 配置环境变量

在 `apps/api/.env` 中添加：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 重启服务

```bash
# 开发环境
cd apps/api
pnpm dev

# 生产环境
pnpm build
pnpm start
```

## 使用示例

### 创建记录

```
输入: "帮我添加一个Hubery，今天10-12点，cello课程，rate 80"

系统会:
1. 检查是否存在名为"Hubery"的客户 (如果不存在则创建)
2. 检查是否存在"cello"课程类型 (如果不存在则创建)
3. 检查或创建rate为80的费率
4. 创建今天10:00-12:00的session记录
```

### 查询数据

```
输入: "显示本月所有cello课程"

系统会:
1. 查询本月日期范围
2. 筛选cello课程类型
3. 返回所有匹配的session记录
```

### 更新记录

```
输入: "更新Hubery的rate为90"

系统会:
1. 查找名为"Hubery"的客户
2. 更新该客户的费率为90元/小时
3. 确认后执行
```

### 删除记录

```
输入: "删除今天的Hubery课程"

系统会:
1. 查找今天Hubery的课程记录
2. 请求确认
3. 删除记录
```

## 支持的操作

- **创建** (create): 添加新的client、session、rate等
- **查询** (search/read): 查找和显示记录
- **更新** (update): 修改现有记录
- **删除** (delete): 删除记录

## 支持的实体

- `client` - 客户
- `session` - 课时记录
- `rate` - 费率
- `sessionType` - 课程类型
- `clientType` - 客户类型
- `invoice` - 发票
- `expense` - 支出
- `expenseCategory` - 支出类别

## 访问方式

### 1. 浮动按钮
在Dashboard任何页面，点击右下角的浮动 ✨ 按钮

### 2. 侧边栏
点击侧边栏的"AI Assistant"菜单项

### 3. 直接访问
访问 `/dashboard/ai-assistant` 页面

## 智能特性

### 时间解析
- "今天" → 当前日期
- "明天" → 明天日期
- "下周一" → 下周一日期
- "10-12点" → 10:00-12:00

### 自动补全
- 缺少client时自动创建
- 缺少sessionType时自动创建
- 缺少rate时自动创建或查找

### 上下文理解
- 记住最近的对话
- 支持相对引用 ("那个客户"、"刚才的记录")

## 安全特性

1. **用户隔离** - 只能操作自己的数据
2. **确认机制** - 危险操作需确认
3. **审计日志** - 所有操作都有记录
4. **权限检查** - 基于用户角色的访问控制

## 成本估算

- **Gemini 1.5 Flash** (免费额度)
  - 前15次请求/分钟免费
  - 前150万token/天免费
  - 超出后约$0.35/百万token

## 故障排除

### API密钥未配置
```
错误: GEMINI_API_KEY is not configured
解决: 在.env文件中添加GEMINI_API_KEY
```

### 解析失败
```
错误: 抱歉，我无法理解您的指令
解决: 使用更明确的语言，包含必要信息（客户名、时间、课程类型等）
```

### 执行失败
```
错误: No applicable rate found
解决: 指定rate金额，或先为客户创建rate
```

## 未来优化

- [ ] 添加语音输入
- [ ] 支持批量操作
- [ ] 增强上下文记忆
- [ ] 添加快捷指令模板
- [ ] 支持更多实体类型
- [ ] 多语言支持 (英文、日文等)

## 技术文档

详细的技术文档请参考：
- MCP类型定义: `packages/shared/src/types/mcp.ts`
- AI服务实现: `apps/api/src/services/aiService.ts`
- MCP执行器: `apps/api/src/services/mcpExecutor.ts`
- 前端组件: `apps/web/src/components/AIAssistant.tsx`

## 联系支持

如有问题或建议，请联系开发团队。

---

**版本**: 1.0.0
**最后更新**: 2025-10-18
**状态**: ✅ 已完成并测试

