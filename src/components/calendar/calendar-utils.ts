// Calendar utility functions for date manipulation and calendar data processing
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  isToday,
  isWeekend,
  format,
  parseISO,
  addWeeks,
  addMonths,
  getWeek
} from 'date-fns'
import type { 
  CalendarReservation, 
  CalendarEvent, 
  DayData, 
  WeekData, 
  MonthData,
  CalendarView 
} from '@/types/calendar'

// Color palette for apartment assignments
const APARTMENT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', dot: 'bg-teal-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', dot: 'bg-indigo-500' },
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', dot: 'bg-red-500' }
]

// Assign colors to apartments consistently
export function getApartmentColor(apartmentId: string, apartmentList: Array<{ id: string }>) {
  const index = apartmentList.findIndex(apt => apt.id === apartmentId)
  return APARTMENT_COLORS[index % APARTMENT_COLORS.length]
}

// Convert reservation data to calendar events
export function reservationsToEvents(
  reservations: CalendarReservation[],
  apartments: Array<{ id: string; name: string }>
): CalendarEvent[] {
  return reservations.map(reservation => ({
    id: reservation.id,
    type: 'reservation' as const,
    title: reservation.guest_name,
    start: parseISO(reservation.check_in),
    end: parseISO(reservation.check_out),
    apartmentId: reservation.apartment_id,
    apartmentName: reservation.apartment_name,
    data: reservation,
    color: getApartmentColor(reservation.apartment_id, apartments).bg,
    textColor: getApartmentColor(reservation.apartment_id, apartments).text
  }))
}

// Generate calendar days for month view
export function generateMonthDays(date: Date): DayData[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: DayData[] = []
  let currentDay = calendarStart

  while (currentDay <= calendarEnd) {
    days.push({
      date: new Date(currentDay),
      events: [],
      isToday: isToday(currentDay),
      isCurrentMonth: isSameMonth(currentDay, date),
      isWeekend: isWeekend(currentDay),
      availability: 'available' // Will be updated based on events
    })
    currentDay = addDays(currentDay, 1)
  }

  return days
}

// Generate weeks for month view
export function generateMonthWeeks(date: Date, events: CalendarEvent[]): WeekData[] {
  const days = generateMonthDays(date)
  
  // Distribute events to days
  events.forEach(event => {
    const eventStart = event.start
    const eventEnd = event.end
    
    days.forEach(day => {
      if (day.date >= eventStart && day.date < eventEnd) {
        day.events.push(event)
      }
    })
  })

  // Update availability based on events
  days.forEach(day => {
    if (day.events.length === 0) {
      day.availability = 'available'
    } else if (day.events.every(event => event.type === 'cleaning')) {
      day.availability = 'partial'
    } else {
      day.availability = 'unavailable'
    }
  })

  // Group days into weeks
  const weeks: WeekData[] = []
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    weeks.push({
      weekNumber: getWeek(weekDays[0].date),
      days: weekDays
    })
  }

  return weeks
}

// Generate calendar data for month view
export function generateMonthData(date: Date, events: CalendarEvent[]): MonthData {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    weeks: generateMonthWeeks(date, events)
  }
}

// Generate days for week view
export function generateWeekDays(date: Date, events: CalendarEvent[]): DayData[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const days: DayData[] = []

  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(weekStart, i)
    const dayEvents = events.filter(event => {
      return currentDay >= event.start && currentDay < event.end
    })

    days.push({
      date: currentDay,
      events: dayEvents,
      isToday: isToday(currentDay),
      isCurrentMonth: true, // All days in week view are considered current
      isWeekend: isWeekend(currentDay),
      availability: dayEvents.length === 0 ? 'available' : 
                   dayEvents.every(event => event.type === 'cleaning') ? 'partial' : 'unavailable'
    })
  }

  return days
}

// Generate time slots for day view (24-hour grid)
export function generateDayTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    slots.push(format(new Date().setHours(hour, 0, 0, 0), 'HH:mm'))
  }
  return slots
}

// Get events for a specific day
export function getEventsForDay(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = event.start
    const eventEnd = event.end
    
    return (
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd) ||
      (date > eventStart && date < eventEnd)
    )
  })
}

// Calculate reservation overlap in a day (for positioning)
export function calculateEventOverlaps(events: CalendarEvent[]): Array<{
  event: CalendarEvent
  column: number
  totalColumns: number
}> {
  if (events.length === 0) return []

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
  
  // Simple column assignment - can be enhanced for complex overlaps
  return sortedEvents.map((event, index) => ({
    event,
    column: index % 3, // Max 3 columns for simplicity
    totalColumns: Math.min(events.length, 3)
  }))
}

// Check if a date is within a date range
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate
}

// Format date range for display
export function formatDateRange(startDate: Date, endDate: Date, view: CalendarView): string {
  switch (view) {
    case 'day':
      return format(startDate, 'EEEE, MMMM d, yyyy')
    case 'week':
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`
      } else {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
      }
    case 'month':
    default:
      return format(startDate, 'MMMM yyyy')
  }
}

// Get the next/previous period for navigation
export function getNavigationDate(date: Date, view: CalendarView, direction: 'prev' | 'next'): Date {
  const multiplier = direction === 'next' ? 1 : -1
  
  switch (view) {
    case 'day':
      return addDays(date, multiplier)
    case 'week':
      return addWeeks(date, multiplier)
    case 'month':
    default:
      return addMonths(date, multiplier)
  }
}

// Check if two date ranges overlap
export function doDateRangesOverlap(
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

// Get status color based on reservation status
export function getReservationStatusColor(status: CalendarReservation['status']) {
  switch (status) {
    case 'confirmed':
    case 'checked_in':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'checked_out':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'cancelled':
    case 'archived':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Get platform color for badges
export function getPlatformColor(platform: CalendarReservation['platform']) {
  switch (platform) {
    case 'airbnb':
      return 'bg-red-100 text-red-800'
    case 'vrbo':
      return 'bg-blue-100 text-blue-800'
    case 'direct':
      return 'bg-green-100 text-green-800'
    case 'booking_com':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Truncate text for display in small spaces
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Calculate nights between dates
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut
  
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

// Format currency for display
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}