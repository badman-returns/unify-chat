import { prisma } from './index'
import { TeamService } from './team'

/**
 * Service for managing customer contacts across all communication channels.
 * Handles CRUD operations, deduplication, and contact history tracking.
 */
export class ContactService {
  /**
   * Find a contact by phone number within a team
   * @param phone - Phone number in E.164 format (e.g., +1234567890)
   * @param teamId - Team identifier
   * @returns Contact with most recent message, or null if not found
   */
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

  /**
   * Find a contact by email address within a team
   * @param email - Email address
   * @param teamId - Team identifier
   * @returns Contact with most recent message, or null if not found
   */
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

  /**
   * Find a contact by unique identifier
   * @param contactId - Contact UUID
   * @returns Contact with most recent message, or null if not found
   */
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

  /**
   * Create a new contact
   * @param data - Contact information
   * @param data.name - Contact display name
   * @param data.phone - Phone number (optional)
   * @param data.email - Email address (optional)
   * @param data.tags - Array of tags for categorization
   * @param data.teamId - Team identifier (required)
   * @returns Newly created contact with most recent message
   */
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

  /**
   * Update contact information
   * @param contactId - Contact UUID
   * @param data - Fields to update
   * @returns Updated contact with most recent message
   */
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

  /**
   * Delete a contact and all associated data
   * @param contactId - Contact UUID
   * @returns Deleted contact data
   */
  static async delete(contactId: string) {
    return await prisma.contact.delete({
      where: { id: contactId }
    })
  }

  /**
   * Retrieve all contacts for a team with filtering and pagination
   * @param teamId - Team identifier
   * @param options - Query options
   * @param options.channel - Filter by communication channel
   * @param options.search - Search query for name, email, phone, or tags
   * @param options.limit - Maximum number of results (default: 50)
   * @param options.offset - Number of results to skip for pagination
   * @returns Array of contacts with message counts and recent activity
   */
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

  /**
   * Find existing contact or create new one from incoming webhook
   * Used by SMS, WhatsApp, and Email webhook handlers for auto-creating contacts
   * @param data - Contact information from webhook payload
   * @param data.phone - Phone number (for SMS/WhatsApp)
   * @param data.email - Email address (for Email)
   * @param data.name - Contact name if available
   * @param data.channel - Communication channel (SMS, WHATSAPP, or EMAIL)
   * @param data.teamId - Team identifier
   * @returns Existing or newly created contact
   */
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
      const contactName = data.name?.trim() 
        ? data.name.trim()
        : data.phone || data.email || 'Unknown Contact'

      contact = await this.create({
        name: contactName,
        phone: data.phone,
        email: data.email,
        tags: [data.channel, 'Auto-created'],
        teamId: data.teamId
      })
    } else if (data.name?.trim() && contact.name !== data.name.trim()) {
      contact = await this.update(contact.id, {
        name: data.name.trim(),
        lastContactAt: new Date()
      })
    } else {
      contact = await this.update(contact.id, {
        lastContactAt: new Date()
      })
    }

    return contact
  }
}
