# 画图保存功能测试指南 / Whiteboard Save Test Guide

## 🔧 已修复的问题 / Fixed Issues

### 1. 后端保存问题 / Backend Save Issue
**问题**: Session 和 Knowledge Base 的后端创建方法没有保存 `notes` 和 `whiteboardData` 字段。

**修复**: 
- ✅ `apps/api/src/routers/sessions.ts` - 添加了 `notes` 和 `whiteboardData` 字段到 `sessionData`
- ✅ `apps/api/src/routers/knowledgeBase.ts` - 添加了 `whiteboardData` 字段到 `entryData`

### 2. Excalidraw 触发问题 / Excalidraw Trigger Issue
**问题**: Excalidraw 只在 `elements.length > 0` 时才触发 `onChange`，导致初始绘制不保存。

**修复**:
- ✅ `apps/web/src/components/ui/excalidraw-wrapper.tsx` - 移除了 `elements.length > 0` 的限制

### 3. 调试日志 / Debug Logging
**添加**:
- ✅ ExcalidrawWrapper: 显示元素数量和数据大小
- ✅ SessionDialog: 显示 notes 和 whiteboardData 的长度
- ✅ KnowledgeDialog: 显示 content 和 whiteboardData 的长度

---

## 🧪 测试步骤 / Test Steps

### 测试 Session 画图保存 / Test Session Whiteboard Save

1. **打开浏览器开发者工具**
   - 按 `F12` 或 `Cmd+Option+I`
   - 切换到 "Console" 标签页

2. **创建新 Session**
   - 点击 "Record New Session"
   - 填写必要信息（Client, Date, Time）
   - 切换到 "画图 Whiteboard" 标签

3. **画一些内容**
   - 使用工具栏绘制几个形状（矩形、圆形、箭头等）
   - 添加一些文本
   - 观察控制台输出：
     ```
     🎨 Excalidraw data changed: {elementsCount: 1, dataSize: 450}
     🎨 Excalidraw data changed: {elementsCount: 2, dataSize: 850}
     ...
     ```

4. **保存 Session**
   - 点击 "Record Session" 按钮
   - 观察控制台输出：
     ```
     📊 Submitting session data: {notes: 0, whiteboardData: 1250}
     ```
   - `whiteboardData` 应该有一个大于 0 的数字

5. **验证保存成功**
   - 找到刚创建的 Session 卡片
   - 应该看到 "🎨 画图 Whiteboard" 的指示器
   - 点击编辑按钮
   - 切换到 "画图 Whiteboard" 标签
   - 应该看到之前绘制的内容

### 测试 Knowledge Base 画图保存 / Test Knowledge Base Whiteboard Save

1. **创建新 Knowledge Entry**
   - 点击 "New Entry"
   - 填写 Title 和 Type
   - 在 Content 标签页填写一些 Markdown 内容
   - 切换到 "画图 Drawing" 标签

2. **画一些内容**
   - 绘制一些图表或草图
   - 观察控制台输出：
     ```
     🎨 Excalidraw data changed: {elementsCount: 3, dataSize: 1200}
     ```

3. **保存 Entry**
   - 点击 "Create Entry" 按钮
   - 观察控制台输出：
     ```
     📚 Submitting knowledge entry data: {content: 50, whiteboardData: 1200}
     ```

4. **验证保存成功**
   - 找到刚创建的 Entry 卡片
   - 应该看到 "🎨 Contains whiteboard drawings"
   - 点击编辑按钮
   - 切换到 "画图 Drawing" 标签
   - 应该看到之前绘制的内容

### 测试全屏编辑 / Test Fullscreen Editing

1. **在 Session 或 Knowledge Base 中**
   - 点击 "画图" 标签页的 "全屏编辑 Fullscreen" 按钮
   - 画图板应该占据 98% 的屏幕

2. **绘制内容**
   - 在全屏模式下绘制
   - 观察控制台日志

3. **关闭全屏**
   - 点击 "完成 Done" 或关闭按钮
   - 返回到对话框
   - 内容应该自动同步到小窗口

4. **保存**
   - 提交表单保存数据

---

## 📊 预期的控制台日志 / Expected Console Logs

