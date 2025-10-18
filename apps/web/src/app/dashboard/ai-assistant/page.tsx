'use client';

/**
 * AI Assistant Page
 * Dedicated page for AI-powered database operations
 */

import { AIAssistant } from '@/components/AIAssistant';
import { Card } from '@/components/ui/card';

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI助手</h1>
        <p className="text-muted-foreground mt-2">
          使用自然语言快速操作数据库，让AI帮您完成复杂的任务
        </p>
      </div>

      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        <AIAssistant />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">📝 创建记录</h3>
          <p className="text-sm text-muted-foreground">
            &ldquo;帮我添加一个Hubery，今天10-12点，cello课程，rate 80&rdquo;
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">🔍 查询数据</h3>
          <p className="text-sm text-muted-foreground">
            &ldquo;显示本月所有cello课程&rdquo; 或 &ldquo;查询Hubery的所有记录&rdquo;
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">✏️ 更新修改</h3>
          <p className="text-sm text-muted-foreground">
            &ldquo;更新Hubery的rate为90&rdquo; 或 &ldquo;修改今天的课程时间&rdquo;
          </p>
        </Card>
      </div>
    </div>
  );
}

