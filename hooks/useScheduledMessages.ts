"use client"

import { useState, useEffect, useCallback } from 'react'

interface ScheduledMessage {
  id: string
  content: string
  scheduledAt: Date
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  to: string
  contactName?: string
}

export function useScheduledMessages(userId?: string) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadScheduledMessages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/schedule${userId ? `?userId=${userId}` : ''}`)
      const data = await response.json()
      
      if (data.messages) {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          scheduledAt: new Date(msg.scheduledAt)
        })))
      }
    } catch (error) {
      console.error('Failed to load scheduled messages:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadScheduledMessages()
  }, [loadScheduledMessages])

  const cancelScheduledMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return false
    }

    try {
      const response = await fetch(`/api/messages/schedule/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to cancel message:', error)
      return false
    }
  }, [])

  const getChannelColor = useCallback((channel: string) => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'WHATSAPP':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'EMAIL':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }, [])

  return {
    messages,
    loading,
    cancelScheduledMessage,
    getChannelColor,
    loadScheduledMessages
  }
}
