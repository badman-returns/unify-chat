"use client"

import { useState, useCallback, useEffect } from 'react'
import { safeParseDate } from '@/lib/utils'
import { messageApi, SendMessageRequest, SendMessageResponse, ApiError } from '@/lib/api-client'
import { useEvents } from './useEvents'
import { useMessagesQuery, useSendMessageMutation } from './queries/useMessagesQuery'
import { useQueryClient } from '@tanstack/react-query'
import { getMessagesQueryKey } from './queries/useMessagesQuery'

export interface Message {
  id: string
  contactId: string
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  metadata?: Record<string, any>
}

export interface MessagingRepository {
  messages: Message[]
  loading: boolean
  error: string | null
  sendMessage: (data: SendMessageRequest) => Promise<SendMessageResponse>
  getConversation: (contactId: string) => Message[]
  loadConversation: (contactId: string) => Promise<void>
  clearError: () => void
}

export function useMessaging(): MessagingRepository {
  const [currentContactId, setCurrentContactId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const queryClient = useQueryClient()
  const { data: queryMessages, isLoading } = useMessagesQuery(currentContactId || '')
  const sendMessageMutation = useSendMessageMutation()

  // Convert React Query data to our format
  const messages: Message[] = queryMessages?.messages?.map((msg: any) => ({
    id: msg.id,
    contactId: msg.contactId,
    channel: (msg.channel || 'sms').toLowerCase() as 'sms' | 'whatsapp' | 'email',
    direction: (msg.direction || 'inbound').toLowerCase() as 'inbound' | 'outbound',
    from: msg.from || 'unknown',
    to: msg.to || 'unknown',
    content: msg.content || '',
    status: (msg.status || 'delivered').toLowerCase() as 'pending' | 'sent' | 'delivered' | 'read' | 'failed',
    timestamp: safeParseDate(msg.createdAt || msg.timestamp),
    metadata: msg.metadata
  })) || []

  // Handle real-time message updates via SSE
  const handleMessageReceived = useCallback((message: any) => {
    // Invalidate and refetch messages for the affected contact
    if (message.contactId) {
      queryClient.invalidateQueries({ 
        queryKey: getMessagesQueryKey(message.contactId) 
      })
    }
  }, [queryClient])

  const handleMessageSent = useCallback((message: any) => {
    // Invalidate and refetch messages for the affected contact
    if (message.contactId) {
      queryClient.invalidateQueries({ 
        queryKey: getMessagesQueryKey(message.contactId) 
      })
    }
  }, [queryClient])

  useEvents({
    onMessageReceived: handleMessageReceived,
    onMessageSent: handleMessageSent
  })

  const sendMessage = async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      const result = await sendMessageMutation.mutateAsync(data)
      return result
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to send message'
      setError(errorMessage)
      throw error
    }
  }

  const loadConversation = async (contactId: string): Promise<void> => {
    setCurrentContactId(contactId)
    setError(null)
  }

  const getConversation = (contactId: string): Message[] => {
    // Always return messages if we have data for this contact
    // React Query will handle the data fetching automatically
    if (currentContactId === contactId) {
      return messages
    }
    return []
  }

  const clearError = () => setError(null)

  return {
    messages,
    loading: isLoading || sendMessageMutation.isPending,
    error: error || (sendMessageMutation.error?.message) || null,
    sendMessage,
    getConversation,
    loadConversation,
    clearError
  }
}
