'use client'

import { format, isSameMonth, isToday, isSameDay, startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { CleaningStatusBadge } from './cleaning-status-badge'
import { cn } from '@/lib/utils'
import type { Cleaning } from '@/types/cleaning'
import { Clock, MapPin, User } from 'lucide-react'

interface CleaningMonthViewProps {
  cleanings: Cleaning[]
  currentDate: Date
  onDateClick: (date: Date) => void
  onCleaningClick?: (cleaning: Cleaning) => void
  className?: string
}

export function CleaningMonthView({
  cleanings,
  currentDate,
  onDateClick,
  onCleaningClick,
  className
}: CleaningMonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  // Generate calendar days
  const days = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  // Get cleanings for a specific day
  const getCleaningsForDay = (date: Date) => {
    return cleanings.filter(cleaning => {
      const cleaningDate = new Date(cleaning.scheduledStart)
      return isSameDay(cleaningDate, date)
    }).sort((a, b) => {
      const dateA = new Date(a.scheduledStart)
      const dateB = new Date(b.scheduledStart)
      return dateA.getTime() - dateB.getTime()
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    if (!date || isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('cleaning-month-view', className)}>
      {/* Header row with weekdays */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {weekdays.map(day => (
          <div
            key={day}
            className="bg-muted px-2 py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)
          const dayCleanings = getCleaningsForDay(day)

          // Calculate minimum height based on content
          const minHeight = Math.max(120, 40 + (dayCleanings.length * 80))

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-background p-2 cursor-pointer hover:bg-accent/50 transition-colors relative',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                isDayToday && 'ring-1 ring-primary/30 rounded-lg bg-primary/5'
              )}
              style={{ minHeight: `${minHeight}px` }}
              onClick={(e) => {
                // Only trigger date click if clicking on empty space
                if (e.target === e.currentTarget || e.target.classList.contains('day-number')) {
                  onDateClick(day)
                }
              }}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'day-number text-sm font-medium flex items-center justify-center w-6 h-6 rounded-full',
                    isDayToday
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {/* Cleaning count indicator */}
                {dayCleanings.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {dayCleanings.length}
                  </span>
                )}
              </div>

              {/* Cleanings for this day */}
              <div className="space-y-1">
                {dayCleanings.slice(0, 3).map((cleaning) => (
                  <div
                    key={cleaning.id}
                    className="p-1.5 rounded text-xs cursor-pointer transition-all hover:shadow-sm border-l-2"
                    style={{
                      backgroundColor: getStatusColor(cleaning.status, 0.1),
                      borderLeftColor: getStatusColor(cleaning.status, 1)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCleaningClick?.(cleaning)
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <CleaningStatusBadge
                        status={cleaning.status}
                        className="text-[10px] py-0 px-1 h-4"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(cleaning.scheduledStart)}
                      </span>
                    </div>

                    {cleaning.apartment && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{cleaning.apartment.name}</span>
                      </div>
                    )}

                    {cleaning.cleaner && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        <span className="truncate">{cleaning.cleaner.name}</span>
                      </div>
                    )}
                  </div>
                ))}

                {dayCleanings.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayCleanings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const getStatusColor = (status: string, opacity = 1) => {
  const colors: Record<string, string> = {
    needed: `rgba(249, 115, 22, ${opacity})`, // orange
    scheduled: `rgba(59, 130, 246, ${opacity})`, // blue
    in_progress: `rgba(245, 158, 11, ${opacity})`, // amber
    completed: `rgba(34, 197, 94, ${opacity})`, // green
    verified: `rgba(16, 185, 129, ${opacity})`, // emerald
    cancelled: `rgba(239, 68, 68, ${opacity})` // red
  }
  return colors[status] || colors.scheduled
}