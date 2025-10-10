# Excalidraw 同步与坐标修复 / Excalidraw Sync & Coordinate Fix

## 🐛 问题描述 / Problem Description

### 问题 1: 鼠标坐标偏移不稳定
**症状**: 点击位置和实际绘制位置不匹配，偏移不稳定

**原因**:
- 容器的 `border` 占用空间，影响坐标计算
- `transform` CSS 属性干扰坐标系统
- 多层容器的 `margin`/`padding` 累积偏移

### 问题 2: 全屏画图后数据消失
**症状**: 在全屏模式画图，点击"完成"回到对话框，画的内容消失了

**原因**:
- 全屏和小窗口是两个独立的 `ExcalidrawWrapper` 实例
- `isInitializedRef` 阻止了数据重新加载
- 小窗口组件未感知到数据变化

---

## ✅ 修复方案 / Fix Solutions

### 修复 1: 双层容器隔离坐标系统

**文件**: `apps/web/src/components/ui/excalidraw-wrapper.tsx`

```typescript
// 外层容器 - 负责显示边框
const wrapperStyle: React.CSSProperties = {
  border: fullscreen ? 'none' : '1px solid #e5e7eb',
  borderRadius: fullscreen ? 0 : '6px',
  overflow: 'hidden',
  height: heightStyle,
  width: '100%',
};

// 内层容器 - Excalidraw 绘图区域，完全无边框
const containerStyle: React.CSSProperties = {
  height: heightStyle,
  width: '100%',
  position: 'relative',
  margin: 0,
  padding: 0,
  border: 'none',           // ← 关键：无边框
  borderRadius: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  transform: 'none',        // ← 关键：无 transform
  imageRendering: 'pixelated',
};

// 双层结构
<div style={wrapperStyle}>
  <div style={containerStyle}>
    <Excalidraw />
  </div>
</div>
```

**优点**:
- ✅ Excalidraw 在完全干净的容器中
- ✅ 外层容器负责视觉效果（边框）
- ✅ 内层容器保证坐标精确

### 修复 2: 移除初始化标志，响应数据变化

**之前** ❌:
```typescript
const isInitializedRef = useRef(false);

useEffect(() => {
  if (excalidrawAPI && initialData && !isInitializedRef.current) {
    // 只加载一次
    excalidrawAPI.updateScene(data);
    isInitializedRef.current = true;  // ← 阻止重新加载
  }
}, [excalidrawAPI, initialData]);
```

**现在** ✅:
```typescript
const lastLoadedDataRef = useRef<string>('');

useEffect(() => {
  if (excalidrawAPI && initialData) {
    // 只在数据实际改变时才重新加载
    if (initialData !== lastLoadedDataRef.current) {
      excalidrawAPI.updateScene(data);
      lastLoadedDataRef.current = initialData;  // ← 跟踪已加载数据
      console.log('🔄 Loaded Excalidraw data');
    }
  }
}, [excalidrawAPI, initialData]);
```

**优点**:
- ✅ 响应 `initialData` 的变化
- ✅ 避免重复加载相同数据
- ✅ 全屏关闭后小窗口会重新加载

### 修复 3: 强制重新挂载小窗口组件

**文件**: `apps/web/src/components/sessions/SessionDialog.tsx`

```typescript
<ExcalidrawWrapper
  key={`small-${fullscreenMode === null ? 'visible' : 'hidden'}`}
  initialData={watch('whiteboardData') || ''}
  onChange={(data) => { /* ... */ }}
  height={300}
/>
```

**工作原理**:
- `fullscreenMode === null` → key = `"small-visible"`
- `fullscreenMode === 'whiteboard'` → key = `"small-hidden"`
- 当从全屏返回 (`null`)，key 变回 `"small-visible"`
- ✅ 组件完全重新挂载，强制重新加载数据

### 修复 4: 添加调试日志

