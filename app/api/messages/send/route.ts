import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { createIntegrationManager } from '@/lib/integrations'
import { broadcastMessageReceived } from '@/lib/websocket-broadcast'
import { sendMessageSchema } from '@/lib/validations/message'
import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import twilio from 'twilio'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let body: any
    let uploadedFiles: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      body = {
        content: formData.get('content') as string,
        channel: formData.get('channel') as string,
        to: formData.get('to') as string,
        metadata: {
          contactId: formData.get('contactId') as string
        }
      }

      for (const [key, value] of formData.entries()) {
        if (key.startsWith('attachment_') && value instanceof File) {
          const file = value as File
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          
          const base64File = `data:${file.type};base64,${buffer.toString('base64')}`
          
          const uploadResult = await cloudinary.uploader.upload(base64File, {
            folder: 'unifychat',
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}`
          })
          
          uploadedFiles.push(uploadResult.secure_url)
        }
      }

      if (uploadedFiles.length > 0) {
        body.metadata.attachments = uploadedFiles
      }
    } else {
      body = await request.json()
    }
    
    const validation = sendMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { channel, to, content, metadata } = validation.data
    const contactId = metadata?.contactId
    const from = body.from

    const integrationManager = createIntegrationManager()

    if (!integrationManager.isChannelEnabled(channel)) {
      return NextResponse.json(
        { error: `Channel ${channel} is not configured or enabled` },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    
    const messageData: any = {
      channel,
      to,
      content,
      from,
      metadata
    }
    
    if (uploadedFiles.length > 0) {
      messageData.mediaUrl = uploadedFiles[0]
    }
    
    const result = await integrationManager.sendMessage(messageData)
    const latency = Date.now() - startTime

    let actualCost = 0
    
    if (result.success && result.messageId && (channel === 'sms' || channel === 'whatsapp')) {
      try {
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )
        const message = await twilioClient.messages(result.messageId).fetch()
        actualCost = message.price ? Math.abs(parseFloat(message.price)) : 0
      } catch (error) {
        const fallbackCosts = { sms: 0.0075, whatsapp: 0.005, email: 0.0001 }
        actualCost = fallbackCosts[channel as keyof typeof fallbackCosts] || 0
      }
    } else if (channel === 'email') {
      actualCost = 0.0001
    }

    if (result.success) {
      let contact
      if (contactId) {
        contact = await ContactService.findById(contactId)
      } else {
        const teamId = 'default-team-id'
        if (channel === 'email') {
          contact = await ContactService.findByEmail(to, teamId)
        } else {
          contact = await ContactService.findByPhone(to, teamId)
        }
        
        if (!contact) {
          contact = await ContactService.create({
            name: to,
            phone: channel !== 'email' ? to : undefined,
            email: channel === 'email' ? to : undefined,
            teamId
          })
        }
      }

      let savedMessage: any = null
      
      if (contact) {
        savedMessage = await MessageService.create({
          content,
          channel: channel.toUpperCase() as 'SMS' | 'WHATSAPP' | 'EMAIL',
          direction: 'OUTBOUND',
          status: 'SENT',
          attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          metadata: {
            ...metadata,
            messageId: result.messageId,
            integrationResponse: result.metadata,
            hasAttachments: uploadedFiles.length > 0,
            attachmentCount: uploadedFiles.length,
            analytics: {
              latency,
              cost: actualCost,
              costCurrency: 'USD',
              timestamp: new Date().toISOString()
            }
          },
          contactId: contact.id,
          userId: session.user.id,
          teamId: contact.teamId
        })
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        channel,
        latency,
        metadata: result.metadata,
        message: savedMessage
      })
    } else {
      return NextResponse.json(
        { 
          error: result.error,
          metadata: result.metadata 
        },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
