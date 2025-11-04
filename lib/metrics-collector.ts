interface ChannelMetrics {
  channel: string
  totalMessages: number
  successfulMessages: number
  failedMessages: number
  averageLatency: number
  totalCost: number
  costPerMessage: number
  reliability: number
  lastUpdated: Date
}

interface MessageEvent {
  messageId: string
  channel: string
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  timestamp: Date
  latency?: number
  cost?: number
  error?: string
}

class MetricsCollector {
  private metrics: Map<string, ChannelMetrics> = new Map()
  private events: MessageEvent[] = []
  private maxEvents = 10000

  private readonly channelCosts = {
    SMS: 0.0075,
    WHATSAPP: 0.005,
    EMAIL: 0.0001,
  }

  constructor() {
    this.initializeMetrics()
  }

  private initializeMetrics() {
    const channels = ['SMS', 'WHATSAPP', 'EMAIL']
    
    channels.forEach(channel => {
      this.metrics.set(channel, {
        channel,
        totalMessages: 0,
        successfulMessages: 0,
        failedMessages: 0,
        averageLatency: 0,
        totalCost: 0,
        costPerMessage: this.channelCosts[channel as keyof typeof this.channelCosts],
        reliability: 100,
        lastUpdated: new Date()
      })
    })
  }

  recordMessageEvent(event: MessageEvent) {
    this.events.push(event)
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    this.updateChannelMetrics(event)
  }

  private updateChannelMetrics(event: MessageEvent) {
    const channelKey = event.channel.toUpperCase()
    const metrics = this.metrics.get(channelKey)
    
    if (!metrics) return

    metrics.totalMessages++
    
    if (event.status === 'sent' || event.status === 'delivered') {
      metrics.successfulMessages++
    } else if (event.status === 'failed') {
      metrics.failedMessages++
    }

    const messageCost = event.cost || metrics.costPerMessage
    metrics.totalCost += messageCost

    if (event.latency) {
      const totalLatency = metrics.averageLatency * (metrics.totalMessages - 1)
      metrics.averageLatency = (totalLatency + event.latency) / metrics.totalMessages
    }

    metrics.reliability = (metrics.successfulMessages / metrics.totalMessages) * 100

    metrics.lastUpdated = new Date()
    this.metrics.set(channelKey, metrics)
  }

  getChannelMetrics(channel?: string): ChannelMetrics | ChannelMetrics[] {
    if (channel) {
      return this.metrics.get(channel.toUpperCase()) || this.createEmptyMetrics(channel)
    }
    
    return Array.from(this.metrics.values())
  }

  private createEmptyMetrics(channel: string): ChannelMetrics {
    return {
      channel: channel.toUpperCase(),
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageLatency: 0,
      totalCost: 0,
      costPerMessage: this.channelCosts[channel.toUpperCase() as keyof typeof this.channelCosts] || 0,
      reliability: 100,
      lastUpdated: new Date()
    }
  }

  getOverallMetrics() {
    const allMetrics = Array.from(this.metrics.values())
    
    const totalMessages = allMetrics.reduce((sum, m) => sum + m.totalMessages, 0)
    const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulMessages, 0)
    const totalCost = allMetrics.reduce((sum, m) => sum + m.totalCost, 0)
    const avgLatency = allMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / allMetrics.length
    
    return {
      totalChannels: allMetrics.filter(m => m.totalMessages > 0).length,
      totalMessages,
      successfulMessages: totalSuccessful,
      failedMessages: totalMessages - totalSuccessful,
      overallReliability: totalMessages > 0 ? (totalSuccessful / totalMessages) * 100 : 100,
      totalCost: totalCost.toFixed(4),
      averageLatency: Math.round(avgLatency),
      costPerMessage: totalMessages > 0 ? (totalCost / totalMessages).toFixed(6) : '0'
    }
  }

  getIntegrationComparison() {
    const allMetrics = Array.from(this.metrics.values())
    
    return allMetrics.map(metrics => ({
      channel: metrics.channel.toLowerCase(),
      name: this.getChannelDisplayName(metrics.channel),
      totalMessages: metrics.totalMessages,
      successRate: metrics.reliability.toFixed(1) + '%',
      averageLatency: metrics.averageLatency.toFixed(0) + 'ms',
      totalCost: '$' + metrics.totalCost.toFixed(4),
      costPerMessage: '$' + metrics.costPerMessage.toFixed(6),
      reliability: metrics.reliability,
      status: metrics.totalMessages > 0 ? 'active' : 'inactive'
    })).sort((a, b) => b.totalMessages - a.totalMessages)
  }

  private getChannelDisplayName(channel: string): string {
    const names = {
      SMS: 'SMS (Twilio)',
      WHATSAPP: 'WhatsApp (Twilio)',
      EMAIL: 'Email (Resend)'
    }
    return names[channel as keyof typeof names] || channel
  }

  getRecentEvents(limit = 100): MessageEvent[] {
    return this.events.slice(-limit).reverse()
  }

  getCostAnalysis() {
    const allMetrics = Array.from(this.metrics.values())
    
    return {
      totalCost: allMetrics.reduce((sum, m) => sum + m.totalCost, 0).toFixed(4),
      costBreakdown: allMetrics.map(metrics => ({
        channel: metrics.channel.toLowerCase(),
        name: this.getChannelDisplayName(metrics.channel),
        totalCost: '$' + metrics.totalCost.toFixed(4),
        messageCount: metrics.totalMessages,
        costPerMessage: '$' + metrics.costPerMessage.toFixed(6),
        percentage: 0
      }))
    }
  }
  async measureLatency<T>(
    operation: () => Promise<T>,
    channel: string,
    messageId?: string
  ): Promise<{ result: T; latency: number }> {
    const startTime = Date.now()
    
    try {
      const result = await operation()
      const latency = Date.now() - startTime
      
      if (messageId) {
        this.recordMessageEvent({
          messageId,
          channel,
          direction: 'outbound',
          status: 'sent',
          timestamp: new Date(),
          latency
        })
      }
      
      return { result, latency }
    } catch (error) {
      const latency = Date.now() - startTime
      
      if (messageId) {
        this.recordMessageEvent({
          messageId,
          channel,
          direction: 'outbound',
          status: 'failed',
          timestamp: new Date(),
          latency,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      throw error
    }
  }

  exportMetrics() {
    return {
      overview: this.getOverallMetrics(),
      channels: this.getIntegrationComparison(),
      costAnalysis: this.getCostAnalysis(),
      recentEvents: this.getRecentEvents(50),
      exportedAt: new Date().toISOString()
    }
  }

  reset() {
    this.metrics.clear()
    this.events = []
    this.initializeMetrics()
  }
}

export const metricsCollector = new MetricsCollector()

export function recordMessageMetrics(event: Omit<MessageEvent, 'timestamp'>) {
  metricsCollector.recordMessageEvent({
    ...event,
    timestamp: new Date()
  })
}
