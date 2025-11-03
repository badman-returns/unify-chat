import { SMSAdapter } from './sms-adapter'
import { WhatsAppAdapter } from './whatsapp-adapter'
import { EmailAdapter } from './email-adapter'
import { 
  IntegrationAdapter, 
  MessageChannel, 
  ChannelConfig,
  SendMessageRequest,
  SendMessageResponse,
  BaseMessage,
  IntegrationMetrics
} from './types'

export * from './types'

export class IntegrationFactory {
  private static smsAdapter: SMSAdapter | null = null
  private static whatsappAdapter: WhatsAppAdapter | null = null
  private static emailAdapter: EmailAdapter | null = null

  static getIntegration(channel: 'SMS' | 'WHATSAPP' | 'EMAIL') {
    switch (channel) {
      case 'SMS':
        if (!this.smsAdapter) {
          this.smsAdapter = new SMSAdapter({
            enabled: true,
            credentials: {
              accountSid: process.env.TWILIO_ACCOUNT_SID!,
              authToken: process.env.TWILIO_AUTH_TOKEN!,
              phoneNumber: process.env.TWILIO_PHONE_NUMBER!
            },
            settings: {}
          })
        }
        return this.smsAdapter

      case 'WHATSAPP':
        if (!this.whatsappAdapter) {
          this.whatsappAdapter = new WhatsAppAdapter({
            enabled: true,
            credentials: {
              accountSid: process.env.TWILIO_ACCOUNT_SID!,
              authToken: process.env.TWILIO_AUTH_TOKEN!,
              phoneNumber: process.env.TWILIO_WHATSAPP_NUMBER!
            },
            settings: {}
          })
        }
        return this.whatsappAdapter

      case 'EMAIL':
        if (!this.emailAdapter) {
          this.emailAdapter = new EmailAdapter({
            enabled: true,
            credentials: {
              apiKey: process.env.RESEND_API_KEY!,
              fromEmail: 'noreply@unifychat.com'
            },
            settings: {}
          })
        }
        return this.emailAdapter

      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }
}

interface IntegrationConfig {
  sms: ChannelConfig
  whatsapp: ChannelConfig
  email: ChannelConfig
}

export class IntegrationManager {
  private adapters: Map<MessageChannel, IntegrationAdapter> = new Map()
  private metrics: Map<MessageChannel, IntegrationMetrics> = new Map()

  constructor(private config: IntegrationConfig) {
    this.initializeAdapters()
  }

  private initializeAdapters() {
    if (this.config.sms.enabled) {
      const smsAdapter = new SMSAdapter(this.config.sms)
      this.adapters.set('sms', smsAdapter)
      this.initializeMetrics('sms')
    }

    if (this.config.whatsapp.enabled) {
      const whatsappAdapter = new WhatsAppAdapter(this.config.whatsapp)
      this.adapters.set('whatsapp', whatsappAdapter)
      this.initializeMetrics('whatsapp')
    }

    if (this.config.email.enabled) {
      const emailAdapter = new EmailAdapter(this.config.email)
      this.adapters.set('email', emailAdapter)
      this.initializeMetrics('email')
    }
  }

  private initializeMetrics(channel: MessageChannel) {
    this.metrics.set(channel, {
      channel,
      totalMessages: 0,
      successRate: 100,
      averageLatency: 0,
      lastUsed: new Date(),
      costPerMessage: this.getCostPerMessage(channel)
    })
  }

