import { prisma } from './index'
import { TeamService } from './team'

export class ContactService {
  static async findByPhone(phone: string, teamId: string) {
    return await prisma.contact.findFirst({
      where: { phone, teamId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  static async findByEmail(email: string, teamId: string) {
    return await prisma.contact.findFirst({
      where: { email, teamId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  static async findById(contactId: string) {
    return await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  static async create(data: {
    name?: string
    phone?: string
    email?: string
    tags?: string[]
    teamId: string
  }) {
    return await prisma.contact.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        tags: data.tags || [],
        teamId: data.teamId,
        lastContactAt: new Date()
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  static async update(contactId: string, data: {
    name?: string
    phone?: string
    email?: string
    tags?: string[]
    lastContactAt?: Date
  }) {
    return await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  static async delete(contactId: string) {
    return await prisma.contact.delete({
      where: { id: contactId }
    })
  }


  static async getAll(teamId: string, options?: {
    channel?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    await TeamService.ensureDefault()
    
    const where: any = { teamId }

    if (options?.search) {
      const search = options.search.toLowerCase()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { tags: { hasSome: [search] } }
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          ...(options?.channel && options.channel !== 'all' ? {
            where: { channel: options.channel.toUpperCase() as any }
          } : {})
        },
        _count: {
          select: {
            messages: {
              where: {
                direction: 'INBOUND',
                status: { not: 'READ' }
              }
            }
          }
        }
      },
      orderBy: { lastContactAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0
    })

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      tags: contact.tags,
      notes: '',
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      lastMessage: contact.messages[0] ? {
        content: contact.messages[0].content,
        timestamp: contact.messages[0].createdAt,
        channel: contact.messages[0].channel.toLowerCase(),
        direction: contact.messages[0].direction.toLowerCase(),
        status: contact.messages[0].status.toLowerCase()
      } : null,
      unreadCount: contact._count.messages
    }))
  }

  static async findOrCreateFromWebhook(data: {
    phone?: string
    email?: string
    name?: string
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
    teamId: string
  }) {
    await TeamService.ensureDefault()
    
    let contact: any = null

    if (data.phone) {
      contact = await this.findByPhone(data.phone, data.teamId)
    } else if (data.email) {
      contact = await this.findByEmail(data.email, data.teamId)
    }

    if (!contact) {
      const channelEmoji = {
        SMS: '📱',
        WHATSAPP: '💬',
        EMAIL: '📧'
      }

      contact = await this.create({
        name: data.name || `${channelEmoji[data.channel]} ${data.channel} Contact ${data.phone || data.email}`,
        phone: data.phone,
        email: data.email,
        tags: [data.channel, 'Auto-created'],
        teamId: data.teamId
      })
    } else {
      contact = await this.update(contact.id, {
        lastContactAt: new Date()
      })
    }

    return contact
  }
}
