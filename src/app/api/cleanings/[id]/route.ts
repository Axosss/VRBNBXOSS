import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCleaningSchema } from '@/lib/validations/cleaning';
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils';
import { sanitizeText } from '@/lib/utils/sanitize';
import { dbMappers } from '@/lib/mappers';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleaningId } = await params;
    
    if (!isValidUUID(cleaningId)) {
      throw new AppError('Invalid cleaning ID', 400);
    }
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Fetch cleaning with relations
    const { data: cleaning, error: queryError } = await supabase
      .from('cleanings')
      .select(`
        *,
        apartment:apartments(
          id,
          name,
          address,
          access_codes
        ),
        cleaner:cleaners(
          id,
          name,
          email,
          phone,
          hourly_rate,
          flat_rate
        ),
        reservation:reservations(
          id,
          check_in,
          check_out,
          platform,
          contact_info,
          guest_count
        )
      `)
      .eq('id', cleaningId)
      .eq('owner_id', user.id)
      .single();
    
    if (queryError) {
      if (queryError.code === 'PGRST116') {
        throw new AppError('Cleaning not found', 404);
      }
      throw new AppError(queryError.message, 500);
    }
    
    // Map cleaning from DB format to frontend format with relations
    const mappedCleaning = dbMappers.cleaning.withRelationsFromDB(cleaning);
    
    return NextResponse.json(
      createSuccessResponse(mappedCleaning, 'Cleaning fetched successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    console.error('Get cleaning error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch cleaning', 500),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleaningId } = await params;
    const body = await request.json();
    
    if (!isValidUUID(cleaningId)) {
      throw new AppError('Invalid cleaning ID', 400);
    }
    
    // Validate input
    const updateData = updateCleaningSchema.parse(body);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Check if cleaning exists and belongs to user through apartment
    const { data: existingCleaning, error: checkError } = await supabase
      .from('cleanings')
      .select(`
        id, 
        status, 
        apartment_id,
        scheduled_start,
        scheduled_end,
        apartment:apartments!inner(
          owner_id
        )
      `)
      .eq('id', cleaningId)
      .eq('apartment.owner_id', user.id)
      .single();
    
    if (checkError || !existingCleaning) {
      throw new AppError('Cleaning not found', 404);
    }
    
    // Don't allow updates to completed or cancelled cleanings unless it's just adding rating/notes
    if (existingCleaning.status === 'cancelled' || existingCleaning.status === 'verified') {
      const allowedFields = ['rating', 'notes', 'photos'];
      const updateFields = Object.keys(updateData);
      const hasDisallowedFields = updateFields.some(field => !allowedFields.includes(field));
      
      if (hasDisallowedFields) {
        throw new AppError(`Cannot update ${existingCleaning.status} cleaning`, 400);
      }
    }
    
    // Verify cleaner belongs to user if changing cleaner
    if (updateData.cleanerId !== undefined) {
      if (updateData.cleanerId) {
        const { data: cleaner, error: cleanerError } = await supabase
          .from('cleaners')
          .select('id, active')
          .eq('id', updateData.cleanerId)
          .eq('owner_id', user.id)
          .eq('active', true)
          .single();
        
        if (cleanerError || !cleaner) {
          throw new AppError('Cleaner not found or not active', 404);
        }
      }
    }
    
    // Check for scheduling conflicts if changing schedule
    if (updateData.scheduledStart) {
      const newDate = new Date(updateData.scheduledStart);
      
      // Check conflicts with reservations
      const { data: conflicts, error: conflictError } = await supabase
        .from('reservations')
        .select('id')
        .eq('apartment_id', existingCleaning.apartment_id)
        .neq('status', 'cancelled')
        .or(`and(check_in.lte.${newDate.toISOString()},check_out.gte.${newDate.toISOString()})`)
        .limit(1);
      
      if (conflictError) {
        throw new AppError('Failed to verify availability', 500);
      }
      
      if (conflicts && conflicts.length > 0) {
        throw new AppError('New schedule conflicts with existing reservation', 409);
      }
      
      // Check conflicts with other cleanings on the same time period
      const endDate = updateData.scheduledEnd || new Date(newDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
      const { data: cleaningConflicts, error: cleaningConflictError } = await supabase
        .from('cleanings')
        .select('id')
        .eq('apartment_id', existingCleaning.apartment_id)
        .neq('id', cleaningId)
        .neq('status', 'cancelled')
        .or(`and(scheduled_start.lte.${endDate},scheduled_end.gte.${newDate.toISOString()})`)
        .limit(1);
      
      if (cleaningConflictError) {
        throw new AppError('Failed to check cleaning conflicts', 500);
      }
      
      if (cleaningConflicts && cleaningConflicts.length > 0) {
        throw new AppError('Another cleaning is already scheduled for this date', 409);
      }
    }
    
    // Prepare update data
    const cleanedData: Record<string, unknown> = {};
    
    if (updateData.cleanerId !== undefined) cleanedData.cleaner_id = updateData.cleanerId;
    if (updateData.scheduledStart !== undefined) cleanedData.scheduled_start = updateData.scheduledStart;
    if (updateData.scheduledEnd !== undefined) cleanedData.scheduled_end = updateData.scheduledEnd;
    if (updateData.actualStart !== undefined) cleanedData.actual_start = updateData.actualStart;
    if (updateData.actualEnd !== undefined) cleanedData.actual_end = updateData.actualEnd;
    if (updateData.status !== undefined) cleanedData.status = updateData.status;
    if (updateData.cleaningType !== undefined) cleanedData.cleaning_type = updateData.cleaningType;
    if (updateData.instructions !== undefined) cleanedData.instructions = updateData.instructions ? sanitizeText(updateData.instructions) : null;
    if (updateData.supplies !== undefined) cleanedData.supplies = updateData.supplies;
    if (updateData.photos !== undefined) cleanedData.photos = updateData.photos;
    if (updateData.cost !== undefined) cleanedData.cost = updateData.cost;
    if (updateData.rating !== undefined) cleanedData.rating = updateData.rating;
    if (updateData.notes !== undefined) cleanedData.notes = updateData.notes ? sanitizeText(updateData.notes) : null;
    
    cleanedData.updated_at = new Date().toISOString();
    
    // Update cleaning (filter by apartment owner)
    const { data: updatedCleaning, error: updateError } = await supabase
      .from('cleanings')
      .update(cleanedData)
      .eq('id', cleaningId)
      .select(`
        *,
        apartment:apartments(
          id,
          name,
          address
        ),
        cleaner:cleaners(
          id,
          name,
          email,
          phone
        )
      `)
      .single();
    
    if (updateError) {
      throw new AppError(updateError.message, 400);
    }
    
    // Map cleaning from DB format to frontend format
    const mappedCleaning = dbMappers.cleaning.fromDB(updatedCleaning);
    
    return NextResponse.json(
      createSuccessResponse(mappedCleaning, 'Cleaning updated successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid input data', 400),
        { status: 400 }
      );
    }
    
    console.error('Update cleaning error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to update cleaning', 500),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cleaningId } = await params;
    
    if (!isValidUUID(cleaningId)) {
      throw new AppError('Invalid cleaning ID', 400);
    }
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Check if cleaning exists and its status through apartment ownership
    const { data: existingCleaning, error: checkError } = await supabase
      .from('cleanings')
      .select(`
        id, 
        status,
        apartment:apartments!inner(
          owner_id
        )
      `)
      .eq('id', cleaningId)
      .eq('apartment.owner_id', user.id)
      .single();
    
    if (checkError || !existingCleaning) {
      throw new AppError('Cleaning not found', 404);
    }
    
    if (existingCleaning.status === 'in_progress') {
      throw new AppError('Cannot cancel cleaning that is in progress', 400);
    }
    
    if (existingCleaning.status === 'completed' || existingCleaning.status === 'verified') {
      throw new AppError('Cannot cancel completed cleaning', 400);
    }
    
    // Update status to cancelled (no hard delete)
    const { error: deleteError } = await supabase
      .from('cleanings')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', cleaningId);
    
    if (deleteError) {
      throw new AppError(deleteError.message, 400);
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Cleaning cancelled successfully')
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    console.error('Delete cleaning error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to cancel cleaning', 500),
      { status: 500 }
    );
  }
}