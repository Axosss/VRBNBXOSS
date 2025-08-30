import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGuestSchema, guestFiltersSchema } from '@/lib/validations/guest'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { sanitizeText, sanitizeContactInfo } from '@/lib/utils/sanitize'
import { mapGuestFromDB, mapGuestToDB } from '@/lib/mappers/guest.mapper'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate filters
    const filters = guestFiltersSchema.parse(queryParams)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Build query
    let query = supabase
      .from('guests')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
    
    // Apply filters
    if (filters.search) {
      const sanitizedSearch = sanitizeText(filters.search)
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%`)
    }
    
    // Apply sorting
    const sortColumn = filters.sortBy === 'created_at' ? 'created_at' : 
                      filters.sortBy === 'updated_at' ? 'updated_at' :
                      filters.sortBy === 'email' ? 'email' : 'name'
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' })
    
    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    
    query = query.range(from, to)
    
    const { data: guests, error: queryError, count } = await query
    
    if (queryError) {
      console.error('Guests query error:', queryError)
      throw new AppError(queryError.message, 500)
    }
    
    // Map guests from DB format to frontend format
    const mappedGuests = (guests || []).map(mapGuestFromDB)
    
    return NextResponse.json(
      createSuccessResponse({
        guests: mappedGuests,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / filters.limit),
        },
      }, 'Guests fetched successfully')
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
        createErrorResponse('Invalid query parameters', 400),
        { status: 400 }
      )
    }
    
    console.error('Guests API error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch guests', 500),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const guestData = createGuestSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Prepare data for insertion
    const insertData = {
      owner_id: user.id,
      name: sanitizeText(guestData.name),
      email: guestData.email ? sanitizeContactInfo(guestData.email) : null,
      phone: guestData.phone ? sanitizeContactInfo(guestData.phone) : null,
      address: guestData.address || null,
      id_document: guestData.idDocument || null,
      notes: guestData.notes ? sanitizeText(guestData.notes) : null,
    }
    
    // Insert guest
    const { data: guest, error: insertError } = await supabase
      .from('guests')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert guest error:', insertError)
      throw new AppError(insertError.message, 400)
    }
    
    // Map guest from DB format to frontend format
    const mappedGuest = mapGuestFromDB(guest)
    
    return NextResponse.json(
      createSuccessResponse(mappedGuest, 'Guest created successfully'),
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
    
    console.error('Create guest error:', error)
    return NextResponse.json(
      createErrorResponse('Failed to create guest', 500),
      { status: 500 }
    )
  }
}