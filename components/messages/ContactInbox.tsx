"use client"

import { useState, useEffect, useRef } from 'react'
import { Phone, Mail, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle, Send, User, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContactInbox } from '@/hooks/useContactInbox'
import { useMarkAsRead } from '@/hooks/useMarkAsRead'
import { MessageAttachment } from './MessageAttachment'
import { ScheduleMessageModal } from './ScheduleMessageModal'
import { MessageContent } from './MessageContent'
import { ContactProfileModal } from './ContactProfileModal'
import { SuccessDialog } from '../ui/SuccessDialog'
import { TypingIndicator } from './TypingIndicator'
import { AttachmentUpload } from './AttachmentUpload'
import { useOptimisticMessage } from '@/hooks/useOptimisticMessage'
import { useQueryClient } from '@tanstack/react-query'

interface ContactInboxProps {
  selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all'
}

export function ContactInbox({ selectedChannel }: ContactInboxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { markAsRead } = useMarkAsRead()
  const { sendWithAttachments } = useOptimisticMessage()
  
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAttachments, setShowAttachments] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  
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
    handleSendMessage: originalHandleSendMessage,
    formatTime,
    canLoadMore,
    isLoadingMore,
    loadMoreMessages,
    getChannelIcon,
    isContactTyping
  } = useContactInbox(selectedChannel)

  const handleSendMessage = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedContact) return
    
    const contentToSend = messageText
    const filesToSend = [...attachments]
    
    setMessageText('')
    setAttachments([])
    setShowAttachments(false)
    
    if (filesToSend.length > 0) {
      const result = await sendWithAttachments(selectedContact, contentToSend, filesToSend)
      
      if (!result.success) {
        console.error('Send failed:', result.error)
        setMessageText(contentToSend)
        setAttachments(filesToSend)
      }
    } else {
      try {
        await originalHandleSendMessage()
      } catch (error) {
        console.error('Failed to send message:', error)
        setMessageText(contentToSend)
      }
    }
  }

  const scrollToBottom = (smooth: boolean = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [conversation])

  useEffect(() => {
    if (isContactTyping) {
      scrollToBottom(true)
    }
  }, [isContactTyping])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop === 0 && canLoadMore && !isLoadingMore) {
        const previousScrollHeight = container.scrollHeight
        loadMoreMessages?.()
        
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight
          container.scrollTop = newScrollHeight - previousScrollHeight
        }, 100)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [canLoadMore, isLoadingMore, loadMoreMessages])

  const renderChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <Phone className="h-3 w-3" />
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />
      case 'email': return <Mail className="h-3 w-3" />
      default: return <MessageCircle className="h-3 w-3" />
    }
  }

  const renderStatusIcon = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case 'sent': return <CheckCircle className="h-3 w-3 text-blue-500" />
      case 'delivered': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'read': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />
      case 'pending': return <Clock className="h-3 w-3 text-gray-400" />
      default: return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getDisplayName = (contact: any) => {
    if (!contact) return ''
    if (contact.email && !contact.phone) {
      return contact.email
    }
    return contact.name || contact.phone || contact.email || 'Unknown'
  }

  const getContactSubtitle = (contact: any) => {
    if (!contact) return ''
    if (contact.email && !contact.phone) {
      return contact.lastMessage?.channel?.toUpperCase() || 'EMAIL'
    }
    return contact.phone || contact.email || ''
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
    <div className="h-full px-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full border-x border-border overflow-hidden rounded-lg">
        <div className="lg:col-span-1 bg-card border-r border-border overflow-hidden">
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
            <div>
              {filteredContacts.map((contact, index) => (
                <button
                  key={contact.id || `contact-${index}`}
                  onClick={() => handleContactSelect(contact.id)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border transition-colors",
                    selectedContactId === contact.id
                      ? "bg-primary/10"
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
                          {getDisplayName(contact)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getContactSubtitle(contact)}
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

      <div className="lg:col-span-2 bg-card flex flex-col h-full overflow-hidden">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-border flex-shrink-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">
                      {getDisplayName(selectedContact)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getContactSubtitle(selectedContact)}
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

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                    <div className="relative">
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer",
                          message.direction === 'outbound'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                          message.status === 'scheduled' && "border-2 border-primary/50"
                        )}
                        onMouseEnter={() => {
                          if (message.status === 'scheduled') {
                            setHoveredMessageId(message.id)
                          }
                        }}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        {message.status === 'scheduled' && (
                          <div className="flex items-center space-x-1 mb-1 text-xs">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Scheduled</span>
                          </div>
                        )}
                        {message.content && message.content !== 'Sent an attachment' && message.content.trim() !== '' && (
                          <MessageContent content={message.content} className="text-sm" />
                        )}
                        {message.attachments && message.attachments.length > 0 && message.attachments[0] !== 'uploading' && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, idx) => (
                              <MessageAttachment
                                key={idx}
                                url={attachment}
                                contentType={message.metadata?.mediaTypes?.[idx]}
                              />
                            ))}
                          </div>
                        )}
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
                      {hoveredMessageId === message.id && message.status === 'scheduled' && message.scheduledAt && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border border-border text-xs whitespace-nowrap z-10">
                          <div className="font-medium">Will be sent:</div>
                          <div>{new Date(message.scheduledAt).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b border-border"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isContactTyping && (
                <TypingIndicator />
              )}
              {isLoadingMore && conversation.length > 0 && (
                <>
                  <div className="flex justify-start">
                    <div className="max-w-[70%] space-y-2">
                      <div className="animate-pulse bg-muted rounded-2xl h-16 w-64"></div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[70%] space-y-2">
                      <div className="animate-pulse bg-primary/20 rounded-2xl h-12 w-48"></div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[70%] space-y-2">
                      <div className="animate-pulse bg-muted rounded-2xl h-20 w-56"></div>
                    </div>
                  </div>
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border flex-shrink-0 bg-card z-10">
              <div className="p-3 pb-4">
                {showAttachments && (
                  <div className="mb-3">
                    <AttachmentUpload
                      onAttachmentsChange={setAttachments}
                      maxFiles={3}
                      maxSizeMB={10}
                    />
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                    title="Attach files"
                  >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onFocus={() => {
                      if (selectedContactId) {
                        markAsRead(selectedContactId)
                      }
                    }}
                    placeholder="Type a message..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />

                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    disabled={!messageText.trim() && attachments.length === 0}
                    className={cn(
                      "p-2 rounded-lg transition-colors flex-shrink-0",
                      messageText.trim() || attachments.length > 0
                        ? "hover:bg-muted text-foreground"
                        : "text-muted-foreground cursor-not-allowed"
                    )}
                    title="Schedule message"
                  >
                    <Clock className="h-5 w-5" />
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() && attachments.length === 0}
                    className={cn(
                      "p-2 rounded-lg transition-colors flex-shrink-0",
                      messageText.trim() || attachments.length > 0
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    title="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <ScheduleMessageModal
              isOpen={isScheduleModalOpen}
              onClose={() => setIsScheduleModalOpen(false)}
              onSchedule={async (scheduledAt) => {
                if (!selectedContact) return
                
                try {
                  const response = await fetch('/api/messages/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contactId: selectedContact.id,
                      channel: selectedContact.lastMessage?.channel?.toLowerCase() || 'sms',
                      content: messageText,
                      to: selectedContact.phone || selectedContact.email,
                      scheduledAt: scheduledAt.toISOString()
                    })
                  })
                  
                  if (response.ok) {
                    setMessageText('')
                    setScheduledTime(scheduledAt.toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    }))
                    setIsSuccessDialogOpen(true)
                    
                    queryClient.invalidateQueries({ queryKey: ['messages'] })
                    queryClient.invalidateQueries({ queryKey: ['contacts'] })
                  }
                } catch (error) {
                  console.error('Failed to schedule message:', error)
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
      </div>
      
      <ContactProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        contact={selectedContact || null}
        messages={conversation}
        onSendMessage={() => {
          setIsProfileModalOpen(false)
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
        }}
      />
      
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        title="Message Scheduled"
        message={`Your message has been scheduled for ${scheduledTime}`}
      />
    </div>
  )
}
