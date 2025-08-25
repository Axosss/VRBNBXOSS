import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reservationCreateSchema, paginationSchema, reservationFilterSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
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
    
    // Build query with joins
    let query = supabase
      .from('reservations')
      .select(`
        *,
        apartment:apartments!inner(
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
      // Search in guest name, platform reservation ID, or notes
      query = query.or(`
        guests.name.ilike.%${filters.search}%,
        platform_reservation_id.ilike.%${filters.search}%,
        notes.ilike.%${filters.search}%
      `)
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
    
    return NextResponse.json(
      createSuccessResponse({
        reservations: reservations || [],
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received reservation data:', JSON.stringify(body, null, 2))
    
    // Validate input
    const reservationData = reservationCreateSchema.parse(body)
    console.log('Validated reservation data:', JSON.stringify(reservationData, null, 2))
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Verify apartment belongs to user
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, capacity, owner_id')
      .eq('id', reservationData.apartmentId)
      .eq('owner_id', user.id)
      .single()
    
    if (apartmentError || !apartment) {
      throw new AppError('Apartment not found or not owned by user', 404)
    }
    
    // Log guest count vs capacity for informational purposes
    if (reservationData.guestCount > apartment.capacity) {
      console.log(`INFO: Guest count (${reservationData.guestCount}) exceeds apartment capacity (${apartment.capacity})`)
    }

    // Verify guest exists if guestId is provided
    if (reservationData.guestId) {
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('id, owner_id')
        .eq('id', reservationData.guestId)
        .eq('owner_id', user.id)
        .single()
      
      if (guestError || !guest) {
        throw new AppError('Guest not found or not owned by user', 404)
      }
    }
    
    // Prepare reservation data for database (transform camelCase to snake_case)
    const insertData = {
      apartment_id: reservationData.apartmentId,
      owner_id: user.id,
      guest_id: reservationData.guestId,
      platform: reservationData.platform,
      platform_reservation_id: reservationData.platformReservationId,
      check_in: reservationData.checkIn,
      check_out: reservationData.checkOut,
      guest_count: reservationData.guestCount,
      total_price: reservationData.totalPrice,
      cleaning_fee: reservationData.cleaningFee || 0,
      platform_fee: reservationData.platformFee || 0,
      currency: reservationData.currency || 'USD',
      status: 'confirmed' as const,
      notes: reservationData.notes || null,
      contact_info: reservationData.contactInfo || null,
    }
    
    console.log('Inserting reservation data:', JSON.stringify(insertData, null, 2))
    
    // Create reservation (DB triggers will handle double-booking validation)
    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert(insertData)
      .select(`
        *,
        apartment:apartments!inner(
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
      `)
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      
      // Handle specific DB errors
      if (insertError.message.includes('Double booking detected')) {
        throw new AppError('This time slot conflicts with an existing reservation', 409)
      }
      if (insertError.message.includes('Guest count') && insertError.message.includes('exceeds apartment capacity')) {
        throw new AppError(`Guest count exceeds apartment capacity (${apartment.capacity})`, 400)
      }
      
      throw new AppError(insertError.message, 400)
    }
    
    console.log('Created reservation:', JSON.stringify(reservation, null, 2))
    
    return NextResponse.json(
      createSuccessResponse(reservation, 'Reservation created successfully'),
      { status: 201 }
    )
    
  } catch (error) {
    console.error('POST /api/reservations error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}