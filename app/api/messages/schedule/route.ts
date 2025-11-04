import { NextRequest, NextResponse } from 'next/server'
import { messageScheduler } from '@/lib/scheduler'

messageScheduler.start()

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { content, channel, to, contactId, scheduledAt, metadata } = data
    
    if (!content || !channel || !to || !contactId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    const messageId = await messageScheduler.scheduleMessage({
      content,
      channel: channel.toUpperCase(),
      to,
      contactId,
      userId: 'system-user-id',
      teamId: 'default-team-id',
      scheduledAt: scheduledDate,
      metadata
    })

    return NextResponse.json({
      success: true,
      messageId,
      scheduledAt: scheduledDate
    })
  } catch (error) {
    console.error('Schedule message error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const userId = searchParams.get('userId')
    const teamId = searchParams.get('teamId') || 'default-team-id'

    const filters: any = { teamId }
    if (contactId) filters.contactId = contactId
    if (userId) filters.userId = userId

    const scheduledMessages = await messageScheduler.getUserScheduledMessages(filters)

    return NextResponse.json({
      success: true,
      messages: scheduledMessages
    })
  } catch (error) {
    console.error('Get scheduled messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduled messages' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const success = await messageScheduler.cancelScheduledMessage(messageId)

    return NextResponse.json({
      success,
      message: success ? 'Message cancelled' : 'Failed to cancel message'
    })
  } catch (error) {
    console.error('Cancel scheduled message error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel scheduled message' },
      { status: 500 }
    )
  }
}
