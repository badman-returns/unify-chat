"use client"

import { UserPresence } from '@/lib/presence'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface PresenceIndicatorProps {
  presences: UserPresence[]
  maxDisplay?: number
  className?: string
}

export function PresenceIndicator({ presences, maxDisplay = 3, className }: PresenceIndicatorProps) {
  if (presences.length === 0) return null

  const displayPresences = presences.slice(0, maxDisplay)
  const remainingCount = presences.length - maxDisplay

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex -space-x-2">
        {displayPresences.map((presence) => (
          <div
            key={presence.userId}
            className="relative group"
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: presence.color }}
            >
              {presence.userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-border">
              {presence.userName}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium"
            title={`${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {presences.length === 1 ? 'is viewing' : 'are viewing'}
      </span>
    </div>
  )
}

export function PresenceBadge({ presence }: { presence: UserPresence }) {
  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-full">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: presence.color }}
      />
      <span className="text-xs font-medium">{presence.userName}</span>
      <span className="text-xs text-muted-foreground">is editing</span>
    </div>
  )
}

export function PresenceList({ presences, className }: { presences: UserPresence[]; className?: string }) {
  if (presences.length === 0) {
    return (
      <div className={cn("text-center py-4", className)}>
        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No one else is viewing</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {presences.map((presence) => (
        <div
          key={presence.userId}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: presence.color }}
          >
            {presence.userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{presence.userName}</p>
            <p className="text-xs text-muted-foreground truncate">{presence.userEmail}</p>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
      ))}
    </div>
  )
}
