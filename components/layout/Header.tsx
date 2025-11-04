"use client"

import Link from 'next/link'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { layout, interactive, typography } from '@/lib/design-tokens'

export function Header() {
  const { data: session, isPending } = useSession()

  return (
    <header className={layout.header}>
      <div className={layout.container}>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className={cn(typography.h3, "text-foreground")}>
              UnifyChat
            </span>
          </Link>
          
          <nav className="flex items-center space-x-2">
            {isPending ? (
              <div className="flex items-center space-x-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : session ? (
              <Link 
                href="/messages"
                className={cn(interactive.button.primary, "text-sm")}
              >
                Go to Inbox
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className={cn(interactive.button.ghost, "text-sm")}
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup"
                  className={cn(interactive.button.primary, "text-sm")}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
