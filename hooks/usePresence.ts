"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { presenceManager, UserPresence } from '@/lib/presence'
import { useSession } from '@/lib/auth-client'

export function usePresence(contactId?: string) {
  const [presences, setPresences] = useState<UserPresence[]>([])
  const { data: session } = useSession()
  const isConnectedRef = useRef(false)

  const handlePresenceUpdate = useCallback((newPresences: UserPresence[]) => {
    setPresences(newPresences)
  }, [])

  useEffect(() => {
    if (!session?.user || isConnectedRef.current) return

    const user = session.user as any
    isConnectedRef.current = true
    
    presenceManager.connect(
      user.id,
      user.name || user.email || 'User',
      user.email || ''
    )

    const unsubscribe = presenceManager.subscribe(handlePresenceUpdate)

    const handleBeforeUnload = () => {
      presenceManager.disconnect()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unsubscribe()
      presenceManager.disconnect()
      isConnectedRef.current = false
    }
  }, [session, handlePresenceUpdate])

  useEffect(() => {
    if (session?.user && contactId) {
      const user = session.user as any
      presenceManager.updatePresence({
        userId: user.id,
        userName: user.name || user.email || 'User',
        userEmail: user.email || '',
        contactId,
        location: `contact-${contactId}`
      })
    }
  }, [contactId, session])

  const updateCursor = (position: { x: number; y: number }) => {
    if (session?.user) {
      const user = session.user as any
      presenceManager.updatePresence({
        userId: user.id,
        userName: user.name || user.email || 'User',
        userEmail: user.email || '',
        contactId,
        cursorPosition: position
      })
    }
  }

  const activePresences = contactId
    ? presences.filter(p => p.contactId === contactId)
    : presences

  return {
    presences: activePresences,
    allPresences: presences,
    updateCursor,
    isCollaborating: activePresences.length > 0
  }
}
