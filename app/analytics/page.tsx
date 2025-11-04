"use client"

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { IntegrationAnalysis } from '@/components/messages/IntegrationAnalysis'
import { BarChart3, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { typography, interactive } from '@/lib/design-tokens'

export default function AnalyticsPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/messages')}
                    className={cn(
                      interactive.button.secondary,
                      "flex items-center space-x-2"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Inbox</span>
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <BarChart3 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className={cn(typography.h3, "text-foreground")}>
                        Analytics Dashboard
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Integration performance and metrics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <IntegrationAnalysis />
        </div>
      </div>
    </ProtectedRoute>
  )
}
