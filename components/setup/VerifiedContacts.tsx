"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Phone, Mail, MessageCircle, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  isVerified: boolean
  verifiedAt?: Date
  lastMessage?: {
    channel: string
    timestamp: Date
  }
}

export function VerifiedContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      
      // In production, fetch verification status from Twilio API
      // For now, mock verification status
      const contactsWithVerification = data.map((contact: any) => ({
        ...contact,
        isVerified: contact.phone?.startsWith('+1229') || false // Mock: your trial number
      }))
      
      setContacts(contactsWithVerification)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'verified') return contact.isVerified
    if (filter === 'unverified') return !contact.isVerified
    return true
  })

  const verifiedCount = contacts.filter(c => c.isVerified).length
  const unverifiedCount = contacts.filter(c => !c.isVerified).length

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Contact Verification Status
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              In <strong>Trial Mode</strong>, you can only send messages to verified phone numbers. 
              Contacts marked with a green checkmark are verified and can receive messages.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-blue-900">
                  <strong>{verifiedCount}</strong> Verified
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-blue-900">
                  <strong>{unverifiedCount}</strong> Unverified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === 'all'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === 'verified'
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              ✓ Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === 'unverified'
                  ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              ✗ Unverified ({unverifiedCount})
            </button>
          </div>

          <button
            onClick={fetchContacts}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Refresh contacts"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h3 className="text-lg font-semibold">Contact List</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No contacts found' : `No ${filter} contacts`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Verification Status */}
                    <div className="flex-shrink-0">
                      {contact.isVerified ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {contact.name}
                        </h4>
                        {contact.isVerified ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            Unverified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {contact.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.lastMessage && (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>
                              Last {contact.lastMessage.channel} message{' '}
                              {new Date(contact.lastMessage.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {!contact.isVerified && contact.phone && (
                      <a
                        href={`https://console.twilio.com/us1/develop/phone-numbers/manage/verified?frameUrl=%2Fconsole%2Fphone-numbers%2Fverified`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <span>Verify in Twilio</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Need to Verify More Contacts?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          To send messages to unverified contacts in Trial Mode, you need to verify their phone numbers in the Twilio Console.
        </p>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <span className="font-semibold text-foreground">1.</span>
            <span className="text-muted-foreground">
              Click "Verify in Twilio" next to any unverified contact
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="font-semibold text-foreground">2.</span>
            <span className="text-muted-foreground">
              Add the phone number in Twilio Console
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="font-semibold text-foreground">3.</span>
            <span className="text-muted-foreground">
              Twilio will send a verification code via call or SMS
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="font-semibold text-foreground">4.</span>
            <span className="text-muted-foreground">
              Once verified, the contact will show with a green checkmark
            </span>
          </div>
        </div>

        <a
          href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium mt-6"
        >
          <span>Manage Verified Numbers</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
