"use client"

import { useState, useEffect } from 'react'
import { Clock, X, MessageCircle } from 'lucide-react'
import { cn, formatMessageTime } from '@/lib/utils'

interface ScheduledMessage {
  id: string
  content: string
  scheduledAt: Date
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  to: string
  contactName?: string
}

interface ScheduledMessagesProps {
  userId?: string
}

export function ScheduledMessages({ userId }: ScheduledMessagesProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScheduledMessages()
  }, [userId])

  const loadScheduledMessages = async () => {
    try {
      setLoading(true)
      // This will call your existing API endpoint
      const response = await fetch(`/api/messages/schedule${userId ? `?userId=${userId}` : ''}`)
      const data = await response.json()
      
      if (data.messages) {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          scheduledAt: new Date(msg.scheduledAt)
        })))
      }
    } catch (error) {
      console.error('Failed to load scheduled messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelScheduledMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return
    }

    try {
      const response = await fetch(`/api/messages/schedule/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to cancel message:', error)
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'WHATSAPP':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'EMAIL':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

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
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium border",
                  getChannelColor(message.channel)
                )}>
                  {message.channel}
                </span>
                <span className="text-sm text-muted-foreground">
                  to {message.contactName || message.to}
                </span>
              </div>
              <button
                onClick={() => cancelScheduledMessage(message.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title="Cancel scheduled message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-foreground mb-3 line-clamp-2">
              {message.content}
            </p>

            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Scheduled for {formatMessageTime(message.scheduledAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
