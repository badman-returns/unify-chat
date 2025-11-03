import { NextRequest, NextResponse } from 'next/server'
import { messageScheduler } from '@/lib/scheduler'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { messageId } = params

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const success = await messageScheduler.cancelScheduledMessage(messageId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel scheduled message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled message cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel scheduled message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
