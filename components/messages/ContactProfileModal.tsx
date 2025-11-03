"use client"

import { useState } from 'react'
import { X, User, Phone, Mail, MessageCircle, Calendar, Tag, FileText, Send } from 'lucide-react'
import { cn, formatMessageTime } from '@/lib/utils'

interface Message {
  id: string
  content: string
  channel: 'sms' | 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  status: string
  timestamp: Date
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  tags?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface ContactProfileModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
  messages: Message[]
  onSendMessage?: () => void
}

export function ContactProfileModal({
  isOpen,
  onClose,
  contact,
  messages,
  onSendMessage
}: ContactProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes'>('timeline')

  if (!isOpen || !contact) return null

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageCircle className="h-3 w-3" />
      case 'whatsapp':
        return <Phone className="h-3 w-3" />
      case 'email':
        return <Mail className="h-3 w-3" />
      default:
        return <MessageCircle className="h-3 w-3" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'sms':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'whatsapp':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'email':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{contact.name}</h2>
              <p className="text-sm text-muted-foreground">
                {contact.phone || contact.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Details */}
        <div className="p-6 border-b border-border space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {contact.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{contact.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                Added {new Date(contact.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {messages.length} messages
              </span>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex items-center space-x-2 flex-wrap pt-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {contact.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onSendMessage}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('timeline')}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === 'timeline'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="inline h-4 w-4 mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === 'notes'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Notes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'timeline' ? (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((message) => (
                    <div key={message.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border",
                          message.direction === 'outbound'
                            ? "bg-primary/10 border-primary/20"
                            : "bg-muted border-border"
                        )}>
                          {getChannelIcon(message.channel)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium border",
                            getChannelColor(message.channel)
                          )}>
                            {message.channel.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.direction === 'outbound' ? 'Sent' : 'Received'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Contact Notes
                </h4>
                <p className="text-sm text-muted-foreground">
                  {contact.notes || 'No notes yet. Add notes to keep track of important information about this contact.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
