"use client"

import { useWebSocket } from './useWebSocket'

interface UseEventsOptions {
  teamId?: string
  onContactCreated?: (contact: any) => void
  onContactUpdated?: (contact: any) => void
  onMessageReceived?: (message: any) => void
  onMessageSent?: (message: any) => void
  onTyping?: (data: { contactId: string; isTyping: boolean }) => void
}

export function useEvents(options: UseEventsOptions = {}) {
  const { isConnected } = useWebSocket({
    onContactCreated: options.onContactCreated,
    onContactUpdated: options.onContactUpdated,
    onMessageReceived: options.onMessageReceived,
    onMessageSent: options.onMessageSent,
    onTyping: options.onTyping,
  })

  return {
    isConnected: isConnected(),
    connectionStatus: isConnected() ? 'connected' : 'disconnected',
    connect: () => {},
    disconnect: () => {}
  }
}
