import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/metrics-collector'

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive metrics
    const overview = metricsCollector.getOverallMetrics()
    const channelComparison = metricsCollector.getIntegrationComparison()
    const costAnalysis = metricsCollector.getCostAnalysis()

    // Calculate cost percentages
    const totalCost = parseFloat(costAnalysis.totalCost)
    costAnalysis.costBreakdown.forEach(item => {
      const itemCost = parseFloat(item.totalCost.replace('$', ''))
      item.percentage = totalCost > 0 ? Math.round((itemCost / totalCost) * 100) : 0
    })

    // Generate recommendations based on metrics
    const recommendations = generateRecommendations(channelComparison, overview)

    const analysis = {
      overview: {
        totalChannels: overview.totalChannels,
        totalMessages: overview.totalMessages,
        averageLatency: overview.averageLatency + 'ms',
        overallReliability: Math.round(overview.overallReliability)
      },
      channelComparison,
      recommendations,
      costAnalysis: {
        totalCost: '$' + costAnalysis.totalCost,
        costPerChannel: costAnalysis.costBreakdown
      }
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

  // Cost optimization recommendations
  const emailChannel = channels.find(c => c.channel === 'email')
  const smsChannel = channels.find(c => c.channel === 'sms')
  const whatsappChannel = channels.find(c => c.channel === 'whatsapp')

  if (emailChannel && smsChannel && emailChannel.totalMessages < smsChannel.totalMessages) {
    recommendations.push('Consider using email for non-urgent communications to reduce costs')
  }

  if (whatsappChannel && smsChannel && whatsappChannel.reliability > smsChannel.reliability) {
    recommendations.push('WhatsApp shows higher reliability than SMS for your use case')
  }

  // Performance recommendations
  if (overview.overallReliability < 95) {
    recommendations.push('Overall reliability is below 95% - consider reviewing failed message patterns')
  }

  if (overview.averageLatency > 2000) {
    recommendations.push('Average latency is high - consider optimizing integration configurations')
  }

  // Usage recommendations
  const activeChannels = channels.filter(c => c.totalMessages > 0)
  if (activeChannels.length < 2) {
    recommendations.push('Consider diversifying communication channels for better reach')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your integration setup is performing well across all metrics')
  }

  return recommendations
}
