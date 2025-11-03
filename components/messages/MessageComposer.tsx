"use client"

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { interactive, typography } from '@/lib/design-tokens'

interface MessageComposerProps {
  selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all'
  getChannelIcon: (channel: string) => React.ReactNode
  getChannelColor: (channel: string) => string
}

export function MessageComposer({ 
  selectedChannel, 
  getChannelIcon, 
  getChannelColor 
}: MessageComposerProps) {
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSend = async () => {
    if (!recipient || !message) {
      setError('Please fill in recipient and message')
      return
    }

    if (selectedChannel === 'all') {
      setError('Please select a specific channel to send messages')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: any = {
        channel: selectedChannel,
        to: recipient,
        content: message
      }

      // Add subject for email
      if (selectedChannel === 'email' && subject) {
        payload.metadata = { subject }
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Message sent successfully via ${selectedChannel}!`)
        setMessage('')
        setRecipient('')
        setSubject('')
      } else {
        setError(result.error || 'Failed to send message')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPlaceholderText = () => {
    switch (selectedChannel) {
      case 'sms': return 'Enter phone number (e.g., +1234567890)'
      case 'whatsapp': return 'Enter WhatsApp number (e.g., +1234567890)'
      case 'email': return 'Enter email address'
      default: return 'Select a channel first'
    }
  }

  const isDisabled = selectedChannel === 'all' || isLoading

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={cn(
          "flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium",
          selectedChannel !== 'all' 
            ? getChannelColor(selectedChannel)
            : "bg-gray-100 text-gray-500 border-gray-200"
        )}>
          {getChannelIcon(selectedChannel)}
          <span className="capitalize">
            {selectedChannel === 'all' ? 'Select Channel' : selectedChannel}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Recipient */}
        <div>
          <label className={cn(typography.label, "block mb-2")}>
            Recipient
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={getPlaceholderText()}
            disabled={isDisabled}
            className={cn(
              interactive.input,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Subject (Email only) */}
        {selectedChannel === 'email' && (
          <div>
            <label className={cn(typography.label, "block mb-2")}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isDisabled}
              className={cn(
                interactive.input,
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
        )}

        {/* Message */}
        <div>
          <label className={cn(typography.label, "block mb-2")}>
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            disabled={isDisabled}
            className={cn(
              interactive.input,
              "resize-none",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {selectedChannel === 'sms' && 'SMS: 160 characters per segment'}
            {selectedChannel === 'whatsapp' && 'WhatsApp: Up to 4096 characters'}
            {selectedChannel === 'email' && 'Email: No character limit'}
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={isDisabled || !recipient || !message}
            className={cn(
              interactive.button.primary,
              "flex items-center space-x-2",
              (isDisabled || !recipient || !message) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Sending...' : 'Send Message'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
