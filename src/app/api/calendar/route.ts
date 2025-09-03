import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calendarFiltersSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import type { CalendarData, CalendarReservation, CalendarCleaning } from '@/types/calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Parse boolean fields
    if (queryParams.includeCleanings) {
      queryParams.includeCleanings = queryParams.includeCleanings === 'true'
    }
    
    // Parse apartmentIds array
    if (queryParams.apartmentIds && typeof queryParams.apartmentIds === 'string') {
      queryParams.apartmentIds = queryParams.apartmentIds.split(',')
    }
    
    // Validate query parameters
    const filters = calendarFiltersSchema.parse(queryParams)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Fetch reservations directly - use left join for apartments to avoid RLS recursion
    let reservationsQuery = supabase
      .from('reservations')
      .select(`
        *,
        apartments(id, name),
        guests(name)
      `)
      .eq('owner_id', user.id)
      .gte('check_out', filters.startDate)
      .lte('check_in', filters.endDate)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: true })
    
    // Apply apartment filter if provided
    if (filters.apartmentIds && filters.apartmentIds.length > 0) {
      reservationsQuery = reservationsQuery.in('apartment_id', filters.apartmentIds)
    }
    
    const { data: reservations, error: reservationsError } = await reservationsQuery
    
    if (reservationsError) {
      console.error('Calendar API - Query error:', reservationsError)
      throw new AppError('Failed to fetch calendar data', 500)
    }
    
    // Get apartments for the user
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('id, name')
      .eq('owner_id', user.id)
      .eq('status', 'active')
    
    if (apartmentsError) {
      console.error('Calendar API - Apartments error:', apartmentsError)
      throw new AppError('Failed to fetch apartments', 500)
    }
    
    // Fetch cleanings if requested
    let transformedCleanings: CalendarCleaning[] = []
    
    console.log('Calendar API - includeCleanings:', filters.includeCleanings)
    
    if (filters.includeCleanings) {
      let cleaningsQuery = supabase
        .from('cleanings')
        .select(`
          *,
          apartments(id, name),
          cleaners(name)
        `)
        .eq('owner_id', user.id)
        .gte('scheduled_end', filters.startDate)
        .lte('scheduled_start', filters.endDate)
        .neq('status', 'cancelled')
        .order('scheduled_start', { ascending: true })
      
      // Apply apartment filter if provided
      if (filters.apartmentIds && filters.apartmentIds.length > 0) {
        cleaningsQuery = cleaningsQuery.in('apartment_id', filters.apartmentIds)
      }
      
      const { data: cleanings, error: cleaningsError } = await cleaningsQuery
      
      console.log('Calendar API - Cleanings fetched:', cleanings?.length || 0)
      
      if (cleaningsError) {
        console.error('Calendar API - Cleanings error:', cleaningsError)
        // Don't throw, just log the error and continue without cleanings
      } else if (cleanings) {
        transformedCleanings = cleanings.map((cleaning: any) => ({
          id: cleaning.id,
          apartmentId: cleaning.apartment_id,
          apartmentName: cleaning.apartments?.name || 'Unknown',
          cleanerName: cleaning.cleaners?.name || 'Unassigned',
          scheduledDate: cleaning.scheduled_start,
          duration: cleaning.duration || '2 hours',
          status: cleaning.status,
          instructions: cleaning.instructions,
          reservationId: cleaning.reservation_id
        }))
      }
    }
    
    // Transform reservations (convert to camelCase for frontend)
    const transformedReservations: CalendarReservation[] = (reservations || []).map((res: any) => ({
      id: res.id,
      apartmentId: res.apartment_id,  // camelCase
      apartmentName: res.apartments?.name || 'Unknown',  // camelCase
      guestName: res.guests?.name || res.contact_info?.name || 'Guest',  // camelCase
      platform: res.platform,
      checkIn: res.check_in,  // camelCase
      checkOut: res.check_out,  // camelCase
      guestCount: res.guest_count,  // camelCase
      totalPrice: parseFloat(res.total_price || 0),  // camelCase
      status: res.status,
      notes: res.notes,
      contactInfo: res.contact_info,  // camelCase
      nights: Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24))
    }))
    
    const calendarData: CalendarData = {
      reservations: transformedReservations,
      cleanings: transformedCleanings.length > 0 ? transformedCleanings : undefined,
      dateRange: {
        start: filters.startDate,
        end: filters.endDate
      },
      apartments: apartments || []
    }
    
    return NextResponse.json(createSuccessResponse(calendarData, 'Calendar data fetched successfully'))
    
  } catch (error) {
    console.error('Calendar API - Error:', error)
    
    if (error instanceof AppError) {
      return NextResponse.json(createErrorResponse(error.message, error.statusCode))
    }
    
    return NextResponse.json(createErrorResponse('Failed to fetch calendar data', 500))
  }
}

export async function POST(request: NextRequest) {
  // Same as GET but with body params
  return GET(request)
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}