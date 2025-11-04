/**
 * Twilio WhatsApp Business API Management
 * NOTE: This only works with approved WhatsApp Business accounts, NOT sandbox
 */

import twilio from 'twilio'

export class TwilioWhatsAppManager {
  private client: twilio.Twilio

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
  }

  /**
   * Send WhatsApp template message (Production only)
   * Templates must be pre-approved by WhatsApp
   */
  async sendTemplateMessage(to: string, templateSid: string, contentVariables: Record<string, string>) {
    try {
      const message = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: `whatsapp:${to}`,
        contentSid: templateSid,
        contentVariables: JSON.stringify(contentVariables)
      })

      return {
        success: true,
        messageSid: message.sid
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get WhatsApp Business Profile (Production only)
   */
  async getBusinessProfile() {
    try {
      // Only available with WhatsApp Business API
      const profile = await this.client.conversations.v1
        .configuration()
        .fetch()

      return profile
    } catch (error: any) {
      console.error('Error fetching profile:', error.message)
      return null
    }
  }

  /**
   * Send opt-in request message
   * This creates a message that asks users to opt-in
   */
  async sendOptInRequest(to: string, businessName: string) {
    try {
      const message = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: `whatsapp:${to}`,
        body: `Hi! ${businessName} would like to send you updates via WhatsApp. Reply YES to confirm or NO to decline.`
      })

      return {
        success: true,
        messageSid: message.sid,
        instructions: 'User must reply YES to opt-in'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Check if a number is reachable on WhatsApp
   * This verifies if the phone number has WhatsApp installed
   */
  async checkWhatsAppAvailability(phoneNumber: string): Promise<boolean> {
    try {
      // Twilio's lookup API can check WhatsApp availability
      const lookup = await this.client.lookups.v2
        .phoneNumbers(phoneNumber)
        .fetch({ fields: 'line_type_intelligence' })

      // Note: This is a paid API call
      return lookup !== null
    } catch (error) {
      console.error('WhatsApp availability check failed:', error)
      return false
    }
  }

  /**
   * Get webhook configuration
   */
  getWebhookInstructions() {
    return {
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`,
      method: 'POST',
      instructions: [
        '1. Go to Twilio Console → Messaging → WhatsApp Senders',
        '2. Select your WhatsApp sender',
        '3. Under "Webhook for Incoming Messages", set:',
        `   URL: ${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`,
        '   Method: POST',
        '4. Save changes'
      ]
    }
  }
}

/**
 * Helper function to generate QR code for WhatsApp opt-in
 * This can be displayed in your app for easy joining
 */
export function generateWhatsAppJoinQRCode(sandboxCode: string) {
  const joinMessage = encodeURIComponent(`join ${sandboxCode}`)
  const phoneNumber = '14155238886' // Twilio sandbox number
  
  // WhatsApp click-to-chat URL
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${joinMessage}`
  
  // QR code generation URL (using a free service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappUrl)}`
  
  return {
    whatsappUrl,
    qrCodeUrl,
    instructions: `Scan this QR code with your phone to join the WhatsApp sandbox automatically`
  }
}

/**
 * Generate a clickable link for easy sandbox joining
 */
export function generateSandboxJoinLink(sandboxCode: string) {
  const joinMessage = encodeURIComponent(`join ${sandboxCode}`)
  const phoneNumber = '14155238886'
  
  return `https://wa.me/${phoneNumber}?text=${joinMessage}`
}

export const whatsappManager = new TwilioWhatsAppManager()
