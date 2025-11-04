"use client"

import { useState, useEffect, useRef } from 'react'
import { usePresence } from './usePresence'
import { useTeamMembers } from './useTeamMembers'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import { useSession } from '@/lib/auth-client'

interface Message {
  id: string
  content: string
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  status: string
  timestamp: Date
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  tags?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export function useContactProfile(contact: Contact | null, messages: Message[], isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes'>('timeline')
  const [notes, setNotes] = useState('')
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const { presences } = usePresence(contact?.id)
  const { members } = useTeamMembers()
  const queryClient = useQueryClient()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const { data: session } = useSession()

  const currentUserId = (session?.user as any)?.id

  const teamMembers = members
    .filter(m => m.id !== currentUserId)
    .map(m => ({
      id: m.id,
      name: m.name,
      email: m.email
    }))

  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  const refreshMessages = () => {
    if (contact?.id) {
      fetch(`/api/messages/${contact.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages) {
            setLocalMessages(data.messages)
          }
        })
        .catch(err => console.error('Failed to refresh messages:', err))
    }
  }

  useEffect(() => {
    if (isOpen && contact?.id) {
      queryClient.invalidateQueries({ queryKey: ['messages', contact.id] })
      refreshMessages()
    }
  }, [isOpen, contact?.id])

  useWebSocket({
    onMessageReceived: (message) => {
      if (isOpen && message.contactId === contact?.id) {
        refreshMessages()
      }
    },
    onMessageSent: (message) => {
      if (isOpen && message.contactId === contact?.id) {
        refreshMessages()
      }
    }
  })

  useEffect(() => {
    if (isOpen && contact?.id && activeTab === 'notes') {
      setIsLoadingNotes(true)
      fetch(`/api/contacts/${contact.id}/notes`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotes(data.notes || '')
          }
        })
        .catch(err => console.error('Failed to load notes:', err))
        .finally(() => setIsLoadingNotes(false))
    }
  }, [isOpen, contact?.id, activeTab])

  const handleNoteUpdate = async (newNotes: string) => {
    setNotes(newNotes)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!contact?.id) return

      try {
        const response = await fetch(`/api/contacts/${contact.id}/notes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: newNotes }),
        })

        if (!response.ok) {
          console.error('Failed to save notes')
        }
      } catch (error) {
        console.error('Error saving notes:', error)
      }
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    activeTab,
    setActiveTab,
    notes,
    handleNoteUpdate,
    isLoadingNotes,
    localMessages,
    presences,
    teamMembers
  }
}
