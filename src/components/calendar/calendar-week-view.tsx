'use client'

import { format, isToday } from 'date-fns'
import { CalendarData } from '@/types/calendar'
import { 
  generateWeekDays, 
  reservationsToEvents,
  getApartmentColor 
} from './calendar-utils'
import { cn } from '@/lib/utils'

interface CalendarWeekViewProps {
  data: CalendarData
  currentDate: Date
  onDateClick: (date: Date, apartmentId?: string) => void
  className?: string
}

export function CalendarWeekView({
  data,
  currentDate,
  onDateClick,
  className
}: CalendarWeekViewProps) {
  const events = reservationsToEvents(data.reservations, data.apartments)
  const weekDays = generateWeekDays(currentDate, events)
  
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className={cn('calendar-week-view', className)}>
      {/* Header with days */}
      <div className="grid grid-cols-8 gap-px bg-border rounded-t-lg overflow-hidden">
        {/* Time column header */}
        <div className="bg-muted p-3"></div>
        
        {/* Day headers */}
        {weekDays.map((day) => {
          const isDayToday = isToday(day.date)
          
          return (
            <div
              key={day.date.toISOString()}
              className={cn(
                'bg-muted p-3 text-center cursor-pointer hover:bg-muted/80',
                isDayToday && 'bg-primary/10'
              )}
              onClick={() => onDateClick(day.date)}
            >
              <div className="text-sm text-muted-foreground">
                {format(day.date, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold mt-1 flex items-center justify-center w-8 h-8 rounded-full mx-auto',
                  isDayToday 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground'
                )}
              >
                {format(day.date, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-8 gap-px bg-border rounded-b-lg overflow-hidden max-h-[600px] overflow-y-auto">
        {/* Time slots */}
        {timeSlots.map((hour) => (
          <div key={`time-${hour}`} className="contents">
            {/* Time label */}
            <div className="bg-muted p-2 text-xs text-muted-foreground text-right border-r">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
            
            {/* Day columns */}
            {weekDays.map((day) => {
              const dayEvents = day.events.filter(event => {
                const eventStart = event.start
                const eventEnd = event.end
                const slotStart = new Date(day.date)
                slotStart.setHours(hour, 0, 0, 0)
                const slotEnd = new Date(slotStart)
                slotEnd.setHours(hour + 1, 0, 0, 0)
                
                return eventStart < slotEnd && eventEnd > slotStart
              })

              return (
                <div
                  key={`${day.date.toISOString()}-${hour}`}
                  className="bg-background p-1 min-h-[60px] cursor-pointer hover:bg-accent/30 relative border-b border-border/50"
                  onClick={() => onDateClick(day.date)}
                >
                  {dayEvents.map((event, index) => {
                    const reservation = event.data as import('@/types/calendar').CalendarReservation
                    const apartmentColor = getApartmentColor(event.apartmentId, data.apartments)
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'text-xs px-2 py-1 rounded border mb-1 truncate',
                          apartmentColor.bg,
                          apartmentColor.border,
                          apartmentColor.text
                        )}
                        style={{
                          position: index === 0 ? 'relative' : 'absolute',
                          top: index * 20,
                          zIndex: 10 - index
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Could open reservation details
                        }}
                      >
                        <div className="font-medium truncate">
                          {reservation.guest_name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}