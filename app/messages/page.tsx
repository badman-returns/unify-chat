"use client"

import { useState } from 'react'
import { MessageSquare, LogOut, BarChart3, Settings } from 'lucide-react'
import { ContactInbox } from '@/components/messages/ContactInbox'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TrialBanner } from '@/components/messages/TrialBanner'
import { cn } from '@/lib/utils'
import { typography, interactive } from '@/lib/design-tokens'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useTrialMode } from '@/hooks/useTrialMode'

export default function MessagesPage() {
  const router = useRouter()
  const [selectedChannel] = useState<'sms' | 'whatsapp' | 'email' | 'all'>('all')
  const { isTrial, verifiedCount, totalContacts } = useTrialMode()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-background">
        {isTrial && (
          <TrialBanner 
            verifiedCount={verifiedCount} 
            totalContacts={totalContacts}
          />
        )}
        
        <div className="border-b border-border bg-card flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <MessageSquare className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className={cn(typography.h3, "text-foreground")}>
                      Unified Chat
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Multi-channel customer communication
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/setup')}
                  className={cn(
                    interactive.button.secondary,
                    "text-sm flex items-center space-x-2"
                  )}
                  title="Integration Setup"
                >
                  <Settings className="h-4 w-4" />
                  <span>Setup</span>
                </button>
                
                <button
                  onClick={() => router.push('/analytics')}
                  className={cn(
                    interactive.button.secondary,
                    "text-sm flex items-center space-x-2"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={handleLogout}
                  className={cn(
                    interactive.button.secondary,
                    "text-sm flex items-center space-x-2 text-red-600 hover:bg-red-50"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ContactInbox selectedChannel={selectedChannel} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
