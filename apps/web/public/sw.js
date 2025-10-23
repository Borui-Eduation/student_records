// Service Worker for PWA
const CACHE_VERSION = 'v2'
const CACHE_NAME = `professional-workspace-${CACHE_VERSION}`
const RUNTIME_CACHE = `professional-workspace-runtime-${CACHE_VERSION}`
const API_CACHE = `professional-workspace-api-${CACHE_VERSION}`
const IMAGE_CACHE = `professional-workspace-images-${CACHE_VERSION}`

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Cache size limits
const CACHE_LIMITS = {
  [RUNTIME_CACHE]: 50,
  [API_CACHE]: 100,
  [IMAGE_CACHE]: 60,
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err)
        // Don't fail install if some assets can't be cached
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Strategy 1: Cache First for static assets (CSS, JS, images)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] Cache hit:', url.pathname)
          return response
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          const cacheName = isImage(url) ? IMAGE_CACHE : CACHE_NAME
          addToCache(cacheName, request, response)
          return response
        }).catch(() => {
          console.log('[SW] Fetch failed for:', url.pathname)
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
    )
    return
  }

  // Strategy 2: Network First for API calls (tRPC)
  if (url.pathname.includes('/api/') || url.pathname.includes('trpc')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          addToCache(API_CACHE, request, response)
          return response
        })
        .catch(() => {
          // Fall back to cached API response
          return caches.match(request).then((response) => {
            if (response) {
              console.log('[SW] Using cached API response:', url.pathname)
              return response
            }
            return new Response(
              JSON.stringify({
                error: 'Offline - API not available',
                data: null,
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
              }
            )
          })
        })
    )
    return
  }

  // Strategy 3: Network First for HTML pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        addToCache(RUNTIME_CACHE, request, response)
        return response
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            console.log('[SW] Using cached page:', url.pathname)
            return response
          }
          // Return offline page if available
          return caches.match('/').catch(() => {
            return new Response('Offline - Page not available', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          })
        })
      })
  )
})

// Helper function to determine if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ]
  return staticExtensions.some((ext) => url.pathname.endsWith(ext))
}

// Helper function to determine if URL is an image
function isImage(url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
  return imageExtensions.some((ext) => url.pathname.endsWith(ext))
}

// Trim cache to size limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    return trimCache(cacheName, maxItems)
  }
}

// Add response to cache with size limit
async function addToCache(cacheName, request, response) {
  if (!response || response.status !== 200 || !response.ok) {
    return
  }
  // Check if response body has already been used
  if (response.bodyUsed) {
    return
  }
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
    const limit = CACHE_LIMITS[cacheName]
    if (limit) {
      await trimCache(cacheName, limit)
    }
  } catch (error) {
    // Silently fail if response cannot be cloned or cached
    console.warn('[SW] Failed to cache response:', error)
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  // Handle show notification request from client
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data
    self.registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    })
  }
})

// Handle push events (for web push notifications)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)
  
  let data = {}
  let title = 'New Notification'
  let options = {
    body: 'You have a new message',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'default',
    requireInteraction: false,
  }

  if (event.data) {
    try {
      data = event.data.json()
      title = data.title || title
      options = {
        ...options,
        body: data.body || options.body,
        icon: data.icon || options.icon,
        tag: data.tag || options.tag,
        data: data.data || {},
      }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

