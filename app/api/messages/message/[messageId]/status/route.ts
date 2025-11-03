import { NextRequest, NextResponse } from 'next/server'
import { MessageService } from '@/lib/db/message'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { status } = await request.json()
    const { messageId } = params

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    await MessageService.updateStatus(messageId, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update message status error:', error)
    return NextResponse.json(
      { error: 'Failed to update message status' },
      { status: 500 }
    )
  }
}
