/**
 * Firebase Cloud Messaging (FCM) Integration
 * Handles push notification token management and messaging
 */

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging'
import app from './firebase'

let messaging: ReturnType<typeof getMessaging> | null = null

/**
 * Initialize Firebase Messaging
 */
export function initializeFCM() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    if (!messaging) {
      messaging = getMessaging(app)
    }
    return messaging
  } catch (error) {
    console.error('[FCM] Failed to initialize messaging:', error)
    return null
  }
}

/**
 * Request FCM token for push notifications
 * @param vapidKey - VAPID key from Firebase Console
 */
export async function requestFCMToken(vapidKey?: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('[FCM] Notifications not supported')
    return null
  }

  // Request notification permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('[FCM] Notification permission denied')
    return null
  }

  try {
    const messagingInstance = initializeFCM()
    if (!messagingInstance) {
      return null
    }

    // Check if service worker is ready
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      console.error('[FCM] Service Worker not ready')
      return null
    }

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[FCM] Token retrieved:', token.substring(0, 20) + '...')
      return token
    } else {
      console.log('[FCM] No token available')
      return null
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error)
    return null
  }
}

/**
 * Listen for foreground messages
 * @param callback - Function to handle incoming messages
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  const messagingInstance = initializeFCM()
  if (!messagingInstance) {
    return () => {}
  }

  return onMessage(messagingInstance, (payload) => {
    console.log('[FCM] Foreground message received:', payload)
    callback(payload)
  })
}

// Note: saveFCMToken and deleteFCMToken are now handled via tRPC
// See usePWA hook for usage with trpc.notifications.saveToken and trpc.notifications.deleteToken