### 正常流程 / Normal Flow

```bash
# 开始绘制
🎨 Excalidraw data changed: {elementsCount: 1, dataSize: 450}

# 继续绘制
🎨 Excalidraw data changed: {elementsCount: 2, dataSize: 850}
🎨 Excalidraw data changed: {elementsCount: 3, dataSize: 1200}

# 提交保存 (Session)
📊 Submitting session data: {notes: 0, whiteboardData: 1200}

# 或者提交保存 (Knowledge Base)
📚 Submitting knowledge entry data: {content: 50, whiteboardData: 1200}
```

### 问题征兆 / Problem Indicators

❌ **如果 `whiteboardData: 0`**
- 数据没有被保存到表单
- 检查 `register('whiteboardData')` 是否正确
- 检查 `setValue('whiteboardData', ...)` 是否被调用

❌ **如果没有看到 "🎨 Excalidraw data changed"**
- Excalidraw 的 onChange 没有触发
- 检查 ExcalidrawWrapper 的 onChange prop 是否传递

❌ **如果编辑后看不到之前的绘图**
- 数据没有正确加载
- 检查 `initialData` prop 是否正确传递
- 检查数据库中是否有 `whiteboardData` 字段

---

## 🔍 数据库验证 / Database Verification

### 在 Firebase Console 中检查 / Check in Firebase Console

1. **打开 Firestore**
   - 进入 Firebase Console
   - 选择你的项目
   - 点击 Firestore Database

2. **检查 Sessions Collection**
   ```
   sessions/{sessionId}
   ├── clientId: "..."
   ├── date: Timestamp
   ├── notes: "..."  ← 应该存在
   ├── whiteboardData: "{\"elements\":[...]}" ← 应该存在且有内容
   └── ...
   ```

3. **检查 KnowledgeBase Collection**
   ```
   knowledgeBase/{entryId}
   ├── title: "..."
   ├── content: "..."
   ├── whiteboardData: "{\"elements\":[...]}" ← 应该存在且有内容
   └── ...
   ```

---

## 🐛 故障排查 / Troubleshooting

### 问题 1: 画图工具栏不显示
**症状**: 打开画图板时，看不到工具（矩形、圆形、画笔等）

**解决方案**: 
- ✅ 已修复：移除了 `UIOptions` 限制
- 刷新页面重试

### 问题 2: 画图后数据为 0
**症状**: `whiteboardData: 0` 在控制台日志中

**检查步骤**:
1. 确认看到 "🎨 Excalidraw data changed" 日志
2. 如果看到，说明 onChange 触发了，但数据没有设置到表单
3. 如果没看到，说明 onChange 没有触发

**解决方案**:
- 检查 `<input type="hidden" {...register('whiteboardData')} />` 是否存在
- 检查 `setValue('whiteboardData', ...)` 调用

### 问题 3: 保存后编辑看不到内容
**症状**: 数据保存了，但重新打开看不到

**检查步骤**:
1. 在数据库中查看 `whiteboardData` 字段
2. 检查是否有 JSON 数据
3. 检查编辑时的 `initialData` prop

**解决方案**:
- 确认 `setValue('whiteboardData', session.whiteboardData || '')` 在 useEffect 中
- 确认 `initialData={watch('whiteboardData') || ''}` 传递给 ExcalidrawWrapper

---

## ✅ 成功标志 / Success Indicators

✓ 控制台显示 Excalidraw 数据变化日志  
✓ 提交时 `whiteboardData` 长度 > 0  
✓ 列表页面显示画图指示器  
✓ 编辑时能看到之前的绘图内容  
✓ 全屏编辑后内容同步到小窗口  
✓ 数据库中有完整的 JSON 数据  

---

## 📝 后续步骤 / Next Steps

如果所有测试都通过：
1. ✅ 移除调试日志（或保留为可选的 debug 模式）
2. ✅ 更新文档
3. ✅ 通知团队功能已完成

如果测试失败：
1. 📋 记录具体的错误信息
2. 📋 记录控制台日志
3. 📋 提供给开发团队

---

**Test Date**: 2024-10-10  
**Version**: 1.0.0  
**Status**: Ready for Testing 🧪

