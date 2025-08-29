import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apartmentUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import { dbMappers } from '@/lib/mappers'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    if (!isValidUUID(id)) {
      throw new AppError('Invalid apartment ID', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Get apartment
    const { data: apartment, error: queryError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id) // RLS will handle this, but explicit for clarity
      .single()
    
    if (queryError) {
      if (queryError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(queryError.message, 500)
    }
    
    // Map apartment from DB format to frontend format
    const mappedApartment = dbMappers.apartment.fromDB(apartment)
    
    return NextResponse.json(
      createSuccessResponse(mappedApartment)
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!isValidUUID(id)) {
      throw new AppError('Invalid apartment ID', 400)
    }
    
    // Validate input
    const updates = apartmentUpdateSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Use mapper to convert to DB format
    const updateData = dbMappers.apartment.toDB(updates)
    
    // Update apartment
    const { data: apartment, error: updateError } = await supabase
      .from('apartments')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(updateError.message, 400)
    }
    
    // Map apartment from DB format to frontend format
    const mappedApartment = dbMappers.apartment.fromDB(apartment)
    
    return NextResponse.json(
      createSuccessResponse(mappedApartment, 'Apartment updated successfully')
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    if (!isValidUUID(id)) {
      throw new AppError('Invalid apartment ID', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Check if apartment has active reservations
    const { data: activeReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id')
      .eq('apartment_id', id)
      .in('status', ['confirmed', 'checked_in'])
      .limit(1)
    
    if (reservationError) {
      throw new AppError('Error checking reservations', 500)
    }
    
    if (activeReservations && activeReservations.length > 0) {
      throw new AppError('Cannot delete apartment with active reservations', 400)
    }
    
    // Soft delete by setting status to inactive
    const { data: apartment, error: deleteError } = await supabase
      .from('apartments')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(deleteError.message, 500)
    }
    
    // Map apartment from DB format to frontend format
    const mappedApartment = dbMappers.apartment.fromDB(apartment)
    
    return NextResponse.json(
      createSuccessResponse(mappedApartment, 'Apartment deleted successfully')
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}