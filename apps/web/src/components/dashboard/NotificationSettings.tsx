'use client'

import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

/**
 * Notification Settings Component
 * Allows users to manage push notifications
 */
export function NotificationSettings() {
  const { user } = useAuth()
  const {
    notificationPermission,
    fcmToken,
    fcmError,
    requestPushNotifications,
    disablePushNotifications,
  } = usePWA(user?.uid)

  const [isEnabling, setIsEnabling] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const saveTokenMutation = trpc.notifications.saveToken.useMutation()
  const deleteTokenMutation = trpc.notifications.deleteToken.useMutation()
  const sendTestMutation = trpc.notifications.sendTest.useMutation()

  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    try {
      const token = await requestPushNotifications()
      
      if (token) {
        // Save token to backend
        await saveTokenMutation.mutateAsync({
          token,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent,
          },
        })
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setIsEnabling(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsDisabling(true)
    try {
      // Delete token from backend first
      await deleteTokenMutation.mutateAsync()
      // Then clear local state
      await disablePushNotifications()
    } catch (error) {
      console.error('Failed to disable notifications:', error)
    } finally {
      setIsDisabling(false)
    }
  }

  const handleSendTest = async () => {
    setTestStatus('sending')
    try {
      await sendTestMutation.mutateAsync()
      setTestStatus('success')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to send test notification:', error)
      setTestStatus('error')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }

  const isEnabled = notificationPermission === 'granted' && fcmToken !== null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">推送通知</h3>
        <p className="text-sm text-muted-foreground">
          启用推送通知以接收实时更新（支持 iOS、Android 和桌面浏览器）
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEnabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {isEnabled ? '已启用' : '未启用'}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? '您将接收到重要的更新和通知'
                : '启用推送通知以不错过任何更新'}
            </p>

            {fcmError && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {fcmError}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isEnabled ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={testStatus === 'sending'}
                >
                  {testStatus === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送中...
                    </>
                  ) : testStatus === 'success' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      已发送
                    </>
                  ) : testStatus === 'error' ? (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      失败
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      测试通知
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableNotifications}
                  disabled={isDisabling}
                >
                  {isDisabling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      禁用中...
                    </>
                  ) : (
                    '禁用'
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isEnabling}
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    启用中...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    启用通知
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isEnabled && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">通知已启用</h4>
              <p className="text-sm text-green-700 mt-1">
                您可以在 iOS（需要将应用添加到主屏幕）、Android 和桌面浏览器上接收推送通知
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">iOS 用户提示</h4>
            <p className="text-sm text-blue-700 mt-1">
              在 iOS 上使用推送通知：
            </p>
            <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
              <li>在 Safari 中打开此应用</li>
              <li>点击"分享"按钮</li>
              <li>选择"添加到主屏幕"</li>
              <li>从主屏幕打开应用</li>
              <li>点击上方"启用通知"按钮</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

