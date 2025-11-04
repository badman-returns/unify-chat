import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { recordMessageMetrics } from '@/lib/metrics-collector'
import { broadcastMessageReceived, broadcastTypingIndicator } from '@/lib/websocket-broadcast'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    let profileName = params.get('ProfileName') || ''
    const channelMetadata = params.get('ChannelMetadata')
    
    if (channelMetadata && !profileName) {
      try {
        const metadata = JSON.parse(channelMetadata)
        profileName = metadata.data?.context?.ProfileName || ''
      } catch (e) {
      }
    }
    
    const inboundMessage = {
      from: params.get('From'),
      to: params.get('To'),
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
      channel: 'SMS',
      teamId
    })

    broadcastTypingIndicator(contact.id, true)

    const message = await MessageService.create({
      content: inboundMessage.content!,
      channel: 'SMS',
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        messageId: inboundMessage.messageId,
        from: inboundMessage.from,
        to: inboundMessage.to,
        timestamp: inboundMessage.timestamp,
        profileName: inboundMessage.profileName
      },
      contactId: contact.id,
      userId,
      teamId
    })

    broadcastTypingIndicator(contact.id, false)

    broadcastMessageReceived({
      id: message.id,
      contactId: contact.id,
      channel: 'SMS',
      direction: 'INBOUND',
      content: message.content,
      createdAt: message.createdAt
    })

    recordMessageMetrics({
      messageId: message.id,
      channel: 'SMS',
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
