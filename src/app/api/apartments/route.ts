import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apartmentCreateSchema, paginationSchema, apartmentFilterSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { sanitizeSearchQuery, sanitizeText } from '@/lib/utils/sanitize'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate pagination and filters
    const pagination = paginationSchema.parse(queryParams)
    const filters = apartmentFilterSchema.parse(queryParams)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Build query
    let query = supabase
      .from('apartments')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.search) {
      const sanitizedSearch = sanitizeSearchQuery(filters.search)
      query = query.ilike('name', `%${sanitizedSearch}%`)
    }
    
    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1
    
    query = query.range(from, to)
    
    const { data: apartments, error: queryError, count } = await query
    
    if (queryError) {
      throw new AppError(queryError.message, 500)
    }
    
    return NextResponse.json(
      createSuccessResponse({
        apartments: apartments || [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        }
      }, 'Apartments fetched successfully')
    )
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        createErrorResponse(error.message, error.statusCode),
        { status: error.statusCode }
      )
    }
    
    console.error('Apartments API error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch apartments', 500),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const apartmentData = apartmentCreateSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Prepare data for insertion
    const insertData = {
      owner_id: user.id,
      name: sanitizeText(apartmentData.name),
      address: apartmentData.address,
      capacity: apartmentData.capacity,
      bedrooms: apartmentData.bedrooms,
      bathrooms: apartmentData.bathrooms,
      square_feet: apartmentData.squareFeet,
      amenities: apartmentData.amenities || [],
      photos: [],
      access_codes: apartmentData.accessCodes,
      status: apartmentData.status || 'active',
      notes: apartmentData.notes ? sanitizeText(apartmentData.notes) : null
    }
    
    // Insert apartment
    const { data: apartment, error: insertError } = await supabase
      .from('apartments')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      throw new AppError(insertError.message, 400)
    }
    
    return NextResponse.json(
      createSuccessResponse(apartment, 'Apartment created successfully'),
      { status: 201 }
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
    
    console.error('Create apartment error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to create apartment', 500),
      { status: 500 }
    )
  }
}