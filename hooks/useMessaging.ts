"use client"

import { useState, useCallback, useEffect } from 'react'
import { safeParseDate } from '@/lib/utils'
import { messageApi, SendMessageRequest, SendMessageResponse, ApiError } from '@/lib/api-client'
import { useEvents } from './useEvents'
import { useMessagesQuery, useSendMessageMutation } from './queries/useMessagesQuery'
import { useQueryClient } from '@tanstack/react-query'
import { getMessagesQueryKey } from './queries/useMessagesQuery'

/**
 * Represents a message in the messaging system
 * 
 * @typedef {Object} Message
 * @property {string} id Unique message ID
 * @property {string} contactId Contact ID associated with the message
 * @property {'sms' | 'whatsapp' | 'email'} channel Channel used for the message
 * @property {'inbound' | 'outbound'} direction Direction of the message
 * @property {string} from Sender's phone number or email
 * @property {string} to Recipient's phone number or email
 * @property {string} content Message content
 * @property {'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled'} status Message status
 * @property {Date} timestamp Timestamp of the message
 * @property {Date} [scheduledAt] Scheduled timestamp of the message
 * @property {string[]} [attachments] Attachments associated with the message
 * @property {Record<string, any>} [metadata] Additional metadata for the message
 */
export interface Message {
  id: string
  contactId: string
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled'
  timestamp: Date
  scheduledAt?: Date
  attachments?: string[]
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

export function useMessaging(): MessagingRepository & { fetchNextPage?: () => void; hasMore?: boolean; isFetchingMore?: boolean; typingContacts?: Set<string> } {
  const [currentContactId, setCurrentContactId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [typingContacts, setTypingContacts] = useState<Set<string>>(new Set())
  
  const queryClient = useQueryClient()
  const { 
    data: queryData, 
    isLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessagesQuery(currentContactId || '')
  const sendMessageMutation = useSendMessageMutation()

  const messages: Message[] = (queryData?.pages || []).flatMap(page => 
    (page?.messages || []).map((msg: any) => {
      if (!msg.id) {
        console.error('⚠️ Message with no ID found:', msg)
      }
      return {
        id: msg.id,
        contactId: msg.contactId,
        channel: (msg.channel || 'sms').toLowerCase() as 'sms' | 'whatsapp' | 'email',
        direction: (msg.direction || 'inbound').toLowerCase() as 'inbound' | 'outbound',
        from: msg.from || 'unknown',
        to: msg.to || 'unknown',
        content: msg.content || '',
        status: (msg.status || 'delivered').toLowerCase() as 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled',
        timestamp: safeParseDate(msg.createdAt || msg.timestamp),
        scheduledAt: msg.scheduledAt ? safeParseDate(msg.scheduledAt) : undefined,
        attachments: msg.attachments || [],
        metadata: msg.metadata
      }
    }).filter(msg => msg.id)
  ).reverse()

  const handleMessageReceived = useCallback((message: any) => {
    if (!message.contactId) return
    
    const messageId = message.id || message.messageId
    if (!messageId) {
      console.error('⚠️ WebSocket message without ID:', message)
      return
    }
    
    const normalizedMessage = {
      ...message,
      id: messageId
    }
    
    queryClient.invalidateQueries({ queryKey: getMessagesQueryKey(message.contactId) })
  }, [queryClient])

  const handleMessageSent = useCallback((message: any) => {
    if (!message.contactId) return
    queryClient.invalidateQueries({ queryKey: getMessagesQueryKey(message.contactId) })
  }, [queryClient])

  const handleTyping = useCallback((data: { contactId: string; isTyping: boolean }) => {
    setTypingContacts(prev => {
      const next = new Set(prev)
      if (data.isTyping) {
        next.add(data.contactId)
      } else {
        next.delete(data.contactId)
      }
      return next
    })
  }, [])

  useEvents({
    onMessageReceived: handleMessageReceived,
    onMessageSent: handleMessageSent,
    onTyping: handleTyping
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
    clearError,
    fetchNextPage,
    hasMore: hasNextPage,
    isFetchingMore: isFetchingNextPage,
    typingContacts
  }
}
