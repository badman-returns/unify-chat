import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { broadcastToSSE } from '@/lib/sse'
import { recordMessageMetrics } from '@/lib/metrics-collector'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const rawFrom = params.get('From') || ''
    const rawTo = params.get('To') || ''
    const cleanFrom = rawFrom.replace('whatsapp:', '')
    const cleanTo = rawTo.replace('whatsapp:', '')
    
    let profileName = params.get('ProfileName') || ''
    const channelMetadata = params.get('ChannelMetadata')
    
    if (channelMetadata && !profileName) {
      try {
        const metadata = JSON.parse(channelMetadata)
        profileName = metadata.data?.context?.ProfileName || ''
      } catch (e) {
      }
    }
    
    const waId = params.get('WaId')
    const phoneNumber = waId ? `+${waId}` : cleanFrom
    
    const inboundMessage = {
      from: phoneNumber,
      to: cleanTo,
      content: params.get('Body'),
      messageId: params.get('MessageSid') || params.get('SmsMessageSid'),
      timestamp: new Date(),
      profileName: profileName
    }

    if (!inboundMessage.from || !inboundMessage.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const teamId = 'default-team-id'
    const userId = 'system-user-id'

    const contact = await ContactService.findOrCreateFromWebhook({
      phone: inboundMessage.from!,
      name: inboundMessage.profileName,
      channel: 'WHATSAPP',
      teamId
    })

    const message = await MessageService.create({
      content: inboundMessage.content!,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        messageId: inboundMessage.messageId,
        from: inboundMessage.from,
        to: inboundMessage.to,
        timestamp: inboundMessage.timestamp,
        profileName: inboundMessage.profileName,
        waId: waId
      },
      contactId: contact.id,
      userId,
      teamId
    })

    broadcastToSSE({
      type: 'contactUpdated',
      data: {
        ...contact,
        lastMessage: {
          content: message.content,
          timestamp: message.createdAt,
          channel: 'whatsapp',
          direction: 'inbound',
          status: 'delivered'
        }
      }
    })
    
    broadcastToSSE({
      type: 'messageReceived',
      data: {
        ...message,
        contactId: contact.id,
        createdAt: message.createdAt,
        channel: message.channel,
        direction: message.direction,
        status: message.status
      }
    })

    // Record metrics for inbound WhatsApp message
    recordMessageMetrics({
      messageId: message.id,
      channel: 'WHATSAPP',
      direction: 'inbound',
      status: 'delivered'
    })

    return NextResponse.json({ 
      success: true, 
      contact: contact.id,
      message: message.id 
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge)
  }

  return new Response('Forbidden', { status: 403 })
}
