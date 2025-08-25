import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { availabilityCheckSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID } from '@/lib/utils'
import type { AvailabilityResult, AvailabilitySlot } from '@/types/calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    console.log('Availability API - Received query params:', JSON.stringify(queryParams, null, 2))

    // Validate query parameters
    const availabilityCheck = availabilityCheckSchema.parse(queryParams)
    
    console.log('Availability API - Parsed check:', JSON.stringify(availabilityCheck, null, 2))

    // Create Supabase client and get user
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Availability API - Auth error:', userError)
      throw new AppError('Authentication failed', 401)
    }

    if (!user) {
      throw new AppError('User not authenticated', 401)
    }

    // Verify apartment ownership
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, name, capacity')
      .eq('id', availabilityCheck.apartmentId)
      .eq('owner_id', user.id)
      .single()

    if (apartmentError) {
      console.error('Availability API - Apartment error:', apartmentError)
      throw new AppError('Apartment not found', 404)
    }

    if (!apartment) {
      throw new AppError('Apartment not found or access denied', 404)
    }

    // Use the database function to check availability
    const { data: available, error: availabilityError } = await supabase.rpc('check_availability', {
      p_apartment_id: availabilityCheck.apartmentId,
      p_check_in: availabilityCheck.checkIn,
      p_check_out: availabilityCheck.checkOut,
      p_exclude_reservation_id: availabilityCheck.excludeReservationId || null
    })

    if (availabilityError) {
      console.error('Availability API - Database error:', availabilityError)
      throw new AppError('Failed to check availability', 500)
    }

    let conflicts: AvailabilityResult['conflicts'] = []
    let suggestions: AvailabilitySlot[] = []

    console.log('Availability API - Available:', available)

    if (!available) {
      // Get conflicting reservations for detailed info
      let conflictQuery = supabase
        .from('reservations')
        .select(`
          id,
          check_in,
          check_out,
          contact_info,
          guest:guests(name)
        `)
        .eq('apartment_id', availabilityCheck.apartmentId)
        .neq('status', 'cancelled')
        .or(`and(check_in.lt.${availabilityCheck.checkOut},check_out.gt.${availabilityCheck.checkIn})`)

      // Exclude specific reservation if provided
      if (availabilityCheck.excludeReservationId) {
        conflictQuery = conflictQuery.neq('id', availabilityCheck.excludeReservationId)
      }

      const { data: conflictData, error: conflictError } = await conflictQuery

      if (conflictError) {
        console.warn('Availability API - Conflict query error:', conflictError)
      } else if (conflictData && conflictData.length > 0) {
        conflicts = conflictData.map((res: any) => ({
          id: res.id,
          check_in: res.check_in,
          check_out: res.check_out,
          guest_name: res.guest?.name || 
                     res.contact_info?.name || 
                     res.contact_info?.guest_name || 
                     'Guest'
        }))
      }

      // Get availability gaps as suggestions
      try {
        const requestedNights = Math.ceil(
          (new Date(availabilityCheck.checkOut).getTime() - new Date(availabilityCheck.checkIn).getTime()) 
          / (1000 * 60 * 60 * 24)
        )

        // Get gaps around the requested dates (extend search range)
        const searchStart = new Date(availabilityCheck.checkIn)
        searchStart.setDate(searchStart.getDate() - 30) // Look 30 days before
        
        const searchEnd = new Date(availabilityCheck.checkOut)
        searchEnd.setDate(searchEnd.getDate() + 30) // Look 30 days after

        const { data: gaps, error: gapsError } = await supabase.rpc('get_availability_gaps', {
          p_apartment_id: availabilityCheck.apartmentId,
          p_start_date: searchStart.toISOString().split('T')[0],
          p_end_date: searchEnd.toISOString().split('T')[0],
          p_min_gap_days: requestedNights
        })

        if (!gapsError && gaps && gaps.length > 0) {
          suggestions = gaps.slice(0, 5) // Limit to 5 suggestions
        }
      } catch (error) {
        console.warn('Availability API - Failed to get suggestions:', error)
        // Continue without suggestions
      }
    }

    const result: AvailabilityResult = {
      available: available || false,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }

    console.log('Availability API - Result:', JSON.stringify(result, null, 2))

    return createSuccessResponse(result, 'Availability checked successfully')

  } catch (error) {
    console.error('Availability API - Error:', error)

    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.statusCode)
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('Invalid query parameters', 400)
    }

    return createErrorResponse('Failed to check availability', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // POST endpoint for batch availability checks
    const body = await request.json()
    console.log('Availability API POST - Received body:', JSON.stringify(body, null, 2))

    // Support both single check and batch checks
    const checks = Array.isArray(body) ? body : [body]
    
    // Validate each check
    const validatedChecks = checks.map(check => availabilityCheckSchema.parse(check))

    // Create Supabase client and get user
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Availability API POST - Auth error:', userError)
      throw new AppError('Authentication failed', 401)
    }

    if (!user) {
      throw new AppError('User not authenticated', 401)
    }

    // Process each availability check
    const results: AvailabilityResult[] = []

    for (const check of validatedChecks) {
      try {
        // Verify apartment ownership
        const { data: apartment, error: apartmentError } = await supabase
          .from('apartments')
          .select('id')
          .eq('id', check.apartmentId)
          .eq('owner_id', user.id)
          .single()

        if (apartmentError || !apartment) {
          results.push({
            available: false,
            conflicts: [{ 
              id: 'access_denied', 
              check_in: check.checkIn, 
              check_out: check.checkOut, 
              guest_name: 'Access Denied' 
            }]
          })
          continue
        }

        // Check availability
        const { data: available, error: availabilityError } = await supabase.rpc('check_availability', {
          p_apartment_id: check.apartmentId,
          p_check_in: check.checkIn,
          p_check_out: check.checkOut,
          p_exclude_reservation_id: check.excludeReservationId || null
        })

        if (availabilityError) {
          console.error('Availability API POST - Database error for check:', check, availabilityError)
          results.push({
            available: false,
            conflicts: [{ 
              id: 'error', 
              check_in: check.checkIn, 
              check_out: check.checkOut, 
              guest_name: 'Check Failed' 
            }]
          })
          continue
        }

        let conflicts: AvailabilityResult['conflicts'] = []

        if (!available) {
          // Get conflicting reservations
          let conflictQuery = supabase
            .from('reservations')
            .select(`
              id,
              check_in,
              check_out,
              contact_info,
              guest:guests(name)
            `)
            .eq('apartment_id', check.apartmentId)
            .neq('status', 'cancelled')
            .or(`and(check_in.lt.${check.checkOut},check_out.gt.${check.checkIn})`)

          if (check.excludeReservationId) {
            conflictQuery = conflictQuery.neq('id', check.excludeReservationId)
          }

          const { data: conflictData, error: conflictError } = await conflictQuery

          if (!conflictError && conflictData) {
            conflicts = conflictData.map((res: any) => ({
              id: res.id,
              check_in: res.check_in,
              check_out: res.check_out,
              guest_name: res.guest?.name || res.contact_info?.name || 'Guest'
            }))
          }
        }

        results.push({
          available: available || false,
          conflicts: conflicts.length > 0 ? conflicts : undefined
        })

      } catch (error) {
        console.error('Availability API POST - Error processing check:', check, error)
        results.push({
          available: false,
          conflicts: [{ 
            id: 'error', 
            check_in: check.checkIn, 
            check_out: check.checkOut, 
            guest_name: 'Check Failed' 
          }]
        })
      }
    }

    // Return single result or array based on input
    const responseData = Array.isArray(body) ? results : results[0]

    console.log('Availability API POST - Results:', JSON.stringify(responseData, null, 2))

    return createSuccessResponse(responseData, 'Availability checks completed')

  } catch (error) {
    console.error('Availability API POST - Error:', error)

    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.statusCode)
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('Invalid request body', 400)
    }

    return createErrorResponse('Failed to check availability', 500)
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}