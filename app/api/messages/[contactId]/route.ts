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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const messages = await MessageService.getByContactId(params.contactId, {
      limit: limit + 1,
      cursor
    })

    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? messagesToReturn[messagesToReturn.length - 1].id : null

    const formattedMessages = messagesToReturn.map(message => {
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
        scheduledAt: message.scheduledAt,
        attachments: message.attachments,
        metadata: message.metadata
      }
    })

    return NextResponse.json(
      {
        success: true,
        messages: formattedMessages,
        nextCursor,
        hasMore
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )

  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
