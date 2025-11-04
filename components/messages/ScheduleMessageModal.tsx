"use client"

import { Clock, X, Calendar as CalendarIcon, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '../ui/Calendar'
import { useScheduleMessage } from '@/hooks/useScheduleMessage'

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
  const {
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
    handleQuickSchedule: handleQuickScheduleHook,
    handleCustomSchedule: handleCustomScheduleHook
  } = useScheduleMessage(minDate)

  if (!isOpen) return null

  const handleQuickSchedule = (option: any) => {
    handleQuickScheduleHook(option, onSchedule)
    onClose()
  }

  const handleCustomSchedule = () => {
    if (handleCustomScheduleHook(onSchedule)) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Schedule Message</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex border-b border-border mb-4">
            <button
              onClick={() => setActiveTab('quick')}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === 'quick'
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Zap className="inline h-3.5 w-3.5 mr-1.5" />
              Quick Select
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === 'custom'
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <CalendarIcon className="inline h-3.5 w-3.5 mr-1.5" />
              Custom Time
            </button>
          </div>

          {activeTab === 'quick' ? (
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSchedule(option)}
                  className="px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Select Date
                </label>
                <Calendar
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  minDate={minDate}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="">Hour</option>
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="">Min</option>
                    {minutes.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                    className="px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2rem'
                    }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {formattedScheduledTime && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Scheduled for</p>
                  <p className="text-xs font-semibold text-foreground">
                    {formattedScheduledTime}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomSchedule}
                  disabled={!canScheduleCustom}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium",
                    canScheduleCustom
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
