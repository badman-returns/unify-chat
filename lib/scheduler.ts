import { MessageService } from './db/message'
import { createIntegrationManager } from './integrations'
import { broadcastMessageReceived } from './websocket-broadcast'

export interface ScheduledMessage {
  id: string
  content: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  to: string
  contactId: string
  userId: string
  teamId: string
  scheduledAt: Date
  metadata?: any
}

interface QueuedMessage {
  id: string
  scheduledAt: Date
  timeout?: NodeJS.Timeout
}

class MessageScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private messageQueue: Map<string, QueuedMessage> = new Map()
  private isRunning = false
  private processingInterval?: NodeJS.Timeout

  start() {
    if (this.isRunning) {
      console.log('[SCHEDULER] Already running')
      return
    }
    
    this.isRunning = true
    console.log('[SCHEDULER] Starting message scheduler...')
    
    this.loadScheduledMessages()
    this.schedulePeriodicCheck()
    
    console.log('[SCHEDULER] Message scheduler started successfully')
  }

  stop() {
    this.isRunning = false
    
    this.intervals.forEach(interval => clearTimeout(interval))
    this.intervals.clear()
    
    this.messageQueue.forEach(msg => {
      if (msg.timeout) clearTimeout(msg.timeout)
    })
    this.messageQueue.clear()
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
    
    console.log('Message scheduler stopped')
  }

  private async loadScheduledMessages() {
    try {
      const now = new Date()
      const futureMessages = await this.getScheduledMessages(new Date(now.getTime() + 24 * 60 * 60 * 1000))
      
      console.log(`Loading ${futureMessages.length} scheduled messages into queue`)
      
      for (const message of futureMessages) {
        this.addToQueue(message.id, message.scheduledAt || message.createdAt)
      }
      
      await this.processScheduledMessages()
    } catch (error) {
      console.error('Error loading scheduled messages:', error)
    }
  }

  private addToQueue(messageId: string, scheduledAt: Date) {
    if (this.messageQueue.has(messageId)) return
    
    const now = new Date()
    const timeDiff = scheduledAt.getTime() - now.getTime()
    
    if (timeDiff <= 0) {
      console.log(`Message ${messageId} is overdue, sending immediately`)
      this.sendScheduledMessage(messageId)
      return
    }
    
    const timeout = setTimeout(() => {
      this.sendScheduledMessage(messageId)
      this.messageQueue.delete(messageId)
    }, timeDiff)
    
    this.messageQueue.set(messageId, {
      id: messageId,
      scheduledAt,
      timeout
    })
    
    console.log(`Queued message ${messageId} for ${scheduledAt.toISOString()}`)
  }

  private schedulePeriodicCheck() {
    if (!this.isRunning) return

    this.processingInterval = setInterval(async () => {
      if (!this.isRunning) {
        if (this.processingInterval) clearInterval(this.processingInterval)
        return
      }
      
      await this.processScheduledMessages()
    }, 30000)

    this.processScheduledMessages()
  }

  async scheduleMessage(data: {
    content: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    to: string
    contactId: string
    userId: string
    teamId: string
    scheduledAt: Date
    metadata?: any
  }): Promise<string> {
    console.log('[SCHEDULER] Scheduling message:', {
      channel: data.channel,
      scheduledAt: data.scheduledAt,
      to: data.to
    })
    
    const message = await MessageService.create({
      content: data.content,
      channel: data.channel,
      contactId: data.contactId,
      userId: data.userId,
      teamId: data.teamId,
      metadata: data.metadata,
      direction: 'OUTBOUND',
      status: 'SCHEDULED',
      scheduledAt: data.scheduledAt
    })

    console.log(`[SCHEDULER] Message scheduled for ${data.scheduledAt}: ${message.id}`)
    console.log(`[SCHEDULER] Current time: ${new Date().toISOString()}`)
    console.log(`[SCHEDULER] Time until send: ${data.scheduledAt.getTime() - new Date().getTime()}ms`)
    
    this.addToQueue(message.id, data.scheduledAt)

    return message.id
  }

  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    try {
      const queuedMsg = this.messageQueue.get(messageId)
      if (queuedMsg?.timeout) {
        clearTimeout(queuedMsg.timeout)
        this.messageQueue.delete(messageId)
      }
      
      const timeout = this.intervals.get(messageId)
      if (timeout) {
        clearTimeout(timeout)
        this.intervals.delete(messageId)
      }

      await MessageService.updateStatus(messageId, 'FAILED')
      
      console.log(`Scheduled message cancelled: ${messageId}`)
      return true
    } catch (error) {
      console.error('Failed to cancel scheduled message:', error)
      return false
    }
  }

  private async processScheduledMessages() {
    try {
      const now = new Date()
      const overdueMessages = await this.getScheduledMessages(now)
      
      if (overdueMessages.length > 0) {
        console.log(`Processing ${overdueMessages.length} overdue scheduled messages`)
        
        for (const message of overdueMessages) {
          const queuedMsg = this.messageQueue.get(message.id)
          if (queuedMsg?.timeout) {
            clearTimeout(queuedMsg.timeout)
            this.messageQueue.delete(message.id)
          }
          
          await this.sendScheduledMessage(message.id)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error)
    }
  }

  private async getScheduledMessages(beforeDate: Date) {
    try {
      const { prisma } = await import('./db')
      return await prisma.message.findMany({
        where: {
          scheduledAt: {
            lte: beforeDate
          },
          status: 'SCHEDULED'
        },
        include: {
          contact: true
        }
      })
    } catch (error) {
      console.error('Error fetching scheduled messages:', error)
      return []
    }
  }

  private async sendScheduledMessage(messageId: string) {
    console.log(`[SCHEDULER] Sending scheduled message: ${messageId}`)
    
    try {
      const { prisma } = await import('./db')
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { contact: true }
      })

      if (!message || message.status !== 'SCHEDULED') {
        console.log(`[SCHEDULER] Message ${messageId} not found or not scheduled (status: ${message?.status})`)
        return
      }

      console.log(`[SCHEDULER] Preparing to send via ${message.channel} to ${message.contact.phone || message.contact.email}`)
      
      const integrationManager = createIntegrationManager()
      
      const result = await integrationManager.sendMessage({
        channel: message.channel.toLowerCase() as 'sms' | 'whatsapp' | 'email',
        to: message.contact.phone || message.contact.email || '',
        content: message.content,
        metadata: (message.metadata || {}) as Record<string, any>
      })

      const newStatus = result.success ? 'SENT' : 'FAILED'
      console.log(`[SCHEDULER] Message send result: ${newStatus}`, result.error || '')
      
      await MessageService.updateStatus(messageId, newStatus)

      broadcastMessageReceived({
        id: messageId,
        contactId: message.contactId,
        channel: message.channel,
        direction: 'OUTBOUND',
        content: message.content,
        createdAt: new Date()
      })

      console.log(`[SCHEDULER] Scheduled message sent: ${messageId} (${newStatus})`)
    } catch (error) {
      console.error(`Failed to send scheduled message ${messageId}:`, error)
      
      try {
        await MessageService.updateStatus(messageId, 'FAILED')
      } catch (updateError) {
        console.error('Failed to update message status:', updateError)
      }
    }
  }

  async getUserScheduledMessages(filters: {
    userId?: string
    teamId?: string
    contactId?: string
  }) {
    try {
      const { prisma } = await import('./db')
      const messages = await prisma.message.findMany({
        where: {
          ...filters,
          scheduledAt: {
            gt: new Date()
          },
          status: 'SCHEDULED'
        },
        include: {
          contact: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      })

      return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        channel: msg.channel,
        scheduledAt: msg.scheduledAt,
        to: (msg.metadata as any)?.to || msg.contact?.phone || msg.contact?.email || '',
        contactName: msg.contact?.name || (msg.metadata as any)?.contactName || null
      }))
    } catch (error) {
      console.error('Error fetching user scheduled messages:', error)
      return []
    }
  }
}

export const messageScheduler = new MessageScheduler()
messageScheduler.start()
