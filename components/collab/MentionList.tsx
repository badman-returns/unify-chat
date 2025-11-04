"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'

interface MentionListProps {
  items: Array<{ id: string; label: string }>
  command: (item: { id: string; label: string }) => void
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-popover border border-border rounded-lg shadow-xl overflow-hidden min-w-[200px]">
      {props.items.length > 0 ? (
        <div className="py-1 max-h-[200px] overflow-y-auto">
          {props.items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-3",
                index === selectedIndex && "bg-accent"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0",
                index === selectedIndex ? "bg-primary" : "bg-muted-foreground"
              )}>
                {item.label.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  )
})

MentionList.displayName = 'MentionList'
