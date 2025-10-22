import { useEffect, useState, useCallback } from 'react'
import {
  isOnlineStatus,
  isPWAInstalled,
  sendNotification,
  requestNotificationPermission,
} from '@/lib/pwa-register'

/**
 * Hook for PWA functionality
 */
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')

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

  const requestNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    return permission
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
    requestNotifications,
    notify,
  }
}

