"use client"

import { useEffect, useRef, useCallback } from 'react'
import { wsManager } from '@/lib/websocket-manager'
import { wsChatManager } from '@/lib/websocket-chat-manager'

interface UseWebSocketOptions {
  onContactCreated?: (contact: any) => void
  onContactUpdated?: (contact: any) => void
  onMessageReceived?: (message: any) => void
  onMessageSent?: (message: any) => void
  onPresenceUpdate?: (presence: any) => void
  onContentUpdate?: (data: any) => void
  onTyping?: (data: { contactId: string; isTyping: boolean }) => void
  channel?: 'collab' | 'chat'
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const channel = options.channel || 'chat'

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    if (channel === 'collab') {
      wsManager.connect()
      
      if (optionsRef.current.onContentUpdate) {
        unsubscribers.push(
          wsManager.on('content-update', (data) => optionsRef.current.onContentUpdate?.(data))
        )
        unsubscribers.push(
          wsManager.on('request-sync', (data) => optionsRef.current.onContentUpdate?.(data))
        )
        unsubscribers.push(
          wsManager.on('sync-response', (data) => optionsRef.current.onContentUpdate?.(data))
        )
      }
    } else {
      wsChatManager.connect()
      
      if (optionsRef.current.onContactCreated) {
        unsubscribers.push(
          wsChatManager.on('contactCreated', (data) => optionsRef.current.onContactCreated?.(data))
        )
      }

      if (optionsRef.current.onContactUpdated) {
        unsubscribers.push(
          wsChatManager.on('contactUpdated', (data) => optionsRef.current.onContactUpdated?.(data))
        )
      }

      if (optionsRef.current.onMessageReceived) {
        unsubscribers.push(
          wsChatManager.on('messageReceived', (data) => optionsRef.current.onMessageReceived?.(data))
        )
      }

      if (optionsRef.current.onMessageSent) {
        unsubscribers.push(
          wsChatManager.on('message_sent', (data) => optionsRef.current.onMessageSent?.(data))
        )
      }

      if (optionsRef.current.onPresenceUpdate) {
        unsubscribers.push(
          wsChatManager.on('presence-update', (data) => optionsRef.current.onPresenceUpdate?.(data))
        )
      }

      if (optionsRef.current.onTyping) {
        unsubscribers.push(
          wsChatManager.on('typing', (data) => optionsRef.current.onTyping?.(data))
        )
      }
    }

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [channel])

  const send = useCallback((message: any) => {
    if (channel === 'collab') {
      wsManager.send(message)
    } else {
      wsChatManager.send(message)
    }
  }, [channel])

  const isConnected = useCallback(() => {
    if (channel === 'collab') {
      return wsManager.isConnected()
    } else {
      return wsChatManager.isConnected()
    }
  }, [channel])

  return { send, isConnected }
}
