import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { recordMessageMetrics } from '@/lib/metrics-collector'
import { broadcastMessageReceived, broadcastTypingIndicator } from '@/lib/websocket-broadcast'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const events = Array.isArray(body) ? body : [body]
    const results: any[] = []

    for (const event of events) {
      const result = await processEmailEvent(event)
      if (result) results.push(result)
    }

    return NextResponse.json({ 
      success: true,
      processed: results.length
    })
  } catch (error) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processEmailEvent(event: any) {
  const teamId = 'default-team-id'
  const userId = 'system-user-id'

  const eventType = event.type || event.event
  const eventData = event.data || event

  if (eventType === 'email.received' || eventType === 'inbound') {
    const fromEmail = eventData.from || event.from || event.email
    if (!fromEmail) return null

    const contact = await ContactService.findOrCreateFromWebhook({
      email: fromEmail,
      name: fromEmail.split('@')[0],
      channel: 'EMAIL',
      teamId
    })

    broadcastTypingIndicator(contact.id, true)

    const subject = eventData.subject || event.subject || 'No subject'
    
    const content = 
      eventData.text || 
      eventData.body || 
      event.text || 
      event.content || 
      event.body ||
      stripHtml(eventData.html || event.html) || 
      stripHtml(eventData.body_html || event.body_html) ||
      `Email: ${subject}`
    
    const message = await MessageService.create({
      content,
      channel: 'EMAIL',
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        from: fromEmail,
        to: eventData.to || event.to || process.env.RESEND_FROM_EMAIL,
        subject: eventData.subject || event.subject,
        messageId: eventData.email_id || event.sg_message_id || `email_${Date.now()}`,
        timestamp: eventData.created_at || event.timestamp,
        eventType,
        rawPayload: event
      },
      contactId: contact.id,
      userId,
      teamId
    })

    broadcastTypingIndicator(contact.id, false)

    broadcastMessageReceived({
      id: message.id,
      contactId: contact.id,
      channel: 'EMAIL',
      direction: 'INBOUND',
      content: message.content,
      createdAt: message.createdAt
    })

    recordMessageMetrics({
      messageId: message.id,
      channel: 'EMAIL',
      direction: 'inbound',
      status: 'delivered'
    })

    return { contact: contact.id, message: message.id }
  } 
  else if (['delivered', 'open', 'bounce', 'dropped', 'email.delivered', 'email.opened', 'email.bounced'].includes(eventType)) {
    const toEmail = eventData.to || event.to || eventData.email || event.email
    if (!toEmail) return null

    const contact = await ContactService.findByEmail(toEmail, teamId)
    if (!contact) return null

    const messages = await MessageService.getByContactId(contact.id)
    const recentMessage = messages
      .filter(m => m.direction === 'OUTBOUND' && m.channel === 'EMAIL')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

    if (recentMessage) {
      const newStatus = mapSendGridStatus(eventType)
      await MessageService.update(recentMessage.id, {
        status: newStatus
      })
    }

    return { contact: contact.id, event: eventType }
  }

  return null
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

function mapSendGridStatus(eventType: string): 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING' {
  switch (eventType?.toLowerCase()) {
    case 'processed':
    case 'delivered':
      return 'DELIVERED'
    case 'open':
      return 'READ'
    case 'bounce':
    case 'dropped':
    case 'blocked':
      return 'FAILED'
    case 'deferred':
      return 'PENDING'
    default:
      return 'SENT'
  }
}
