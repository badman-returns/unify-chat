import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  lastMessage?: {
    channel: string
  }
}

export function useOptimisticMessage() {
  const queryClient = useQueryClient()

  const sendWithAttachments = useCallback(async (
    selectedContact: Contact,
    messageText: string,
    attachments: File[]
  ) => {
    const tempId = `temp-${Date.now()}`
    const now = new Date()
    const optimisticMessage = {
      id: tempId,
      content: messageText || 'Sent an attachment',
      channel: (selectedContact.lastMessage?.channel || 'sms').toUpperCase(),
      direction: 'OUTBOUND',
      status: 'PENDING',
      timestamp: now,
      createdAt: now,
      contactId: selectedContact.id,
      from: 'system',
      to: selectedContact.phone || selectedContact.email || '',
      attachments: attachments.length > 0 ? ['uploading'] : [],
      metadata: {}
    }
    
    queryClient.setQueryData(['messages', selectedContact.id], (old: any) => {
      if (!old) {
        return {
          pages: [{
            messages: [optimisticMessage],
            nextCursor: null,
            hasMore: false
          }],
          pageParams: [undefined]
        }
      }
      
      if (old.pages && Array.isArray(old.pages)) {
        const newPages = [...old.pages]
        if (newPages.length > 0) {
          const firstPage = newPages[0]
          if (firstPage.messages && Array.isArray(firstPage.messages)) {
            newPages[0] = {
              ...firstPage,
              messages: [...firstPage.messages, optimisticMessage]
            }
          } else {
            newPages[0] = {
              messages: [optimisticMessage],
              nextCursor: null,
              hasMore: false
            }
          }
        }
        return {
          ...old,
          pages: newPages
        }
      }
      
      return old
    })
    
    const formData = new FormData()
    formData.append('content', messageText || 'Sent an attachment')
    formData.append('channel', (selectedContact.lastMessage?.channel || 'sms').toLowerCase())
    formData.append('to', selectedContact.phone || selectedContact.email || '')
    formData.append('contactId', selectedContact.id)
    
    attachments.forEach((file, index) => {
      formData.append(`attachment_${index}`, file)
    })
    
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['messages', selectedContact.id] })
        return { success: true }
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      queryClient.setQueryData(['messages', selectedContact.id], (old: any) => {
        if (!old) return old
        
        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              messages: page.messages?.filter((msg: any) => msg.id !== tempId) || []
            }))
          }
        }
        
        return old
      })
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      }
    }
  }, [queryClient])

  const removeOptimisticMessage = useCallback((contactId: string, messageId: string) => {
    queryClient.setQueryData(['messages', contactId], (old: any) => {
      if (!old) return old
      
      if (old.pages && Array.isArray(old.pages)) {
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages?.filter((msg: any) => msg.id !== messageId) || []
          }))
        }
      }
      
      return old
    })
  }, [queryClient])

  return {
    sendWithAttachments,
    removeOptimisticMessage
  }
}
