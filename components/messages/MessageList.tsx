"use client"

import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { useMessaging } from '@/hooks/useMessaging'

interface Message {
  id: string
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
}

interface MessageListProps {
  selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all'
  getChannelIcon: (channel: string) => React.ReactNode
  getChannelColor: (channel: string) => string
}

export function MessageList({
  selectedChannel,
  getChannelIcon,
  getChannelColor
}: MessageListProps) {
  const { messages } = useMessaging()

  const filteredMessages = selectedChannel === 'all' 
    ? messages 
    : messages.filter(msg => msg.channel === selectedChannel)

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-blue-500" />
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'read':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />
    }
  }


  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-base font-medium">
          Messages {selectedChannel !== 'all' && `(${selectedChannel.toUpperCase()})`}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divide-y divide-border">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground mb-2">
              {getChannelIcon(selectedChannel)}
            </div>
            <p className="text-sm text-muted-foreground">
              No messages found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedChannel === 'all' 
                ? 'Send your first message using the composer above'
                : `No ${selectedChannel} messages yet`
              }
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium",
                    getChannelColor(message.channel)
                  )}>
                    {getChannelIcon(message.channel)}
                    <span className="capitalize">{message.channel}</span>
                  </div>
                  
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    message.direction === 'inbound'
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  )}>
                    {message.direction === 'inbound' ? 'Received' : 'Sent'}
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {getStatusIcon(message.status)}
                  <span className="capitalize">{message.status}</span>
                  <span>•</span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">From:</span> {message.from}
                  <span className="mx-2">•</span>
                  <span className="font-medium">To:</span> {message.to}
                </div>
              </div>

              <div className="text-sm text-foreground">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
