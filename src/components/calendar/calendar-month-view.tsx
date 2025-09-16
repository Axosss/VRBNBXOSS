'use client'

import { format, isSameMonth, isToday, isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarData } from '@/types/calendar'
import { ReservationBar } from './reservation-bar'
import { 
  generateMonthData, 
  reservationsToEvents,
  getApartmentColor,
  calculateReservationPositions 
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
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  // Get cleanings for the current month
  const monthCleanings = data.cleanings?.filter(cleaning => {
    const cleaningDate = new Date(cleaning.scheduledDate)
    return cleaningDate >= monthStart && cleaningDate <= monthEnd
  }) || []
  
  // Calculate positions for all reservation bars
  const reservationPositions = calculateReservationPositions(
    data.reservations,
    monthStart,
    monthEnd
  )

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Group positions by week for better organization
  const positionsByWeek = reservationPositions.reduce((acc, item) => {
    const weekKey = Math.floor(item.position.row)
    if (!acc[weekKey]) {
      acc[weekKey] = []
    }
    acc[weekKey].push(item)
    return acc
  }, {} as Record<number, typeof reservationPositions>)
  
  // Calculate maximum row offset for each week
  const maxRowOffsetByWeek: Record<number, number> = {}
  Object.entries(positionsByWeek).forEach(([weekKey, items]) => {
    maxRowOffsetByWeek[parseInt(weekKey)] = Math.max(
      0,
      ...items.map(item => item.position.rowOffset)
    )
  })

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
        {monthData.weeks.map((week, weekIndex) => {
          const weekNumber = weekIndex + 1
          const weekReservations = positionsByWeek[weekNumber] || []
          const maxRowOffset = maxRowOffsetByWeek[weekNumber] || 0
          
          return week.days.map((day) => {
            const isCurrentMonth = isSameMonth(day.date, currentDate)
            const isDayToday = isToday(day.date)
            
            // Get cleanings for this day
            const dayCleanings = monthCleanings.filter(cleaning => 
              isSameDay(new Date(cleaning.scheduledDate), day.date)
            )
            
            // Calculate the required height for this cell
            // Base: 40px (header) + reservations + cleanings + padding
            const reservationHeight = (maxRowOffset + 1) * 36 // 36px per reservation row
            const cleaningHeight = dayCleanings.length > 0 ? (dayCleanings.length * 28 + 16) : 0 // 28px per cleaning + padding
            const minHeight = Math.max(120, 40 + reservationHeight + cleaningHeight + 8)
            
            return (
              <div
                key={day.date.toISOString()}
                className={cn(
                  'bg-background p-2 cursor-pointer hover:bg-accent/50 transition-colors relative',
                  !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                  isDayToday && 'ring-1 ring-primary/30 rounded-lg bg-primary/5'
                )}
                style={{ minHeight: `${minHeight}px` }}
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
                
                {/* Cleaning badges - positioned below reservations */}
                {dayCleanings.length > 0 && (
                  <div 
                    className="absolute left-2 right-2 space-y-1"
                    style={{
                      // Position below the last reservation row
                      // 40px base + (maxRowOffset + 1) * 36px for reservations + 8px padding
                      top: `${40 + (maxRowOffset + 1) * 36 + 8}px`
                    }}
                  >
                    {dayCleanings.slice(0, 2).map((cleaning) => {
                      // Extract time from scheduledDate (format: "2024-09-05T10:00:00")
                      const cleaningTime = new Date(cleaning.scheduledDate).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      
                      return (
                        <div 
                          key={cleaning.id}
                          className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full truncate relative z-5"
                          title={`Ménage: ${cleaning.apartmentName} - ${cleaningTime} - ${cleaning.cleanerName || 'Non assigné'} - Durée: ${cleaning.duration || '2h'}`}
                        >
                          🧹 {cleaning.apartmentName}
                        </div>
                      )
                    })}
                    {dayCleanings.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayCleanings.length - 2} more
                      </div>
                    )}
                  </div>
                )}
                
                {/* Render reservation bars for this week at the first day of the week */}
                {day === week.days[0] && weekReservations.length > 0 && (
                  <div className="absolute top-10 left-0 right-0 z-10" style={{ width: '700%' }}>
                    {weekReservations.map((item, index) => {
                      const apartmentColor = getApartmentColor(item.reservation.apartmentId, data.apartments)
                      const offsetTop = item.position.rowOffset * 36 // 36px per row offset
                      
                      return (
                        <div
                          key={`${item.reservation.id}-${index}`}
                          className={cn(
                            'absolute h-8 px-2 py-1 cursor-pointer transition-all hover:z-20 hover:shadow-lg',
                            'flex items-center justify-between pointer-events-auto',
                            apartmentColor.bg,
                            apartmentColor.border,
                            apartmentColor.text,
                            'border',
                            'overflow-hidden rounded-md'
                          )}
                          style={{
                            left: `${((item.position.startCol - 1) * 100) / 7}%`,
                            width: `${(item.position.span * 100) / 7}%`,
                            top: `${offsetTop}px`
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('Clicked reservation:', item.reservation)
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.reservation.guestAvatar && (
                              <img 
                                src={item.reservation.guestAvatar} 
                                alt={item.reservation.guestName}
                                className="w-5 h-5 rounded-full flex-shrink-0"
                              />
                            )}
                            <div className="truncate">
                              <span className="font-medium text-sm">
                                {item.reservation.guestName}
                              </span>
                              {item.position.span > 1 && (
                                <span className="text-xs ml-1 opacity-75">
                                  • {item.position.span} {item.position.span === 1 ? 'nuit' : 'nuits'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {item.position.span >= 3 && item.reservation.totalPrice && item.reservation.totalPrice > 0 && (
                            <div className="text-sm font-medium flex-shrink-0 ml-2">
                              {item.reservation.totalPrice.toFixed(0)}€
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        })}
      </div>
    </div>
  )
}