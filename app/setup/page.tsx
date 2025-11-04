"use client"

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { WhatsAppSetup } from '@/components/setup/WhatsAppSetup'
import { TwilioTrialInfo } from '@/components/setup/TwilioTrialInfo'
import { VerifiedContacts } from '@/components/setup/VerifiedContacts'
import { Phone, MessageCircle, Settings, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'

type SetupTab = 'trial-info' | 'whatsapp' | 'verified-contacts' | 'settings'

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState<SetupTab>('trial-info')

  const tabs = [
    { id: 'trial-info' as SetupTab, label: 'Trial Status', icon: Phone },
    { id: 'whatsapp' as SetupTab, label: 'WhatsApp Setup', icon: MessageCircle },
    { id: 'verified-contacts' as SetupTab, label: 'Verified Contacts', icon: CheckCircle },
    { id: 'settings' as SetupTab, label: 'Settings', icon: Settings },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className={cn(typography.h1, "text-foreground")}>
                Integration Setup
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Configure your messaging channels and verify contacts
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-primary font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'trial-info' && <TwilioTrialInfo />}
          {activeTab === 'whatsapp' && <WhatsAppSetup />}
          {activeTab === 'verified-contacts' && <VerifiedContacts />}
          {activeTab === 'settings' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className={cn(typography.h2, "mb-4")}>Settings</h2>
              <p className="text-sm text-muted-foreground">
                Additional configuration options coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
