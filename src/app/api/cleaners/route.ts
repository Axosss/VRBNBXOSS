import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCleanerSchema, cleanerFiltersSchema } from '@/lib/validations/cleaning';
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils';
import { sanitizeText, sanitizeContactInfo } from '@/lib/utils/sanitize';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate filters
    const filters = cleanerFiltersSchema.parse(queryParams);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Build query
    let query = supabase
      .from('cleaners')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    
    if (filters.minRating !== undefined) {
      query = query.gte('rating', filters.minRating);
    }
    
    if (filters.search) {
      const sanitizedSearch = sanitizeText(filters.search);
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%`);
    }
    
    // Apply pagination
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    
    query = query.range(from, to);
    
    const { data: cleaners, error: queryError, count } = await query;
    
    if (queryError) {
      console.error('Cleaners query error:', queryError);
      throw new AppError(queryError.message, 500);
    }
    
    return NextResponse.json(
      createSuccessResponse({
        cleaners: cleaners || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / filters.limit),
        },
      }, 'Cleaners fetched successfully')
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
    
    console.error('Cleaners API error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch cleaners', 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const cleanerData = createCleanerSchema.parse(body);
    
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401);
    }
    
    // Prepare data for insertion - match actual schema
    const insertData = {
      owner_id: user.id,
      name: sanitizeText(cleanerData.name),
      email: cleanerData.email ? sanitizeText(cleanerData.email) : null,
      phone: cleanerData.phone ? sanitizeText(cleanerData.phone) : null,
      hourly_rate: cleanerData.hourlyRate || null,
      flat_rate: cleanerData.flatRate || null,
      currency: cleanerData.currency || 'EUR',
      active: true,
      services: [],
      rating: null
    };
    
    // Insert cleaner
    const { data: cleaner, error: insertError } = await supabase
      .from('cleaners')
      .insert(insertData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert cleaner error:', insertError);
      throw new AppError(insertError.message, 400);
    }
    
    return NextResponse.json(
      createSuccessResponse(cleaner, 'Cleaner created successfully'),
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
      return NextResponse.json(
        createErrorResponse('Invalid input data', 400),
        { status: 400 }
      );
    }
    
    console.error('Create cleaner error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create cleaner', 500),
      { status: 500 }
    );
  }
}