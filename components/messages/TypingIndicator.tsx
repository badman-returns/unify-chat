"use client"

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-2 px-4 py-2", className)}>
      <div className="flex items-center space-x-1 bg-muted rounded-2xl px-4 py-3">
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div 
            className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    </div>
  )
}
