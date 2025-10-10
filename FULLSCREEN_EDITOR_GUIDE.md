# 全屏编辑器功能指南 / Fullscreen Editor Feature Guide

## 概述 / Overview

本系统现已支持 **Markdown 编辑器**和 **Excalidraw 画图板**的全屏编辑模式，为用户提供更大的编辑空间和更好的使用体验。

This system now supports **Markdown Editor** and **Excalidraw Whiteboard** in fullscreen editing mode, providing users with more editing space and better user experience.

---

## 功能特性 / Features

### 1. 双重编辑模式 / Dual Editing Modes

#### Session 模块 / Session Module
- **笔记编辑 / Notes Editor**: 支持 Markdown 格式的课堂记录
- **画图板 / Whiteboard**: 使用 Excalidraw 进行可视化绘图
- **全屏切换**: 每种模式都可以切换到全屏进行编辑

#### Knowledge Base 模块 / Knowledge Base Module
- **内容编辑 / Content Editor**: Markdown 格式的知识条目
- **画图板 / Drawing Board**: 可视化图表和草图
- **全屏切换**: 每种模式都可以切换到全屏进行编辑

### 2. 全屏编辑器特性 / Fullscreen Editor Features

#### Markdown 编辑器
- ✅ 实时预览（Live Preview）
- ✅ 语法高亮
- ✅ 工具栏支持
- ✅ 98% 屏幕覆盖
- ✅ 快捷键支持

#### Excalidraw 画图板
- ✅ 完整的绘图工具栏
- ✅ 形状工具（矩形、圆形、箭头等）
- ✅ 手绘工具
- ✅ 文本工具
- ✅ 颜色选择器
- ✅ 图层管理
- ✅ 撤销/重做
- ✅ 98% 屏幕覆盖

---

## 使用方法 / Usage

### Session 模块中使用 / In Session Module

1. **创建/编辑 Session**
   - 点击 "Record New Session" 或编辑现有 Session
   - 在对话框中找到 "上课记录 / Class Notes" 部分

2. **选择编辑模式**
   - **笔记 Notes**: 用于文字记录、作业列表等
   - **画图 Whiteboard**: 用于图表、示意图、手绘说明等

3. **全屏编辑**
   - 在任何一个标签页中，点击右上角的 "全屏编辑 Fullscreen" 按钮
   - 编辑器会弹出并占据 98% 的屏幕
   - 完成后点击 "完成 Done" 或关闭按钮返回

4. **保存内容**
   - 内容会自动同步
   - 点击主对话框的 "Record Session" 或 "Update Session" 保存到数据库

### Knowledge Base 模块中使用 / In Knowledge Base Module

1. **创建/编辑知识条目**
   - 点击 "New Entry" 或编辑现有条目
   - 在对话框中找到 "Content (Markdown & Drawing)" 部分

2. **选择编辑模式**
   - **笔记 Notes**: 用于文档、教程、笔记等
   - **画图 Drawing**: 用于架构图、流程图、概念图等

3. **全屏编辑**
   - 与 Session 模块相同的操作方式

4. **保存内容**
   - 内容会自动同步
   - 点击主对话框的 "Create Entry" 或 "Update Entry" 保存

---

## 技术实现 / Technical Implementation

### 组件结构 / Component Structure

```
FullscreenEditorDialog
├── Header (标题 + 完成按钮)
├── Content Area (98vw × 98vh)
└── Children (MarkdownEditor 或 ExcalidrawWrapper)
```

### 数据流 / Data Flow

1. **Markdown 数据**
   - 存储为纯文本字符串
   - 字段: `notes` (Session) / `content` (Knowledge Base)

2. **Excalidraw 数据**
   - 存储为 JSON 字符串
   - 包含: elements（绘图元素）+ appState（应用状态）
   - 字段: `whiteboardData`

### 状态管理 / State Management

- 使用 `react-hook-form` 管理表单状态
- 使用 `setValue` 同步编辑器内容到表单
- 全屏模式通过独立的 state 控制（`fullscreenMode`）

---

## 快捷键 / Keyboard Shortcuts

### Markdown 编辑器
- `Ctrl/Cmd + B`: 加粗
- `Ctrl/Cmd + I`: 斜体
- `Ctrl/Cmd + K`: 插入链接
- `Ctrl/Cmd + Z`: 撤销
- `Ctrl/Cmd + Shift + Z`: 重做

### Excalidraw 画图板
- `V`: 选择工具
- `R`: 矩形工具
- `O`: 圆形工具
- `A`: 箭头工具
- `D`: 线条工具
- `T`: 文本工具
- `Ctrl/Cmd + Z`: 撤销
- `Ctrl/Cmd + Shift + Z`: 重做
- `Ctrl/Cmd + D`: 复制选中元素
- `Delete`: 删除选中元素

---

## 最佳实践 / Best Practices

### Session 笔记 / Session Notes
```markdown
# 2024-01-15 上课记录

## 本节内容
- 讨论了 React Hooks 的使用
- 练习了 useState 和 useEffect

## 作业/任务
- [ ] 完成练习题 1-5
- [ ] 阅读 React 官方文档

## 备注
学生对 useEffect 依赖数组理解较好
```

### Knowledge Base 笔记 / Knowledge Base Notes
```markdown
# AWS S3 配置指南

## 创建 Bucket
1. 登录 AWS Console
2. 选择 S3 服务
3. 点击 "Create Bucket"

## 权限配置
- Public Access: Blocked
- Encryption: AES-256
```

### 画图使用场景 / Drawing Use Cases
- 📊 系统架构图
- 🔄 流程图
- 🧠 思维导图
- 📐 数学公式和图形
- 🎨 手绘示意图
- 📈 关系图

---

## 故障排查 / Troubleshooting

### 画图工具栏不显示
- ✅ 已修复：移除了限制性的 UIOptions 配置
- 现在所有 Excalidraw 工具都完全可用

### 日期转换错误
- ✅ 已修复：添加了错误处理和验证
- 无效日期会自动使用当前日期

### 无限循环更新
- ✅ 已修复：使用 useRef 和 useCallback 优化
- 只在数据真正改变时才触发更新

---

## 数据库字段 / Database Fields

### Session Collection
```typescript
{
  // ... 其他字段
  notes?: string,           // Markdown 笔记
  whiteboardData?: string,  // Excalidraw JSON 数据
}
```

### KnowledgeBase Collection
```typescript
{
  // ... 其他字段
  content: string,          // Markdown 内容
  whiteboardData?: string,  // Excalidraw JSON 数据
}
```

---

## 未来改进 / Future Enhancements

- [ ] 导出画图为 PNG/SVG
- [ ] 画图协作模式
- [ ] 画图模板库
- [ ] Markdown 模板库
- [ ] 键盘快捷键自定义
- [ ] 深色模式支持

---

## 相关文档 / Related Documentation

- [Markdown Editor Guide](./MARKDOWN_EDITOR_GUIDE.md)
- [Whiteboard Guide](./WHITEBOARD_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: 2024-10-10
**Version**: 1.0.0

