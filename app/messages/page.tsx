"use client"

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { ContactInbox } from '@/components/messages/ContactInbox'
import { ChannelSelector } from '@/components/messages/ChannelSelector'
import { IntegrationAnalysis } from '@/components/messages/IntegrationAnalysis'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'
import { typography, interactive } from '@/lib/design-tokens'

export default function MessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp' | 'email' | 'all'>('all')
  const [showAnalysis, setShowAnalysis] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <MessageSquare className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className={cn(typography.h3, "text-foreground")}>
                      Unified Inbox
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Multi-channel customer communication
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className={cn(
                    interactive.button.secondary,
                    "text-sm"
                  )}
                >
                  {showAnalysis ? 'Hide Inbox' : 'Show Analysis'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {showAnalysis ? (
            <IntegrationAnalysis />
          ) : (
            <ContactInbox selectedChannel={selectedChannel} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
