"use client"

import { useState } from 'react'
import { Clock, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScheduleMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduledAt: Date) => void
  minDate?: Date
}

export function ScheduleMessageModal({
  isOpen,
  onClose,
  onSchedule,
  minDate = new Date()
}: ScheduleMessageModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  if (!isOpen) return null

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time')
      return
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`)
    
    if (scheduledDateTime <= new Date()) {
      alert('Please select a future date and time')
      return
    }

    onSchedule(scheduledDateTime)
    onClose()
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // Get current time in HH:MM format
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Schedule Message</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Select Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min={selectedDate === today ? currentTime : undefined}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">Scheduled for:</span>
                <br />
                {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg transition-colors",
              selectedDate && selectedTime
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
