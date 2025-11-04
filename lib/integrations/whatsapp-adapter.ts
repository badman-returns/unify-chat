import twilio from 'twilio'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

/**
 * WhatsApp Business integration adapter using Twilio API
 * Handles WhatsApp message sending with media support and webhook processing
 * Requires Twilio WhatsApp sandbox or approved WhatsApp Business account
 * @implements {IntegrationAdapter}
 */
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

  /**
   * Send a WhatsApp message via Twilio
   * Automatically formats phone numbers with 'whatsapp:' prefix
   * @param request - Message send request with content and recipient
   * @returns Response with success status and Twilio message SID
   */
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

      const messageParams: any = {
        body: request.content,
        from: fromNumber,
        to: toNumber
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
          channel: 'whatsapp',
          mediaUrl: request.mediaUrl
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

  /**
   * Process incoming WhatsApp webhook from Twilio
   * Handles inbound messages, status updates, and media attachments
   * @param payload - Twilio webhook payload
   * @returns Normalized message object or null if invalid
   */
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

  /**
   * Validate WhatsApp configuration
   * @param config - Channel configuration object
   * @returns True if all required credentials are present
   */
  validateConfig(config: ChannelConfig): boolean {
    return !!(
      config.enabled &&
      config.credentials.accountSid &&
      config.credentials.authToken &&
      config.credentials.phoneNumber
    )
  }

  /**
   * Get WhatsApp channel information and capabilities
   * @returns Channel metadata including pricing and features
   */
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

  /**
   * Format phone number for WhatsApp by adding 'whatsapp:' prefix
   * @param phoneNumber - Phone number in E.164 format
   * @returns Formatted number with whatsapp: prefix
   */
  private formatWhatsAppNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/^whatsapp:/, '')
    
    return cleanNumber.startsWith('whatsapp:') 
      ? cleanNumber 
      : `whatsapp:${cleanNumber}`
  }

  /**
   * Remove 'whatsapp:' prefix from phone number
   * @param phoneNumber - Phone number with optional whatsapp: prefix
   * @returns Clean phone number without prefix
   */
  private cleanWhatsAppNumber(phoneNumber: string): string {
    return phoneNumber.replace(/^whatsapp:/, '')
  }

  /**
   * Map Twilio status to standardized message status
   * @param twilioStatus - Twilio message status (queued, sent, delivered, etc.)
   * @returns Normalized status (pending, sent, delivered, read, failed)
   */
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
