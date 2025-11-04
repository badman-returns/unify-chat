import { NextRequest, NextResponse } from 'next/server'
import { createIntegrationManager } from '@/lib/integrations'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const integrationManager = createIntegrationManager()
    const enabledChannels = integrationManager.getEnabledChannels()
    
    const messages = await prisma.message.findMany({
      select: {
        id: true,
        channel: true,
        status: true,
        direction: true,
        metadata: true,
        createdAt: true,
        contactId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    const channelStats = new Map<string, { 
      total: number
      successful: number
      failed: number
      totalLatency: number
      latencyCount: number
      totalCost: number
    }>()
    
    messages.forEach(msg => {
      const channel = msg.channel
      if (!channelStats.has(channel)) {
        channelStats.set(channel, { total: 0, successful: 0, failed: 0, totalLatency: 0, latencyCount: 0, totalCost: 0 })
      }
      const stats = channelStats.get(channel)!
      stats.total++
      
      if (msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ') {
        stats.successful++
      } else if (msg.status === 'FAILED') {
        stats.failed++
      }
      
      if (msg.metadata && typeof msg.metadata === 'object') {
        const metadata = msg.metadata as any
        if (metadata.analytics) {
          if (metadata.analytics.latency) {
            stats.totalLatency += metadata.analytics.latency
            stats.latencyCount++
          }
          if (metadata.analytics.cost) {
            stats.totalCost += metadata.analytics.cost
          }
        }
      }
    })
    
    const contactResponseTimes = new Map<string, { inboundTime: Date | null; responses: number[] }>()
    
    messages.forEach(msg => {
      const key = msg.contactId
      if (!contactResponseTimes.has(key)) {
        contactResponseTimes.set(key, { inboundTime: null, responses: [] })
      }
      const contactData = contactResponseTimes.get(key)!
      
      if (msg.direction === 'INBOUND') {
        contactData.inboundTime = msg.createdAt
      } else if (msg.direction === 'OUTBOUND' && contactData.inboundTime) {
        const responseTime = msg.createdAt.getTime() - contactData.inboundTime.getTime()
        contactData.responses.push(responseTime)
        contactData.inboundTime = null
      }
    })
    
    const allResponseTimes = Array.from(contactResponseTimes.values())
      .flatMap(c => c.responses)
    const averageResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
      : 0

    const timeSeriesData = new Map<string, { sms: number; whatsapp: number; email: number; total: number }>()
    
    messages.forEach(msg => {
      const dateKey = msg.createdAt.toISOString().split('T')[0]
      if (!timeSeriesData.has(dateKey)) {
        timeSeriesData.set(dateKey, { sms: 0, whatsapp: 0, email: 0, total: 0 })
      }
      const dayData = timeSeriesData.get(dateKey)!
      dayData.total++
      if (msg.channel === 'SMS') dayData.sms++
      else if (msg.channel === 'WHATSAPP') dayData.whatsapp++
      else if (msg.channel === 'EMAIL') dayData.email++
    })
    
    const timeSeries = Array.from(timeSeriesData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }))
    
    const totalMessages = Array.from(channelStats.values()).reduce((sum, stats) => sum + stats.total, 0)
    const totalSuccessful = Array.from(channelStats.values()).reduce((sum, stats) => sum + stats.successful, 0)
    const overview = {
      totalMessages,
      successfulMessages: totalSuccessful,
      failedMessages: totalMessages - totalSuccessful,
      overallReliability: totalMessages > 0 ? (totalSuccessful / totalMessages) * 100 : 100,
      averageResponseTime: Math.round(averageResponseTime / 1000)
    }
    
    const channelComparison = Array.from(channelStats.entries()).map(([channel, stats]) => ({
      channel,
      totalMessages: stats.total,
      successRate: stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) + '%' : '0%',
      reliability: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      averageLatency: stats.latencyCount > 0 ? Math.round(stats.totalLatency / stats.latencyCount) : 0,
      totalCost: stats.totalCost
    }))
    
    const recommendations = generateRecommendations(channelComparison, overview)

    const smsStats = channelStats.get('SMS')
    const whatsappStats = channelStats.get('WHATSAPP')
    const emailStats = channelStats.get('EMAIL')
    
    const allChannels = [
      {
        channel: 'sms',
        name: 'SMS',
        description: 'Text messaging via Twilio',
        pricing: { 
          cost: smsStats && smsStats.total > 0 
            ? `$${(smsStats.totalCost / smsStats.total).toFixed(4)}` 
            : '$0.0075', 
          unit: 'per message' 
        },
        reliability: Math.round((channelComparison.find(c => c.channel === 'SMS')?.reliability || 99.5) * 10) / 10,
        latency: channelComparison.find(c => c.channel === 'SMS')?.averageLatency 
          ? `${channelComparison.find(c => c.channel === 'SMS')!.averageLatency}ms`
          : '1-3s',
        metrics: {
          totalMessages: smsStats?.total || 0,
          successRate: smsStats && smsStats.total > 0 ? (smsStats.successful / smsStats.total) * 100 : 0
        }
      },
      {
        channel: 'whatsapp',
        name: 'WhatsApp',
        description: 'WhatsApp Business API',
        pricing: { 
          cost: whatsappStats && whatsappStats.total > 0 
            ? `$${(whatsappStats.totalCost / whatsappStats.total).toFixed(4)}` 
            : '$0.005', 
          unit: 'per message' 
        },
        reliability: Math.round((channelComparison.find(c => c.channel === 'WHATSAPP')?.reliability || 99.8) * 10) / 10,
        latency: channelComparison.find(c => c.channel === 'WHATSAPP')?.averageLatency 
          ? `${channelComparison.find(c => c.channel === 'WHATSAPP')!.averageLatency}ms`
          : '2-5s',
        metrics: {
          totalMessages: whatsappStats?.total || 0,
          successRate: whatsappStats && whatsappStats.total > 0 ? (whatsappStats.successful / whatsappStats.total) * 100 : 0
        }
      },
      {
        channel: 'email',
        name: 'Email',
        description: 'Email via Resend API',
        pricing: { 
          cost: emailStats && emailStats.total > 0 
            ? `$${(emailStats.totalCost / emailStats.total).toFixed(6)}` 
            : '$0.0001', 
          unit: 'per email' 
        },
        reliability: Math.round((channelComparison.find(c => c.channel === 'EMAIL')?.reliability || 98.0) * 10) / 10,
        latency: channelComparison.find(c => c.channel === 'EMAIL')?.averageLatency 
          ? `${channelComparison.find(c => c.channel === 'EMAIL')!.averageLatency}ms`
          : '5-30s',
        metrics: {
          totalMessages: emailStats?.total || 0,
          successRate: emailStats && emailStats.total > 0 ? (emailStats.successful / emailStats.total) * 100 : 0
        }
      }
    ]
    
    const channelDetails = allChannels
      .filter(ch => enabledChannels.map(e => e.toLowerCase()).includes(ch.channel))
      .map(ch => ({ ...ch, enabled: true }))

    const formattedRecommendations = recommendations.map(rec => {
      let type = 'general'
      let title = rec
      
      if (rec.includes('cost') || rec.includes('email')) {
        type = 'cost_optimization'
        title = 'Cost Optimization'
      } else if (rec.includes('reliability')) {
        type = 'reliability'
        title = 'Reliability Improvement'
      } else if (rec.includes('latency') || rec.includes('performance')) {
        type = 'performance'
        title = 'Performance Optimization'
      }
      
      return {
        type,
        title,
        description: rec
      }
    })

    const analysis = {
      summary: {
        totalChannels: channelDetails.length,
        totalMessages: overview.totalMessages,
        averageSuccessRate: overview.totalMessages > 0 ? Math.round(overview.overallReliability) : 100,
        averageResponseTime: overview.averageResponseTime
      },
      channels: channelDetails,
      recommendations: formattedRecommendations,
      overview,
      channelComparison,
      timeSeries
    }

    return NextResponse.json(analysis)

  } catch (error: any) {
    console.error('Error generating integration analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateRecommendations(channels: any[], overview: any): string[] {
  const recommendations: string[] = []

  const emailChannel = channels.find(c => c.channel === 'EMAIL')
  const smsChannel = channels.find(c => c.channel === 'SMS')
  const whatsappChannel = channels.find(c => c.channel === 'WHATSAPP')

  if (emailChannel && smsChannel && emailChannel.totalMessages < smsChannel.totalMessages) {
    recommendations.push('Consider using email for non-urgent communications to reduce costs')
  }

  if (whatsappChannel && smsChannel && whatsappChannel.reliability > smsChannel.reliability) {
    recommendations.push('WhatsApp shows higher reliability than SMS for your use case')
  }

  if (overview.overallReliability < 95) {
    recommendations.push('Overall reliability is below 95% - consider reviewing failed message patterns')
  }

  const activeChannels = channels.filter(c => c.totalMessages > 0)
  if (activeChannels.length < 2) {
    recommendations.push('Consider diversifying communication channels for better reach')
  }

  if (overview.totalMessages === 0) {
    recommendations.push('Start sending messages to see analytics and performance metrics')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your integration setup is performing well across all metrics')
  }

  return recommendations
}
