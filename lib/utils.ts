import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse any date value into a valid Date object
 */
export function safeParseDate(dateValue: any): Date {
  try {
    if (!dateValue) return new Date()
    
    let parsedDate: Date
    
    if (typeof dateValue === 'string') {
      // Handle ISO strings and regular date strings
      parsedDate = dateValue.includes('T') ? parseISO(dateValue) : new Date(dateValue)
    } else {
      parsedDate = new Date(dateValue)
    }
    
    return isValid(parsedDate) ? parsedDate : new Date()
  } catch (error) {
    console.warn('Error parsing date:', dateValue, error)
    return new Date()
  }
}

/**
 * Format time with safe date handling
 */
export function formatTime(date: Date | string | number): string {
  try {
    const validDate = safeParseDate(date)
    
    if (!isValid(validDate)) {
      return '--:--'
    }
    
    return format(validDate, 'h:mm a')
  } catch (error) {
    console.error('Error formatting time:', error, 'Date:', date)
    return '--:--'
  }
}

/**
 * Format date with relative time (Today, Yesterday, etc.)
 */
export function formatDate(date: Date | string | number): string {
  try {
    const validDate = safeParseDate(date)
    
    if (!isValid(validDate)) {
      return 'Invalid date'
    }
    
    const now = new Date()
    const diff = now.getTime() - validDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    
    return format(validDate, 'MMM d')
  } catch (error) {
    console.error('Error formatting date:', error, 'Date:', date)
    return 'Invalid date'
  }
}

/**
 * Format timestamp for message display (e.g., "2 minutes ago", "Yesterday 3:45 PM")
 */
export function formatMessageTime(date: Date | string | number): string {
  try {
    const validDate = safeParseDate(date)
    
    if (!isValid(validDate)) {
      return '--:--'
    }
    
    const now = new Date()
    const diff = now.getTime() - validDate.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return format(validDate, 'h:mm a')
    if (days === 1) return `Yesterday ${format(validDate, 'h:mm a')}`
    if (days < 7) return format(validDate, 'EEE h:mm a')
    
    return format(validDate, 'MMM d, h:mm a')
  } catch (error) {
    console.error('Error formatting message time:', error, 'Date:', date)
    return '--:--'
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | number): boolean {
  try {
    const validDate = safeParseDate(date)
    const today = new Date()
    
    return validDate.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
