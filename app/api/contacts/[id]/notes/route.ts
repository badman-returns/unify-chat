import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const contactId = params.id

    const note = await prisma.note.findFirst({
      where: {
        contactId,
        userId: user.id,
        isPrivate: false
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      notes: note?.content || ''
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const contactId = params.id
    const { notes } = await request.json()

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { teamId: true }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const existingNote = await prisma.note.findFirst({
      where: {
        contactId,
        userId: user.id,
        isPrivate: false
      }
    })

    let note
    if (existingNote) {
      note = await prisma.note.update({
        where: { id: existingNote.id },
        data: { content: notes }
      })
    } else {
      note = await prisma.note.create({
        data: {
          content: notes,
          contactId,
          userId: user.id,
          teamId: contact.teamId,
          isPrivate: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      notes: note.content
    })
  } catch (error) {
    console.error('Error saving notes:', error)
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    )
  }
}
