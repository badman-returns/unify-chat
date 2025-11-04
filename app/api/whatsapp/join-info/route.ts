import { NextRequest, NextResponse } from 'next/server'
import { generateWhatsAppJoinQRCode, generateSandboxJoinLink } from '@/lib/twilio-whatsapp-management'

/**
 * API endpoint to get WhatsApp sandbox join information
 * Returns QR code and clickable link for easy joining
 */
export async function GET(request: NextRequest) {
  try {
    // Your Twilio sandbox code (get this from Twilio Console)
    // Example: "sunny-cloud-1234"
    const sandboxCode = process.env.TWILIO_WHATSAPP_SANDBOX_CODE || 'your-sandbox-code'

    if (sandboxCode === 'your-sandbox-code') {
      return NextResponse.json({
        error: 'Please set TWILIO_WHATSAPP_SANDBOX_CODE in your .env.local file',
        instructions: [
          '1. Go to Twilio Console → Messaging → Try it out → WhatsApp',
          '2. Find your sandbox code (e.g., "join sunny-cloud-1234")',
          '3. Add TWILIO_WHATSAPP_SANDBOX_CODE=sunny-cloud-1234 to .env.local'
        ]
      }, { status: 400 })
    }

    const qrCodeInfo = generateWhatsAppJoinQRCode(sandboxCode)
    const directLink = generateSandboxJoinLink(sandboxCode)

    return NextResponse.json({
      success: true,
      sandboxCode,
      sandboxNumber: '+1 415-523-8886',
      joinMethods: {
        manual: {
          instructions: [
            '1. Open WhatsApp on your phone',
            '2. Start a new chat with: +1 415-523-8886',
            `3. Send this exact message: join ${sandboxCode}`
          ],
          message: `join ${sandboxCode}`
        },
        qrCode: {
          url: qrCodeInfo.qrCodeUrl,
          instructions: 'Scan this QR code with your phone camera to open WhatsApp and join automatically'
        },
        clickableLink: {
          url: directLink,
          instructions: 'Click this link on your phone to open WhatsApp with the join message pre-filled'
        }
      },
      webhookSetup: {
        url: `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`,
        instructions: [
          '1. Go to Twilio Console → Messaging → Try it out → WhatsApp sandbox settings',
          '2. Set "When a message comes in" to:',
          `   ${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`,
          '3. HTTP Method: POST',
          '4. Click Save'
        ]
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
