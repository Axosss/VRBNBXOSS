// Custom React hook for calendar data management
// Provides real-time calendar data with optimized caching and state management

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  CalendarFilters, 
  CalendarData, 
  CalendarReservation,
  CalendarStats,
  AvailabilityResult,
  QuickReservation,
  CalendarView 
} from '@/types/calendar'

interface UseCalendarOptions {
  initialFilters?: Partial<CalendarFilters>
  autoRefresh?: boolean
  refreshInterval?: number
  includeStats?: boolean
  enableRealtime?: boolean
}

interface CalendarState {
  data: CalendarData | null
  loading: boolean
  error: string | null
  filters: CalendarFilters
  lastFetch: Date | null
}

interface CalendarActions {
  // Data fetching
  fetchCalendarData: (filters?: Partial<CalendarFilters>) => Promise<void>
  refreshData: () => Promise<void>
  
  // Filtering and navigation
  setFilters: (filters: Partial<CalendarFilters>) => void
  setView: (view: CalendarView) => void
  setDateRange: (startDate: string, endDate: string) => void
  setSelectedApartments: (apartmentIds: string[]) => void
  
  // Availability checks
  checkAvailability: (
    apartmentId: string, 
    checkIn: string, 
    checkOut: string,
    excludeReservationId?: string
  ) => Promise<AvailabilityResult>
  
  // Quick operations
  createQuickReservation: (reservation: QuickReservation) => Promise<CalendarReservation>
  
  // Real-time subscriptions
  enableRealtime: () => void
  disableRealtime: () => void
}

export function useCalendar(options: UseCalendarOptions = {}): CalendarState & CalendarActions {
  const {
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    includeStats = false,
    enableRealtime = true
  } = options

  // Default filters
  const defaultFilters: CalendarFilters = {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    view: 'month',
    includeCleanings: false,
    ...initialFilters
  }

  // State
  const [state, setState] = useState<CalendarState>({
    data: null,
    loading: false,
    error: null,
    filters: defaultFilters,
    lastFetch: null
  })

  // Refs for cleanup and optimization
  const supabase = useRef(createClient())
  const subscriptionRef = useRef<any>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch calendar data
  const fetchCalendarData = useCallback(async (newFilters?: Partial<CalendarFilters>) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      const filters = newFilters ? { ...state.filters, ...newFilters } : state.filters
      
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        filters: filters
      }))

      // Build query parameters
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        view: filters.view,
        includeCleanings: filters.includeCleanings.toString(),
        includeStats: includeStats.toString()
      })

      if (filters.apartmentIds && filters.apartmentIds.length > 0) {
        queryParams.set('apartmentIds', filters.apartmentIds.join(','))
      }

      const response = await fetch(`/api/calendar?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch calendar data')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch calendar data')
      }

      setState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        error: null,
        lastFetch: new Date()
      }))

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return
      }

      console.error('Calendar hook - Fetch error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch calendar data'
      }))
    }
  }, [state.filters, includeStats])

  // Refresh data
  const refreshData = useCallback(() => {
    return fetchCalendarData()
  }, [fetchCalendarData])

  // Set filters
  const setFilters = useCallback((newFilters: Partial<CalendarFilters>) => {
    fetchCalendarData(newFilters)
  }, [fetchCalendarData])

  // Set view
  const setView = useCallback((view: CalendarView) => {
    fetchCalendarData({ view })
  }, [fetchCalendarData])

  // Set date range
  const setDateRange = useCallback((startDate: string, endDate: string) => {
    fetchCalendarData({ startDate, endDate })
  }, [fetchCalendarData])

  // Set selected apartments
  const setSelectedApartments = useCallback((apartmentIds: string[]) => {
    fetchCalendarData({ apartmentIds })
  }, [fetchCalendarData])

  // Check availability
  const checkAvailability = useCallback(async (
    apartmentId: string,
    checkIn: string,
    checkOut: string,
    excludeReservationId?: string
  ): Promise<AvailabilityResult> => {
    try {
      const queryParams = new URLSearchParams({
        apartmentId,
        checkIn,
        checkOut
      })

      if (excludeReservationId) {
        queryParams.set('excludeReservationId', excludeReservationId)
      }

      const response = await fetch(`/api/calendar/availability?${queryParams}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to check availability')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to check availability')
      }

      return result.data
    } catch (error: any) {
      console.error('Calendar hook - Availability check error:', error)
      throw error
    }
  }, [])

  // Create quick reservation
  const createQuickReservation = useCallback(async (reservation: QuickReservation): Promise<CalendarReservation> => {
    try {
      const response = await fetch('/api/calendar/quick-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create reservation')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create reservation')
      }

      // Refresh calendar data to show the new reservation
      await refreshData()

      return result.data
    } catch (error: any) {
      console.error('Calendar hook - Quick reservation error:', error)
      throw error
    }
  }, [refreshData])

  // Enable real-time subscriptions
  const enableRealtimeSubscriptions = useCallback(() => {
    if (subscriptionRef.current) {
      return // Already enabled
    }

    // Get current user to filter subscriptions
    supabase.current.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      // Subscribe to reservation changes
      const reservationChannel = supabase.current
        .channel('calendar-reservations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `owner_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Calendar hook - Reservation change:', payload)
            // Refresh data when reservations change
            refreshData()
          }
        )

      // Subscribe to cleaning changes
      const cleaningChannel = supabase.current
        .channel('calendar-cleanings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cleanings',
          },
          (payload) => {
            console.log('Calendar hook - Cleaning change:', payload)
            // Refresh data when cleanings change
            refreshData()
          }
        )

      // Subscribe to apartment changes
      const apartmentChannel = supabase.current
        .channel('calendar-apartments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'apartments',
            filter: `owner_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Calendar hook - Apartment change:', payload)
            // Refresh data when apartments change
            refreshData()
          }
        )

      // Store subscription references
      subscriptionRef.current = {
        reservationChannel,
        cleaningChannel,
        apartmentChannel,
        unsubscribe: () => {
          supabase.current.removeChannel(reservationChannel)
          supabase.current.removeChannel(cleaningChannel)
          supabase.current.removeChannel(apartmentChannel)
        }
      }

      // Subscribe all channels
      reservationChannel.subscribe()
      cleaningChannel.subscribe()
      apartmentChannel.subscribe()
    })
  }, [refreshData])

  // Disable real-time subscriptions
  const disableRealtimeSubscriptions = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  // Initial data fetch and setup
  useEffect(() => {
    fetchCalendarData()

    if (enableRealtime) {
      enableRealtimeSubscriptions()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      disableRealtimeSubscriptions()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, []) // Only run on mount

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return
    }

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshData().then(() => {
          scheduleRefresh() // Schedule next refresh
        })
      }, refreshInterval)
    }

    scheduleRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, refreshData])

  return {
    // State
    ...state,
    
    // Actions
    fetchCalendarData,
    refreshData,
    setFilters,
    setView,
    setDateRange,
    setSelectedApartments,
    checkAvailability,
    createQuickReservation,
    enableRealtime: enableRealtimeSubscriptions,
    disableRealtime: disableRealtimeSubscriptions
  }
}

// Helper hook for calendar navigation
export function useCalendarNavigation(initialView: CalendarView = 'month') {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>(initialView)
  const [selectedApartments, setSelectedApartments] = useState<string[]>([])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      
      switch (view) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
          break
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
          break
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
          break
      }
      
      return newDate
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  return {
    currentDate,
    view,
    selectedApartments,
    setView,
    setSelectedApartments,
    navigateDate,
    goToToday,
    goToDate
  }
}