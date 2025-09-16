// Calendar data fetching utilities
// Provides efficient methods for retrieving calendar data from Supabase

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { 
  CalendarFilters, 
  CalendarData, 
  CalendarReservation,
  CalendarStats,
  AvailabilityResult,
  AvailabilitySlot,
  QuickReservation 
} from '@/types/calendar'

// Client-side calendar data fetching
export class CalendarAPI {
  private supabase = createClient()

  /**
   * Fetch calendar data for a specific date range and apartments
   */
  async getCalendarData(filters: CalendarFilters): Promise<CalendarData> {
    const { startDate, endDate, apartmentIds, includeCleanings = false } = filters

    try {
      // Get the current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Fetch calendar reservations using the database function
      const { data: reservations, error: reservationsError } = await this.supabase
        .rpc('get_calendar_data', {
          p_owner_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate,
          p_apartment_ids: apartmentIds || null
        })

      if (reservationsError) {
        console.error('Error fetching calendar data:', reservationsError)
        throw new Error('Failed to fetch calendar data')
      }

      // Get apartments for the current user
      let apartmentQuery = this.supabase
        .from('apartments')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (apartmentIds && apartmentIds.length > 0) {
        apartmentQuery = apartmentQuery.in('id', apartmentIds)
      }

      const { data: apartments, error: apartmentsError } = await apartmentQuery

      if (apartmentsError) {
        console.error('Error fetching apartments:', apartmentsError)
        throw new Error('Failed to fetch apartments')
      }

      // Transform the data to match our CalendarReservation interface
      const transformedReservations: CalendarReservation[] = (reservations || []).map((res: any) => ({
        id: res.id,
        apartment_id: res.apartment_id,
        apartment_name: res.apartment_name,
        guest_name: res.guest_name || 'Guest',
        platform: res.platform,
        check_in: res.check_in,
        check_out: res.check_out,
        guest_count: res.guest_count,
        total_price: parseFloat(res.total_price),
        status: res.status,
        notes: res.notes,
        contact_info: res.contact_info,
        nights: Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24)),
        cleaning_id: res.cleaning_id,
        cleaning_status: res.cleaning_status,
        cleaning_date: res.cleaning_date
      }))

