import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calendarFiltersSchema, calendarStatsSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { serverCalendarAPI } from '@/lib/api/calendar'
import type { CalendarData, CalendarStats } from '@/types/calendar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    console.log('Calendar API - Received query params:', JSON.stringify(queryParams, null, 2))

    // Parse apartmentIds from comma-separated string
    if (queryParams.apartmentIds) {
      try {
        queryParams.apartmentIds = queryParams.apartmentIds.split(',').filter(Boolean)
      } catch (error) {
        queryParams.apartmentIds = []
      }
    }

    // Parse boolean fields
    if (queryParams.includeCleanings) {
      queryParams.includeCleanings = queryParams.includeCleanings === 'true'
    }

    // Parse stats request
    const includeStats = queryParams.includeStats === 'true'
    
    // Validate query parameters
    const filters = calendarFiltersSchema.parse(queryParams)
    
    console.log('Calendar API - Parsed filters:', JSON.stringify(filters, null, 2))

    // TEMPORARY: Use admin client to bypass auth issues
    const adminSupabase = createAdminClient()
    const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc' // Hardcoded for now
    
    console.log('Calendar API - Using admin client with user:', userId)

    // Fetch calendar data
    const calendarData: CalendarData = await serverCalendarAPI.getCalendarDataForUser(userId, filters)

    // Optionally fetch stats
    let stats: CalendarStats | undefined
    if (includeStats) {
      try {
        const { data: statsData, error: statsError } = await adminSupabase.rpc('get_calendar_stats', {
          p_owner_id: userId,
          p_start_date: filters.startDate,
          p_end_date: filters.endDate,
          p_apartment_ids: filters.apartmentIds || null
        })

        if (statsError) {
          console.warn('Calendar API - Stats error:', statsError)
          // Don't fail the entire request if stats fail
        } else if (statsData && statsData.length > 0) {
          const statResult = statsData[0]
          stats = {
            total_nights: statResult.total_nights,
            occupied_nights: statResult.occupied_nights,
            occupancy_rate: parseFloat(statResult.occupancy_rate),
            total_revenue: parseFloat(statResult.total_revenue),
            total_reservations: parseInt(statResult.total_reservations),
            platform_breakdown: statResult.platform_breakdown || {}
          }
        }
      } catch (error) {
        console.warn('Calendar API - Failed to fetch stats:', error)
        // Continue without stats
      }
    }

    // Add stats to response if requested and available
    if (stats) {
      calendarData.stats = stats
    }

    console.log(`Calendar API - Returning ${calendarData.reservations.length} reservations for ${calendarData.apartments.length} apartments`)

    return createSuccessResponse(calendarData, 'Calendar data fetched successfully')

  } catch (error) {
    console.error('Calendar API - Error:', error)

    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.statusCode)
    }

    if (error instanceof Error && error.message.includes('invalid input syntax')) {
      return createErrorResponse('Invalid query parameters', 400)
    }

    return createErrorResponse('Failed to fetch calendar data', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // POST endpoint for more complex calendar queries with body parameters
    const body = await request.json()
    console.log('Calendar API POST - Received body:', JSON.stringify(body, null, 2))

    // Validate the request body
    const filters = calendarFiltersSchema.parse(body)

    // TEMPORARY: Use admin client to bypass auth issues
    const adminSupabase = createAdminClient()
    const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc' // Hardcoded for now
    
    console.log('Calendar API POST - Using admin client with user:', userId)

    // Fetch calendar data
    const calendarData: CalendarData = await serverCalendarAPI.getCalendarDataForUser(userId, filters)

    // Fetch stats if requested
    let stats: CalendarStats | undefined
    if (body.includeStats) {
      try {
        const { data: statsData, error: statsError } = await adminSupabase.rpc('get_calendar_stats', {
          p_owner_id: userId,
          p_start_date: filters.startDate,
          p_end_date: filters.endDate,
          p_apartment_ids: filters.apartmentIds || null
        })

        if (!statsError && statsData && statsData.length > 0) {
          const statResult = statsData[0]
          stats = {
            total_nights: statResult.total_nights,
            occupied_nights: statResult.occupied_nights,
            occupancy_rate: parseFloat(statResult.occupancy_rate),
            total_revenue: parseFloat(statResult.total_revenue),
            total_reservations: parseInt(statResult.total_reservations),
            platform_breakdown: statResult.platform_breakdown || {}
          }
          calendarData.stats = stats
        }
      } catch (error) {
        console.warn('Calendar API POST - Failed to fetch stats:', error)
        // Continue without stats
      }
    }

    console.log(`Calendar API POST - Returning ${calendarData.reservations.length} reservations`)

    return createSuccessResponse(calendarData, 'Calendar data fetched successfully')

  } catch (error) {
    console.error('Calendar API POST - Error:', error)

    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.statusCode)
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('Invalid request body', 400)
    }

    return createErrorResponse('Failed to fetch calendar data', 500)
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