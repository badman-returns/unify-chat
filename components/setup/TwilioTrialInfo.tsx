"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, Phone, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'

interface TwilioInfo {
  accountSid: string
  phoneNumber: string
  whatsappNumber: string
  isTrial: boolean
  balance?: string
  status: 'active' | 'trial' | 'suspended'
}

export function TwilioTrialInfo() {
  const [twilioInfo, setTwilioInfo] = useState<TwilioInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, fetch from Twilio API
    // For now, showing static info from env
    setTwilioInfo({
      accountSid: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || 'AC...',
      phoneNumber: '+1 229-808-7986',
      whatsappNumber: '+1 415-523-8886 (Sandbox)',
      isTrial: true, // Detect from Twilio API
      balance: '$15.50',
      status: 'trial'
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trial Warning Banner */}
      {twilioInfo?.isTrial && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                🎯 Trial Account Active
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                You're using a Twilio Trial account. You can only send messages to <strong>verified phone numbers</strong>.
                To send to any number, upgrade to a paid account.
              </p>
              <a
                href="https://console.twilio.com/us1/billing/manage-billing/billing-overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                <span>Upgrade Account</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className={cn(typography.h2, "mb-6")}>Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account SID */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Account SID
            </label>
            <div className="flex items-center space-x-2">
              <code className="px-4 py-2 bg-muted rounded-lg text-sm font-mono flex-1">
                {twilioInfo?.accountSid}
              </code>
              {twilioInfo?.status === 'active' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Account Status
            </label>
            <div className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center space-x-2",
              twilioInfo?.isTrial 
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-green-100 text-green-800 border border-green-200"
            )}>
              {twilioInfo?.isTrial ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Trial Mode</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Production</span>
                </>
              )}
            </div>
          </div>

          {/* SMS Number */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              SMS Phone Number
            </label>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <code className="px-4 py-2 bg-muted rounded-lg text-sm font-mono">
                {twilioInfo?.phoneNumber}
              </code>
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              WhatsApp Number
            </label>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <code className="px-4 py-2 bg-muted rounded-lg text-sm font-mono">
                {twilioInfo?.whatsappNumber}
              </code>
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Account Balance
            </label>
            <div className="px-4 py-2 bg-muted rounded-lg text-sm font-mono">
              {twilioInfo?.balance}
            </div>
          </div>
        </div>
      </div>

      {/* Trial Limitations */}
      {twilioInfo?.isTrial && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Trial Account Limitations</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Verified Numbers Only:</strong>
                <span className="text-muted-foreground ml-2">
                  You can only send messages to phone numbers you've verified in the Twilio Console
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Trial Message Prefix:</strong>
                <span className="text-muted-foreground ml-2">
                  SMS messages will include "Sent from your Twilio trial account -" prefix
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Free Credits:</strong>
                <span className="text-muted-foreground ml-2">
                  Trial accounts include free credits for testing ($15.50 remaining)
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">WhatsApp Sandbox:</strong>
                <span className="text-muted-foreground ml-2">
                  Free access to WhatsApp sandbox for testing (users must join first)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold mb-3">How to Verify Numbers:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-foreground">1.</span>
                <span>Go to Twilio Console → Phone Numbers → Verified Caller IDs</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-foreground">2.</span>
                <span>Click "Add a new Caller ID" and enter the phone number</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-foreground">3.</span>
                <span>Twilio will call/SMS the number with a verification code</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold text-foreground">4.</span>
                <span>Enter the code to verify - number will show as "Verified" in your app</span>
              </li>
            </ol>

            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium mt-4"
            >
              <span>Verify Phone Numbers</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://console.twilio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors group"
          >
            <span className="text-sm font-medium">Twilio Console</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>

          <a
            href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors group"
          >
            <span className="text-sm font-medium">Verified Caller IDs</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>

          <a
            href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors group"
          >
            <span className="text-sm font-medium">WhatsApp Sandbox</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>

          <a
            href="https://console.twilio.com/us1/billing/manage-billing/billing-overview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors group"
          >
            <span className="text-sm font-medium">Upgrade Account</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>
        </div>
      </div>
    </div>
  )
}
