import { prisma } from './index'

/**
 * Service for managing messages across all communication channels.
 * Handles message creation, status updates, and conversation history.
 */
export class MessageService {
  /**
   * Create a new message
   * @param data - Message data
   * @param data.content - Message text content
   * @param data.channel - Communication channel (SMS, WHATSAPP, or EMAIL)
   * @param data.direction - Message direction (INBOUND or OUTBOUND)
   * @param data.status - Message status (default: DELIVERED)
   * @param data.metadata - Additional metadata (e.g., media URLs, subject)
   * @param data.contactId - Contact UUID
   * @param data.userId - User UUID who sent/received the message
   * @param data.teamId - Team UUID
   * @param data.scheduledAt - Schedule time for future delivery (optional)
   * @returns Newly created message
   */
  static async create(data: {
    content: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    direction: 'INBOUND' | 'OUTBOUND'
    status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SCHEDULED'
    attachments?: string[]
    metadata?: any
    contactId: string
    userId: string
    teamId: string
    scheduledAt?: Date
  }) {
    return await prisma.message.create({
      data: {
        content: data.content,
        channel: data.channel,
        direction: data.direction,
        status: data.status || 'DELIVERED',
        attachments: data.attachments || [],
        metadata: data.metadata,
        contactId: data.contactId,
        userId: data.userId,
        teamId: data.teamId,
        ...(data.scheduledAt && { scheduledAt: data.scheduledAt })
      }
    })
  }

  /**
   * Retrieve messages for a specific contact with pagination
   * @param contactId - Contact UUID
   * @param options - Query options
   * @param options.limit - Maximum messages to return (default: 50)
   * @param options.cursor - Cursor for pagination (message ID)
   * @returns Array of messages with contact and user details
   */
  static async getByContactId(contactId: string, options?: { limit?: number; cursor?: string | null }) {
    const limit = options?.limit || 50
    const cursor = options?.cursor

    return await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { 
        skip: 1,
        cursor: { id: cursor } 
      } : {}),
      include: {
        contact: true,
        user: true
      }
    })
  }

  /**
   * Update message delivery status
   * @param messageId - Message UUID
   * @param status - New status (PENDING, SENT, DELIVERED, READ, FAILED, SCHEDULED)
   * @returns Updated message
   */
  static async updateStatus(messageId: string, status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SCHEDULED') {
    return await prisma.message.update({
      where: { id: messageId },
      data: { status }
    })
  }

  /**
   * Update message fields
   * @param messageId - Message UUID
   * @param data - Fields to update
   * @returns Updated message
   */
  static async update(messageId: string, data: {
    content?: string
    status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SCHEDULED'
    metadata?: any
    attachments?: string[]
  }) {
    return await prisma.message.update({
      where: { id: messageId },
      data
    })
  }

  /**
   * Mark all inbound messages for a contact as read
   * @param contactId - Contact UUID
   * @returns Update count
   */
  static async markContactMessagesAsRead(contactId: string) {
    return await prisma.message.updateMany({
      where: { 
        contactId,
        direction: 'INBOUND',
        status: {
          not: 'READ'
        }
      },
      data: { status: 'READ' }
    })
  }

  /**
   * Get count of unread inbound messages for a contact
   * @param contactId - Contact UUID
   * @returns Number of unread messages
   */
  static async getUnreadCount(contactId: string) {
    return await prisma.message.count({
      where: {
        contactId,
        direction: 'INBOUND',
        status: {
          not: 'READ'
        }
      }
    })
  }
}
