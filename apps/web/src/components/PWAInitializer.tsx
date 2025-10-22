'use client'

import { useEffect } from 'react'
import { registerPWA } from '@/lib/pwa-register'

/**
 * PWA Initializer Component
 * Registers Service Worker and sets up PWA functionality
 */
export function PWAInitializer() {
  useEffect(() => {
    // Register PWA
    registerPWA({
      enabled: true,
      debug: process.env.NODE_ENV === 'development',
      onInstalled: () => {
        // eslint-disable-next-line no-console
        console.log('PWA installed successfully')
      },
      onUpdated: () => {
        // eslint-disable-next-line no-console
        console.log('PWA updated')
      },
      onOffline: () => {
        // eslint-disable-next-line no-console
        console.log('Application is offline')
      },
      onOnline: () => {
        // eslint-disable-next-line no-console
        console.log('Application is online')
      },
    })
  }, [])

  return null
}

