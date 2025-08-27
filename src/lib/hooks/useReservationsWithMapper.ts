/**
 * Hook to fetch reservations using the new mapper pattern
 * This is a transitional hook that demonstrates the mapper usage
 * while keeping the existing code intact
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  mapReservationFromDB, 
  mapReservationToDB,
  mapReservationsFromDB,
  mapReservationWithRelationsFromDB,
  mapReservationsWithRelationsFromDB 
} from '@/lib/mappers'
import type { ReservationDB } from '@/lib/mappers/types'
import type { Reservation } from '@/lib/stores/reservation-store'

interface UseReservationsWithMapperOptions {
  apartmentId?: string
  guestId?: string
  status?: string
  includeRelations?: boolean
  limit?: number
}

interface UseReservationsWithMapperReturn {
  reservations: Reservation[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  createReservation: (data: Partial<Reservation>) => Promise<Reservation | null>
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<Reservation | null>
  deleteReservation: (id: string) => Promise<boolean>
}

/**
 * Custom hook that uses the mapper pattern for reservations
 * Demonstrates the transition from snake_case DB to mixed frontend format
 */
export function useReservationsWithMapper(
  options: UseReservationsWithMapperOptions = {}
): UseReservationsWithMapperReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  /**
   * Fetch reservations with optional filters
   */
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from('reservations').select(
        options.includeRelations 
          ? `*, 
             apartment:apartments(*), 
             guest:guests(*)`
          : '*'
      )

      // Apply filters
      if (options.apartmentId) {
        query = query.eq('apartment_id', options.apartmentId)
      }
      if (options.guestId) {
        query = query.eq('guest_id', options.guestId)
      }
      if (options.status) {
        query = query.eq('status', options.status)
      }
      if (options.limit) {
        query = query.limit(options.limit)
      }

      // Order by check-in date descending
      query = query.order('check_in', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Use mapper to transform data
      const mappedReservations = options.includeRelations
        ? mapReservationsWithRelationsFromDB(data || [])
        : mapReservationsFromDB(data || [])

      setReservations(mappedReservations)

      // Log transformation for debugging (remove in production)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        console.group('🔄 Mapper Transformation')
        console.log('Original DB data (snake_case):', data[0])
        console.log('Mapped data (current format):', mappedReservations[0])
        console.groupEnd()
      }
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch reservations'))
    } finally {
      setLoading(false)
    }
  }, [supabase, options.apartmentId, options.guestId, options.status, options.limit, options.includeRelations])

  /**
   * Create a new reservation
   */
  const createReservation = useCallback(async (
    data: Partial<Reservation>
  ): Promise<Reservation | null> => {
    try {
      setError(null)

      // Transform to database format
      const dbData = mapReservationToDB(data)

      // Log transformation for debugging
      if (process.env.NODE_ENV === 'development') {
        console.group('🔄 Create Transformation')
        console.log('Input data (mixed format):', data)
        console.log('DB data (snake_case):', dbData)
        console.groupEnd()
      }

      const { data: createdData, error: createError } = await supabase
        .from('reservations')
        .insert(dbData)
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Transform response back
      const mappedReservation = mapReservationFromDB(createdData)
      
      // Update local state
      setReservations(prev => [mappedReservation, ...prev])

      return mappedReservation
    } catch (err) {
      console.error('Error creating reservation:', err)
      setError(err instanceof Error ? err : new Error('Failed to create reservation'))
      return null
    }
  }, [supabase])

  /**
   * Update an existing reservation
   */
  const updateReservation = useCallback(async (
    id: string,
    data: Partial<Reservation>
  ): Promise<Reservation | null> => {
    try {
      setError(null)

      // Transform to database format
      const dbData = mapReservationToDB(data)

      const { data: updatedData, error: updateError } = await supabase
        .from('reservations')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Transform response back
      const mappedReservation = mapReservationFromDB(updatedData)
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? mappedReservation : r)
      )

      return mappedReservation
    } catch (err) {
      console.error('Error updating reservation:', err)
      setError(err instanceof Error ? err : new Error('Failed to update reservation'))
      return null
    }
  }, [supabase])

  /**
   * Delete a reservation
   */
  const deleteReservation = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      setReservations(prev => prev.filter(r => r.id !== id))

      return true
    } catch (err) {
      console.error('Error deleting reservation:', err)
      setError(err instanceof Error ? err : new Error('Failed to delete reservation'))
      return false
    }
  }, [supabase])

  // Fetch on mount and when options change
  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  return {
    reservations,
    loading,
    error,
    refetch: fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
  }
}