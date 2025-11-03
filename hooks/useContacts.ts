"use client"

import { useState, useEffect, useCallback } from 'react'
import { safeParseDate } from '@/lib/utils'
import { contactsApi, messageApi, ApiError } from '@/lib/api-client'
import { useEvents } from './useEvents'
import { useContactsQuery, useMarkAsReadMutation, CONTACTS_QUERY_KEY } from './queries/useContactsQuery'
import { useQueryClient } from '@tanstack/react-query'

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface LastMessage {
  content: string
  timestamp: Date
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
}

export interface ContactWithLastMessage extends Contact {
  lastMessage: LastMessage
  unreadCount: number
}

export interface ContactRepository {
  contacts: ContactWithLastMessage[]
  loading: boolean
  error: string | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  
  findAll: () => Promise<void>
  findByChannel: (channel: 'sms' | 'whatsapp' | 'email' | 'all') => ContactWithLastMessage[]
  findById: (id: string) => ContactWithLastMessage | undefined
  create: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (id: string, updates: Partial<Contact>) => Promise<void>
  delete: (id: string) => Promise<void>
  search: (query: string) => ContactWithLastMessage[]
  addTag: (contactId: string, tag: string) => Promise<void>
  removeTag: (contactId: string, tag: string) => Promise<void>
  updateNotes: (contactId: string, notes: string) => Promise<void>
  markAsRead: (contactId: string) => Promise<void>
  clearError: () => void
}


export function useContacts(): ContactRepository {
  const [error, setError] = useState<string | null>(null)
  
  // Use React Query for contacts data
  const queryClient = useQueryClient()
  const { data: queryContacts, isLoading: queryLoading, error: queryError } = useContactsQuery()
  const markAsReadMutation = useMarkAsReadMutation()

  // Use React Query data as primary source
  const contacts: ContactWithLastMessage[] = queryContacts?.contacts?.map((contact: any) => ({
    ...contact,
    createdAt: safeParseDate(contact.createdAt),
    updatedAt: safeParseDate(contact.updatedAt),
    lastMessage: contact.lastMessage ? {
      ...contact.lastMessage,
      timestamp: safeParseDate(contact.lastMessage.timestamp)
    } : null
  })) || []

  const loading = queryLoading || markAsReadMutation.isPending



  const findAll = async () => {
    // React Query handles this automatically
    setError(null)
  }

  const findByChannel = (channel: 'sms' | 'whatsapp' | 'email' | 'all') => {
    if (channel === 'all') return contacts
    return contacts.filter(contact => contact.lastMessage.channel === channel)
  }

  const findById = (id: string) => {
    return contacts.find(contact => contact.id === id)
  }

  const create = async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      // React Query mutations handle this
      await contactsApi.create(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact')
    }
  }

  const update = async (id: string, updates: Partial<Contact>) => {
    try {
      setError(null)
      // React Query mutations handle this
      await contactsApi.update(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact')
    }
  }

  const deleteContact = async (id: string) => {
    try {
      setError(null)
      // React Query mutations handle this
      await contactsApi.delete(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
    }
  }

  const search = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.email?.toLowerCase().includes(lowercaseQuery) ||
      contact.phone?.includes(query) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  const addTag = async (contactId: string, tag: string) => {
    try {
      setError(null)
      const contact = contacts.find(c => c.id === contactId)
      if (contact) {
        await contactsApi.update(contactId, {
          tags: [...contact.tags, tag]
        })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to add tag')
      }
    }
  }

  const removeTag = async (contactId: string, tag: string) => {
    try {
      setError(null)
      const contact = contacts.find(c => c.id === contactId)
      if (contact) {
        await contactsApi.update(contactId, {
          tags: contact.tags.filter(t => t !== tag)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tag')
    }
  }

  const updateNotes = async (contactId: string, notes: string) => {
    try {
      setError(null)
      await contactsApi.update(contactId, { notes })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes')
    }
  }

  const markAsRead = async (contactId: string) => {
    try {
      setError(null)
      await markAsReadMutation.mutateAsync(contactId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }

  const clearError = () => setError(null)

  // SSE handlers for real-time updates
  const handleContactCreated = useCallback((contact: any) => {
    // Invalidate contacts query to trigger refetch
    queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
  }, [queryClient])

  const handleMessageReceived = useCallback((message: any) => {
    // Invalidate contacts query to trigger refetch with updated unread counts
    queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
  }, [queryClient])

  const handleContactUpdated = useCallback((contact: any) => {
    // Invalidate contacts query to trigger refetch
    queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
  }, [queryClient])

  // Initialize SSE connection for real-time updates
  const { isConnected, connectionStatus } = useEvents({
    onContactCreated: handleContactCreated,
    onContactUpdated: handleContactUpdated,
    onMessageReceived: handleMessageReceived,
    onMessageSent: handleMessageReceived
  })

  useEffect(() => {
    findAll()
  }, [])

  return {
    contacts,
    loading,
    error,
    isConnected,
    connectionStatus,
    findAll,
    findByChannel,
    findById,
    create,
    update,
    delete: deleteContact,
    search,
    addTag,
    removeTag,
    updateNotes,
    markAsRead,
    clearError
  }
}
