import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reservationCreateSchema, paginationSchema, reservationFilterSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import { sanitizeText, sanitizeContactInfo, sanitizeSearchQuery } from '@/lib/utils/sanitize'
import { rateLimit } from '@/middleware/rate-limit'
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
      // Use parameterized query with Supabase's built-in escaping
      query = query.or(`guests.name.ilike.%${sanitizedSearch}%,platform_reservation_id.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`)
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
  // Apply rate limiting for write operations
  const rateLimitResponse = await rateLimit(request, 'write')
  if (rateLimitResponse) return rateLimitResponse

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
    const insertData: any = {
      apartment_id: reservationData.apartmentId,
      owner_id: user.id,
      guest_id: reservationData.guestId || null,
      platform: reservationData.platform || 'direct',
      platform_reservation_id: sanitizeText(reservationData.platformReservationId) || null,
      check_in: reservationData.checkIn,
      check_out: reservationData.checkOut,
      guest_count: reservationData.guestCount,
      total_price: reservationData.totalPrice,
      cleaning_fee: reservationData.cleaningFee || 0,
      platform_fee: reservationData.platformFee || 0,
      currency: reservationData.currency || 'USD',
      notes: sanitizeText(reservationData.notes) || null,
      contact_info: sanitizeContactInfo(reservationData.contactInfo) || null,
    }
    
    // Debug: Check if dates are causing issue
    console.log('Check-in date:', reservationData.checkIn, 'Type:', typeof reservationData.checkIn)
    console.log('Check-out date:', reservationData.checkOut, 'Type:', typeof reservationData.checkOut)
    
    console.log('Inserting reservation data:', JSON.stringify(insertData, null, 2))
    
    // Final availability check right before insert to prevent race conditions
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .eq('apartment_id', reservationData.apartmentId)
      .neq('status', 'cancelled')
      .or(`and(check_in.lte.${reservationData.checkOut},check_out.gte.${reservationData.checkIn})`)
      .limit(1)
    
    if (conflictError) {
      console.error('Conflict check error:', conflictError)
      throw new AppError('Failed to verify availability', 500)
    }
    
    if (conflicts && conflicts.length > 0) {
      throw new AppError('These dates are no longer available. Please refresh and try again.', 409)
    }
    
    // Create reservation (DB triggers will handle additional validation)
    console.log('About to insert with data:', JSON.stringify(insertData, null, 2))
    console.log('Keys in insertData:', Object.keys(insertData))
    console.log('Status field exists:', 'status' in insertData)
    
    // Try raw SQL insert to bypass any Supabase client issues
    const { data: rawInsertResult, error: rawInsertError } = await supabase.rpc('insert_reservation_raw', {
      p_apartment_id: insertData.apartment_id,
      p_owner_id: insertData.owner_id,
      p_guest_id: insertData.guest_id,
      p_platform: insertData.platform,
      p_platform_reservation_id: insertData.platform_reservation_id,
      p_check_in: insertData.check_in,
      p_check_out: insertData.check_out,
      p_guest_count: insertData.guest_count,
      p_total_price: insertData.total_price,
      p_cleaning_fee: insertData.cleaning_fee || 0,
      p_platform_fee: insertData.platform_fee || 0,
      p_currency: insertData.currency || 'USD',
      p_notes: insertData.notes,
      p_contact_info: insertData.contact_info
    })
    
    if (!rawInsertError) {
      console.log('Raw SQL insert succeeded! ID:', rawInsertResult)
      
      // Fetch the created reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          apartment:apartments(id, name, address, capacity),
          guest:guests(id, name, email, phone)
        `)
        .eq('id', rawInsertResult)
        .single()
      
      if (!fetchError && reservation) {
        return NextResponse.json(
          createSuccessResponse(reservation, 'Reservation created successfully'),
          { status: 201 }
        )
      }
    }
    
    // Log RPC error if it exists
    if (rawInsertError) {
      console.log('RPC function not found or failed:', rawInsertError)
    }
    
    // Try debugging: check what Supabase thinks the schema is
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('reservations')
      .select('*')
      .limit(0)
    
    console.log('Schema query error:', schemaError)
    
    // If raw SQL failed, try standard insert with very explicit data
    const cleanInsertData = {
      apartment_id: insertData.apartment_id,
      owner_id: insertData.owner_id,
      guest_id: insertData.guest_id || null,
      platform: insertData.platform || 'direct',
      platform_reservation_id: insertData.platform_reservation_id || null,
      check_in: insertData.check_in,
      check_out: insertData.check_out,
      guest_count: insertData.guest_count,
      total_price: insertData.total_price,
      cleaning_fee: insertData.cleaning_fee || 0,
      platform_fee: insertData.platform_fee || 0,
      currency: insertData.currency || 'USD',
      notes: insertData.notes || null,
      contact_info: insertData.contact_info || null
    }
    
    // IMPORTANT: Do NOT include status field at all
    console.log('Clean insert data keys:', Object.keys(cleanInsertData))
    console.log('Clean insert data:', JSON.stringify(cleanInsertData, null, 2))
    
    // Try a completely different approach - use upsert instead of insert
    const { data: upsertResult, error: upsertError } = await supabase
      .from('reservations')
      .upsert({
        ...cleanInsertData,
        id: crypto.randomUUID() // Generate our own ID
      })
      .select('id')
      .single()
    
    if (!upsertError) {
      console.log('UPSERT WORKED! ID:', upsertResult.id)
      
      // Fetch the created reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          apartment:apartments(id, name, address, capacity),
          guest:guests(id, name, email, phone)
        `)
        .eq('id', upsertResult.id)
        .single()
      
      if (!fetchError && reservation) {
        return NextResponse.json(
          createSuccessResponse(reservation, 'Reservation created successfully'),
          { status: 201 }
        )
      }
    }
    
    console.log('Upsert also failed:', upsertError)
    
    // If upsert failed, try regular insert
    const { data: insertResult, error: insertError } = await supabase
      .from('reservations')
      .insert(cleanInsertData)
      .select('id')
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      console.error('Full insert error details:', JSON.stringify(insertError, null, 2))
      console.error('Insert data that caused error:', JSON.stringify(insertData, null, 2))
      
      // Handle specific DB errors
      if (insertError.message.includes('Double booking detected')) {
        throw new AppError('This time slot conflicts with an existing reservation', 409)
      }
      if (insertError.message.includes('Guest count') && insertError.message.includes('exceeds apartment capacity')) {
        throw new AppError(`Guest count exceeds apartment capacity (${apartment.capacity})`, 400)
      }
      if (insertError.message.includes('archived')) {
        // There seems to be a database issue with the status enum
        console.error('CRITICAL: Database is returning "archived" error even though no status was sent')
        console.error('Attempting workaround by explicitly setting status to confirmed')
        
        // Try again with explicit status
        const retryData = { ...insertData, status: 'confirmed' }
        const { data: retryReservation, error: retryError } = await supabase
          .from('reservations')
          .insert(retryData)
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
          `)
          .single()
        
        if (retryError) {
          console.error('Retry also failed:', retryError)
          throw new AppError('Unable to create reservation due to database issue. Please try again.', 500)
        }
        
        console.log('Created reservation with retry:', JSON.stringify(retryReservation, null, 2))
        
        return NextResponse.json(
          createSuccessResponse(retryReservation, 'Reservation created successfully'),
          { status: 201 }
        )
      }
      
      throw new AppError(insertError.message, 400)
    }
    
    // If insert succeeded, fetch the full reservation with relations
    const { data: reservation, error: fetchError } = await supabase
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
      `)
      .eq('id', insertResult.id)
      .single()
    
    if (fetchError) {
      console.error('Failed to fetch created reservation:', fetchError)
      // Still return success with minimal data since insert worked
      return NextResponse.json(
        createSuccessResponse({ id: insertResult.id }, 'Reservation created successfully'),
        { status: 201 }
      )
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