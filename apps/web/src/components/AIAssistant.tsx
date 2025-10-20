'use client';

/**
 * AI Assistant Component
 * Provides natural language interface for database operations
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'confirmation' | 'result';
  content: string;
  workflow?: any;
  result?: any;
  timestamp: Date;
}

export function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const chatMutation = trpc.ai.chat.useMutation();
  const executeMutation = trpc.ai.execute.useMutation();

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 处理执行结果的通用函数
  const handleExecutionResult = async (result: any) => {
    if (result.success) {
      // 格式化结果内容
      let content = '✅ 操作成功完成';
      
      // 优先显示 naturalResponse（用于 aggregate 查询）
      if (result.naturalResponse) {
        content = result.naturalResponse;
      }
      // 如果有查询结果数据，显示它
      else if (result.data && Array.isArray(result.data)) {
        // 检查是否是查询结果（包含多个结果对象的数组）
        const firstItem = result.data[0];
        
        // 如果第一个元素是数组（查询操作返回），或如果是对象且有数据库字段（如clientName、date等）
        if (Array.isArray(firstItem)) {
          // 第一个命令返回的是数组（如查询结果）
          const records = firstItem;
          
          if (records.length > 0) {
            content = `✅ 查询成功，找到 ${records.length} 条记录\n\n`;
            
            // 显示每条记录的摘要
            records.slice(0, 5).forEach((record: any, index: number) => {
              content += `${index + 1}. `;
              if (record.name) {
                content += `${record.name} `;
              }
              if (record.clientName) {
                content += `客户: ${record.clientName} `;
              }
              if (record.date) {
                const date = new Date(record.date);
                content += `日期: ${date.toLocaleDateString('zh-CN')} `;
              }
              if (record.startTime && record.endTime) {
                content += `时间: ${record.startTime}-${record.endTime} `;
              }
              if (record.totalAmount) {
                content += `金额: ¥${record.totalAmount}`;
              }
              if (record.title && !record.clientName) {
                // KnowledgeBase entry
                content += `标题: ${record.title}`;
              }
              content += '\n';
            });
            
            if (records.length > 5) {
              content += `\n... 还有 ${records.length - 5} 条记录`;
            }
          } else {
            content = '✅ 操作成功完成，但没有找到匹配的记录';
          }
        } else if (firstItem && typeof firstItem === 'object' && (firstItem.clientName || firstItem.date || firstItem.title)) {
          // 直接是结果对象数组（来自search操作）
          const records = result.data;
          
          if (records.length > 0) {
            content = `✅ 查询成功，找到 ${records.length} 条记录\n\n`;
            
            records.slice(0, 5).forEach((record: any, index: number) => {
              content += `${index + 1}. `;
              if (record.name) {
                content += `${record.name} `;
              }
              if (record.clientName) {
                content += `客户: ${record.clientName} `;
              }
              if (record.date) {
                const date = new Date(record.date);
                content += `日期: ${date.toLocaleDateString('zh-CN')} `;
              }
              if (record.startTime && record.endTime) {
                content += `时间: ${record.startTime}-${record.endTime} `;
              }
              if (record.totalAmount) {
                content += `金额: ¥${record.totalAmount}`;
              }
              if (record.title && !record.clientName) {
                content += `标题: ${record.title}`;
              }
              content += '\n';
            });
            
            if (records.length > 5) {
              content += `\n... 还有 ${records.length - 5} 条记录`;
            }
          } else {
            content = '✅ 操作成功完成，但没有找到匹配的记录';
          }
        } else {
          // 创建/更新/删除操作
          content = '✅ 操作成功完成';
        }
      } else if (result.affectedRecords && result.affectedRecords.length > 0) {
        // 显示创建/更新/删除的记录
        content = `✅ 操作成功完成\n\n`;
        result.affectedRecords.forEach((record: any) => {
          const action = record.operation === 'create' ? '创建' : 
                        record.operation === 'update' ? '更新' : '删除';
          content += `${action}了 ${record.entity}: ${record.id}\n`;
        });
      }
      
      const resultMessage: Message = {
        id: Date.now().toString(),
        type: 'result',
        content,
        result,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);
    } else {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'result',
        content: `❌ 操作失败：${result.error}`,
        result,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Parse natural language
      const result = await chatMutation.mutateAsync({
        input,
        context: {
          currentDate: getCurrentDate(),
          userPreferences: {
            defaultCurrency: 'CNY',
            timezone: 'Asia/Shanghai',
          },
        },
      });

      if (!result.success) {
        // Show error message
        const errorMsg = 'error' in result ? result.error : '';
        const suggestions = 'suggestions' in result ? result.suggestions : [];
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `抱歉，我无法理解您的指令。${errorMsg || ''}${suggestions ? '\n\n建议：\n' + suggestions.join('\n') : ''}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else if ('workflow' in result && result.workflow) {
        const workflow = result.workflow;
        
        // 检查是否需要确认
        if (workflow.requiresConfirmation) {
          // 删除/更新操作需要确认
          const confirmationMessage: Message = {
            id: Date.now().toString(),
            type: 'confirmation',
            content: workflow.description,
            workflow: workflow,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmationMessage]);
          setPendingWorkflow(workflow);
        } else {
          // 查询/创建操作直接执行
          const infoMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `正在执行：${workflow.description}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, infoMessage]);
          
          // 直接执行工作流
          try {
            const executeResult = await executeMutation.mutateAsync({
              workflow: workflow,
            });
            
            // 处理执行结果
            await handleExecutionResult(executeResult);
          } catch (error) {
            const errorMessage: Message = {
              id: Date.now().toString(),
              type: 'result',
              content: `❌ 执行失败：${error instanceof Error ? error.message : '未知错误'}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `发生错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingWorkflow) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await executeMutation.mutateAsync({
        workflow: pendingWorkflow,
      });

      await handleExecutionResult(result);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'result',
        content: `❌ 发生错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setPendingWorkflow(null);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setPendingWorkflow(null);
    const cancelMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: '已取消操作',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">AI助手</h3>
            <p className="text-sm">
              试试用自然语言操作数据库，例如：
            </p>
            <div className="mt-4 space-y-2 text-xs text-left max-w-md mx-auto">
              <div className="bg-gray-50 p-3 rounded">
                &ldquo;帮我添加一个Hubery，今天10-12点，cello课程，rate 80&rdquo;
              </div>
              <div className="bg-gray-50 p-3 rounded">
                &ldquo;显示本月所有cello课程&rdquo;
              </div>
              <div className="bg-gray-50 p-3 rounded">
                &ldquo;显示Hubery的所有课程记录&rdquo;
              </div>
              <div className="bg-gray-50 p-3 rounded">
                &ldquo;保存一个API密钥，标题OpenAI Key，内容sk-xxx&rdquo;
              </div>
              <div className="bg-gray-50 p-3 rounded">
                &ldquo;查找所有SSH相关的记录&rdquo;
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'confirmation'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : message.type === 'result'
                  ? 'bg-gray-50 border border-gray-200'
                  : 'bg-gray-100'
              }`}
            >
              {message.type === 'confirmation' && (
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-yellow-800">需要确认</span>
                </div>
              )}

              <p className="whitespace-pre-wrap text-sm">{message.content}</p>

              {message.type === 'confirmation' && message.workflow && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        执行中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        确认执行
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    取消
                  </Button>
                </div>
              )}

              {message.type === 'result' && message.result?.affectedRecords && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>影响的记录：</p>
                  <ul className="list-disc list-inside">
                    {message.result.affectedRecords.map((record: any, idx: number) => (
                      <li key={idx}>
                        {record.operation} {record.entity} ({record.id})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && !pendingWorkflow && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入您的指令... (Shift+Enter换行，Enter发送)"
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="self-end"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 提示：您可以用自然语言创建、查询、更新和删除记录
        </p>
      </div>
    </div>
  );
}

/**
 * AI Assistant Dialog - Can be triggered from anywhere
 */
export function AIAssistantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI助手
          </DialogTitle>
          <DialogDescription>
            使用自然语言操作数据库
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <AIAssistant />
        </div>
      </DialogContent>
    </Dialog>
  );
}

