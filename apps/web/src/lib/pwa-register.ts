/**
 * PWA Service Worker Registration
 * Handles registration, updates, and lifecycle management
 */

export interface PWAConfig {
  enabled?: boolean
  debug?: boolean
  onInstalled?: () => void
  onUpdated?: () => void
  onOffline?: () => void
  onOnline?: () => void
}

let registration: ServiceWorkerRegistration | null = null
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

/**
 * Register Service Worker and set up PWA
 */
export async function registerPWA(config: PWAConfig = {}): Promise<void> {
  const {
    enabled = true,
    debug = false,
    onInstalled,
    onUpdated,
    onOffline,
    onOnline,
  } = config

  // Check if running in browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return
  }

  // Check if Service Workers are supported
  if (!('serviceWorker' in navigator)) {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[PWA] Service Workers not supported')
    }
    return
  }

  if (!enabled) {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[PWA] PWA disabled')
    }
    return
  }

  try {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[PWA] Registering Service Worker...')
    }

    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[PWA] Service Worker registered successfully')
    }

    // Handle Service Worker updates
    registration.addEventListener('updatefound', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const newWorker = registration!.installing
      if (!newWorker) {
        return
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New Service Worker available
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('[PWA] New Service Worker available')
          }
          onUpdated?.()

          // Notify user about update
          notifyUpdate()
        }
      })
    })

    // Handle first install
    if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (registration!.active) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('[PWA] Service Worker activated')
          }
          onInstalled?.()
        }
      })
    } else if (registration.active) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[PWA] Service Worker already active')
      }
      onInstalled?.()
    }

    // Set up online/offline listeners
    window.addEventListener('online', () => {
      isOnline = true
      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[PWA] Online')
      }
      onOnline?.()
    })

    window.addEventListener('offline', () => {
      isOnline = false
      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[PWA] Offline')
      }
      onOffline?.()
    })

    // Request periodic background sync (if supported)
    if ('periodicSync' in registration) {
      try {
        await (registration.periodicSync as any).register('sync-data', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        })
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[PWA] Periodic sync registered')
        }
      } catch (err) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('[PWA] Periodic sync not available:', err)
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PWA] Failed to register Service Worker:', error)
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterPWA(): Promise<void> {
  if (!registration) {
    return
  }

  try {
    const success = await registration.unregister()
    if (success) {
      registration = null
      // eslint-disable-next-line no-console
      console.log('[PWA] Service Worker unregistered')
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PWA] Failed to unregister Service Worker:', error)
  }
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check if running as standalone app
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

/**
 * Check if online
 */
export function isOnlineStatus(): boolean {
  return isOnline
}

/**
 * Get Service Worker registration
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return registration
}

/**
 * Notify user about available update
 */
function notifyUpdate(): void {
  // Create a simple notification
  const message = document.createElement('div')
  message.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #000;
    color: #fff;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    gap: 12px;
    align-items: center;
  `
  
  message.innerHTML = `
    <span>New version available</span>
    <button id="pwa-update-btn" style="
      background: #fff;
      color: #000;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    ">Update</button>
  `
  
  document.body.appendChild(message)
  
  const btn = document.getElementById('pwa-update-btn')
  if (btn) {
    btn.addEventListener('click', () => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    })
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    message.remove()
  }, 10000)
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    // eslint-disable-next-line no-console
    console.log('[PWA] Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission()
  }

  return 'denied'
}

/**
 * Send a notification
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  if (registration?.active) {
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      options,
    })
  } else {
    // eslint-disable-next-line no-new
    new Notification(title, options)
  }
}