  private getCostPerMessage(channel: MessageChannel): number {
    switch (channel) {
      case 'sms': return 0.0075
      case 'whatsapp': return 0.007
      case 'email': return 0.0006
      default: return 0
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const adapter = this.adapters.get(request.channel)
    
    if (!adapter) {
      return {
        success: false,
        error: `Channel ${request.channel} is not configured or enabled`
      }
    }

    const startTime = Date.now()
    
    try {
      const response = await adapter.sendMessage(request)
      
      this.updateMetrics(request.channel, response.success, Date.now() - startTime)
      
      return response
    } catch (error: any) {
      this.updateMetrics(request.channel, false, Date.now() - startTime)
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  async handleWebhook(channel: MessageChannel, payload: any): Promise<BaseMessage | null> {
    const adapter = this.adapters.get(channel)
    
    if (!adapter) {
      console.error(`No adapter found for channel: ${channel}`)
      return null
    }

    return adapter.handleWebhook(payload)
  }

  getChannelInfo(channel: MessageChannel) {
    const adapter = this.adapters.get(channel)
    return adapter?.getChannelInfo() || null
  }

  getAllChannelInfo() {
    const channels: Array<ReturnType<IntegrationAdapter['getChannelInfo']> & { channel: MessageChannel }> = []
    
    for (const [channel, adapter] of this.adapters) {
      channels.push({
        channel,
        ...adapter.getChannelInfo()
      })
    }
    
    return channels
  }

  getMetrics(channel?: MessageChannel): IntegrationMetrics | IntegrationMetrics[] {
    if (channel) {
      return this.metrics.get(channel) || this.createEmptyMetrics(channel)
    }
    
    return Array.from(this.metrics.values())
  }

  getEnabledChannels(): MessageChannel[] {
    return Array.from(this.adapters.keys())
  }

  isChannelEnabled(channel: MessageChannel): boolean {
    return this.adapters.has(channel)
  }

  private updateMetrics(channel: MessageChannel, success: boolean, latency: number) {
    const metrics = this.metrics.get(channel)
    if (!metrics) return

    metrics.totalMessages++
    metrics.lastUsed = new Date()
    
    const successCount = Math.round(metrics.successRate * (metrics.totalMessages - 1) / 100)
    const newSuccessCount = successCount + (success ? 1 : 0)
    metrics.successRate = (newSuccessCount / metrics.totalMessages) * 100
    
    metrics.averageLatency = (
      (metrics.averageLatency * (metrics.totalMessages - 1) + latency) / 
      metrics.totalMessages
    )
  }

  private createEmptyMetrics(channel: MessageChannel): IntegrationMetrics {
    return {
      channel,
      totalMessages: 0,
      successRate: 0,
      averageLatency: 0,
      lastUsed: new Date(),
      costPerMessage: this.getCostPerMessage(channel)
    }
  }

  generateIntegrationAnalysis() {
    const channels = this.getAllChannelInfo()
    const metrics = this.getMetrics() as IntegrationMetrics[]
    
    return {
      summary: {
        totalChannels: channels.length,
        totalMessages: metrics.reduce((sum, m) => sum + m.totalMessages, 0),
        averageSuccessRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length || 0
      },
      channels: channels.map(channel => {
        const channelMetrics = metrics.find(m => m.channel === channel.channel)
        return {
          ...channel,
          metrics: channelMetrics || this.createEmptyMetrics(channel.channel),
          status: this.isChannelEnabled(channel.channel) ? 'active' : 'inactive'
        }
      }),
      recommendations: this.generateRecommendations(channels)
    }
  }

  private generateRecommendations(channels: any[]) {
    const recommendations: Array<{
      type: string
      title: string
      description: string
    }> = []
    
    const sortedByCost = channels.sort((a, b) => 
      parseFloat(a.pricing.cost.replace('$', '')) - parseFloat(b.pricing.cost.replace('$', ''))
    )
    
    recommendations.push({
      type: 'cost_optimization',
      title: 'Most Cost-Effective Channel',
      description: `${sortedByCost[0]?.name} offers the lowest cost per message at ${sortedByCost[0]?.pricing.cost} ${sortedByCost[0]?.pricing.unit}`
    })
    
    const mostReliable = channels.sort((a, b) => b.reliability - a.reliability)[0]
    if (mostReliable) {
      recommendations.push({
        type: 'reliability',
        title: 'Most Reliable Channel',
        description: `${mostReliable.name} has the highest reliability at ${mostReliable.reliability}%`
      })
    }
    
    const fastestChannel = channels.sort((a, b) => {
      const aLatency = parseInt(a.latency.split('-')[0])
      const bLatency = parseInt(b.latency.split('-')[0])
      return aLatency - bLatency
    })[0]
    
    if (fastestChannel) {
      recommendations.push({
        type: 'performance',
        title: 'Fastest Channel',
        description: `${fastestChannel.name} offers the lowest latency at ${fastestChannel.latency}`
      })
    }
    
    return recommendations
  }
}

export const createIntegrationManager = () => {
  const config: IntegrationConfig = {
    sms: {
      enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
      },
      settings: {}
    },
    whatsapp: {
      enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
      },
      settings: {}
    },
    email: {
      enabled: !!process.env.SENDGRID_API_KEY,
      credentials: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || ''
      },
      settings: {}
    }
  }

  return new IntegrationManager(config)
}
