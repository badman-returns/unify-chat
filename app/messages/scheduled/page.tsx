"use client"

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ScheduledMessages } from '@/components/messages/ScheduledMessages'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ScheduledMessagesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Link
              href="/messages"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Inbox
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Scheduled Messages</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your scheduled messages
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <ScheduledMessages />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
