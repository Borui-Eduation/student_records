# Markdown 语法快速参考指南

这是一个完整的 Markdown 语法参考，包括 LaTeX 数学公式的使用方法。

## 📝 基础文本格式

### 标题

```markdown
# 一级标题 (H1)
## 二级标题 (H2)
### 三级标题 (H3)
#### 四级标题 (H4)
##### 五级标题 (H5)
###### 六级标题 (H6)
```

### 文本样式

```markdown
**粗体文本** 或 __粗体文本__
*斜体文本* 或 _斜体文本_
***粗斜体*** 或 ___粗斜体___
~~删除线~~
`行内代码`
```

**效果**：
- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~
- `行内代码`

## 📋 列表

### 无序列表

```markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

* 也可以使用星号
+ 或加号
```

### 有序列表

```markdown
1. 第一项
2. 第二项
3. 第三项
   1. 子项 3.1
   2. 子项 3.2
```

### 任务列表

```markdown
- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待办事项 1
- [x] 待办事项 2
```

**效果**：
- [x] 已完成任务
- [ ] 未完成任务

## 🔗 链接和图片

### 链接

```markdown
[链接文本](https://example.com)
[带标题的链接](https://example.com "鼠标悬停显示此标题")
<https://example.com> (自动链接)
```

### 图片

```markdown
![替代文本](图片URL)
![带标题的图片](图片URL "图片标题")
```

## 💻 代码块

### 行内代码

```markdown
使用 `代码` 来标记行内代码
```

### 代码块（带语法高亮）

````markdown
```javascript
function hello() {
  console.log("Hello, World!");
}
```

```python
def hello():
    print("Hello, World!")
```

```typescript
const greeting: string = "Hello, World!";
console.log(greeting);
```
````

## 📊 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:-------:|-------:|
| 左     | 中      | 右     |
```

**效果**：

| 姓名 | 年龄 | 职业 |
|------|:----:|-----:|
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |

## 💬 引用

```markdown
> 这是一级引用
> 
> > 这是二级引用
> > 
> > > 这是三级引用

> **提示**：引用块可以包含其他 Markdown 格式
> - 列表项 1
> - 列表项 2
```

## 📐 LaTeX 数学公式

### 行内公式

使用单个美元符号 `$...$` 包裹：

```markdown
这是一个行内公式：$E = mc^2$，爱因斯坦的质能方程。

圆的面积公式：$A = \pi r^2$
```

**效果**：这是一个行内公式：$E = mc^2$

### 块级公式（独立行）

使用双美元符号 `$$...$$` 包裹：

```markdown
$$
E = mc^2
$$

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### 常用 LaTeX 数学符号

#### 上标和下标

```markdown
$x^2$               上标
$x_i$               下标
$x^{2y}$            多字符上标
$x_{ij}$            多字符下标
$x_i^2$             同时使用
```

#### 分数

```markdown
$\frac{1}{2}$                   普通分数
$\frac{x+y}{x-y}$               复杂分数
$\dfrac{1}{2}$                  大号分数
```

#### 根号

```markdown
$\sqrt{2}$                      平方根
$\sqrt[3]{8}$                   立方根
$\sqrt{x^2 + y^2}$              复杂根式
```

#### 求和、积分、极限

```markdown
$\sum_{i=1}^{n} x_i$            求和
$\int_0^1 f(x) dx$              积分
$\lim_{x \to \infty} f(x)$      极限
$\prod_{i=1}^{n} x_i$           连乘
```

**效果**：
$$
\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n
$$

#### 希腊字母

```markdown
$\alpha, \beta, \gamma, \delta$      小写
$\Alpha, \Beta, \Gamma, \Delta$      大写
$\pi, \theta, \omega, \phi$          常用符号
$\epsilon, \varepsilon$               epsilon 变体
```

**常用希腊字母表**：
- α β γ δ ε ζ η θ
- Α Β Γ Δ Ε Ζ Η Θ
- λ μ ν ξ π ρ σ τ
- Λ Μ Ν Ξ Π Ρ Σ Τ
- φ χ ψ ω
- Φ Χ Ψ Ω

#### 运算符

```markdown
$\times$        乘号
$\div$          除号
$\pm$           加减
$\mp$           减加
$\cdot$         点乘
$\leq$          小于等于
$\geq$          大于等于
$\neq$          不等于
$\approx$       约等于
$\equiv$        恒等于
```

#### 集合符号

```markdown
$\in$           属于
$\notin$        不属于
$\subset$       子集
$\supset$       超集
$\cup$          并集
$\cap$          交集
$\emptyset$     空集
```

#### 矩阵

