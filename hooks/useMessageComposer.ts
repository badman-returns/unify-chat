"use client"

import { useState, useCallback } from 'react'

export function useMessageComposer(selectedChannel: 'sms' | 'whatsapp' | 'email' | 'all') {
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getPlaceholderText = useCallback(() => {
    switch (selectedChannel) {
      case 'sms': return 'Enter phone number (e.g., +1234567890)'
      case 'whatsapp': return 'Enter WhatsApp number (e.g., +1234567890)'
      case 'email': return 'Enter email address'
      default: return 'Select a channel first'
    }
  }, [selectedChannel])

  const getCharacterLimit = useCallback(() => {
    switch (selectedChannel) {
      case 'sms': return 'SMS: 160 characters per segment'
      case 'whatsapp': return 'WhatsApp: Up to 4096 characters'
      case 'email': return 'Email: No character limit'
      default: return ''
    }
  }, [selectedChannel])

  const handleSend = useCallback(async () => {
    if (!recipient || !message) {
      setError('Please fill in recipient and message')
      return
    }

    if (selectedChannel === 'all') {
      setError('Please select a specific channel to send messages')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: any = {
        channel: selectedChannel,
        to: recipient,
        content: message
      }

      if (selectedChannel === 'email' && subject) {
        payload.metadata = { subject }
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Message sent successfully via ${selectedChannel}!`)
        setMessage('')
        setRecipient('')
        setSubject('')
      } else {
        setError(result.error || 'Failed to send message')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [recipient, message, subject, selectedChannel])

  const resetForm = useCallback(() => {
    setRecipient('')
    setMessage('')
    setSubject('')
    setError(null)
    setSuccess(null)
  }, [])

  const isDisabled = selectedChannel === 'all' || isLoading
  const canSend = !isDisabled && recipient && message

  return {
    recipient,
    setRecipient,
    message,
    setMessage,
    subject,
    setSubject,
    isLoading,
    error,
    success,
    isDisabled,
    canSend,
    handleSend,
    resetForm,
    getPlaceholderText,
    getCharacterLimit
  }
}
