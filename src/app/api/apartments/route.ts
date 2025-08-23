import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apartmentCreateSchema, paginationSchema, apartmentFilterSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
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
      query = query.ilike('name', `%${filters.search}%`)
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
        },
      })
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(new AppError(error.errors[0].message, 400)),
        { status: 400 }
      )
    }
    
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
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
    
    // Prepare apartment data
    const insertData = {
      owner_id: user.id,
      name: apartmentData.name,
      address: apartmentData.address,
      capacity: apartmentData.capacity,
      bedrooms: apartmentData.bedrooms || null,
      bathrooms: apartmentData.bathrooms || null,
      amenities: apartmentData.amenities || [],
      access_codes: apartmentData.accessCodes || null,
      photos: [],
      status: 'active' as const,
    }
    
    // Create apartment
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(new AppError(error.errors[0].message, 400)),
        { status: 400 }
      )
    }
    
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}