```markdown
$$
\begin{matrix}
a & b \\
c & d
\end{matrix}
$$

$$
\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}
$$

$$
\begin{pmatrix}
x \\
y \\
z
\end{pmatrix}
$$
```

#### 方程组

```markdown
$$
\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}
$$

$$
f(x) = \begin{cases}
x^2, & x \geq 0 \\
-x^2, & x < 0
\end{cases}
$$
```

### 🧮 数学公式示例

#### 二次方程

```markdown
$$
ax^2 + bx + c = 0
$$

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

#### 微积分

```markdown
$$
\frac{d}{dx}(x^n) = nx^{n-1}
$$

$$
\int x^n dx = \frac{x^{n+1}}{n+1} + C, \quad n \neq -1
$$
```

#### 线性代数

```markdown
$$
\mathbf{A}\mathbf{x} = \mathbf{b}
$$

$$
\det(\mathbf{A}) = \sum_{i=1}^{n} a_{ij}C_{ij}
$$
```

#### 概率论

```markdown
$$
P(A \cup B) = P(A) + P(B) - P(A \cap B)
$$

$$
E[X] = \sum_{i=1}^{n} x_i P(X = x_i)
$$
```

#### 统计学

```markdown
$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i
$$

$$
\sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2}
$$
```

## 🎨 高级技巧

### 文字颜色（部分编辑器支持）

```markdown
$\color{red}{红色文本}$
$\color{blue}{蓝色文本}$
$\color{green}{绿色文本}$
```

### 空格控制

```markdown
$a\,b$          小空格
$a\;b$          中空格
$a\quad b$      大空格
$a\qquad b$     超大空格
```

### 上下划线

```markdown
$\overline{abc}$        上划线
$\underline{abc}$       下划线
$\overbrace{a+b+c}^{n}$ 上括号
$\underbrace{a+b+c}_{n}$ 下括号
```

### 箭头

```markdown
$\rightarrow$   右箭头
$\leftarrow$    左箭头
$\Rightarrow$   双右箭头
$\Leftarrow$    双左箭头
$\leftrightarrow$ 双向箭头
$\Leftrightarrow$ 双线双向箭头
```

## 🔢 数学排版示例

### 例1：勾股定理

```markdown
在直角三角形中，直角边 $a$ 和 $b$ 与斜边 $c$ 满足：

$$
a^2 + b^2 = c^2
$$
```

### 例2：欧拉公式

```markdown
欧拉公式是数学中最美丽的公式之一：

$$
e^{i\pi} + 1 = 0
$$

这个公式将五个最重要的数学常数联系在一起：
- $e$ (自然对数的底)
- $i$ (虚数单位)
- $\pi$ (圆周率)
- $1$ (乘法单位元)
- $0$ (加法单位元)
```

### 例3：泰勒级数

```markdown
任何光滑函数都可以用泰勒级数展开：

$$
f(x) = f(a) + f'(a)(x-a) + \frac{f''(a)}{2!}(x-a)^2 + \frac{f'''(a)}{3!}(x-a)^3 + \cdots
$$

或者更简洁地：

$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$
```

## ✅ 最佳实践

1. **保持简洁**：Markdown 的优势在于简洁明了
2. **使用空行**：段落之间使用空行分隔
3. **代码高亮**：指定代码块的语言以获得语法高亮
4. **表格对齐**：使用 `|` 对齐表格以提高可读性
5. **数学公式**：复杂公式使用块级显示（`$$...$$`）
6. **预览检查**：编辑后预览效果，确保格式正确

## 🚀 快速参考卡片

| 功能 | 语法 | 效果 |
|------|------|------|
| 粗体 | `**text**` | **text** |
| 斜体 | `*text*` | *text* |
| 代码 | `` `code` `` | `code` |
| 链接 | `[text](url)` | [text](url) |
| 图片 | `![alt](url)` | ![alt](url) |
| 标题 | `# H1` | # H1 |
| 列表 | `- item` | • item |
| 引用 | `> quote` | > quote |
| 行内公式 | `$x^2$` | $x^2$ |
| 块级公式 | `$$E=mc^2$$` | $$E=mc^2$$ |

---

## 📚 推荐资源

- [CommonMark](https://commonmark.org/) - Markdown 标准规范
- [GitHub Flavored Markdown](https://github.github.com/gfm/) - GitHub 的 Markdown 扩展
- [KaTeX](https://katex.org/) - 快速的 LaTeX 数学渲染
- [MathJax](https://www.mathjax.org/) - 另一个流行的数学公式渲染器

---

**提示**：此系统支持完整的 Markdown 语法和 LaTeX 数学公式。在编辑时可以使用实时预览功能查看效果！

