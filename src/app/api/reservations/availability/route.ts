import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import { z } from 'zod'

// Schema for availability check parameters
const availabilitySchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be in YYYY-MM-DD format'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be in YYYY-MM-DD format'),
  excludeReservationId: z.string().uuid().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkIn)
  const checkOut = new Date(data.checkOut)
  return checkOut > checkIn
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut']
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract and validate query parameters
    const queryParams = {
      apartmentId: searchParams.get('apartmentId'),
      checkIn: searchParams.get('checkIn'),
      checkOut: searchParams.get('checkOut'),
      excludeReservationId: searchParams.get('excludeReservationId') || undefined,
    }

    // Validate parameters
    const validatedParams = availabilitySchema.parse(queryParams)

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('Availability check - User:', user ? user.id : 'null', 'Error:', userError?.message || 'none')
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Check if apartment exists and belongs to user
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, owner_id')
      .eq('id', validatedParams.apartmentId)
      .eq('owner_id', user.id)
      .single()

    if (apartmentError || !apartment) {
      throw new AppError('Apartment not found', 404)
    }

    // Check for overlapping reservations
    let query = supabase
      .from('reservations')
      .select('id, check_in, check_out, status')
      .eq('apartment_id', validatedParams.apartmentId)
      .in('status', ['confirmed', 'in_progress']) // Only check active reservations
      .or(`check_in.lte.${validatedParams.checkOut},check_out.gte.${validatedParams.checkIn}`)

    // Exclude a specific reservation if provided (useful for updates)
    if (validatedParams.excludeReservationId) {
      query = query.neq('id', validatedParams.excludeReservationId)
    }

    const { data: conflictingReservations, error: reservationError } = await query

    if (reservationError) {
      console.error('Error checking reservations:', reservationError)
      throw new AppError('Failed to check availability', 500)
    }

    const available = !conflictingReservations || conflictingReservations.length === 0

    return NextResponse.json(
      createSuccessResponse({
        available,
        conflicts: conflictingReservations || [],
      })
    )
    
  } catch (error) {
    console.error('Availability check error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}