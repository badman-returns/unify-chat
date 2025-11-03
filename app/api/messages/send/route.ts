import { NextRequest, NextResponse } from 'next/server'
import { createIntegrationManager } from '@/lib/integrations'
import { auth } from '@/lib/auth'
import { MessageService } from '@/lib/db/message'
import { ContactService } from '@/lib/db/contact'
import { broadcastToSSE } from '@/lib/sse'
import { metricsCollector } from '@/lib/metrics-collector'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { channel, to, content, from, metadata } = body
    const contactId = metadata?.contactId

    // Validate required fields
    if (!channel || !to || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, to, content' },
        { status: 400 }
      )
    }

    // Validate channel type
    if (!['sms', 'whatsapp', 'email'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be: sms, whatsapp, or email' },
        { status: 400 }
      )
    }

    // Create integration manager
    const integrationManager = createIntegrationManager()

    // Check if channel is enabled
    if (!integrationManager.isChannelEnabled(channel)) {
      return NextResponse.json(
        { error: `Channel ${channel} is not configured or enabled` },
        { status: 400 }
      )
    }

    // Send message with latency tracking
    const { result, latency } = await metricsCollector.measureLatency(
      () => integrationManager.sendMessage({
        channel,
        to,
        content,
        from,
        metadata
      }),
      channel.toUpperCase()
    )

    if (result.success) {
      // Find or create contact
      let contact
      if (contactId) {
        contact = await ContactService.findById(contactId)
      } else {
        // Try to find contact by phone/email
        const teamId = 'default-team-id'
        if (channel === 'email') {
          contact = await ContactService.findByEmail(to, teamId)
        } else {
          contact = await ContactService.findByPhone(to, teamId)
        }
        
        // Create contact if not found
        if (!contact) {
          contact = await ContactService.create({
            name: to,
            phone: channel !== 'email' ? to : undefined,
            email: channel === 'email' ? to : undefined,
            teamId
          })
        }
      }

      if (contact) {
        // Save outbound message to database
        const savedMessage = await MessageService.create({
          content,
          channel: channel.toUpperCase() as 'SMS' | 'WHATSAPP' | 'EMAIL',
          direction: 'OUTBOUND',
          status: 'SENT',
          metadata: {
            ...metadata,
            messageId: result.messageId,
            integrationResponse: result.metadata
          },
          contactId: contact.id,
          userId: session.user.id,
          teamId: contact.teamId
        })

        // Broadcast message via SSE for real-time updates
        broadcastToSSE({
          type: 'message_sent',
          message: {
            id: savedMessage.id,
            content: savedMessage.content,
            channel: savedMessage.channel.toLowerCase(),
            direction: savedMessage.direction.toLowerCase(),
            status: savedMessage.status.toLowerCase(),
            timestamp: savedMessage.createdAt,
            contactId: contact.id,
            contactName: contact.name
          }
        })
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        channel,
        to,
        metadata: result.metadata
      })
    } else {
      return NextResponse.json(
        { 
          error: result.error,
          metadata: result.metadata 
        },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
