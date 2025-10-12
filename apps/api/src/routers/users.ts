import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import * as admin from 'firebase-admin';

export const usersRouter = router({
  /**
   * Get or create current user document
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userDoc = await ctx.db.collection('users').doc(ctx.user.uid).get();

    if (userDoc.exists) {
      // Update last login time
      await userDoc.ref.update({
        lastLoginAt: admin.firestore.Timestamp.now(),
      });

      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }

    // Create new user document
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const role = ctx.user.email === superAdminEmail ? 'superadmin' : 'user';

    const newUser = {
      email: ctx.user.email || '',
      role,
      createdAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
      isInitialized: false,
    };

    await ctx.db.collection('users').doc(ctx.user.uid).set(newUser);

    return {
      id: ctx.user.uid,
      ...newUser,
    };
  }),

  /**
   * Initialize user with welcome guide and default company profile
   */
  initializeUser: protectedProcedure.mutation(async ({ ctx }) => {
    const userDoc = await ctx.db.collection('users').doc(ctx.user.uid).get();

    if (!userDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const userData = userDoc.data();
    if (userData?.isInitialized) {
      return { success: true, message: 'User already initialized' };
    }

    // Create Markdown guide
    const markdownGuideContent = `# Markdown 语法快速参考指南

这是一个完整的 Markdown 语法参考，包括 LaTeX 数学公式的使用方法。

## 📝 基础文本格式

### 标题

\`\`\`markdown
# 一级标题 (H1)
## 二级标题 (H2)
### 三级标题 (H3)
#### 四级标题 (H4)
##### 五级标题 (H5)
###### 六级标题 (H6)
\`\`\`

### 文本样式

\`\`\`markdown
**粗体文本** 或 __粗体文本__
*斜体文本* 或 _斜体文本_
***粗斜体*** 或 ___粗斜体___
~~删除线~~
\`行内代码\`
\`\`\`

**效果**：
- **粗体文本**
- *斜体文本*
- ***粗斜体***
- ~~删除线~~
- \`行内代码\`

## 📋 列表

### 无序列表

\`\`\`markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3
\`\`\`

### 任务列表

\`\`\`markdown
- [x] 已完成任务
- [ ] 未完成任务
\`\`\`

## 🔗 链接和图片

\`\`\`markdown
[链接文本](https://example.com)
![图片](图片URL)
\`\`\`

## 💻 代码块

\`\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`\`

## 📊 表格

\`\`\`markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
\`\`\`

## 📐 LaTeX 数学公式

### 行内公式

使用单个美元符号 \`$...$\` 包裹：

\`\`\`markdown
这是一个行内公式：$E = mc^2$
圆的面积公式：$A = \\pi r^2$
\`\`\`

### 块级公式

使用双美元符号 \`$$...$$\` 包裹：

\`\`\`markdown
$$
E = mc^2
$$

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
\`\`\`

### 常用 LaTeX 数学符号

#### 上标和下标

\`\`\`markdown
$x^2$               上标
$x_i$               下标
$x^{2y}$            多字符上标
$x_{ij}$            多字符下标
\`\`\`

#### 分数

\`\`\`markdown
$\\frac{1}{2}$                   普通分数
$\\frac{x+y}{x-y}$               复杂分数
\`\`\`

#### 根号

\`\`\`markdown
$\\sqrt{2}$                      平方根
$\\sqrt[3]{8}$                   立方根
$\\sqrt{x^2 + y^2}$              复杂根式
\`\`\`

#### 求和、积分、极限

\`\`\`markdown
$\\sum_{i=1}^{n} x_i$            求和
$\\int_0^1 f(x) dx$              积分
$\\lim_{x \\to \\infty} f(x)$      极限
$\\prod_{i=1}^{n} x_i$           连乘
\`\`\`

**示例**：
$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n
$$

#### 希腊字母

\`\`\`markdown
$\\alpha, \\beta, \\gamma, \\delta$      小写
$\\pi, \\theta, \\omega, \\phi$          常用符号
\`\`\`

#### 运算符

\`\`\`markdown
$\\times$        乘号
$\\div$          除号
$\\pm$           加减
$\\leq$          小于等于
$\\geq$          大于等于
$\\neq$          不等于
$\\approx$       约等于
\`\`\`

#### 矩阵

\`\`\`markdown
$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{bmatrix}
$$
\`\`\`

#### 方程组

\`\`\`markdown
$$
\\begin{cases}
x + y = 5 \\\\
2x - y = 1
\\end{cases}
$$
\`\`\`

## 🧮 数学公式示例

### 二次方程

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

### 微积分

$$
\\frac{d}{dx}(x^n) = nx^{n-1}
$$

$$
\\int x^n dx = \\frac{x^{n+1}}{n+1} + C, \\quad n \\neq -1
$$

### 概率论

$$
P(A \\cup B) = P(A) + P(B) - P(A \\cap B)
$$

### 统计学

$$
\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i
$$

$$
\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}
$$

## 🚀 快速参考

| 功能 | 语法 |
|------|------|
| 粗体 | \`**text**\` |
| 斜体 | \`*text*\` |
| 代码 | \`\\\`code\\\`\` |
| 链接 | \`[text](url)\` |
| 标题 | \`# H1\` |
| 行内公式 | \`$x^2$\` |
| 块级公式 | \`$$E=mc^2$$\` |

---

**提示**：此系统支持完整的 Markdown 语法和 LaTeX 数学公式。使用实时预览功能查看效果！`;

    const now = admin.firestore.Timestamp.now();

    // Add markdown guide to knowledge base
    await ctx.db.collection('knowledgeBase').add({
      userId: ctx.user.uid,
      title: '📚 Markdown 语法指南',
      type: 'note',
      content: markdownGuideContent,
      isEncrypted: false,
      tags: ['markdown', 'latex', '语法', '教程'],
      category: '使用指南',
      attachments: [],
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    });

    // Create default company profile
    await ctx.db.collection('companyProfile').doc(ctx.user.uid).set({
      companyName: '',
      address: '',
      email: ctx.user.email || '',
      phone: '',
      website: '',
      updatedAt: now,
      updatedBy: ctx.user.uid,
    });

    // Mark user as initialized
    await userDoc.ref.update({
      isInitialized: true,
    });

    return { success: true, message: 'User initialized successfully' };
  }),

  /**
   * List all users (super admin only)
   */
  listUsers: adminProcedure.query(async ({ ctx }) => {
    // Check if user is super admin
    const userDoc = await ctx.db.collection('users').doc(ctx.user.uid).get();
    const userData = userDoc.data();

    if (userData?.role !== 'superadmin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Super admin access required',
      });
    }

    const snapshot = await ctx.db.collection('users').orderBy('createdAt', 'desc').get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      items: users,
      total: users.length,
    };
  }),
});

