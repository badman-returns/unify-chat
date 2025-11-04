"use client"

import { useState, useMemo, useCallback } from 'react'

interface QuickOption {
  label: string
  getValue: () => Date
}

export function useScheduleMessage(minDate: Date = new Date()) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedMinute, setSelectedMinute] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick')

  const quickOptions: QuickOption[] = useMemo(() => [
    {
      label: '30 minutes',
      getValue: () => new Date(Date.now() + 30 * 60 * 1000)
    },
    {
      label: '1 hour',
      getValue: () => new Date(Date.now() + 60 * 60 * 1000)
    },
    {
      label: '2 hours',
      getValue: () => new Date(Date.now() + 2 * 60 * 60 * 1000)
    },
    {
      label: 'Tomorrow 9 AM',
      getValue: () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        return tomorrow
      }
    },
    {
      label: 'Tomorrow 2 PM',
      getValue: () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(14, 0, 0, 0)
        return tomorrow
      }
    },
    {
      label: 'Next Monday 9 AM',
      getValue: () => {
        const date = new Date()
        const day = date.getDay()
        const daysUntilMonday = day === 0 ? 1 : 8 - day
        date.setDate(date.getDate() + daysUntilMonday)
        date.setHours(9, 0, 0, 0)
        return date
      }
    }
  ], [])

  const hours = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  , [])

  const minutes = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  , [])

  const convertTo24Hour = useCallback((hour: string, period: 'AM' | 'PM'): number => {
    let hour24 = parseInt(hour)
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    return hour24
  }, [])

  const getScheduledDateTime = useCallback((): Date | null => {
    if (!selectedDate || !selectedHour || !selectedMinute) {
      return null
    }

    const hour24 = convertTo24Hour(selectedHour, selectedPeriod)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hour24, parseInt(selectedMinute), 0, 0)
    
    if (scheduledDateTime <= new Date()) {
      return null
    }

    return scheduledDateTime
  }, [selectedDate, selectedHour, selectedMinute, selectedPeriod, convertTo24Hour])

  const formattedScheduledTime = useMemo(() => {
    const dateTime = getScheduledDateTime()
    if (!dateTime) return null

    return dateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }, [getScheduledDateTime])

  const handleQuickSchedule = useCallback((option: QuickOption, onSchedule: (date: Date) => void) => {
    onSchedule(option.getValue())
  }, [])

  const handleCustomSchedule = useCallback((onSchedule: (date: Date) => void): boolean => {
    const scheduledDateTime = getScheduledDateTime()
    if (!scheduledDateTime) return false

    onSchedule(scheduledDateTime)
    return true
  }, [getScheduledDateTime])

  const resetForm = useCallback(() => {
    setSelectedDate(undefined)
    setSelectedHour('')
    setSelectedMinute('')
    setSelectedPeriod('AM')
    setActiveTab('quick')
  }, [])

  const canScheduleCustom = selectedDate && selectedHour && selectedMinute

  return {
    selectedDate,
    setSelectedDate,
    selectedHour,
    setSelectedHour,
    selectedMinute,
    setSelectedMinute,
    selectedPeriod,
    setSelectedPeriod,
    activeTab,
    setActiveTab,
    quickOptions,
    hours,
    minutes,
    formattedScheduledTime,
    canScheduleCustom,
    handleQuickSchedule,
    handleCustomSchedule,
    resetForm,
    minDate
  }
}
