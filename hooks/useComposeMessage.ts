import { useState, useCallback } from 'react'
import { useTrialMode } from './useTrialMode'
import { sendMessageSchema } from '@/lib/validations/message'

interface UseComposeMessageOptions {
  initialChannel?: 'sms' | 'whatsapp' | 'email'
  onSuccess?: () => void
}

export function useComposeMessage({ 
  initialChannel = 'sms',
  onSuccess 
}: UseComposeMessageOptions = {}) {
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>(initialChannel)
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [showAttachments, setShowAttachments] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  
  const { isTrial, isVerified } = useTrialMode()

  const getPlaceholder = useCallback(() => {
    switch (channel) {
      case 'sms':
      case 'whatsapp':
        return '+1234567890'
      case 'email':
        return 'customer@example.com'
    }
  }, [channel])

  const validateMessage = useCallback(() => {
    const validation = sendMessageSchema.safeParse({
      to: recipient,
      content: message,
      channel,
      metadata: attachments.length > 0 ? { hasAttachments: true } : undefined
    })

    if (!validation.success) {
      return validation.error.errors[0].message
    }

    if (isTrial && channel !== 'email' && !isVerified(recipient)) {
      return `This number is not verified. In Trial Mode, you can only send to verified numbers. Verify it in Twilio Console or upgrade your account.`
    }

    return null
  }, [recipient, message, channel, attachments, isTrial, isVerified])

  const resetForm = useCallback(() => {
    setRecipient('')
    setMessage('')
    setAttachments([])
    setShowAttachments(false)
    setError('')
  }, [])

  const handleSend = useCallback(async () => {
    const validationError = validateMessage()
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      setIsSending(true)
      setError('')

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          channel,
          to: recipient,
          metadata: {
            newConversation: true,
            hasAttachments: attachments.length > 0
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      resetForm()
      onSuccess?.()
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      return false
    } finally {
      setIsSending(false)
    }
  }, [validateMessage, message, channel, recipient, attachments, resetForm, onSuccess])

  const handleRecipientChange = useCallback((value: string) => {
    setRecipient(value)
    setError('')
  }, [])

  const canSend = !isSending && recipient.trim() && message.trim()

  const characterLimit = channel === 'sms' ? 160 : 1000
  const characterCount = message.length
  const isTrialRestricted = isTrial && channel !== 'email' && recipient && !isVerified(recipient)

  return {
    channel,
    setChannel,
    recipient,
    setRecipient: handleRecipientChange,
    message,
    setMessage,
    attachments,
    setAttachments,
    showAttachments,
    setShowAttachments,
    isSending,
    error,
    canSend,
    handleSend,
    getPlaceholder,
    characterLimit,
    characterCount,
    isTrialRestricted,
    resetForm
  }
}
