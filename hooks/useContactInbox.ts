"use client"

import { useState, useEffect } from 'react'
import { formatTime } from '@/lib/utils'
import { useContacts } from './useContacts'
import { useMessaging } from './useMessaging'

export function useContactInbox(selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all') {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  
  const contactRepo = useContacts()
  const messagingRepo = useMessaging()
  
  const filteredContacts = contactRepo.findByChannel(selectedChannel)
  const selectedContact = selectedContactId ? contactRepo.findById(selectedContactId) : null
  const conversation = selectedContactId ? messagingRepo.getConversation(selectedContactId) : []

  const handleContactSelect = async (contactId: string) => {
    setSelectedContactId(contactId)
    // The useEffect below will handle loading the conversation
  }

  // Load conversation when selectedContactId changes
  useEffect(() => {
    if (selectedContactId) {
      messagingRepo.loadConversation(selectedContactId)
    }
  }, [selectedContactId, messagingRepo])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return

    try {
      await messagingRepo.sendMessage({
        content: messageText,
        channel: selectedContact.lastMessage?.channel as any || 'sms',
        to: selectedContact.phone || selectedContact.email || '',
        metadata: {
          contactId: selectedContact.id,
          contactName: selectedContact.name
        }
      })
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
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
    // State
    selectedContactId,
    messageText,
    setMessageText,
    
    // Data
    filteredContacts,
    selectedContact,
    conversation,
    
    // Repository states
    contactsLoading: contactRepo.loading,
    contactsError: contactRepo.error,
    messagingLoading: messagingRepo.loading,
    messagingError: messagingRepo.error,
    isConnected: contactRepo.isConnected,
    connectionStatus: contactRepo.connectionStatus,
    
    // Actions
    handleContactSelect,
    handleSendMessage,
    
    // Utilities
    getChannelIcon,
    getStatusIcon,
    formatTime
  }
}
