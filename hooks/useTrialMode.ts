"use client"

import { useState, useEffect } from 'react'

interface TrialModeInfo {
  isTrial: boolean
  verifiedNumbers: string[]
  isVerified: (phoneOrEmail: string) => boolean
  verifiedCount: number
  totalContacts: number
}

/**
 * Hook to manage Twilio trial mode restrictions
 * In trial mode, messages can only be sent to verified phone numbers
 */
export function useTrialMode(): TrialModeInfo {
  const [verifiedNumbers, setVerifiedNumbers] = useState<string[]>([])
  const [totalContacts, setTotalContacts] = useState(0)

  // In production, fetch from Twilio API
  // For now, detect trial mode from env and mock verified numbers
  const isTrial = true // Set to false when upgraded

  useEffect(() => {
    fetchVerifiedNumbers()
    fetchContactCount()
  }, [])

  const fetchVerifiedNumbers = async () => {
    try {
      // In production, call Twilio API to get verified numbers
      // GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/OutgoingCallerIds.json
      
      // For now, mock with trial number
      const trialNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+12298087986'
      setVerifiedNumbers([trialNumber, '+12298087986'])
    } catch (error) {
      console.error('Failed to fetch verified numbers:', error)
    }
  }

  const fetchContactCount = async () => {
    try {
      const response = await fetch('/api/contacts')
      const contacts = await response.json()
      setTotalContacts(contacts.length)
    } catch (error) {
      console.error('Failed to fetch contact count:', error)
    }
  }

  const isVerified = (phoneOrEmail: string): boolean => {
    if (!isTrial) return true // In production, all numbers are allowed
    
    // Clean the phone number for comparison
    const cleanNumber = phoneOrEmail.replace(/[^+\d]/g, '')
    return verifiedNumbers.some(verified => 
      verified.replace(/[^+\d]/g, '') === cleanNumber
    )
  }

  return {
    isTrial,
    verifiedNumbers,
    isVerified,
    verifiedCount: verifiedNumbers.length,
    totalContacts
  }
}
