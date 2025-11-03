"use client"

import { useEffect, useRef, useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, MessageCircle, MoreHorizontal, User, Calendar, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContactInbox } from '@/hooks/useContactInbox'
import { useMarkAsRead } from '@/hooks/useMarkAsRead'
import { ChannelSelector } from './ChannelSelector'
import { ScheduleMessageModal } from './ScheduleMessageModal'
import { ContactProfileModal } from './ContactProfileModal'

interface ContactInboxProps {
  selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all'
}

export function ContactInbox({ selectedChannel }: ContactInboxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { markAsRead } = useMarkAsRead()
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  const {
    filteredContacts,
    selectedContact,
    conversation,
    messageText,
    setMessageText,
    selectedContactId,
    contactsLoading,
    contactsError,
    isConnected,
    connectionStatus,
    handleContactSelect,
    handleSendMessage,
    formatTime
  } = useContactInbox(selectedChannel)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    })
  }

  useEffect(() => {
    if (conversation.length > 0) {
      scrollToBottom()
    }
  }, [conversation.length, selectedContact?.id])

  const renderChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <Phone className="h-3 w-3" />
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />
      case 'email': return <Mail className="h-3 w-3" />
      default: return <MessageCircle className="h-3 w-3" />
    }
  }

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-3 w-3 text-blue-500" />
      case 'delivered': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'read': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />
      default: return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'whatsapp': return 'bg-green-100 text-green-800 border-green-200'
      case 'email': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (contactsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (contactsError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{contactsError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-1 bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}></div>
              <span className="text-xs text-muted-foreground">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredContacts.map((contact, index) => (
                <button
                  key={contact.id || `contact-${index}`}
                  onClick={() => handleContactSelect(contact.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedContactId === contact.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.phone || contact.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium border",
                        getChannelColor(contact.lastMessage?.channel || 'sms')
                      )}>
                        <div className="flex items-center space-x-1">
                          {renderChannelIcon(contact.lastMessage?.channel || 'sms')}
                          <span>{contact.lastMessage?.channel?.toUpperCase() || 'SMS'}</span>
                        </div>
                      </div>
                      {contact.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  {contact.lastMessage && (
                    <div className="mt-2 ml-11">
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(contact.lastMessage.timestamp)}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">
                      {selectedContact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.phone || selectedContact.email}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="View contact profile"
                >
                  <User className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversation.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div
                    key={message.id || `message-${index}`}
                    className={cn(
                      "flex",
                      message.direction === 'outbound' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.direction === 'outbound'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.direction === 'outbound' && (
                          <div className="ml-2">
                            {renderStatusIcon(message.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onFocus={() => {
                    // Mark as read when user focuses on input to start typing
                    if (selectedContactId) {
                      markAsRead(selectedContactId)
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  disabled={!messageText.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors border",
                    messageText.trim()
                      ? "border-primary text-primary hover:bg-primary/10"
                      : "border-muted text-muted-foreground cursor-not-allowed"
                  )}
                  title="Schedule message"
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors",
                    messageText.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <ScheduleMessageModal
              isOpen={isScheduleModalOpen}
              onClose={() => setIsScheduleModalOpen(false)}
              onSchedule={async (scheduledAt) => {
                // Schedule the message
                if (!selectedContact) return
                
                try {
                  const response = await fetch('/api/messages/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contactId: selectedContact.id,
                      channel: selectedContact.lastMessage?.channel || 'SMS',
                      content: messageText,
                      to: selectedContact.phone || selectedContact.email,
                      scheduledAt: scheduledAt.toISOString()
                    })
                  })
                  
                  if (response.ok) {
                    setMessageText('')
                    alert('Message scheduled successfully!')
                  }
                } catch (error) {
                  console.error('Failed to schedule message:', error)
                  alert('Failed to schedule message')
                }
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base font-medium text-foreground mb-2">
                Select a contact
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a contact from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      
      <ContactProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        contact={selectedContact || null}
        messages={conversation}
        onSendMessage={() => {
          setIsProfileModalOpen(false)
          // Focus on message input when closing modal
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
        }}
      />
    </div>
  )
}
