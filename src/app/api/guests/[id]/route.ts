import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateGuestSchema } from '@/lib/validations/guest'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { sanitizeText, sanitizeContactInfo } from '@/lib/utils/sanitize'
import { mapGuestFromDB, mapGuestToDB } from '@/lib/mappers/guest.mapper'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Get guest with reservation count
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('owner_id', user.id)
      .single()
    
    if (guestError || !guest) {
      throw new AppError('Guest not found', 404)
    }
    
    // Get reservation history for this guest
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        apartment_id,
        platform,
        check_in,
        check_out,
        total_price,
        currency,
        status,
        apartments (
          id,
          name
        )
      `)
      .eq('guest_id', resolvedParams.id)
      .eq('owner_id', user.id)
      .order('check_in', { ascending: false })
    
    if (reservationsError) {
      console.error('Reservations query error:', reservationsError)
    }
    
    // Map guest from DB format to frontend format
    const mappedGuest = mapGuestFromDB(guest)
    
    // Add reservation history
    const guestWithHistory = {
      ...mappedGuest,
      reservations: reservations || [],
      totalReservations: reservations?.length || 0,
      totalRevenue: reservations?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0,
    }
    
    return NextResponse.json(
      createSuccessResponse(guestWithHistory, 'Guest details fetched successfully')
    )
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      )
    }
    
    console.error('Get guest error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch guest details', 500),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const body = await request.json()
    
    // Validate input
    const updateData = updateGuestSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Check if guest exists and belongs to user
    const { data: existingGuest, error: checkError } = await supabase
      .from('guests')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('owner_id', user.id)
      .single()
    
    if (checkError || !existingGuest) {
      throw new AppError('Guest not found', 404)
    }
    
    // Prepare update data
    const dbUpdateData: any = {}
    
    if (updateData.name !== undefined) {
      dbUpdateData.name = sanitizeText(updateData.name)
    }
    if (updateData.email !== undefined) {
      dbUpdateData.email = updateData.email ? sanitizeContactInfo(updateData.email) : null
    }
    if (updateData.phone !== undefined) {
      dbUpdateData.phone = updateData.phone ? sanitizeContactInfo(updateData.phone) : null
    }
    if (updateData.address !== undefined) {
      dbUpdateData.address = updateData.address
    }
    if (updateData.idDocument !== undefined) {
      dbUpdateData.id_document = updateData.idDocument
    }
    if (updateData.notes !== undefined) {
      dbUpdateData.notes = updateData.notes ? sanitizeText(updateData.notes) : null
    }
    
    // Update guest
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update(dbUpdateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update guest error:', updateError)
      throw new AppError(updateError.message, 400)
    }
    
    // Map guest from DB format to frontend format
    const mappedGuest = mapGuestFromDB(updatedGuest)
    
    return NextResponse.json(
      createSuccessResponse(mappedGuest, 'Guest updated successfully')
    )
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid input data', 400),
        { status: 400 }
      )
    }
    
    console.error('Update guest error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to update guest', 500),
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Check if guest has any reservations
    const { data: reservations, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('guest_id', resolvedParams.id)
      .eq('owner_id', user.id)
      .limit(1)
    
    if (checkError) {
      console.error('Check reservations error:', checkError)
      throw new AppError('Failed to check guest reservations', 500)
    }
    
    if (reservations && reservations.length > 0) {
      // Guest has reservations, cannot delete
      throw new AppError('Cannot delete guest with existing reservations', 400)
    } else {
      // Guest has no reservations, can hard delete
      const { error: deleteError } = await supabase
        .from('guests')
        .delete()
        .eq('id', resolvedParams.id)
        .eq('owner_id', user.id)
      
      if (deleteError) {
        console.error('Delete guest error:', deleteError)
        throw new AppError('Failed to delete guest', 500)
      }
      
      return NextResponse.json(
        createSuccessResponse(null, 'Guest deleted successfully')
      )
    }
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      )
    }
    
    console.error('Delete guest error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to delete guest', 500),
      { status: 500 }
    )
  }
}