import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reservationUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID, getDaysBetween } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Fetching reservation with ID:', id)
    
    // Validate UUID
    if (!isValidUUID(id)) {
      throw new AppError('Invalid reservation ID format', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Fetch reservation with joins
    const { data: reservation, error: queryError } = await supabase
      .from('reservations')
      .select(`
        *,
        apartment:apartments!inner(
          id,
          name,
          address,
          capacity,
          bedrooms,
          bathrooms,
          amenities,
          photos
        ),
        guest:guests(
          id,
          name,
          email,
          phone,
          address,
          id_document
        ),
        cleanings(
          id,
          scheduled_date,
          status,
          cleaner:cleaners(
            id,
            name,
            phone
          )
        )
      `)
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    
    if (queryError || !reservation) {
      if (queryError?.code === 'PGRST116') {
        throw new AppError('Reservation not found', 404)
      }
      throw new AppError(queryError?.message || 'Failed to fetch reservation', 500)
    }
    
    // Calculate additional fields
    const checkInDate = new Date(reservation.check_in)
    const checkOutDate = new Date(reservation.check_out)
    const stayDuration = getDaysBetween(checkInDate, checkOutDate)
    const pricePerNight = stayDuration > 0 ? reservation.total_price / stayDuration : 0
    
    // Add calculated fields
    const enrichedReservation = {
      ...reservation,
      stayDuration,
      pricePerNight: Math.round(pricePerNight * 100) / 100, // Round to 2 decimals
      totalWithFees: reservation.total_price + (reservation.cleaning_fee || 0) + (reservation.platform_fee || 0),
    }
    
    console.log('Found reservation:', JSON.stringify(enrichedReservation.id, null, 2))
    
    return NextResponse.json(
      createSuccessResponse(enrichedReservation, 'Reservation retrieved successfully')
    )
    
  } catch (error) {
    console.error('GET /api/reservations/[id] error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Updating reservation with ID:', id)
    
    // Validate UUID
    if (!isValidUUID(id)) {
      throw new AppError('Invalid reservation ID format', 400)
    }
    
    const body = await request.json()
    console.log('Received update data:', JSON.stringify(body, null, 2))
    
    // Validate input
    const updateData = reservationUpdateSchema.parse(body)
    console.log('Validated update data:', JSON.stringify(updateData, null, 2))
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Verify reservation exists and belongs to user
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, apartment_id, owner_id, status, check_in, check_out')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    
    if (fetchError || !existingReservation) {
      if (fetchError?.code === 'PGRST116') {
        throw new AppError('Reservation not found', 404)
      }
      throw new AppError('Failed to fetch reservation', 500)
    }
    
    // Verify guest exists if guestId is provided
    if (updateData.guestId) {
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('id, owner_id')
        .eq('id', updateData.guestId)
        .eq('owner_id', user.id)
        .single()
      
      if (guestError || !guest) {
        throw new AppError('Guest not found or not owned by user', 404)
      }
    }
    
    // If updating guest count, verify against apartment capacity
    if (updateData.guestCount) {
      const { data: apartment, error: apartmentError } = await supabase
        .from('apartments')
        .select('capacity')
        .eq('id', existingReservation.apartment_id)
        .single()
      
      if (apartmentError || !apartment) {
        throw new AppError('Associated apartment not found', 404)
      }
      
      if (updateData.guestCount > apartment.capacity) {
        throw new AppError(`Guest count (${updateData.guestCount}) exceeds apartment capacity (${apartment.capacity})`, 400)
      }
    }
    
    // Prepare update data for database (transform camelCase to snake_case)
    const dbUpdateData: any = {}
    
    if (updateData.guestId !== undefined) dbUpdateData.guest_id = updateData.guestId
    if (updateData.platform) dbUpdateData.platform = updateData.platform
    if (updateData.platformReservationId !== undefined) dbUpdateData.platform_reservation_id = updateData.platformReservationId
    if (updateData.checkIn) dbUpdateData.check_in = updateData.checkIn
    if (updateData.checkOut) dbUpdateData.check_out = updateData.checkOut
    if (updateData.guestCount) dbUpdateData.guest_count = updateData.guestCount
    if (updateData.totalPrice !== undefined) dbUpdateData.total_price = updateData.totalPrice
    if (updateData.cleaningFee !== undefined) dbUpdateData.cleaning_fee = updateData.cleaningFee
    if (updateData.platformFee !== undefined) dbUpdateData.platform_fee = updateData.platformFee
    if (updateData.currency) dbUpdateData.currency = updateData.currency
    if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes
    if (updateData.contactInfo !== undefined) dbUpdateData.contact_info = updateData.contactInfo
    
    // Add updated_at
    dbUpdateData.updated_at = new Date().toISOString()
    
    console.log('Updating with data:', JSON.stringify(dbUpdateData, null, 2))
    
    // Update reservation (DB triggers will handle validation)
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(dbUpdateData)
      .eq('id', id)
      .eq('owner_id', user.id)
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
    
    if (updateError) {
      console.error('Update error:', updateError)
      
      // Handle specific DB errors
      if (updateError.message.includes('Double booking detected')) {
        throw new AppError('Updated dates conflict with an existing reservation', 409)
      }
      if (updateError.message.includes('Guest count') && updateError.message.includes('exceeds apartment capacity')) {
        throw new AppError('Guest count exceeds apartment capacity', 400)
      }
      
      throw new AppError(updateError.message, 400)
    }
    
    console.log('Updated reservation:', JSON.stringify(updatedReservation.id, null, 2))
    
    return NextResponse.json(
      createSuccessResponse(updatedReservation, 'Reservation updated successfully')
    )
    
  } catch (error) {
    console.error('PUT /api/reservations/[id] error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Deleting reservation with ID:', id)
    
    // Validate UUID
    if (!isValidUUID(id)) {
      throw new AppError('Invalid reservation ID format', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Verify reservation exists and belongs to user
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, owner_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    
    if (fetchError || !existingReservation) {
      if (fetchError?.code === 'PGRST116') {
        throw new AppError('Reservation not found', 404)
      }
      throw new AppError('Failed to fetch reservation', 500)
    }
    
    // Soft delete: Update status to cancelled instead of hard delete
    // This preserves historical data and any linked cleanings
    const { error: deleteError } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('owner_id', user.id)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      throw new AppError(deleteError.message, 500)
    }
    
    console.log('Successfully cancelled reservation:', id)
    
    return NextResponse.json(
      createSuccessResponse(null, 'Reservation cancelled successfully')
    )
    
  } catch (error) {
    console.error('DELETE /api/reservations/[id] error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}