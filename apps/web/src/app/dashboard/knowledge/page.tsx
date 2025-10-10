'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Lock, Search, Tag, Pencil, Trash2, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KnowledgeDialog } from '@/components/knowledge/KnowledgeDialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function KnowledgePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntry, setDeletingEntry] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const utils = trpc.useUtils();

  // Query knowledge entries
  const { data, isLoading, error } = trpc.knowledgeBase.list.useQuery({
    limit: 50,
  });

  // Delete mutation
  const deleteMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      setDeletingEntry(null);
    },
  });

  // Create example mutation
  const createExampleMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
    },
  });

  // Add Markdown guide example
  const addMarkdownGuide = () => {
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

    createExampleMutation.mutate({
      title: '📚 Markdown 语法指南（示例）',
      type: 'note',
      content: markdownGuideContent,
      tags: ['markdown', 'latex', '语法', '示例', '教程'],
      category: '使用指南',
      requireEncryption: false,
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'note': 'text-blue-600 bg-blue-100',
      'api-key': 'text-red-600 bg-red-100',
      'ssh-record': 'text-purple-600 bg-purple-100',
      'password': 'text-orange-600 bg-orange-100',
      'memo': 'text-green-600 bg-green-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const filteredItems = data?.items.filter((item: any) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Securely store API keys, SSH records, and sensitive information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={addMarkdownGuide}
            disabled={createExampleMutation.isPending}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {createExampleMutation.isPending ? '添加中...' : '添加 Markdown 指南'}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <KnowledgeDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingEntry?.title}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntry && deleteMutation.mutate({ id: deletingEntry.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or tags..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Error loading knowledge base: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems && filteredItems.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No entries match your search'
                    : 'No entries in knowledge base yet'}
                </p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-2"
                >
                  {searchQuery ? 'Clear search' : 'Create your first entry'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredItems?.map((entry: any) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <CardTitle className="text-lg flex items-center gap-2">
                        {entry.isEncrypted && <Lock className="h-4 w-4 text-red-500" />}
                        {entry.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(entry.type)}`}>
                        {entry.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEntry(entry);
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingEntry(entry);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {entry.category && (
                    <CardDescription className="mt-2">{entry.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent
                  className="cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="text-sm text-muted-foreground">
                    {entry.isEncrypted ? (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        [Encrypted Content]
                      </span>
                    ) : (
                      <p className="line-clamp-2">{entry.content}</p>
                    )}
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    Accessed: {entry.accessCount || 0} times
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Entry Detail Modal (View) */}
      {selectedEntry && (
        <KnowledgeDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          entryId={selectedEntry.id}
        />
      )}

      {/* Entry Edit Modal */}
      {editingEntry && (
        <KnowledgeDialog
          open={true}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          entryId={editingEntry.id}
          editMode={true}
        />
      )}
    </div>
  );
}


