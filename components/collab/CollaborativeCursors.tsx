"use client"

import { useEffect, useState, useRef } from 'react'
import { UserPresence } from '@/lib/presence'

interface CollaborativeCursorsProps {
  presences: UserPresence[]
  containerRef?: React.RefObject<HTMLElement>
}

interface CursorPosition {
  userId: string
  userName: string
  color: string
  x: number
  y: number
}

export function CollaborativeCursors({ presences, containerRef }: CollaborativeCursorsProps) {
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({})

  useEffect(() => {
    const newCursors = presences
      .filter(p => p.cursorPosition)
      .map(p => ({
        userId: p.userId,
        userName: p.userName,
        color: p.color,
        x: p.cursorPosition!.x,
        y: p.cursorPosition!.y
      }))

    newCursors.forEach(cursor => {
      if (timeoutRef.current[cursor.userId]) {
        clearTimeout(timeoutRef.current[cursor.userId])
      }

      timeoutRef.current[cursor.userId] = setTimeout(() => {
        setCursors(prev => prev.filter(c => c.userId !== cursor.userId))
      }, 5000)
    })

    setCursors(newCursors)

    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout)
    }
  }, [presences])

  if (cursors.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 3L19 12L12 14L9 21L5 3Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          
          <div
            className="absolute top-5 left-5 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  )
}

export function useCursorTracking(enabled: boolean, onCursorMove: (position: { x: number; y: number }) => void) {
  useEffect(() => {
    if (!enabled) return

    let throttleTimeout: NodeJS.Timeout | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (throttleTimeout) return

      throttleTimeout = setTimeout(() => {
        onCursorMove({ x: e.clientX, y: e.clientY })
        throttleTimeout = null
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [enabled, onCursorMove])
}
