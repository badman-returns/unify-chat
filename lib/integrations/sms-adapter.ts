import twilio from 'twilio'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

/**
 * SMS integration adapter using Twilio API
 * Handles SMS/MMS message sending and webhook processing
 * @implements {IntegrationAdapter}
 */
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

  /**
   * Send an SMS or MMS message via Twilio
   * @param request - Message send request with content, recipient, and optional media
   * @returns Response with success status and Twilio message SID
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'SMS client not initialized. Check configuration.'
      }
    }

    try {
      const messageParams: any = {
        body: request.content,
        from: request.from || this.config.credentials.phoneNumber,
        to: request.to
      }

      if (request.mediaUrl) {
        messageParams.mediaUrl = [request.mediaUrl]
      }

      const message = await this.client.messages.create(messageParams)

      return {
        success: true,
        messageId: message.sid,
        metadata: {
          status: message.status,
          direction: message.direction,
          price: message.price,
          priceUnit: message.priceUnit,
          channel: 'sms'
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
        channel: 'sms',
        direction: Direction === 'outbound-api' ? 'outbound' : 'inbound',
        from: From,
        to: To,
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
        'Media sharing (images, documents) - MMS',
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
