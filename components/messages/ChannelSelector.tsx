"use client"

import { Phone, Mail, MessageCircle, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'
import { useChannelSelector } from '@/hooks/useChannelSelector'

interface ChannelSelectorProps {
  selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all'
  onChannelSelect: (channel: 'sms' | 'whatsapp' | 'email' | 'all') => void
}

export function ChannelSelector({ selectedChannel, onChannelSelect }: ChannelSelectorProps) {
  const {
    channelOptions,
    loading,
    getChannelColor,
    handleChannelSelect
  } = useChannelSelector(selectedChannel, onChannelSelect)

  const renderChannelIcon = (channelId: string) => {
    switch (channelId) {
      case 'sms': return <Phone className="h-3 w-3" />
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />
      case 'email': return <Mail className="h-3 w-3" />
      default: return <MessageCircle className="h-3 w-3" />
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className={cn(typography.h4, "mb-4")}>Channels</h3>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-muted rounded-md"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {channelOptions.map((option) => {
            const isSelected = selectedChannel === option.id
            const isEnabled = option.id === 'all' || ('enabled' in option ? option.enabled : true)
            
            return (
              <button
                key={option.id}
                onClick={() => isEnabled && handleChannelSelect(option.id as any)}
                disabled={!isEnabled}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedChannel === option.id 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50",
                  !isEnabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium",
                      option.id !== 'all' 
                        ? getChannelColor(option.id)
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {renderChannelIcon(option.id)}
                      <span>{option.name}</span>
                    </div>
                    
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    
                    {option.id !== 'all' && !isEnabled && (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  {option.description}
                </p>
                
                {option.id !== 'all' && (
                    <div className="mt-2 ml-1 space-y-1">
                      {'pricing' in option && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium">{option.pricing?.cost} {option.pricing?.unit}</span>
                        </div>
                      )}
                      {'reliability' in option && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Reliability:</span>
                          <span className="font-medium">{option.reliability}%</span>
                        </div>
                      )}
                      {'latency' in option && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Latency:</span>
                          <span className="font-medium">{option.latency}</span>
                        </div>
                      )}
                      {'metrics' in option && option.metrics && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Messages:</span>
                          <span className="font-medium">{option.metrics.totalMessages}</span>
                        </div>
                      )}
                    </div>
                )}
                
                {option.id !== 'all' && !isEnabled && (
                  <div className="mt-2 ml-1">
                    <span className="text-xs text-amber-600 font-medium">
                      Not configured
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      
      {!loading && channelOptions.length <= 1 && (
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No channels configured
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your Twilio and SendGrid credentials to get started
          </p>
        </div>
      )}
    </div>
  )
}
