import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCleaningSchema, cleaningFiltersSchema } from '@/lib/validations/cleaning';
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils';
import { sanitizeText } from '@/lib/utils/sanitize';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate filters
    const filters = cleaningFiltersSchema.parse(queryParams);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Build query with joins - filter through apartments.owner_id
    let query = supabase
      .from('cleanings')
      .select(`
        *,
        apartment:apartments!inner(
          id,
          name,
          address,
          owner_id
        ),
        cleaner:cleaners(
          id,
          name,
          email,
          phone
        ),
        reservation:reservations(
          id,
          check_in,
          check_out,
          platform,
          contact_info
        )
      `, { count: 'exact' })
      .eq('apartment.owner_id', user.id);
    
    // Apply filters
    if (filters.apartmentId) {
      query = query.eq('apartment_id', filters.apartmentId);
    }
    
    if (filters.cleanerId) {
      query = query.eq('cleaner_id', filters.cleanerId);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.cleaningType) {
      query = query.eq('cleaning_type', filters.cleaningType);
    }
    
    if (filters.startDate) {
      query = query.gte('scheduled_start', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('scheduled_end', filters.endDate);
    }
    
    if (filters.search) {
      const sanitizedSearch = sanitizeText(filters.search);
      query = query.or(`instructions.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`);
    }
    
    // Apply sorting
    const sortColumn = filters.sortBy === 'scheduled_start' ? 'scheduled_start' :
                      filters.sortBy === 'created_at' ? 'created_at' :
                      filters.sortBy === 'status' ? 'status' :
                      'scheduled_start';
    
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });
    
    // Apply pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    
    query = query.range(from, to);
    
    const { data: cleanings, error: queryError, count } = await query;
    
    if (queryError) {
      console.error('Cleanings query error:', queryError);
      throw new AppError(queryError.message, 500);
    }
    
    return NextResponse.json(
      createSuccessResponse({
        cleanings: cleanings || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / filters.limit),
        },
      }, 'Cleanings fetched successfully')
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
        createErrorResponse('Invalid query parameters', 400),
        { status: 400 }
      );
    }
    
    console.error('Cleanings API error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch cleanings', 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/cleanings - Request body:', JSON.stringify(body, null, 2));
    
    // Transform snake_case to camelCase for validation
    const transformedBody = {
      apartmentId: body.apartment_id,
      cleanerId: body.cleaner_id,
      reservationId: body.reservation_id,
      scheduledStart: body.scheduled_start,
      scheduledEnd: body.scheduled_end,
      cleaningType: body.cleaning_type || 'standard',
      instructions: body.instructions,
      supplies: body.supplies,
      cost: body.cost,
      currency: body.currency || 'EUR'
    };
    
    // Validate input
    const cleaningData = createCleaningSchema.parse(transformedBody);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Verify apartment belongs to user
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, name')
      .eq('id', cleaningData.apartmentId)
      .eq('owner_id', user.id)
      .single();
    
    if (apartmentError || !apartment) {
      throw new AppError('Apartment not found or not owned by user', 404);
    }
    
    // Verify cleaner belongs to user if provided
    if (cleaningData.cleanerId) {
      const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('id, active')
        .eq('id', cleaningData.cleanerId)
        .eq('owner_id', user.id)
        .eq('active', true)
        .single();
      
      if (cleanerError || !cleaner) {
        throw new AppError('Cleaner not found or not active', 404);
      }
    }
    
    // Check for scheduling conflicts with reservations
    const cleaningDate = new Date(cleaningData.scheduledStart);
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .eq('apartment_id', cleaningData.apartmentId)
      .neq('status', 'cancelled')
      .or(`and(check_in.lte.${cleaningDate.toISOString()},check_out.gte.${cleaningDate.toISOString()})`)
      .limit(1);
    
    if (conflictError) {
      console.error('Conflict check error:', conflictError);
      throw new AppError('Failed to verify availability', 500);
    }
    
    if (conflicts && conflicts.length > 0) {
      throw new AppError('Cleaning schedule conflicts with existing reservation', 409);
    }
    
    // Check for conflicts with other cleanings on the same time period
    const { data: cleaningConflicts, error: cleaningConflictError } = await supabase
      .from('cleanings')
      .select('id')
      .eq('apartment_id', cleaningData.apartmentId)
      .neq('status', 'cancelled')
      .or(`and(scheduled_start.lte.${cleaningData.scheduledEnd},scheduled_end.gte.${cleaningData.scheduledStart})`)
      .limit(1);
    
    if (cleaningConflictError) {
      console.error('Cleaning conflict check error:', cleaningConflictError);
      throw new AppError('Failed to check cleaning conflicts', 500);
    }
    
    if (cleaningConflicts && cleaningConflicts.length > 0) {
      throw new AppError('Cleaning schedule conflicts with another cleaning', 409);
    }
    
    // Prepare data for insertion
    const insertData = {
      apartment_id: cleaningData.apartmentId,
      cleaner_id: cleaningData.cleanerId || null,
      reservation_id: cleaningData.reservationId || null,
      scheduled_start: cleaningData.scheduledStart,
      scheduled_end: cleaningData.scheduledEnd,
      cleaning_type: cleaningData.cleaningType || 'standard',
      status: cleaningData.cleanerId ? 'scheduled' : 'needed',
      instructions: cleaningData.instructions ? sanitizeText(cleaningData.instructions) : null,
      supplies: cleaningData.supplies || {},
      cost: cleaningData.cost || null,
      currency: cleaningData.currency || 'EUR'
    };
    
    // Insert cleaning
    const { data: cleaning, error: insertError } = await supabase
      .from('cleanings')
      .insert(insertData)
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
    
    if (insertError) {
      console.error('Insert cleaning error:', insertError);
      throw new AppError(insertError.message, 400);
    }
    
    return NextResponse.json(
      createSuccessResponse(cleaning, 'Cleaning scheduled successfully'),
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      );
    }
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      const errorMessage = error.errors?.length 
        ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Invalid input data';
      return NextResponse.json(
        createErrorResponse(`Validation failed: ${errorMessage}`, 400),
        { status: 400 }
      );
    }
    
    console.error('Create cleaning error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to schedule cleaning', 500),
      { status: 500 }
    );
  }
}