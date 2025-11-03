import { prisma } from './index'

export class MessageService {
  static async create(data: {
    content: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    direction: 'INBOUND' | 'OUTBOUND'
    status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
    metadata?: any
    contactId: string
    userId: string
    teamId: string
  }) {
    return await prisma.message.create({
      data: {
        content: data.content,
        channel: data.channel,
        direction: data.direction,
        status: data.status || 'DELIVERED',
        metadata: data.metadata,
        contactId: data.contactId,
        userId: data.userId,
        teamId: data.teamId
      }
    })
  }

  static async getByContactId(contactId: string) {
    return await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: 'asc' },
      include: {
        contact: true,
        user: true
      }
    })
  }

  static async updateStatus(messageId: string, status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED') {
    return await prisma.message.update({
      where: { id: messageId },
      data: { status }
    })
  }

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
