import { NextRequest, NextResponse } from 'next/server'
import { MessageService } from '@/lib/db/message'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    await MessageService.markContactMessagesAsRead(contactId)

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
