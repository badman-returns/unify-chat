"use client"

import { Clock, X } from 'lucide-react'
import { cn, formatMessageTime } from '@/lib/utils'
import { useScheduledMessages } from '@/hooks/useScheduledMessages'

interface ScheduledMessagesProps {
  userId?: string
}

export function ScheduledMessages({ userId }: ScheduledMessagesProps) {
  const {
    messages,
    loading,
    cancelScheduledMessage,
    getChannelColor
  } = useScheduledMessages(userId)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No scheduled messages</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Scheduled Messages ({messages.length})
        </h3>
      </div>

      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    getChannelColor(message.channel)
                  )}>
                    {message.channel.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {message.contactName || message.to || 'Unknown recipient'}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {message.content}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(message.scheduledAt) > new Date() 
                    ? `Sending in ${Math.round((new Date(message.scheduledAt).getTime() - Date.now()) / 60000)} minutes`
                    : 'Sending now...'
                  }
                  <span className="mx-2">•</span>
                  {new Date(message.scheduledAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
              <button
                onClick={() => cancelScheduledMessage(message.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors ml-4"
                title="Cancel scheduled message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
