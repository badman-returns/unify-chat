import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  error: string | null
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md",
      className
    )}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
