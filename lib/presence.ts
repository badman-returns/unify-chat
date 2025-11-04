import { wsChatManager } from './websocket-chat-manager'

interface UserPresence {
  userId: string
  userName: string
  userEmail: string
  contactId?: string
  location: string
  cursorPosition?: { x: number; y: number }
  color: string
  lastSeen: Date
}

class PresenceManager {
  private listeners: Set<(presences: UserPresence[]) => void> = new Set()
  private presences: Map<string, UserPresence> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private currentUserId: string | null = null
  private currentPresence: Partial<UserPresence> | null = null
  private unsubscribe: (() => void) | null = null
  private connectionCount: number = 0

  connect(userId: string, userName: string, userEmail: string) {
    this.connectionCount++
    
    if (this.currentUserId === userId && this.unsubscribe) {
      return
    }
    
    this.currentUserId = userId
    
    if (this.unsubscribe) {
      this.disconnect()
    }

    this.currentPresence = { userId, userName, userEmail }
    
    wsChatManager.connect().then(() => {
      this.unsubscribe = wsChatManager.on('presence-update', (data) => {
        this.handlePresenceUpdate(data)
      })

      wsChatManager.send({
        type: 'presence-join',
        userId,
        userName,
        userEmail
      })

      this.startHeartbeat()
    })
  }

  disconnect() {
    this.connectionCount = Math.max(0, this.connectionCount - 1)
    
    if (this.connectionCount > 0) {
      return
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    if (this.currentUserId) {
      wsChatManager.send({
        type: 'presence-leave',
        userId: this.currentUserId
      })
      this.currentUserId = null
      this.currentPresence = null
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.currentPresence) {
        wsChatManager.send({
          type: 'presence-update',
          ...this.currentPresence
        })
      }
    }, 30000)
  }

  updatePresence(data: {
    userId: string
    userName: string
    userEmail: string
    contactId?: string
    location?: string
    cursorPosition?: { x: number; y: number }
  }) {
    this.currentPresence = { ...this.currentPresence, ...data }
    
    wsChatManager.send({
      type: 'presence-update',
      ...this.currentPresence
    })
  }

  private handlePresenceUpdate(data: any) {
    if (data.userId !== this.currentUserId) {
      const presence: UserPresence = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        contactId: data.contactId,
        location: data.location || '',
        cursorPosition: data.cursorPosition,
        color: data.color || this.generateColor(data.userId),
        lastSeen: new Date()
      }
      this.presences.set(presence.userId, presence)
      this.notifyListeners()
    }
  }

  subscribe(callback: (presences: UserPresence[]) => void): () => void {
    const existingListener = Array.from(this.listeners).find(l => l === callback)
    if (existingListener) {
      return () => this.listeners.delete(callback)
    }
    
    this.listeners.add(callback)
    callback(Array.from(this.presences.values()))
    
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners() {
    const presenceList = Array.from(this.presences.values())
    this.listeners.forEach(callback => callback(presenceList))
  }

  getPresences(): UserPresence[] {
    return Array.from(this.presences.values())
  }

  getPresenceForContact(contactId: string): UserPresence[] {
    return Array.from(this.presences.values()).filter(
      p => p.contactId === contactId
    )
  }

  getUserColor(userId: string): string {
    const presence = this.presences.get(userId)
    return presence?.color || this.generateColor(userId)
  }

  private generateColor(userId: string): string {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ]
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }
}

export const presenceManager = new PresenceManager()
export type { UserPresence }
