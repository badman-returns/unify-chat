"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface SSEMessage {
  type: 'contactCreated' | 'contactUpdated' | 'messageReceived' | 'message_sent' | 'connected' | 'ping'
  data?: any
  timestamp?: number
  message?: string
}

interface UseSSEOptions {
  teamId?: string
  onContactCreated?: (contact: any) => void
  onContactUpdated?: (contact: any) => void
  onMessageReceived?: (message: any) => void
  onMessageSent?: (message: any) => void
}

export function useEvents(options: UseSSEOptions = {}) {
  const {
    teamId = 'default-team-id',
    onContactCreated,
    onContactUpdated,
    onMessageReceived,
    onMessageSent
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setConnectionStatus('connecting')
    const eventSource = new EventSource(`/api/events?teamId=${teamId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setConnectionStatus('connected')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data)
        switch (message.type) {
          case 'contactCreated':
            onContactCreated?.(message.data)
            break
          case 'contactUpdated':
            onContactUpdated?.(message.data)
            break
          case 'messageReceived':
            onMessageReceived?.(message.data)
            break
          case 'message_sent':
            onMessageSent?.(message.message || message.data)
            break
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setConnectionStatus('error')
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null
          connect()
        }, 5000)
      }
    }
  }, [teamId, onContactCreated, onContactUpdated, onMessageReceived, onMessageSent])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connect, isConnected])

  return { isConnected, connectionStatus, connect, disconnect }
}
