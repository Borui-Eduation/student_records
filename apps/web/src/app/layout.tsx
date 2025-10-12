import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Student Record Management System',
  description: 'Multi-Business Management Platform for Education & Technical Services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          <TRPCProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TRPCProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

