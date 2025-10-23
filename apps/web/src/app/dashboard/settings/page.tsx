'use client'

import { NotificationSettings } from '@/components/dashboard/NotificationSettings'

/**
 * Settings Page
 * Allows users to manage their account and notification settings
 */
export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground">
          管理您的账户和通知偏好
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <NotificationSettings />
        </section>
      </div>
    </div>
  )
}

