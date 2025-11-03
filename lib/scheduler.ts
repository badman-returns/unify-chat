import { MessageService } from './db/message'
import { IntegrationFactory } from './integrations'
import { broadcastToSSE } from './sse'

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

class MessageScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('Message scheduler started')
    
    // Check for scheduled messages every minute
    this.schedulePeriodicCheck()
  }

  stop() {
    this.isRunning = false
    this.intervals.forEach(interval => clearTimeout(interval))
    this.intervals.clear()
    console.log('Message scheduler stopped')
  }

  private schedulePeriodicCheck() {
    if (!this.isRunning) return

    const checkInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(checkInterval)
        return
      }
      
      await this.processScheduledMessages()
    }, 60000) // Check every minute

    // Also check immediately
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
    // Create scheduled message in database
    const message = await MessageService.create({
      ...data,
      direction: 'OUTBOUND',
      status: 'PENDING'
    })

    console.log(`Message scheduled for ${data.scheduledAt}: ${message.id}`)
    
    // If scheduled for very soon (within 2 minutes), set a specific timeout
    const now = new Date()
    const timeDiff = data.scheduledAt.getTime() - now.getTime()
    
    if (timeDiff > 0 && timeDiff <= 2 * 60 * 1000) {
      const timeout = setTimeout(() => {
        this.sendScheduledMessage(message.id)
        this.intervals.delete(message.id)
      }, timeDiff)
      
      this.intervals.set(message.id, timeout)
    }

    return message.id
  }

  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    try {
      // Clear any pending timeout
      const timeout = this.intervals.get(messageId)
      if (timeout) {
        clearTimeout(timeout)
        this.intervals.delete(messageId)
      }

      // Update message status to failed/cancelled
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
      // Get messages scheduled for now or earlier that are still pending
      const now = new Date()
      const scheduledMessages = await this.getScheduledMessages(now)
      
      console.log(`Processing ${scheduledMessages.length} scheduled messages`)
      
      for (const message of scheduledMessages) {
        await this.sendScheduledMessage(message.id)
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error)
    }
  }

  private async getScheduledMessages(beforeDate: Date) {
    try {
      // Query database for scheduled messages
      const { prisma } = await import('./db')
      return await prisma.message.findMany({
        where: {
          scheduledAt: {
            lte: beforeDate
          },
          status: 'PENDING'
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
    try {
      // Get message details from database
      const { prisma } = await import('./db')
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { contact: true }
      })

      if (!message || message.status !== 'PENDING') {
        return
      }

      // Send message through appropriate channel
      const integration = IntegrationFactory.getIntegration(message.channel)
      
      const result = await integration.sendMessage({
        channel: message.channel.toLowerCase() as any,
        to: message.contact.phone || message.contact.email || '',
        content: message.content,
        metadata: message.metadata
      })

      // Update message status
      const newStatus = result.success ? 'SENT' : 'FAILED'
      await MessageService.updateStatus(messageId, newStatus)

      // Broadcast SSE event
      broadcastToSSE({
        type: 'message_sent',
        data: {
          ...message,
          status: newStatus,
          sentAt: new Date()
        }
      })

      console.log(`Scheduled message sent: ${messageId} (${newStatus})`)
    } catch (error) {
      console.error(`Failed to send scheduled message ${messageId}:`, error)
      
      // Mark as failed
      try {
        await MessageService.updateStatus(messageId, 'FAILED')
      } catch (updateError) {
        console.error('Failed to update message status:', updateError)
      }
    }
  }

  // Get all scheduled messages for a user/team
  async getUserScheduledMessages(filters: {
    userId?: string
    teamId?: string
    contactId?: string
  }) {
    try {
      const { prisma } = await import('./db')
      return await prisma.message.findMany({
        where: {
          ...filters,
          scheduledAt: {
            gt: new Date()
          },
          status: 'PENDING'
        },
        include: {
          contact: true
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      })
    } catch (error) {
      console.error('Error fetching user scheduled messages:', error)
      return []
    }
  }
}

// Singleton instance
export const messageScheduler = new MessageScheduler()

// Auto-start scheduler in production
if (process.env.NODE_ENV === 'production') {
  messageScheduler.start()
}
