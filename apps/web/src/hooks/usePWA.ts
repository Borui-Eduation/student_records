import { useEffect, useState, useCallback } from 'react'
import {
  isOnlineStatus,
  isPWAInstalled,
  sendNotification,
  requestNotificationPermission,
} from '@/lib/pwa-register'
import {
  requestFCMToken,
  onForegroundMessage,
} from '@/lib/fcm'

/**
 * Hook for PWA functionality with FCM integration
 */
export function usePWA(userId?: string) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [fcmError, setFcmError] = useState<string | null>(null)

  useEffect(() => {
    // Check initial state
    setIsOnline(isOnlineStatus())
    setIsInstalled(isPWAInstalled())

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Setup FCM foreground message listener
  useEffect(() => {
    if (notificationPermission !== 'granted') {
      return
    }

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[PWA] Foreground message received:', payload)
      
      // Show notification when app is in foreground
      const title = payload.notification?.title || 'New Message'
      const options: NotificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icon-192x192.png',
        tag: payload.data?.tag || 'default',
        data: payload.data || {},
      }
      
      sendNotification(title, options)
    })

    return unsubscribe
  }, [notificationPermission])

  const requestNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    return permission
  }, [])

  const requestPushNotifications = useCallback(async () => {
    try {
      setFcmError(null)
      
      // Request permission first
      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)
      
      if (permission !== 'granted') {
        setFcmError('Notification permission denied')
        return null
      }

      // Get FCM token
      const token = await requestFCMToken()
      
      if (!token) {
        setFcmError('Failed to get FCM token')
        return null
      }

      setFcmToken(token)
      return token
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setFcmError(errorMsg)
      console.error('[PWA] Error requesting push notifications:', error)
      return null
    }
  }, [])

  const disablePushNotifications = useCallback(async () => {
    try {
      setFcmToken(null)
      setFcmError(null)
      return true
    } catch (error) {
      console.error('[PWA] Error disabling push notifications:', error)
      return false
    }
  }, [])

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (notificationPermission === 'granted') {
        sendNotification(title, options)
      }
    },
    [notificationPermission]
  )

  return {
    isOnline,
    isInstalled,
    notificationPermission,
    fcmToken,
    fcmError,
    requestNotifications,
    requestPushNotifications,
    disablePushNotifications,
    notify,
  }
}

