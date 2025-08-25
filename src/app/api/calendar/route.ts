import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calendarFiltersSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import type { CalendarData, CalendarReservation } from '@/types/calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Parse boolean fields
    if (queryParams.includeCleanings) {
      queryParams.includeCleanings = queryParams.includeCleanings === 'true'
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
    const { data: reservations, error: reservationsError } = await supabase
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
    
    // Transform reservations
    const transformedReservations: CalendarReservation[] = (reservations || []).map((res: any) => ({
      id: res.id,
      apartment_id: res.apartment_id,
      apartment_name: res.apartments?.name || 'Unknown',
      guest_name: res.guests?.name || res.contact_info?.name || 'Guest',
      platform: res.platform,
      check_in: res.check_in,
      check_out: res.check_out,
      guest_count: res.guest_count,
      total_price: parseFloat(res.total_price || 0),
      status: res.status,
      notes: res.notes,
      contact_info: res.contact_info,
      nights: Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24))
    }))
    
    const calendarData: CalendarData = {
      reservations: transformedReservations,
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