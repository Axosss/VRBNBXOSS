import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCleaningSchema, cleaningFiltersSchema } from '@/lib/validations/cleaning';
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils';
import { sanitizeText } from '@/lib/utils/sanitize';
import { dbMappers } from '@/lib/mappers';
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
    
    // Map cleanings from DB format to frontend format with relations
    const mappedCleanings = (cleanings || []).map(dbMappers.cleaning.withRelationsFromDB);
    
    return NextResponse.json(
      createSuccessResponse({
        cleanings: mappedCleanings,
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
    // Handle both formats (snake_case from the mapper or camelCase if sent directly)
    const transformedBody = {
      apartmentId: body.apartmentId || body.apartment_id,
      cleanerId: body.cleanerId || body.cleaner_id,
      reservationId: body.reservationId || body.reservation_id,
      scheduledStart: body.scheduledStart || body.scheduled_start || body.scheduled_date,
      scheduledEnd: body.scheduledEnd || body.scheduled_end,
      cleaningType: body.cleaningType || body.cleaning_type || 'standard',
      instructions: body.instructions,
      supplies: body.supplies || {},
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
    
    // No conflict checking - cleanings are purely informational
    // Users can create cleanings at any time, even overlapping
    
    // Prepare data for insertion
    const insertData = {
      apartment_id: cleaningData.apartmentId,
      owner_id: user.id,
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
    
    // Map cleaning from DB format to frontend format
    const mappedCleaning = dbMappers.cleaning.fromDB(cleaning);
    
    return NextResponse.json(
      createSuccessResponse(mappedCleaning, 'Cleaning scheduled successfully'),
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