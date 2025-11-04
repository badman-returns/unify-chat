import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const teamId = user.teamId || 'default-team-id'

    const users = await prisma.user.findMany({
      where: {
        teamId
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const teamMembers = users.map(u => ({
      id: u.id,
      name: u.name || u.email?.split('@')[0] || 'User',
      email: u.email || '',
      avatar: u.image,
      role: u.role,
      joinedAt: u.createdAt
    }))

    return NextResponse.json({
      success: true,
      members: teamMembers,
      count: teamMembers.length
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
