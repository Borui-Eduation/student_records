# Excalidraw 坐标问题简易修复指南

## ✅ 已应用的修复

### 1. 简化容器结构
- ❌ 移除了复杂的双层容器
- ✅ 使用单一简洁的容器
- ✅ 使用 `outline` 代替 `border`（outline 不占用空间）

### 2. 改进数据同步
- ✅ 移除 `isInitializedRef`
- ✅ 使用 `lastLoadedDataRef` 跟踪已加载数据
- ✅ 响应 `initialData` 的变化
- ✅ 添加 `key` prop 强制重新挂载

## 🧪 快速测试步骤

### 测试 1: 基本绘制（30秒）

1. **刷新浏览器**（重要！按 F5 或 Cmd+R）
2. **检查浏览器缩放**
   - 按 `Ctrl+0` (Windows) 或 `Cmd+0` (Mac)
   - 确保缩放为 100%
3. **打开 Session 创建对话框**
4. **切换到"画图 Whiteboard"**
5. **测试点击**:
   - 点击一个点
   - 应该正好在鼠标位置
6. **测试拖拽**:
   - 选择矩形工具
   - 拖拽绘制矩形
   - 起点和终点应该准确

### 测试 2: 全屏同步（1分钟）

1. **点击"全屏编辑"**
2. **画几个图形**
3. **打开浏览器控制台**（F12）
4. **点击"完成 Done"**
5. **查看控制台输出**:
   ```
   🔍 Save clicked, data length: XXX
   🔄 Loaded Excalidraw data: {elementsCount: X}
   ```
6. **检查小窗口**:
   - 应该显示刚才画的内容
   - 数据大小应该显示正确的 bytes

## 🐛 如果还有坐标偏移

### 可能的原因和解决方案

#### 原因 1: 浏览器缩放
**检查方法**:
- 看浏览器地址栏右侧是否显示缩放百分比
- 或者按 `Ctrl+0` / `Cmd+0` 重置

**症状**:
- 偏移量随缩放比例变化
- 例如 110% 缩放时偏移约 10% 距离

#### 原因 2: 浏览器扩展干扰
**检查方法**:
- 打开隐私/无痕模式测试
- 或者禁用所有浏览器扩展

**可能干扰的扩展**:
- 鼠标手势
- 页面缩放工具
- 截图工具
- 颜色选择器

#### 原因 3: 操作系统显示缩放
**检查方法**:
- Windows: 设置 → 显示 → 缩放和布局 → 应该是 100%
- Mac: 系统偏好设置 → 显示器 → 分辨率 → 默认

#### 原因 4: 父容器有 transform
**检查方法**:
1. 打开浏览器开发者工具（F12）
2. 检查元素（右键点击画布 → 检查）
3. 查看 Computed 样式
4. 搜索 `transform`
5. 如果有任何 transform（除了 `none`），那就是问题

**临时解决**:
在浏览器控制台运行：
```javascript
// 查找并移除 transform
document.querySelectorAll('[style*="transform"]').forEach(el => {
  el.style.transform = 'none';
});
```

## 📝 手动测试坐标

在浏览器控制台运行此代码来测试坐标：

```javascript
// 1. 找到 Excalidraw 容器
const container = document.querySelector('[style*="height"]');
console.log('Container:', container);

// 2. 获取边界信息
const rect = container.getBoundingClientRect();
console.log('Boundary:', {
  top: rect.top,
  left: rect.left,
  width: rect.width,
  height: rect.height,
});

// 3. 检查样式
const style = window.getComputedStyle(container);
console.log('Styles:', {
  border: style.border,
  padding: style.padding,
  margin: style.margin,
  transform: style.transform,
  position: style.position,
});

// 4. 点击监听测试
container.addEventListener('click', (e) => {
  console.log('Click at:', {
    clientX: e.clientX,
    clientY: e.clientY,
    offsetX: e.offsetX,
    offsetY: e.offsetY,
    layerX: e.layerX,
    layerY: e.layerY,
  });
}, { once: true });
console.log('Click the canvas to see coordinates...');
```

## 🔧 如果数据不同步

### 检查控制台日志

**应该看到的完整流程**:
```bash
# 1. 打开全屏
🔍 SessionDialog - fullscreenMode changed: whiteboard

# 2. 在全屏画图
🔍 Fullscreen onChange, data length: 450
🎨 Excalidraw data changed: {elementsCount: 1, dataSize: 450}

# 3. 继续画
🔍 Fullscreen onChange, data length: 850
🎨 Excalidraw data changed: {elementsCount: 2, dataSize: 850}

# 4. 点击完成
🔍 Save clicked, data length: 850
🔍 Closing fullscreen, current data length: 850
🔍 SessionDialog - fullscreenMode changed: null

# 5. 小窗口重新加载（关键！）
🔄 Loaded Excalidraw data: {elementsCount: 2, dataSize: 850}

# 6. 在小窗口继续编辑
🔍 Small onChange, data length: 1200
```

### 如果缺少某个步骤

**缺少 "Fullscreen onChange"**:
- 全屏模式的 onChange 没触发
- Excalidraw 可能没有正确初始化

**缺少 "Loaded Excalidraw data"**:
- 小窗口没有重新加载数据
- 检查 `key` prop 是否生效
- 检查 `initialData` 是否改变

**缺少 "Small onChange"**:
- 小窗口的 onChange 没触发
- 可能是组件没有正确挂载

## 🚑 紧急修复

如果以上都不行，尝试这个临时方案：

### 方案 A: 只用全屏模式
暂时隐藏小窗口的画图，只使用全屏模式：

1. 打开 SessionDialog
2. 切换到"画图"标签
3. 直接点击"全屏编辑"
4. 在全屏完成所有绘制
5. 点击"完成"后直接保存 Session

### 方案 B: 截图记录
如果绘图功能完全不可用：

1. 使用其他绘图工具（如系统截图工具）
2. 将图片保存并上传到其他地方
3. 在笔记中添加图片链接

## 📞 提供反馈信息

如果问题持续存在，请提供以下信息：

1. **浏览器信息**:
   - 浏览器名称和版本
   - 操作系统

2. **偏移情况**:
   - 偏移方向（右下？左上？）
   - 大约偏移多少像素？
   - 是固定偏移还是随位置变化？

3. **控制台日志**:
   - 复制所有 🔍 和 🎨 开头的日志

4. **屏幕录制**:
   - 如果可能，录制一个短视频展示问题

---

**Updated**: 2024-10-10
**Version**: 3.0 (简化版)

