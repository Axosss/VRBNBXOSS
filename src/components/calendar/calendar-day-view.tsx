'use client'

import { format, isToday } from 'date-fns'
import { CalendarData } from '@/types/calendar'
import { 
  getEventsForDay, 
  reservationsToEvents,
  getApartmentColor,
  calculateEventOverlaps
} from './calendar-utils'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface CalendarDayViewProps {
  data: CalendarData
  currentDate: Date
  onDateClick: (date: Date, apartmentId?: string) => void
  className?: string
}

export function CalendarDayView({
  data,
  currentDate,
  onDateClick,
  className
}: CalendarDayViewProps) {
  const events = reservationsToEvents(data.reservations, data.apartments)
  const dayEvents = getEventsForDay(currentDate, events)
  const eventOverlaps = calculateEventOverlaps(dayEvents)
  
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
  const isDayToday = isToday(currentDate)

  return (
    <div className={cn('calendar-day-view', className)}>
      {/* Day header */}
      <div className="bg-muted rounded-t-lg p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {isDayToday && (
              <span className="text-sm text-primary font-medium">Today</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
          </div>
        </div>
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-y-auto max-h-[600px] bg-background rounded-b-lg">
        <div className="grid grid-cols-[80px_1fr] gap-0">
          {timeSlots.map((hour) => (
            <div key={hour} className="contents">
              {/* Time label */}
              <div className="p-2 text-xs text-muted-foreground text-right border-r border-b border-border/50 bg-muted/30">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              
              {/* Event area */}
              <div 
                className="min-h-[60px] p-2 border-b border-border/50 cursor-pointer hover:bg-accent/30 relative"
                onClick={() => onDateClick(currentDate)}
              >
                {/* Render events that overlap this hour */}
                {eventOverlaps
                  .filter(({ event }) => {
                    const eventStart = event.start
                    const eventEnd = event.end
                    const slotStart = new Date(currentDate)
                    slotStart.setHours(hour, 0, 0, 0)
                    const slotEnd = new Date(slotStart)
                    slotEnd.setHours(hour + 1, 0, 0, 0)
                    
                    return eventStart < slotEnd && eventEnd > slotStart
                  })
                  .map(({ event, column, totalColumns }) => {
                    const reservation = event.data as CalendarReservation
                    const apartmentColor = getApartmentColor(event.apartmentId, data.apartments)
                    
                    // Calculate position and duration
                    const eventStart = event.start
                    const eventEnd = event.end
                    const slotStart = new Date(currentDate)
                    slotStart.setHours(hour, 0, 0, 0)
                    
                    // Calculate if this is the first slot for this event
                    const isFirstSlot = eventStart >= slotStart && eventStart < new Date(slotStart.getTime() + 60 * 60 * 1000)
                    
                    if (!isFirstSlot) return null
                    
                    // Calculate duration in hours
                    const durationHours = Math.max(1, Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60)))
                    const width = `${(1 / totalColumns) * 100}%`
                    const left = `${(column / totalColumns) * 100}%`
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'absolute rounded border p-2 shadow-sm',
                          apartmentColor.bg,
                          apartmentColor.border,
                          apartmentColor.text
                        )}
                        style={{
                          left,
                          width,
                          height: `${durationHours * 60 - 4}px`,
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Could open reservation details
                        }}
                      >
                        <div className="font-medium text-sm truncate">
                          {reservation.guest_name}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {reservation.apartment_name}
                        </div>
                        <div className="text-xs opacity-60">
                          {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events summary sidebar */}
      {dayEvents.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Today&apos;s Events</h4>
          <div className="space-y-2">
            {dayEvents.map((event) => {
              const reservation = event.data as CalendarReservation
              const apartmentColor = getApartmentColor(event.apartmentId, data.apartments)
              
              return (
                <div
                  key={event.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded border cursor-pointer hover:opacity-80',
                    apartmentColor.bg,
                    apartmentColor.border
                  )}
                  onClick={() => {
                    // Could open reservation details
                  }}
                >
                  <div className={cn('w-3 h-3 rounded-full', apartmentColor.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-medium truncate', apartmentColor.text)}>
                      {reservation.guest_name}
                    </div>
                    <div className={cn('text-sm opacity-75', apartmentColor.text)}>
                      {reservation.apartment_name} • {reservation.nights} nights
                    </div>
                  </div>
                  <div className={cn('text-sm', apartmentColor.text)}>
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}