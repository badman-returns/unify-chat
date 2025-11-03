import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { broadcastToSSE } from '@/lib/sse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const inboundMessage = {
      from: params.get('From'),
      to: params.get('To'),
      content: params.get('Body'),
      messageId: params.get('MessageSid'),
      timestamp: new Date()
    }

    if (!inboundMessage.from || !inboundMessage.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const teamId = 'default-team-id'
    const userId = 'system-user-id'

    const contact = await ContactService.findOrCreateFromWebhook({
      phone: inboundMessage.from!,
      channel: 'SMS',
      teamId
    })

    const message = await MessageService.create({
      content: inboundMessage.content!,
      channel: 'SMS',
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        messageId: inboundMessage.messageId,
        from: inboundMessage.from,
        to: inboundMessage.to,
        timestamp: inboundMessage.timestamp
      },
      contactId: contact.id,
      userId,
      teamId
    })

    broadcastToSSE({
      type: 'contactCreated',
      data: contact,
      timestamp: Date.now()
    })
    
    broadcastToSSE({
      type: 'messageReceived',
      data: message,
      timestamp: Date.now()
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
