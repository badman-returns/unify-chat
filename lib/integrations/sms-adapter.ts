import twilio from 'twilio'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

export class SMSAdapter implements IntegrationAdapter {
  channel = 'sms' as const
  name = 'Twilio SMS'
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
        error: 'SMS client not initialized. Check configuration.'
      }
    }

    try {
      const message = await this.client.messages.create({
        body: request.content,
        from: request.from || this.config.credentials.phoneNumber,
        to: request.to
      })

      return {
        success: true,
        messageId: message.sid,
        metadata: {
          status: message.status,
          direction: message.direction,
          price: message.price,
          priceUnit: message.priceUnit
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
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
        Direction = 'inbound'
      } = payload

      if (!MessageSid || !From || !To) {
        return null
      }

      return {
        id: MessageSid,
        channel: 'sms',
        direction: Direction === 'outbound-api' ? 'outbound' : 'inbound',
        from: From,
        to: To,
        content: Body || '',
        status: this.mapTwilioStatus(MessageStatus || SmsStatus),
        timestamp: new Date(),
        metadata: {
          twilioStatus: MessageStatus || SmsStatus,
          rawPayload: payload
        }
      }
    } catch (error) {
      console.error('Error processing SMS webhook:', error)
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
      name: 'SMS',
      description: 'Traditional text messaging via Twilio',
      capabilities: [
        'Text messages up to 1600 characters',
        'Delivery receipts',
        'Global reach',
        'High reliability'
      ],
      pricing: {
        cost: '$0.0075',
        unit: 'per message'
      },
      reliability: 95,
      latency: '1-5 seconds'
    }
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
