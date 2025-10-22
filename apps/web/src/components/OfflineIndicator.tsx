'use client'

import { usePWA } from '@/hooks/usePWA'
import { WifiOff } from 'lucide-react'

/**
 * Offline Indicator Component
 * Shows when the application is offline
 */
export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 shadow-lg z-50">
      <WifiOff className="w-4 h-4 text-yellow-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          You are offline
        </p>
        <p className="text-xs text-yellow-700">
          Some features may be limited
        </p>
      </div>
    </div>
  )
}

