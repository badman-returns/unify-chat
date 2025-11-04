import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactDeduplication } from '@/lib/contact-deduplication'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { sourceId, targetId } = body

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'Source and target IDs required' },
        { status: 400 }
      )
    }

    const teamId = session.user.teamId || 'default'
    
    await contactDeduplication.mergeDuplicates(sourceId, targetId, teamId)

    return NextResponse.json({
      success: true,
      message: 'Contacts merged successfully'
    })

  } catch (error: any) {
    console.error('Error merging contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
