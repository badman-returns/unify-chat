"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarProps {
  selected?: Date
  onSelect: (date: Date) => void
  minDate?: Date
}

export function Calendar({ selected, onSelect, minDate = new Date() }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date())

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return date < min
  }

  const isDateSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onSelect(newDate)
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={previousMonth}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="text-sm font-semibold text-foreground">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1 place-items-center">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-muted-foreground py-1 w-7"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 place-items-center">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="w-7 h-7" />
        ))}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            disabled={isDateDisabled(day)}
            className={cn(
              "w-7 h-7 rounded-md text-xs font-medium transition-all flex items-center justify-center",
              isDateSelected(day)
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-muted text-foreground",
              isDateDisabled(day) && "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}
