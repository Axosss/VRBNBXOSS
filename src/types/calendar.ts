// Calendar-specific types for the VRBNBXOSS application
// These types support efficient calendar data fetching and real-time updates

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarFilters {
  startDate: string
  endDate: string
  apartmentIds?: string[]
  view: CalendarView
  includeCleanings?: boolean
}

export interface CalendarReservation {
  id: string
  apartmentId: string
  apartmentName: string
  guestName: string
  platform: 'airbnb' | 'vrbo' | 'direct' | 'booking_com'
  checkIn: string
  checkOut: string
  guestCount: number
  totalPrice: number
  status: 'draft' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'archived'
  notes?: string
  contactInfo?: Record<string, any>
  nights: number
  // Cleaning information
  cleaningId?: string
  cleaningStatus?: 'needed' | 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'cancelled'
  cleaningDate?: string
}

export interface CalendarEvent {
  id: string
  type: 'reservation' | 'cleaning' | 'maintenance' | 'blocked'
  title: string
  start: Date
  end: Date
  apartmentId: string
  apartmentName: string
  data: CalendarReservation | CalendarCleaning | CalendarMaintenance | CalendarBlocked
  color?: string
  textColor?: string
}

export interface CalendarCleaning {
  id: string
  apartmentId: string
  apartmentName: string
  cleanerName?: string
  scheduledDate: string
  duration?: string
  status: 'needed' | 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'cancelled'
  instructions?: string
  reservationId?: string
}

export interface CalendarMaintenance {
  id: string
  apartmentId: string
  apartmentName: string
  title: string
  description?: string
  scheduledDate: string
  duration?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface CalendarBlocked {
  id: string
  apartmentId: string
  apartmentName: string
  startDate: string
  endDate: string
  reason: 'owner_use' | 'maintenance' | 'seasonal' | 'other'
  notes?: string
}

export interface AvailabilitySlot {
  gapStart: string
  gapEnd: string
  gapDays: number
}

export interface CalendarStats {
  totalNights: number
  occupiedNights: number
  occupancyRate: number
  totalRevenue: number
  totalReservations: number
  platformBreakdown: Record<string, number>
}

export interface CalendarData {
  reservations: CalendarReservation[]
  cleanings?: CalendarCleaning[]
  stats?: CalendarStats
  dateRange: {
    start: string
    end: string
  }
  apartments: {
    id: string
    name: string
  }[]
}

// Quick add reservation interface
export interface QuickReservation {
  apartmentId: string
  checkIn: string
  checkOut: string
  guestName: string
  guestCount: number
  platform: 'airbnb' | 'vrbo' | 'direct' | 'booking_com'
  totalPrice: number
  notes?: string
}

// Availability check types
export interface AvailabilityCheck {
  apartmentId: string
  checkIn: string
  checkOut: string
  excludeReservationId?: string
}

export interface AvailabilityResult {
  available: boolean
  conflicts?: {
    id: string
    checkIn: string
    checkOut: string
    guestName: string
  }[]
  suggestions?: AvailabilitySlot[]
}

// Real-time subscription types
export interface CalendarSubscription {
  channel: string
  events: ('INSERT' | 'UPDATE' | 'DELETE')[]
  table: 'reservations' | 'cleanings' | 'apartments'
  filter?: string
}

// Calendar navigation types
export interface CalendarNavigation {
  currentDate: Date
  view: CalendarView
  selectedDate?: Date
  selectedApartments: string[]
}

// Calendar preferences stored in user settings
export interface CalendarPreferences {
  defaultView: CalendarView
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  showCleanings: boolean
  showAvailability: boolean
  colorScheme: 'light' | 'dark' | 'system'
  timeFormat: '12h' | '24h'
  timezone: string
  apartmentOrder: string[]
}

// API response types
export interface CalendarAPIResponse {
  success: boolean
  data: CalendarData
  message?: string
}

export interface AvailabilityAPIResponse {
  success: boolean
  data: AvailabilityResult
  message?: string
}

export interface QuickAddAPIResponse {
  success: boolean
  data: CalendarReservation
  message?: string
}

// Calendar state management types
export interface CalendarState {
  loading: boolean
  error: string | null
  data: CalendarData | null
  filters: CalendarFilters
  navigation: CalendarNavigation
  preferences: CalendarPreferences
  subscriptions: CalendarSubscription[]
}

// Utility types for calendar calculations
export interface DateRange {
  start: Date
  end: Date
}

export interface MonthData {
  year: number
  month: number
  weeks: WeekData[]
}

export interface WeekData {
  weekNumber: number
  days: DayData[]
}

export interface DayData {
  date: Date
  events: CalendarEvent[]
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
  availability?: 'available' | 'partial' | 'unavailable'
}

// Export all platform-specific types
export const PLATFORMS = ['airbnb', 'vrbo', 'direct', 'booking_com'] as const
export const RESERVATION_STATUSES = ['draft', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'archived'] as const
export const CLEANING_STATUSES = ['needed', 'scheduled', 'in_progress', 'completed', 'verified', 'cancelled'] as const
export const CALENDAR_VIEWS = ['month', 'week', 'day'] as const

// Type guards
export function isValidCalendarView(view: string): view is CalendarView {
  return CALENDAR_VIEWS.includes(view as CalendarView)
}

export function isValidPlatform(platform: string): platform is CalendarReservation['platform'] {
  return PLATFORMS.includes(platform as any)
}

export function isValidReservationStatus(status: string): status is CalendarReservation['status'] {
  return RESERVATION_STATUSES.includes(status as any)
}

export function isCalendarReservation(event: CalendarEvent): event is CalendarEvent & { data: CalendarReservation } {
  return event.type === 'reservation'
}

export function isCalendarCleaning(event: CalendarEvent): event is CalendarEvent & { data: CalendarCleaning } {
  return event.type === 'cleaning'
}