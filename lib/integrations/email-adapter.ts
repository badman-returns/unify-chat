import sgMail from '@sendgrid/mail'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

export class EmailAdapter implements IntegrationAdapter {
  channel = 'email' as const
  name = 'SendGrid Email'
  private initialized = false

  constructor(private config: ChannelConfig) {
    if (this.validateConfig(config)) {
      sgMail.setApiKey(config.credentials.apiKey)
      this.initialized = true
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Email client not initialized. Check SendGrid API key.'
      }
    }

    try {
      const msg = {
        to: request.to,
        from: request.from || this.config.credentials.fromEmail,
        subject: request.metadata?.subject || 'Message from UnifyChat',
        text: request.content,
        html: this.formatHtmlContent(request.content),
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      }

      const [response] = await sgMail.send(msg)

      return {
        success: true,
        messageId: response.headers['x-message-id'] || 'unknown',
        metadata: {
          statusCode: response.statusCode,
          headers: response.headers
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email',
        metadata: { 
          error,
          code: error.code,
          response: error.response?.body
        }
      }
    }
  }

  async handleWebhook(payload: any): Promise<BaseMessage | null> {
    try {
      const events = Array.isArray(payload) ? payload : [payload]
      
      const event = events[0]
      if (!event) return null

      const {
        sg_message_id,
        email,
        event: eventType,
        timestamp,
        smtp_id,
        subject,
        from,
        to,
        text,
        html
      } = event

      if (eventType === 'inbound') {
        return {
          id: sg_message_id || smtp_id || `email_${Date.now()}`,
          channel: 'email',
          direction: 'inbound',
          from: from || email,
          to: to || this.config.credentials.fromEmail,
          content: text || this.stripHtml(html) || '',
          status: 'delivered',
          timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
          metadata: {
            subject,
            eventType,
            rawPayload: event
          }
        }
      } else {
        return {
          id: sg_message_id || smtp_id || 'unknown',
          channel: 'email',
          direction: 'outbound',
          from: this.config.credentials.fromEmail,
          to: email,
          content: '',
          status: this.mapSendGridStatus(eventType),
          timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
          metadata: {
            eventType,
            subject,
            rawPayload: event
          }
        }
      }
    } catch (error) {
      console.error('Error processing email webhook:', error)
      return null
    }
  }

  validateConfig(config: ChannelConfig): boolean {
    return !!(
      config.enabled &&
      config.credentials.apiKey &&
      config.credentials.fromEmail
    )
  }

  getChannelInfo() {
    return {
      name: 'Email',
      description: 'Professional email communication via SendGrid',
      capabilities: [
        'Rich HTML formatting',
        'File attachments',
        'Delivery tracking',
        'Open/click analytics',
        'Global delivery',
        'Professional appearance'
      ],
      pricing: {
        cost: '$0.0006',
        unit: 'per email'
      },
      reliability: 99,
      latency: '5-30 seconds'
    }
  }

  private formatHtmlContent(textContent: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${textContent.split('\n').map(line => 
          line.trim() ? `<p>${line}</p>` : '<br>'
        ).join('')}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Sent via UnifyChat - Unified Customer Communication Platform
        </p>
      </div>
    `
  }

  private stripHtml(html: string): string {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
  }

  private mapSendGridStatus(eventType: string): BaseMessage['status'] {
    switch (eventType?.toLowerCase()) {
      case 'processed':
      case 'delivered':
        return 'delivered'
      case 'open':
        return 'read'
      case 'bounce':
      case 'dropped':
      case 'blocked':
        return 'failed'
      case 'deferred':
        return 'pending'
      default:
        return 'sent'
    }
  }
}
