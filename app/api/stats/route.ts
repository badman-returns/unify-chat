import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalMessages,
      totalContacts,
      scheduledMessages,
      channelCounts
    ] = await Promise.all([
      prisma.message.count(),
      prisma.contact.count(),
      prisma.message.count({ where: { status: 'SCHEDULED' } }),
      prisma.message.groupBy({
        by: ['channel'],
        _count: { channel: true }
      })
    ])

    const channels = channelCounts.reduce((acc, item) => {
      acc[item.channel] = item._count.channel
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalMessages,
      totalContacts,
      scheduledMessages,
      channels
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