      return {
        reservations: transformedReservations,
        dateRange: { start: startDate, end: endDate },
        apartments: apartments || []
      }
    } catch (error) {
      console.error('Calendar API Error:', error)
      throw error
    }
  }

  /**
   * Get calendar statistics for a date range
   */
  async getCalendarStats(
    startDate: string, 
    endDate: string, 
    apartmentIds?: string[]
  ): Promise<CalendarStats> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase.rpc('get_calendar_stats', {
        p_owner_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
        p_apartment_ids: apartmentIds || null
      })

      if (error) {
        console.error('Error fetching calendar stats:', error)
        throw new Error('Failed to fetch calendar statistics')
      }

      if (!data || data.length === 0) {
        return {
          total_nights: 0,
          occupied_nights: 0,
          occupancy_rate: 0,
          total_revenue: 0,
          total_reservations: 0,
          platform_breakdown: {}
        }
      }

      const stats = data[0]
      return {
        total_nights: stats.total_nights,
        occupied_nights: stats.occupied_nights,
        occupancy_rate: parseFloat(stats.occupancy_rate),
        total_revenue: parseFloat(stats.total_revenue),
        total_reservations: parseInt(stats.total_reservations),
        platform_breakdown: stats.platform_breakdown || {}
      }
    } catch (error) {
      console.error('Calendar Stats API Error:', error)
      throw error
    }
  }

  /**
   * Check availability for a specific date range
   */
  async checkAvailability(
    apartmentId: string,
    checkIn: string,
    checkOut: string,
    excludeReservationId?: string
  ): Promise<AvailabilityResult> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Check if the apartment belongs to the user
      const { data: apartment, error: apartmentError } = await this.supabase
        .from('apartments')
        .select('id')
        .eq('id', apartmentId)
        .eq('owner_id', user.id)
        .single()

      if (apartmentError || !apartment) {
        throw new Error('Apartment not found or access denied')
      }

      // Use the database function to check availability
      const { data: available, error: availabilityError } = await this.supabase.rpc('check_availability', {
        p_apartment_id: apartmentId,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_exclude_reservation_id: excludeReservationId || null
      })

      if (availabilityError) {
        console.error('Error checking availability:', availabilityError)
        throw new Error('Failed to check availability')
      }

      let conflicts: AvailabilityResult['conflicts'] = []
      let suggestions: AvailabilitySlot[] = []

      if (!available) {
        // Get conflicting reservations
        const { data: conflictData, error: conflictError } = await this.supabase
          .from('reservations')
          .select(`
            id,
            check_in,
            check_out,
            contact_info,
            guests:guest_id(name)
          `)
          .eq('apartment_id', apartmentId)
          .neq('status', 'cancelled')
          .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`)

        if (!conflictError && conflictData) {
          conflicts = conflictData.map((res: any) => ({
            id: res.id,
            check_in: res.check_in,
            check_out: res.check_out,
            guest_name: res.guests?.name || res.contact_info?.name || 'Guest'
          }))
        }

        // Get availability gaps as suggestions
        const { data: gaps, error: gapsError } = await this.supabase.rpc('get_availability_gaps', {
          p_apartment_id: apartmentId,
          p_start_date: checkIn,
          p_end_date: checkOut,
          p_min_gap_days: Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        })

        if (!gapsError && gaps) {
          suggestions = gaps.slice(0, 5) // Limit to 5 suggestions
        }
      }

      return {
        available: available || false,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }
    } catch (error) {
      console.error('Availability Check API Error:', error)
      throw error
    }
  }

  /**
   * Create a quick reservation directly from calendar
   */
  async createQuickReservation(reservation: QuickReservation): Promise<CalendarReservation> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Verify apartment ownership
      const { data: apartment, error: apartmentError } = await this.supabase
        .from('apartments')
        .select('id, capacity')
        .eq('id', reservation.apartmentId)
        .eq('owner_id', user.id)
        .single()

      if (apartmentError || !apartment) {
        throw new Error('Apartment not found or access denied')
      }

      // Validate guest count against apartment capacity
      if (reservation.guestCount > apartment.capacity) {
        throw new Error(`Guest count exceeds apartment capacity (${apartment.capacity})`)
      }

      // Final availability check
      const availability = await this.checkAvailability(
        reservation.apartmentId,
        reservation.checkIn,
        reservation.checkOut
      )

      if (!availability.available) {
        throw new Error('Selected dates are not available')
      }

      // Create the reservation
      const reservationData = {
        apartment_id: reservation.apartmentId,
        owner_id: user.id,
        platform: reservation.platform,
        check_in: reservation.checkIn,
        check_out: reservation.checkOut,
        guest_count: reservation.guestCount,
        total_price: reservation.totalPrice,
        currency: 'EUR',
        status: 'confirmed',
        notes: reservation.notes,
        contact_info: { name: reservation.guestName },
        cleaning_fee: 0,
        platform_fee: 0
      }

      const { data: newReservation, error: insertError } = await this.supabase
        .from('reservations')
        .insert(reservationData)
        .select(`
          *,
          apartment:apartments!inner(id, name),
          guest:guests(name)
        `)
        .single()

      if (insertError) {
        console.error('Error creating quick reservation:', insertError)
        throw new Error('Failed to create reservation')
      }

      // Transform to CalendarReservation format
      const result: CalendarReservation = {
        id: newReservation.id,
        apartment_id: newReservation.apartment_id,
        apartment_name: newReservation.apartment.name,
        guest_name: newReservation.guest?.name || reservation.guestName,
        platform: newReservation.platform,
        check_in: newReservation.check_in,
        check_out: newReservation.check_out,
        guest_count: newReservation.guest_count,
        total_price: parseFloat(newReservation.total_price),
        status: newReservation.status,
        notes: newReservation.notes,
        contact_info: newReservation.contact_info,
        nights: Math.ceil((new Date(newReservation.check_out).getTime() - new Date(newReservation.check_in).getTime()) / (1000 * 60 * 60 * 24))
      }

      return result
    } catch (error) {
      console.error('Quick Reservation API Error:', error)
      throw error
    }
  }

  /**
   * Set up real-time subscriptions for calendar updates
   */
  subscribeToCalendarUpdates(
    ownerId: string,
    onUpdate: (payload: any) => void
  ) {
    // Subscribe to reservation changes
    const reservationSubscription = this.supabase
      .channel('calendar-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `owner_id=eq.${ownerId}`,
        },
        onUpdate
      )
      .subscribe()

    // Subscribe to cleaning changes
    const cleaningSubscription = this.supabase
      .channel('calendar-cleanings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cleanings',
        },
        onUpdate
      )
      .subscribe()

    return {
      reservationSubscription,
      cleaningSubscription,
      unsubscribe: () => {
        this.supabase.removeChannel(reservationSubscription)
        this.supabase.removeChannel(cleaningSubscription)
      }
    }
  }
}

// Server-side calendar utilities for API routes
export class ServerCalendarAPI {
  private supabase: ReturnType<typeof createServerClient>

  constructor() {
    this.supabase = createServerClient()
  }

  async getCalendarDataForUser(
    userId: string,
    filters: CalendarFilters
  ): Promise<CalendarData> {
    const { startDate, endDate, apartmentIds } = filters

    try {
      // Fetch calendar reservations using the database function
      const { data: reservations, error: reservationsError } = await this.supabase
        .rpc('get_calendar_data', {
          p_owner_id: userId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_apartment_ids: apartmentIds || null
        })

      if (reservationsError) {
        console.error('Server: Error fetching calendar data:', reservationsError)
        throw new Error('Failed to fetch calendar data')
      }

      // Get apartments for the user
      let apartmentQuery = this.supabase
        .from('apartments')
        .select('id, name')
        .eq('owner_id', userId)
        .eq('status', 'active')

      if (apartmentIds && apartmentIds.length > 0) {
        apartmentQuery = apartmentQuery.in('id', apartmentIds)
      }

      const { data: apartments, error: apartmentsError } = await apartmentQuery

      if (apartmentsError) {
        console.error('Server: Error fetching apartments:', apartmentsError)
        throw new Error('Failed to fetch apartments')
      }

      // Transform the data
      const transformedReservations: CalendarReservation[] = (reservations || []).map((res: any) => ({
        id: res.id,
        apartment_id: res.apartment_id,
        apartment_name: res.apartment_name,
        guest_name: res.guest_name || 'Guest',
        platform: res.platform,
        check_in: res.check_in,
        check_out: res.check_out,
        guest_count: res.guest_count,
        total_price: parseFloat(res.total_price),
        status: res.status,
        notes: res.notes,
        contact_info: res.contact_info,
        nights: Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24)),
        cleaning_id: res.cleaning_id,
        cleaning_status: res.cleaning_status,
        cleaning_date: res.cleaning_date
      }))

      return {
        reservations: transformedReservations,
        dateRange: { start: startDate, end: endDate },
        apartments: apartments || []
      }
    } catch (error) {
      console.error('Server Calendar API Error:', error)
      throw error
    }
  }
}

// Export singleton instances
export const calendarAPI = new CalendarAPI()
export const serverCalendarAPI = new ServerCalendarAPI()