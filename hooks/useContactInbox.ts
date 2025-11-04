"use client"

import { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils'
import { useContacts } from './useContacts'
import { useMessaging } from './useMessaging'

/**
 * Main hook for managing the unified inbox interface
 * Handles contact selection, message conversations, and real-time updates
 * Integrates contact management with messaging functionality
 * 
 * @param selectedChannel - Filter contacts by channel (sms, whatsapp, email, or all)
 * @returns Inbox state and actions for UI rendering
 * 
 * @example
 * ```tsx
 * const {
 *   filteredContacts,
 *   selectedContact,
 *   conversation,
 *   handleSendMessage
 * } = useContactInbox('all')
 * ```
 */
export function useContactInbox(selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all') {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  const contactRepo = useContacts()
  const messagingRepo = useMessaging()
  
  const filteredContacts = contactRepo.findByChannel(selectedChannel)
  const selectedContact = selectedContactId ? contactRepo.findById(selectedContactId) : null
  const conversation = selectedContactId ? messagingRepo.getConversation(selectedContactId) : []
  const canLoadMore = messagingRepo.hasMore
  const isLoadingMore = messagingRepo.isFetchingMore
  const isContactTyping = selectedContactId ? messagingRepo.typingContacts?.has(selectedContactId) : false

  const handleContactSelect = async (contactId: string) => {
    setSelectedContactId(contactId)
  }

  useEffect(() => {
    if (selectedContactId) {
      messagingRepo.loadConversation(selectedContactId)
    }
  }, [selectedContactId, messagingRepo])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return

    const contentToSend = messageText
    
    setIsSending(true)
    setMessageText('')
    
    try {
      await messagingRepo.sendMessage({
        content: contentToSend,
        channel: (selectedContact.lastMessage?.channel?.toLowerCase() as any) || 'sms',
        to: selectedContact.phone || selectedContact.email || '',
        metadata: {
          contactId: selectedContact.id,
          contactName: selectedContact.name
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessageText(contentToSend)
    } finally {
      setIsSending(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return '📱'
      case 'whatsapp': return '💬'
      case 'email': return '📧'
      default: return '📋'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✓'
      case 'delivered': return '✓✓'
      case 'read': return '✓✓'
      case 'failed': return '✗'
      default: return '○'
    }
  }


  return {
    selectedContactId,
    messageText,
    setMessageText,
    
    filteredContacts,
    selectedContact,
    conversation,
    canLoadMore,
    isLoadingMore,
    isContactTyping,
    isSending,
    
    contactsLoading: contactRepo.loading,
    contactsError: contactRepo.error,
    messagingLoading: messagingRepo.loading,
    messagingError: messagingRepo.error,
    isConnected: contactRepo.isConnected,
    connectionStatus: contactRepo.connectionStatus,
    
    handleContactSelect,
    handleSendMessage,
    loadMoreMessages: messagingRepo.fetchNextPage,
    
    getChannelIcon,
    getStatusIcon,
    formatTime
  }
}
