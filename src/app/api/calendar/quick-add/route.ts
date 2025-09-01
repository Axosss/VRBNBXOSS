import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quickReservationSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { sanitizeText, sanitizeContactInfo } from '@/lib/utils/sanitize'
import type { CalendarReservation } from '@/types/calendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Quick Add API - Received body:', JSON.stringify(body, null, 2))

    // Validate the request body
    const quickReservation = quickReservationSchema.parse(body)
    
    console.log('Quick Add API - Parsed reservation:', JSON.stringify(quickReservation, null, 2))

    // Create Supabase client and get user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Quick Add API - Auth error:', userError)
      throw new AppError('Authentication failed', 401)
    }

    if (!user) {
      throw new AppError('User not authenticated', 401)
    }

    // Verify apartment ownership and get apartment details
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, name, capacity, owner_id')
      .eq('id', quickReservation.apartmentId)
      .eq('owner_id', user.id)
      .single()

    if (apartmentError) {
      console.error('Quick Add API - Apartment error:', apartmentError)
      throw new AppError('Apartment not found', 404)
    }

    if (!apartment) {
      throw new AppError('Apartment not found or access denied', 404)
    }

    // Validate guest count against apartment capacity
    if (quickReservation.guestCount > apartment.capacity) {
      throw new AppError(
        `Guest count (${quickReservation.guestCount}) exceeds apartment capacity (${apartment.capacity})`, 
        400
      )
    }

    // Check if dates are valid
    const checkInDate = new Date(quickReservation.checkIn)
    const checkOutDate = new Date(quickReservation.checkOut)
    
    // Allow past dates for historical data and testing
    // Only validate that check-out is after check-in
    if (checkOutDate <= checkInDate) {
      throw new AppError('Check-out date must be after check-in date', 400)
    }

    // Calculate nights for validation
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights > 365) {
      throw new AppError('Reservation cannot exceed 365 nights', 400)
    }

    // Final availability check using the database function
    const { data: available, error: availabilityError } = await supabase.rpc('check_availability', {
      p_apartment_id: quickReservation.apartmentId,
      p_check_in: quickReservation.checkIn,
      p_check_out: quickReservation.checkOut,
      p_exclude_reservation_id: null
    })

    if (availabilityError) {
      console.error('Quick Add API - Availability error:', availabilityError)
      throw new AppError('Failed to verify availability', 500)
    }

    if (!available) {
      // Get conflict details for better error message
      const { data: conflicts } = await supabase
        .from('reservations')
        .select('check_in, check_out, contact_info, guest:guests(name)')
        .eq('apartment_id', quickReservation.apartmentId)
        .neq('status', 'cancelled')
        .or(`and(check_in.lt.${quickReservation.checkOut},check_out.gt.${quickReservation.checkIn})`)
        .limit(1)

      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0]
        const guestName = conflict.guest?.name || conflict.contact_info?.name || 'Another guest'
        throw new AppError(
          `Selected dates conflict with existing reservation for ${guestName} (${conflict.check_in} to ${conflict.check_out})`, 
          409
        )
      } else {
        throw new AppError('Selected dates are not available', 409)
      }
    }

    // Prepare reservation data for database insert
    const reservationData = {
      apartment_id: quickReservation.apartmentId,
      owner_id: user.id,
      guest_id: null, // Quick add doesn't create guest records initially
      platform: quickReservation.platform,
      platform_reservation_id: null,
      check_in: quickReservation.checkIn,
      check_out: quickReservation.checkOut,
      guest_count: quickReservation.guestCount,
      total_price: quickReservation.totalPrice,
      cleaning_fee: quickReservation.cleaningFee || 0,
      platform_fee: quickReservation.platformFee || 0,
      currency: 'USD',
      status: 'confirmed',
      notes: sanitizeText(quickReservation.notes),
      contact_info: sanitizeContactInfo({ name: quickReservation.guestName })
    }

    console.log('Quick Add API - Inserting reservation data:', JSON.stringify(reservationData, null, 2))

    // Create the reservation
    const { data: newReservation, error: insertError } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select(`
        id,
        apartment_id,
        owner_id,
        platform,
        check_in,
        check_out,
        guest_count,
        total_price,
        status,
        notes,
        contact_info,
        created_at,
        updated_at
      `)
      .single()

    if (insertError) {
      console.error('Quick Add API - Insert error:', insertError)
      
      if (insertError.code === '23505') {
        throw new AppError('Reservation conflicts with existing booking', 409)
      }
      
      if (insertError.message?.includes('overlapping')) {
        throw new AppError('Dates overlap with existing reservation', 409)
      }

      throw new AppError('Failed to create reservation', 500)
    }

    if (!newReservation) {
      throw new AppError('Failed to create reservation - no data returned', 500)
    }

    // Transform to CalendarReservation format
    const calendarReservation: CalendarReservation = {
      id: newReservation.id,
      apartment_id: newReservation.apartment_id,
      apartment_name: apartment.name,
      guest_name: quickReservation.guestName,
      platform: newReservation.platform,
      check_in: newReservation.check_in,
      check_out: newReservation.check_out,
      guest_count: newReservation.guest_count,
      total_price: parseFloat(newReservation.total_price),
      status: newReservation.status,
      notes: newReservation.notes,
      contact_info: newReservation.contact_info,
      nights: nights
    }

    console.log('Quick Add API - Created reservation:', JSON.stringify(calendarReservation, null, 2))

    // Try to auto-create a cleaning task for checkout day (best effort)
    try {
      const checkoutDate = new Date(quickReservation.checkOut)
      checkoutDate.setHours(15, 0, 0, 0) // Set to 3 PM checkout time

      await supabase.from('cleanings').insert({
        apartment_id: quickReservation.apartmentId,
        reservation_id: newReservation.id,
        scheduled_date: checkoutDate.toISOString(),
        status: 'needed',
        instructions: `Cleaning needed after ${quickReservation.guestName} checkout`,
        supplies: {}
      })

      console.log('Quick Add API - Auto-created cleaning task')
    } catch (cleaningError) {
      console.warn('Quick Add API - Failed to create cleaning task:', cleaningError)
      // Don't fail the reservation creation if cleaning task fails
    }

    return NextResponse.json(
      createSuccessResponse(calendarReservation, 'Reservation created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('Quick Add API - Error:', error)

    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      )
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse('Invalid reservation data', 400),
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('duplicate key value')) {
      return NextResponse.json(
        createErrorResponse('Reservation conflicts with existing booking', 409),
        { status: 409 }
      )
    }

    return NextResponse.json(
      createErrorResponse('Failed to create reservation', 500),
      { status: 500 }
    )
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}