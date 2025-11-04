"use client"

type EventCallback = (data: any) => void

interface WebSocketMessage {
  type: string
  data?: any
  roomId?: string
  userId?: string
  userName?: string
  contactId?: string
  content?: string
  [key: string]: any
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private messageQueue: WebSocketMessage[] = []
  private connectionPromise: Promise<void> | null = null

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    if (this.isConnecting) {
      return Promise.resolve()
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.isConnecting = true

      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
      const wsUrl = `${protocol}//${host}/api/collab/ws`

      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          this.isConnecting = false
          this.connectionPromise = null
          
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()
            if (msg) this.send(msg)
          }
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('WebSocket message parse error:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          this.connectionPromise = null
          reject(error)
        }

        this.ws.onclose = () => {
          this.ws = null
          this.isConnecting = false
          this.connectionPromise = null
          
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
          }
          
          this.reconnectTimeout = setTimeout(() => {
            this.connect()
          }, 3000)
        }
      } catch (error) {
        this.isConnecting = false
        this.connectionPromise = null
        reject(error)
      }
    })

    return this.connectionPromise
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnecting = false
    this.connectionPromise = null
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
      this.connect().catch(() => {})
    }
  }

  on(eventType: string, callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    return () => {
      const callbacks = this.listeners.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.listeners.get(message.type)
    if (callbacks) {
      callbacks.forEach(callback => callback(message.data || message))
    }

    const allCallbacks = this.listeners.get('*')
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback(message))
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsManager = new WebSocketManager()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    wsManager.disconnect()
  })
}
