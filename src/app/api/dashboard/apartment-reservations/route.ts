import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { dbMappers } from '@/lib/mappers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Get all apartments for the user
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (apartmentsError) {
      throw new AppError('Failed to fetch apartments', 500)
    }

    if (!apartments || apartments.length === 0) {
      return NextResponse.json(
        createSuccessResponse({
          apartments: []
        }, 'No apartments found')
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // For each apartment, get current and next reservation
    const apartmentReservations = await Promise.all(
      apartments.map(async (apartment) => {
        // Get current reservation (today is between check-in and check-out)
        const { data: currentReservation } = await supabase
          .from('reservations')
          .select(`
            *,
            guest:guests(
              id,
              name
            )
          `)
          .eq('apartment_id', apartment.id)
          .eq('owner_id', user.id)
          .eq('status', 'confirmed')
          .lte('check_in', todayStr)
          .gt('check_out', todayStr)
          .order('check_in', { ascending: true })
          .limit(1)
          .maybeSingle()

        // Get next reservation (check-in is after today)
        const { data: nextReservation } = await supabase
          .from('reservations')
          .select(`
            *,
            guest:guests(
              id,
              name
            )
          `)
          .eq('apartment_id', apartment.id)
          .eq('owner_id', user.id)
          .eq('status', 'confirmed')
          .gt('check_in', todayStr)
          .order('check_in', { ascending: true })
          .limit(1)
          .maybeSingle()

        // Calculate days remaining for current reservation
        let daysRemaining = null
        if (currentReservation) {
          const checkOutDate = new Date(currentReservation.check_out)
          checkOutDate.setHours(0, 0, 0, 0)
          const diffTime = checkOutDate.getTime() - today.getTime()
          daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }

        // Debug Montaigne issue
        if (apartment.name && apartment.name.toLowerCase().includes('montaigne')) {
          console.log('Montaigne Debug:', {
            apartment: apartment.name,
            currentReservation: currentReservation ? {
              id: currentReservation.id,
              guest_id: currentReservation.guest_id,
              guest: currentReservation.guest
            } : null
          })
        }

        return {
          apartment: dbMappers.apartment.fromDB(apartment),
          currentReservation: currentReservation ? {
            ...dbMappers.reservation.fromDB(currentReservation),
            guest: currentReservation.guest ? dbMappers.guest.fromDB(currentReservation.guest) : null,
            daysRemaining
          } : null,
          nextReservation: nextReservation ? {
            ...dbMappers.reservation.fromDB(nextReservation),
            guest: nextReservation.guest ? dbMappers.guest.fromDB(nextReservation.guest) : null
          } : null
        }
      })
    )

    return NextResponse.json(
      createSuccessResponse({
        apartments: apartmentReservations
      }, 'Apartment reservations retrieved successfully')
    )

  } catch (error) {
    console.error('GET /api/dashboard/apartment-reservations error:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode
    })
  }
}