```typescript
// 1. 全屏 onChange
onChange={(data) => {
  console.log('🔍 Fullscreen onChange, data length:', data.length);
  setValue('whiteboardData', data);
}}

// 2. 小窗口 onChange
onChange={(data) => {
  console.log('🔍 Small onChange, data length:', data.length);
  setValue('whiteboardData', data);
}}

// 3. 关闭全屏
onOpenChange={(open) => {
  if (!open) {
    console.log('🔍 Closing fullscreen, current data length:', 
      watch('whiteboardData')?.length || 0);
    setFullscreenMode(null);
  }
}}

// 4. ExcalidrawWrapper 加载数据
console.log('🔄 Loaded Excalidraw data:', {
  elementsCount: data.elements.length,
  dataSize: initialData.length
});
```

---

## 🧪 测试步骤 / Test Steps

### 测试 1: 鼠标坐标精确度

1. **刷新浏览器**（F5 或 Cmd+R）
2. **打开 Session 创建对话框**
3. **切换到"画图 Whiteboard"标签**
4. **测试点击精度**:
   - 点击画板上一个点
   - ✅ 应该正好在鼠标位置
   - 没有偏移

5. **测试绘制**:
   - 画一个矩形
   - 起点和终点应该跟随鼠标
   - 没有右下方偏移

6. **测试全屏**:
   - 点击"全屏编辑"
   - 在全屏模式下绘制
   - ✅ 坐标应该同样精确

### 测试 2: 全屏数据同步

#### Part A: 新建 Session 测试

1. **打开 Session 创建对话框**
2. **填写基本信息**（Client, Date, Time）
3. **切换到"画图 Whiteboard"**
4. **观察**:
   - 显示"当前数据: 0 bytes"
   
5. **点击"全屏编辑"**
6. **在全屏模式下绘制**:
   - 画几个图形（矩形、圆形、箭头）
   - **查看控制台**:
     ```
     🔍 Fullscreen onChange, data length: 450
     🔍 Fullscreen onChange, data length: 850
     🔍 Fullscreen onChange, data length: 1200
     ```

7. **点击"完成 Done"**
8. **查看控制台**:
   ```
   🔍 Save clicked, data length: 1200
   🔍 Closing fullscreen, current data length: 1200
   🔍 SessionDialog - fullscreenMode changed: null
   🔄 Loaded Excalidraw data: {elementsCount: 3, dataSize: 1200}
   ```

9. **检查小窗口**:
   - ✅ 显示"当前数据: 1200 bytes"（或类似）
   - ✅ 画板中应该显示全屏时画的内容
   - ✅ 所有图形都应该可见

10. **再次点击"全屏编辑"**:
    - ✅ 之前画的内容应该显示在全屏中
    - ✅ 可以继续编辑

#### Part B: 编辑已有 Session 测试

1. **创建并保存一个带画图的 Session**
2. **关闭对话框**
3. **点击"编辑"按钮**
4. **切换到"画图"标签**
5. **检查**:
   - ✅ 已保存的画图应该加载显示
   - ✅ "当前数据"显示正确的 bytes

6. **点击"全屏编辑"**
7. **修改画图**（添加新元素）
8. **点击"完成"**
9. **检查小窗口**:
   - ✅ 新添加的元素应该显示
   - ✅ 原有元素仍然存在

10. **点击"Update Session"保存**
11. **重新编辑验证**:
    - ✅ 所有修改都应该被保存

---

## 📊 预期的控制台输出 / Expected Console Output

### 正常流程 / Normal Flow

```bash
# 1. 打开对话框
🔍 SessionDialog - fullscreenMode changed: null

# 2. 点击全屏编辑
🔍 SessionDialog - fullscreenMode changed: whiteboard

# 3. 在全屏绘制
🔍 Fullscreen onChange, data length: 450
🎨 Excalidraw data changed: {elementsCount: 1, dataSize: 450}
🔍 Fullscreen onChange, data length: 850
🎨 Excalidraw data changed: {elementsCount: 2, dataSize: 850}

# 4. 点击完成
🔍 Save clicked, data length: 850
🔍 Closing fullscreen, current data length: 850
🔍 SessionDialog - fullscreenMode changed: null
🔄 Loaded Excalidraw data: {elementsCount: 2, dataSize: 850}

# 5. 小窗口继续编辑
🔍 Small onChange, data length: 1200
🎨 Excalidraw data changed: {elementsCount: 3, dataSize: 1200}

# 6. 提交保存
📊 Submitting session data: {notes: 0, whiteboardData: 1200}
```

