"use client"

import { AlertCircle, ExternalLink, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TrialBannerProps {
  verifiedCount: number
  totalContacts: number
}

export function TrialBanner({ verifiedCount, totalContacts }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()

  if (isDismissed) return null

  const unverifiedCount = totalContacts - verifiedCount

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-900">
                <strong>Trial Mode Active:</strong> You can only send messages to{' '}
                <button
                  onClick={() => router.push('/setup?tab=verified-contacts')}
                  className="underline hover:text-amber-700 font-semibold"
                >
                  {verifiedCount} verified contact{verifiedCount !== 1 ? 's' : ''}
                </button>
                {unverifiedCount > 0 && (
                  <span>
                    {' '}({unverifiedCount} unverified)
                  </span>
                )}
                . 
                <a
                  href="https://console.twilio.com/us1/billing/manage-billing/billing-overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-amber-700 font-semibold inline-flex items-center"
                >
                  Upgrade to send to all
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/setup')}
              className="px-3 py-1 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition-colors"
            >
              Setup Guide
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4 text-amber-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
