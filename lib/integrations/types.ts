export type MessageChannel = 'sms' | 'whatsapp' | 'email'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface BaseMessage {
  id: string
  channel: MessageChannel
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  content: string
  status: MessageStatus
  timestamp: Date
  metadata?: Record<string, any>
}

export interface SendMessageRequest {
  channel: MessageChannel
  to: string
  content: string
  from?: string
  metadata?: Record<string, any>
}

export interface SendMessageResponse {
  success: boolean
  messageId?: string
  error?: string
  metadata?: Record<string, any>
}

export interface ChannelConfig {
  enabled: boolean
  credentials: Record<string, string>
  settings: Record<string, any>
}

export interface IntegrationAdapter {
  channel: MessageChannel
  name: string
  
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>
  
  handleWebhook(payload: any): Promise<BaseMessage | null>
  
  validateConfig(config: ChannelConfig): boolean
  
  getChannelInfo(): {
    name: string
    description: string
    capabilities: string[]
    pricing: {
      cost: string
      unit: string
    }
    reliability: number
    latency: string
  }
}

export interface IntegrationMetrics {
  channel: MessageChannel
  totalMessages: number
  successRate: number
  averageLatency: number
  lastUsed: Date
  costPerMessage: number
}
