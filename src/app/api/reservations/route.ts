import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reservationCreateSchema, paginationSchema, reservationFilterSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import { sanitizeText, sanitizeContactInfo, sanitizeSearchQuery } from '@/lib/utils/sanitize'
import { rateLimit } from '@/middleware/rate-limit'
import { dbMappers } from '@/lib/mappers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  // Apply rate limiting for read operations
  const rateLimitResponse = await rateLimit(request, 'read')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    console.log('Received reservation query params:', JSON.stringify(queryParams, null, 2))
    
    // Validate pagination and filters
    const pagination = paginationSchema.parse(queryParams)
    const filters = reservationFilterSchema.parse(queryParams)
    console.log('Validated filters:', JSON.stringify(filters, null, 2))
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Build query with joins - use left join for apartments to avoid RLS recursion
    let query = supabase
      .from('reservations')
      .select(`
        *,
        apartment:apartments(
          id,
          name,
          address,
          capacity
        ),
        guest:guests(
          id,
          name,
          email,
          phone
        )
      `, { count: 'exact' })
      .eq('owner_id', user.id)
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.platform) {
      query = query.eq('platform', filters.platform)
    }
    
    if (filters.apartmentId) {
      query = query.eq('apartment_id', filters.apartmentId)
    }
    
    if (filters.search) {
      // Sanitize search query to prevent injection
      const sanitizedSearch = sanitizeSearchQuery(filters.search)
      
      // Search across multiple fields including contact_info JSONB
      // We search in platform_reservation_id, notes, contact_info->name, and guest names
      
      // First, find all guest IDs that match the search
      const { data: matchingGuests } = await supabase
        .from('guests')
        .select('id')
        .ilike('name', `%${sanitizedSearch}%`)
        .eq('owner_id', user.id)
      
      const guestIds = matchingGuests?.map(g => g.id) || []
      
      // Build search conditions
      // Note: PostgREST supports searching in JSONB fields with ->> operator
      // We search in multiple fields: platform_reservation_id, notes, contact_info name, and guest_id
      const searchConditions = [
        `platform_reservation_id.ilike.%${sanitizedSearch}%`,
        `notes.ilike.%${sanitizedSearch}%`,
        `contact_info->>name.ilike.%${sanitizedSearch}%`
      ]
      
      if (guestIds.length > 0) {
        searchConditions.push(`guest_id.in.(${guestIds.join(',')})`)
      }
      
      query = query.or(searchConditions.join(','))
    }
    
    if (filters.startDate) {
      query = query.gte('check_in', filters.startDate)
    }
    
    if (filters.endDate) {
      query = query.lte('check_out', filters.endDate)
    }
    
    // Apply sorting
    const sortColumn = filters.sortBy === 'check_in' ? 'check_in' :
                      filters.sortBy === 'check_out' ? 'check_out' :
                      filters.sortBy === 'total_price' ? 'total_price' :
                      'created_at'
    
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' })
    
    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1
    
    query = query.range(from, to)
    
    const { data: reservations, error: queryError, count } = await query
    
    if (queryError) {
      console.error('Query error:', queryError)
      throw new AppError(queryError.message, 500)
    }
    
    console.log(`Found ${reservations?.length || 0} reservations out of ${count} total`)
    
    // Apply mapper to transform data from DB format
    const mappedReservations = reservations ? dbMappers.reservation.multipleWithRelationsFromDB(reservations) : []
    
    return NextResponse.json(
      createSuccessResponse({
        reservations: mappedReservations,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        },
      })
    )
    
  } catch (error) {
    console.error('GET /api/reservations error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}