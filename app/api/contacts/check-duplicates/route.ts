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
    const { name, email, phone } = body

    if (!name && !email && !phone) {
      return NextResponse.json(
        { error: 'At least one field required' },
        { status: 400 }
      )
    }

    const teamId = session.user.teamId || 'default'
    const duplicates = await contactDeduplication.findDuplicates(
      { name, email, phone },
      teamId
    )

    return NextResponse.json({
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.map(d => ({
        contact: d.contact,
        matchScore: Math.round((1 - d.score) * 100),
        matchedFields: d.matchedFields
      }))
    })

  } catch (error: any) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
