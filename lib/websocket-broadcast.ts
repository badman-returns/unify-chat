import { EventEmitter } from 'events'

class WebSocketBroadcaster extends EventEmitter {
  broadcastMessage(type: string, data: any) {
    this.emit('broadcast', { type, ...data })
  }
}

declare global {
  // eslint-disable-next-line no-var
  var wsBroadcaster: WebSocketBroadcaster | undefined
}

export const wsBroadcaster = global.wsBroadcaster || (global.wsBroadcaster = new WebSocketBroadcaster())

export function broadcastMessageReceived(message: any) {
  const eventType = message.direction === 'OUTBOUND' ? 'message_sent' : 'messageReceived'
  wsBroadcaster.broadcastMessage(eventType, {
    messageId: message.id,
    contactId: message.contactId,
    channel: message.channel,
    direction: message.direction,
    content: message.content,
    timestamp: message.createdAt || new Date()
  })
}

export function broadcastContactCreated(contact: any) {
  wsBroadcaster.broadcastMessage('contactCreated', {
    contactId: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email
  })
}

export function broadcastContactUpdated(contact: any) {
  wsBroadcaster.broadcastMessage('contactUpdated', {
    contactId: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email
  })
}

export function broadcastTypingIndicator(contactId: string, isTyping: boolean) {
  wsBroadcaster.broadcastMessage('typing', {
    contactId,
    isTyping,
    timestamp: new Date()
  })
}
