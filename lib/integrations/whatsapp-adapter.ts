import twilio from 'twilio'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

export class WhatsAppAdapter implements IntegrationAdapter {
  channel = 'whatsapp' as const
  name = 'Twilio WhatsApp'
  private client: twilio.Twilio | null = null

  constructor(private config: ChannelConfig) {
    if (this.validateConfig(config)) {
      this.client = twilio(
        config.credentials.accountSid,
        config.credentials.authToken
      )
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'WhatsApp client not initialized. Check configuration.'
      }
    }

    try {
      const fromNumber = this.formatWhatsAppNumber(
        request.from || this.config.credentials.phoneNumber
      )
      const toNumber = this.formatWhatsAppNumber(request.to)

      const message = await this.client.messages.create({
        body: request.content,
        from: fromNumber,
        to: toNumber
      })

      return {
        success: true,
        messageId: message.sid,
        metadata: {
          status: message.status,
          direction: message.direction,
          price: message.price,
          priceUnit: message.priceUnit,
          channel: 'whatsapp'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp message',
        metadata: { error }
      }
    }
  }

  async handleWebhook(payload: any): Promise<BaseMessage | null> {
    try {
      const {
        MessageSid,
        From,
        To,
        Body,
        MessageStatus,
        SmsStatus,
        Direction = 'inbound',
        MediaUrl0,
        MediaContentType0,
        NumMedia
      } = payload

      if (!MessageSid || !From || !To) {
        return null
      }

      let content = Body || ''
      const hasMedia = NumMedia && parseInt(NumMedia) > 0

      if (hasMedia && MediaUrl0) {
        content = content 
          ? `${content}\n\n📎 Media: ${MediaUrl0}`
          : `📎 Media: ${MediaUrl0}`
      }

      return {
        id: MessageSid,
        channel: 'whatsapp',
        direction: Direction === 'outbound-api' ? 'outbound' : 'inbound',
        from: this.cleanWhatsAppNumber(From),
        to: this.cleanWhatsAppNumber(To),
        content,
        status: this.mapTwilioStatus(MessageStatus || SmsStatus),
        timestamp: new Date(),
        metadata: {
          twilioStatus: MessageStatus || SmsStatus,
          hasMedia,
          mediaUrl: MediaUrl0,
          mediaType: MediaContentType0,
          rawPayload: payload
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error)
      return null
    }
  }

  validateConfig(config: ChannelConfig): boolean {
    return !!(
      config.enabled &&
      config.credentials.accountSid &&
      config.credentials.authToken &&
      config.credentials.phoneNumber
    )
  }

  getChannelInfo() {
    return {
      name: 'WhatsApp',
      description: 'Rich messaging via WhatsApp Business API',
      capabilities: [
        'Text messages',
        'Media sharing (images, documents)',
        'Read receipts',
        'Rich formatting',
        'Global reach',
        'High engagement rates'
      ],
      pricing: {
        cost: '$0.005-0.009',
        unit: 'per message (varies by country)'
      },
      reliability: 98,
      latency: '1-3 seconds'
    }
  }

  private formatWhatsAppNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/^whatsapp:/, '')
    
    return cleanNumber.startsWith('whatsapp:') 
      ? cleanNumber 
      : `whatsapp:${cleanNumber}`
  }

  private cleanWhatsAppNumber(phoneNumber: string): string {
    return phoneNumber.replace(/^whatsapp:/, '')
  }

  private mapTwilioStatus(twilioStatus: string): BaseMessage['status'] {
    switch (twilioStatus?.toLowerCase()) {
      case 'queued':
      case 'accepted':
        return 'pending'
      case 'sent':
        return 'sent'
      case 'delivered':
        return 'delivered'
      case 'read':
        return 'read'
      case 'failed':
      case 'undelivered':
        return 'failed'
      default:
        return 'pending'
    }
  }
}
