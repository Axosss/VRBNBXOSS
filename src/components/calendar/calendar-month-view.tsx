'use client'

import { format, isSameMonth, isToday } from 'date-fns'
import { CalendarData } from '@/types/calendar'
// import { ReservationCard } from './reservation-card' // Unused for now
import { 
  generateMonthData, 
  reservationsToEvents,
  getApartmentColor 
} from './calendar-utils'
import { cn } from '@/lib/utils'

interface CalendarMonthViewProps {
  data: CalendarData
  currentDate: Date
  onDateClick: (date: Date, apartmentId?: string) => void
  className?: string
}

export function CalendarMonthView({
  data,
  currentDate,
  onDateClick,
  className
}: CalendarMonthViewProps) {
  const events = reservationsToEvents(data.reservations, data.apartments)
  const monthData = generateMonthData(currentDate, events)

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('calendar-month-view', className)}>
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
        {monthData.weeks.map((week) =>
          week.days.map((day) => {
            const dayEvents = day.events.filter(event => event.type === 'reservation')
            const isCurrentMonth = isSameMonth(day.date, currentDate)
            const isDayToday = isToday(day.date)
            
            return (
              <div
                key={day.date.toISOString()}
                className={cn(
                  'bg-background min-h-[120px] p-2 cursor-pointer hover:bg-accent/50 transition-colors',
                  !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                  isDayToday && 'bg-primary/5 border-primary'
                )}
                onClick={() => onDateClick(day.date)}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium flex items-center justify-center w-6 h-6 rounded-full',
                      isDayToday 
                        ? 'bg-primary text-primary-foreground' 
                        : isCurrentMonth 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                    )}
                  >
                    {format(day.date, 'd')}
                  </span>
                  
                  {/* Availability indicator */}
                  {day.availability && (
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        day.availability === 'available' && 'bg-green-500',
                        day.availability === 'partial' && 'bg-yellow-500',
                        day.availability === 'unavailable' && 'bg-red-500'
                      )}
                    />
                  )}
                </div>

                {/* Reservations */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const reservation = event.data as import('@/types/calendar').CalendarReservation
                    const apartmentColor = getApartmentColor(event.apartmentId, data.apartments)
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'text-xs px-2 py-1 rounded border truncate',
                          apartmentColor.bg,
                          apartmentColor.border,
                          apartmentColor.text
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Could open reservation details modal
                        }}
                      >
                        <div className="font-medium truncate">
                          {reservation.guest_name}
                        </div>
                        <div className="text-xs opacity-75">
                          {reservation.apartment_name}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Show "+X more" if there are more events */}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-2">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}