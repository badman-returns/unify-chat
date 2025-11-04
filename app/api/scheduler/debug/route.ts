import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { messageScheduler } from '@/lib/scheduler'

export async function GET() {
  try {
    const scheduledMessages = await prisma.message.findMany({
      where: {
        status: 'SCHEDULED'
      },
      include: {
        contact: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    const overdueMessages = await prisma.message.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date()
        }
      },
      include: {
        contact: true
      }
    })

    return NextResponse.json({
      success: true,
      totalScheduled: scheduledMessages.length,
      overdueCount: overdueMessages.length,
      scheduledMessages: scheduledMessages.map(msg => ({
        id: msg.id,
        channel: msg.channel,
        to: msg.contact.phone || msg.contact.email,
        content: msg.content.substring(0, 50),
        scheduledAt: msg.scheduledAt,
        createdAt: msg.createdAt,
        isOverdue: msg.scheduledAt ? msg.scheduledAt <= new Date() : false
      })),
      overdueMessages: overdueMessages.map(msg => ({
        id: msg.id,
        channel: msg.channel,
        scheduledAt: msg.scheduledAt,
        minutesOverdue: msg.scheduledAt 
          ? Math.floor((new Date().getTime() - new Date(msg.scheduledAt).getTime()) / 60000)
          : 0
      }))
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const overdueMessages = await prisma.message.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date()
        }
      }
    })

    console.log(`Manually triggering ${overdueMessages.length} overdue messages`)

    return NextResponse.json({
      success: true,
      message: `Triggered check for ${overdueMessages.length} overdue messages`,
      messageIds: overdueMessages.map(m => m.id)
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
