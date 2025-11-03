import { NextRequest, NextResponse } from 'next/server'
import { createIntegrationManager } from '@/lib/integrations'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create integration manager
    const integrationManager = createIntegrationManager()

    // Get all channel information
    const channels = integrationManager.getAllChannelInfo()
    const enabledChannels = integrationManager.getEnabledChannels()
    const metrics = integrationManager.getMetrics()

    return NextResponse.json({
      channels: channels.map(channel => ({
        ...channel,
        enabled: enabledChannels.includes(channel.channel),
        metrics: Array.isArray(metrics) 
          ? metrics.find(m => m.channel === channel.channel)
          : null
      })),
      summary: {
        totalChannels: channels.length,
        enabledChannels: enabledChannels.length,
        totalMessages: Array.isArray(metrics) 
          ? metrics.reduce((sum, m) => sum + m.totalMessages, 0)
          : 0
      }
    })

  } catch (error: any) {
    console.error('Error getting channel info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
