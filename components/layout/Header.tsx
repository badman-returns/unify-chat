import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { layout, interactive, typography } from '@/lib/design-tokens'

export function Header() {
  return (
    <header className={layout.header}>
      <div className={layout.container}>
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className={cn(typography.h3, "text-foreground")}>
              UnifyChat
            </span>
          </div>
          
          <nav className="flex items-center space-x-2">
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
          </nav>
        </div>
      </div>
    </header>
  )
}
