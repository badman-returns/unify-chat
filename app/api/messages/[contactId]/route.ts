import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { MessageService } from '@/lib/db/message'

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const messages = await MessageService.getByContactId(params.contactId)

    const formattedMessages = messages.map(message => {
      const metadata = message.metadata as any || {}
      return {
        id: message.id,
        contactId: message.contactId,
        channel: message.channel.toLowerCase(),
        direction: message.direction.toLowerCase(),
        from: message.direction === 'INBOUND' ? metadata.from || 'contact' : 'system',
        to: message.direction === 'OUTBOUND' ? metadata.to || 'contact' : 'system',
        content: message.content,
        status: message.status.toLowerCase(),
        timestamp: message.createdAt,
        metadata: message.metadata
      }
    })

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })

  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
