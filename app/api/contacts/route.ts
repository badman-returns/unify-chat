import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ContactService } from '@/lib/db/contact'

export async function GET(request: NextRequest) {
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
    const channel = searchParams.get('channel')
    const search = searchParams.get('search')
    const teamId = 'default-team-id'

    const contacts = await ContactService.getAll(teamId, {
      channel: channel || undefined,
      search: search || undefined,
      limit: 50
    })
    
    return NextResponse.json(
      {
        contacts,
        total: contacts.length
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { name, email, phone, tags = [], notes = '' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const teamId = 'default-team-id'

    const newContact = await ContactService.create({
      name,
      email,
      phone,
      tags: Array.isArray(tags) ? tags : [],
      teamId
    })

    return NextResponse.json({
      success: true,
      contact: newContact
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
