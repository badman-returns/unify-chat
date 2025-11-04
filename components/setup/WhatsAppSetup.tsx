"use client"

import { useState, useEffect } from 'react'
import { QrCode, Link, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'

interface JoinInfo {
  sandboxCode: string
  sandboxNumber: string
  joinMethods: {
    manual: {
      instructions: string[]
      message: string
    }
    qrCode: {
      url: string
      instructions: string
    }
    clickableLink: {
      url: string
      instructions: string
    }
  }
  webhookSetup: {
    url: string
    instructions: string[]
  }
}

export function WhatsAppSetup() {
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchJoinInfo()
  }, [])

  const fetchJoinInfo = async () => {
    try {
      const response = await fetch('/api/whatsapp/join-info')
      const data = await response.json()
      if (data.success) {
        setJoinInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch join info:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!joinInfo) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          Failed to load WhatsApp setup information. Please check your configuration.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={cn(typography.h2, "mb-2")}>WhatsApp Sandbox Setup</h2>
        <p className="text-sm text-muted-foreground">
          Choose any method below to join the WhatsApp sandbox and start receiving messages
        </p>
      </div>

      {/* Method 1: QR Code */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Method 1: Scan QR Code</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {joinInfo.joinMethods.qrCode.instructions}
            </p>
            <div className="bg-white p-4 rounded-lg border border-border inline-block">
              <img 
                src={joinInfo.joinMethods.qrCode.url} 
                alt="WhatsApp Join QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Method 2: Clickable Link */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Link className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Method 2: Click to Join</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {joinInfo.joinMethods.clickableLink.instructions}
            </p>
            <a
              href={joinInfo.joinMethods.clickableLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Open WhatsApp</span>
              <Link className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Method 3: Manual */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Copy className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Method 3: Manual Join</h3>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              {joinInfo.joinMethods.manual.instructions.map((instruction, index) => (
                <p key={index}>{instruction}</p>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <code className="px-4 py-2 bg-muted rounded-lg text-sm font-mono">
                {joinInfo.joinMethods.manual.message}
              </code>
              <button
                onClick={() => copyToClipboard(joinInfo.joinMethods.manual.message)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">📡 Webhook Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure this webhook URL in your Twilio console to receive messages:
        </p>
        <div className="space-y-2 text-sm">
          {joinInfo.webhookSetup.instructions.map((instruction, index) => (
            <p key={index} className="text-muted-foreground">{instruction}</p>
          ))}
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <code className="flex-1 px-4 py-2 bg-white rounded-lg text-sm font-mono border border-blue-300">
            {joinInfo.webhookSetup.url}
          </code>
          <button
            onClick={() => copyToClipboard(joinInfo.webhookSetup.url)}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Copy webhook URL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
