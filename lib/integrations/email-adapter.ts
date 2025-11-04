import { Resend } from 'resend'
import { 
  IntegrationAdapter, 
  BaseMessage, 
  SendMessageRequest, 
  SendMessageResponse, 
  ChannelConfig 
} from './types'

/**
 * Email integration adapter using Resend API
 * Handles professional email sending with HTML formatting and webhook processing
 * Provides reliable transactional email delivery with tracking
 * @implements {IntegrationAdapter}
 */
export class EmailAdapter implements IntegrationAdapter {
  channel = 'email' as const
  name = 'Resend Email'
  private initialized = false
  private resend: Resend | null = null

  constructor(private config: ChannelConfig) {
    if (this.validateConfig(config)) {
      this.resend = new Resend(config.credentials.apiKey)
      this.initialized = true
    }
  }

  /**
   * Send an email via Resend API
   * Automatically formats content as HTML and includes plain text fallback
   * @param request - Message send request with content, recipient, and optional subject
   * @returns Response with success status and Resend email ID
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.initialized || !this.resend) {
      return {
        success: false,
        error: 'Email client not initialized. Check Resend API key.'
      }
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: request.from || this.config.credentials.fromEmail,
        to: [request.to],
        subject: request.metadata?.subject || 'Message from UnifyChat',
        text: request.content,
        html: this.formatHtmlContent(request.content)
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email',
          metadata: { error }
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown',
        metadata: {
          emailId: data?.id
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email',
        metadata: { 
          error,
          code: error.code
        }
      }
    }
  }

  /**
   * Process incoming email webhook (SendGrid/Resend format)
   * Handles inbound emails and delivery status updates
   * Note: Resend webhooks provide metadata only, not full email body
   * @param payload - Email webhook payload
   * @returns Normalized message object or null if invalid
   */
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

  /**
   * Validate email configuration
   * @param config - Channel configuration object
   * @returns True if API key and from email are present
   */
  validateConfig(config: ChannelConfig): boolean {
    return !!(
      config.enabled &&
      config.credentials.apiKey &&
      config.credentials.fromEmail
    )
  }

  /**
   * Get email channel information and capabilities
   * @returns Channel metadata including pricing and features
   */
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

  /**
   * Convert plain text to formatted HTML email
   * @param textContent - Plain text message content
   * @returns HTML-formatted email with UnifyChat branding
   */
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

  /**
   * Remove HTML tags from content
   * @param html - HTML string
   * @returns Plain text without HTML tags
   */
  private stripHtml(html: string): string {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
  }

  /**
   * Map SendGrid/Resend event type to standardized message status
   * @param eventType - Event type (delivered, open, bounce, etc.)
   * @returns Normalized status (sent, delivered, read, failed, pending)
   */
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