### 异常情况 / Error Cases

#### 如果全屏数据未同步

```bash
# 问题征兆
🔍 Save clicked, data length: 1200
🔍 Closing fullscreen, current data length: 1200
🔍 SessionDialog - fullscreenMode changed: null
# ❌ 缺少: 🔄 Loaded Excalidraw data

# 可能原因：
- initialData 未变化
- ExcalidrawWrapper 未重新挂载
- watch('whiteboardData') 返回旧值
```

---

## 🔧 故障排查 / Troubleshooting

### 问题 1: 点击后仍有偏移

**检查步骤**:
1. 打开浏览器开发者工具
2. 检查 ExcalidrawWrapper 容器
3. 确认样式:
   ```css
   /* 内层容器应该有 */
   border: none;
   transform: none;
   margin: 0;
   padding: 0;
   ```

**临时解决方案**:
- 刷新页面
- 清除浏览器缓存
- 确保没有浏览器缩放（Ctrl+0 重置）

### 问题 2: 全屏数据还是消失

**检查控制台日志**:
```bash
# 应该看到这些日志
🔍 Fullscreen onChange, data length: XXX  ← 全屏有变化
🔍 Save clicked, data length: XXX         ← 关闭时数据存在
🔄 Loaded Excalidraw data                 ← 小窗口重新加载
```

**如果缺少某个日志**:
- 缺少第1个 → 全屏 onChange 未触发
- 缺少第2个 → 数据未保存到表单状态
- 缺少第3个 → 小窗口未重新加载

**手动验证数据**:
```javascript
// 在浏览器控制台运行
const form = document.querySelector('form');
const input = form.querySelector('[name="whiteboardData"]');
console.log('Form value length:', input?.value?.length || 0);
```

### 问题 3: Key 策略不生效

**检查组件是否重新挂载**:
```typescript
// 添加日志到 ExcalidrawWrapper
useEffect(() => {
  console.log('🎯 ExcalidrawWrapper mounted');
  return () => console.log('🎯 ExcalidrawWrapper unmounted');
}, []);
```

**应该看到**:
```bash
# 打开全屏时
🎯 ExcalidrawWrapper mounted  (全屏实例)

# 关闭全屏时
🎯 ExcalidrawWrapper unmounted (全屏实例销毁)
🎯 ExcalidrawWrapper mounted   (小窗口重新挂载)
```

---

## 📝 代码变更总结 / Code Changes Summary

### 修改的文件 / Modified Files

1. **apps/web/src/components/ui/excalidraw-wrapper.tsx**
   - 移除 `isInitializedRef`
   - 添加 `lastLoadedDataRef`
   - 使用双层容器结构
   - 改进坐标系统隔离

2. **apps/web/src/components/sessions/SessionDialog.tsx**
   - 添加 fullscreenMode 追踪日志
   - 小窗口 ExcalidrawWrapper 添加 key prop
   - 添加数据大小显示
   - 添加详细的 onChange 日志

3. **apps/web/src/components/knowledge/KnowledgeDialog.tsx**
   - （可选）同样的改进

---

## ✅ 验证清单 / Verification Checklist

- [ ] 鼠标点击位置精确，无偏移
- [ ] 全屏绘制坐标精确
- [ ] 全屏绘制后，关闭时数据保存
- [ ] 小窗口显示全屏绘制的内容
- [ ] 小窗口可以继续编辑
- [ ] 再次打开全屏，之前的内容存在
- [ ] 保存到数据库后，重新编辑能加载
- [ ] 控制台日志显示正确的数据流

---

**Fixed Date**: 2024-10-10  
**Version**: 2.0.0  
**Status**: ✅ Ready for Testing

