import { NextRequest, NextResponse } from 'next/server'
import { ContactService } from '@/lib/db/contact'
import { MessageService } from '@/lib/db/message'
import { recordMessageMetrics } from '@/lib/metrics-collector'
import { mediaStorage } from '@/lib/media-storage'
import { broadcastMessageReceived, broadcastContactCreated, broadcastTypingIndicator } from '@/lib/websocket-broadcast'
import twilio from 'twilio'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    
    const rawFrom = params.get('From') || ''
    const rawTo = params.get('To') || ''
    const cleanFrom = rawFrom.replace('whatsapp:', '')
    const cleanTo = rawTo.replace('whatsapp:', '')
    
    let profileName = params.get('ProfileName') || ''
    const channelMetadata = params.get('ChannelMetadata')
    
    if (channelMetadata && !profileName) {
      try {
        const metadata = JSON.parse(channelMetadata)
        profileName = metadata.data?.context?.ProfileName || ''
      } catch (e) {
      }
    }
    
    const waId = params.get('WaId')
    const phoneNumber = waId ? `+${waId}` : cleanFrom
    
    const messageType = params.get('MessageType')
    const messageSid = params.get('MessageSid')
    const numMedia = parseInt(params.get('NumMedia') || '0')
    const mediaUrls: string[] = []
    const mediaTypes: string[] = []

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    if (messageType === 'document' && messageSid) {
      try {
        const message = await twilioClient.messages(messageSid).fetch()
        
        if (message.numMedia && parseInt(message.numMedia) > 0) {
          const mediaList = await twilioClient.messages(messageSid).media.list()
          
          for (const media of mediaList) {
            const mediaUrl = `https://api.twilio.com${media.uri.replace('.json', '')}`
            const originalFilename = (media as any).filename || undefined
            try {
              const storedMedia = await mediaStorage.downloadAndStore(mediaUrl, twilioClient, originalFilename)
              mediaUrls.push(storedMedia.url)
              mediaTypes.push(storedMedia.contentType)
            } catch (error) {
              console.error('Failed to download document:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch message from Twilio:', error)
      }
    } else if (numMedia > 0) {
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = params.get(`MediaUrl${i}`)
        const mediaContentType = params.get(`MediaContentType${i}`)
        
        if (mediaUrl) {
          try {
            const storedMedia = await mediaStorage.downloadAndStore(mediaUrl, twilioClient)
            mediaUrls.push(storedMedia.url)
            mediaTypes.push(storedMedia.contentType)
          } catch (error) {
            console.error('Failed to download media:', error)
            mediaUrls.push(mediaUrl)
            mediaTypes.push(mediaContentType || 'application/octet-stream')
          }
        }
      }
    }
    
    const inboundMessage = {
      from: phoneNumber,
      to: cleanTo,
      content: params.get('Body') || (mediaUrls.length > 0 || messageType === 'document' ? '[Document]' : ''),
      messageId: messageSid || params.get('SmsMessageSid'),
      timestamp: new Date(),
      profileName: profileName,
      attachments: mediaUrls
    }

    if (!inboundMessage.from) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const teamId = 'default-team-id'
    const userId = 'system-user-id'

    const contact = await ContactService.findOrCreateFromWebhook({
      phone: inboundMessage.from!,
      name: inboundMessage.profileName,
      channel: 'WHATSAPP',
      teamId
    })

    broadcastTypingIndicator(contact.id, true)

    const message = await MessageService.create({
      content: inboundMessage.content!,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        messageId: inboundMessage.messageId,
        from: inboundMessage.from,
        to: inboundMessage.to,
        timestamp: inboundMessage.timestamp,
        profileName: inboundMessage.profileName,
        waId: waId,
        mediaTypes: mediaTypes
      },
      contactId: contact.id,
      userId,
      teamId
    })

    if (mediaUrls.length > 0) {
      await MessageService.update(message.id, {
        attachments: mediaUrls
      })
    }

    broadcastTypingIndicator(contact.id, false)

    broadcastMessageReceived({
      id: message.id,
      contactId: contact.id,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      content: message.content,
      createdAt: message.createdAt
    })

    recordMessageMetrics({
      messageId: message.id,
      channel: 'WHATSAPP',
      direction: 'inbound',
      status: 'delivered'
    })

    return NextResponse.json({ 
      success: true, 
      contact: contact.id,
      message: message.id 
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge)
  }

  return new Response('Forbidden', { status: 403 })
}
