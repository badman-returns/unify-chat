"use client"

import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { interactive, typography } from '@/lib/design-tokens'
import { useMessageComposer } from '@/hooks/useMessageComposer'

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
  const {
    recipient,
    setRecipient,
    message,
    setMessage,
    subject,
    setSubject,
    isLoading,
    error,
    success,
    isDisabled,
    canSend,
    handleSend,
    getPlaceholderText,
    getCharacterLimit
  } = useMessageComposer(selectedChannel)

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
            {getCharacterLimit()}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              interactive.button.primary,
              "flex items-center space-x-2",
              !canSend && "opacity-50 cursor-not-allowed"
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
