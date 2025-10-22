import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PWAInitializer } from '@/components/PWAInitializer'
import { OfflineIndicator } from '@/components/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Professional Workspace',
  description: 'Multi-Business Management Platform for Education & Technical Services',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Workspace',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Workspace" />
        <meta name="apple-itunes-app" content="app-id=0" />
        <meta name="application-name" content="Workspace" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* iOS Icons - Multiple sizes for different devices */}
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="180x180" />

        {/* Splash screens for iOS */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/icon-192x192.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/icon-192x192.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <TRPCProvider>
            <AuthProvider>
              <PWAInitializer />
              <OfflineIndicator />
              {children}
            </AuthProvider>
          </TRPCProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

