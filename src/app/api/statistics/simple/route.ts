import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  apartmentId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = querySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      apartmentId: searchParams.get('apartmentId') || undefined,
    })

    // Default to last 3 months if no date range provided
    const endDate = query.endDate || format(new Date(), 'yyyy-MM-dd')
    const startDate = query.startDate || format(subMonths(new Date(), 3), 'yyyy-MM-dd')

    // Get basic statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_simple_statistics', {
      p_owner_id: user.id,
      p_start_date: startDate,
      p_end_date: endDate,
      p_apartment_id: query.apartmentId || null
    })

    if (statsError) {
      console.error('Statistics error:', statsError)
      // Fallback to direct queries if function doesn't exist yet
      
      // Get total reservations and revenue
      // Find all reservations that overlap with the date range
      let reservationsQuery = supabase
        .from('reservations')
        .select('total_price, cleaning_fee, platform_fee, guest_count, check_in, check_out, status, platform')
        .eq('owner_id', user.id)
        .lte('check_in', endDate)  // Starts before or during the period
        .gte('check_out', startDate) // Ends after or during the period

      if (query.apartmentId) {
        reservationsQuery = reservationsQuery.eq('apartment_id', query.apartmentId)
      }

      const { data: reservations, error: resError } = await reservationsQuery

      if (resError) throw resError

      // Filter out cancelled and draft reservations
      const activeReservations = reservations?.filter(
        r => r.status !== 'cancelled' && r.status !== 'draft'
      ) || []

      // Calculate metrics with prorated revenue for multi-period reservations
      const totalReservations = activeReservations.length
      
      // Calculate prorated revenue based on days within the period
      const periodStart = new Date(startDate)
      const periodEnd = new Date(endDate)
      
      const totalRevenue = activeReservations.reduce((sum, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        
        // Calculate the overlap period
        const overlapStart = checkIn > periodStart ? checkIn : periodStart
        const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
        
        // Calculate days in the overlap period
        const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        
        // Calculate total days of the reservation
        const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // Prorate the revenue
        const proratedAmount = totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0
        
        return sum + proratedAmount
      }, 0)
      
      // Prorate fees as well
      const totalCleaningFees = activeReservations.reduce((sum, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        const overlapStart = checkIn > periodStart ? checkIn : periodStart
        const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
        const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const proratedAmount = totalDays > 0 ? (Number(r.cleaning_fee) || 0) * (overlapDays / totalDays) : 0
        return sum + proratedAmount
      }, 0)
      
      const totalPlatformFees = activeReservations.reduce((sum, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        const overlapStart = checkIn > periodStart ? checkIn : periodStart
        const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
        const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
        const proratedAmount = totalDays > 0 ? (Number(r.platform_fee) || 0) * (overlapDays / totalDays) : 0
        return sum + proratedAmount
      }, 0)
      
      const totalGuests = activeReservations.reduce((sum, r) => sum + (r.guest_count || 0), 0)
      const averageRevenue = totalReservations > 0 ? totalRevenue / totalReservations : 0

      // Calculate occupancy
      let apartmentQuery = supabase
        .from('apartments')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (query.apartmentId) {
        apartmentQuery = apartmentQuery.eq('id', query.apartmentId)
      }

      const { data: apartments } = await apartmentQuery
      const apartmentCount = apartments?.length || 1
      
      const totalPossibleNights = apartmentCount * Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      
      const occupiedNights = activeReservations.reduce((sum, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        // Only count nights within the period
        const overlapStart = checkIn > periodStart ? checkIn : periodStart
        const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
        const nights = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)))
        return sum + nights
      }, 0)

      const occupancyRate = totalPossibleNights > 0 ? Math.round((occupiedNights / totalPossibleNights) * 100) : 0

      // Calculate platform breakdown with prorated amounts
      const platformBreakdown = {
        airbnb: activeReservations.filter(r => r.platform === 'airbnb').reduce((sum, r) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)
          const overlapStart = checkIn > periodStart ? checkIn : periodStart
          const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
          const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return sum + (totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0)
        }, 0),
        vrbo: activeReservations.filter(r => r.platform === 'vrbo').reduce((sum, r) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)
          const overlapStart = checkIn > periodStart ? checkIn : periodStart
          const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
          const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return sum + (totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0)
        }, 0),
        direct: activeReservations.filter(r => r.platform === 'direct').reduce((sum, r) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)
          const overlapStart = checkIn > periodStart ? checkIn : periodStart
          const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
          const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return sum + (totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0)
        }, 0),
        rent: activeReservations.filter(r => r.platform === 'rent').reduce((sum, r) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)
          const overlapStart = checkIn > periodStart ? checkIn : periodStart
          const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd
          const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return sum + (totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0)
        }, 0),
      }

      // Get period-specific data for chart based on selected date range
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
      
      let monthlyData = []
      
      // When showing all properties, get per-apartment breakdown
      if (!query.apartmentId) {
        // Get all apartments for the user
        const { data: userApartments } = await supabase
          .from('apartments')
          .select('id, name')
          .eq('owner_id', user.id)
          .eq('status', 'active')
        
        const apartmentData: any = {}
        
        // Initialize data structure for each apartment
        userApartments?.forEach(apt => {
          apartmentData[apt.id] = {
            name: apt.name,
            data: []
          }
        })
        
        // Determine granularity based on period length
        if (daysDiff <= 31) {
          // Daily granularity for 1 month or less
          for (let d = 0; d <= daysDiff; d++) {
            const currentDate = new Date(startDateObj)
            currentDate.setDate(currentDate.getDate() + d)
            const dayStart = format(currentDate, 'yyyy-MM-dd')
            const dayEnd = format(currentDate, 'yyyy-MM-dd')
            const periodLabel = format(currentDate, 'MMM dd')
            
            // Get reservations for this day with apartment info
            const { data: dayReservations } = await supabase
              .from('reservations')
              .select('total_price, cleaning_fee, platform_fee, status, check_in, check_out, apartment_id')
              .eq('owner_id', user.id)
              .lte('check_in', dayEnd)
              .gte('check_out', dayStart)
            
            const activeDayReservations = dayReservations?.filter(
              r => r.status !== 'cancelled' && r.status !== 'draft'
            ) || []
            
            // Calculate revenue per apartment
            const periodData: any = { period: periodLabel }
            let totalRevenue = 0
            
            for (const aptId in apartmentData) {
              const aptReservations = activeDayReservations.filter(r => r.apartment_id === aptId)
              const aptRevenue = aptReservations.reduce((sum, r) => {
                const checkIn = new Date(r.check_in)
                const checkOut = new Date(r.check_out)
                const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
                const dailyRate = (Number(r.total_price) || 0) / totalDays
                return sum + dailyRate
              }, 0)
              
              periodData[aptId] = aptRevenue
              totalRevenue += aptRevenue
            }
            
            periodData.total = totalRevenue
            monthlyData.push(periodData)
          }
        } else {
          // Monthly granularity for longer periods
          let currentDate = new Date(startDateObj)
          currentDate.setDate(1) // Start from the beginning of the month
          
          while (currentDate <= endDateObj) {
            const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd')
            const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd')
            
            // Don't go beyond the selected period
            const effectiveStart = monthStart < startDate ? startDate : monthStart
            const effectiveEnd = monthEnd > endDate ? endDate : monthEnd
            const periodLabel = format(currentDate, 'MMM')
            
            // Get reservations for this month with apartment info
            const { data: monthReservations } = await supabase
              .from('reservations')
              .select('total_price, cleaning_fee, platform_fee, status, check_in, check_out, apartment_id')
              .eq('owner_id', user.id)
              .lte('check_in', effectiveEnd)
              .gte('check_out', effectiveStart)
            
            const activeMonthReservations = monthReservations?.filter(
              r => r.status !== 'cancelled' && r.status !== 'draft'
            ) || []
            
            // Calculate revenue per apartment
            const periodData: any = { period: periodLabel }
            let totalRevenue = 0
            
            for (const aptId in apartmentData) {
              const aptReservations = activeMonthReservations.filter(r => r.apartment_id === aptId)
              const aptRevenue = aptReservations.reduce((sum, r) => {
                const checkIn = new Date(r.check_in)
                const checkOut = new Date(r.check_out)
                const monthStartDate = new Date(effectiveStart)
                const monthEndDate = new Date(effectiveEnd)
                
                // Calculate total days of the reservation
                const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
                
                // Check if this is a long-term rental (> 30 days)
                const isLongTermRental = totalDays > 30
                
                let proratedAmount = 0
                
                if (isLongTermRental) {
                  // For long-term rentals, use fixed monthly rent calculation
                  const totalMonths = Math.max(1, Math.round(totalDays / 30))
                  const monthlyRent = (Number(r.total_price) || 0) / totalMonths
                  
                  // Check if current month is fully within the reservation period
                  const isFullMonth = checkIn <= monthStartDate && checkOut >= monthEndDate
                  
                  if (isFullMonth) {
                    proratedAmount = monthlyRent
                  } else {
                    // Partial month - calculate based on days occupied
                    const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate
                    const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate
                    const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                    const daysInMonth = new Date(monthEndDate.getFullYear(), monthEndDate.getMonth() + 1, 0).getDate()
                    
                    proratedAmount = (monthlyRent / daysInMonth) * overlapDays
                  }
                } else {
                  // For short-term rentals, use the original daily rate calculation
                  const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate
                  const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate
                  const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  
                  proratedAmount = totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0
                }
                
                return sum + proratedAmount
              }, 0)
              
              periodData[aptId] = aptRevenue
              totalRevenue += aptRevenue
            }
            
            periodData.total = totalRevenue
            monthlyData.push(periodData)
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1)
          }
        }
        
        // Add apartment info to response
        monthlyData = {
          chartType: 'multi-apartment',
          apartments: userApartments || [],
          data: monthlyData
        }
      } else {
        // Single apartment - use line chart (existing logic)
        if (daysDiff <= 31) {
          // Daily granularity for 1 month or less
          for (let d = 0; d <= daysDiff; d++) {
            const currentDate = new Date(startDateObj)
            currentDate.setDate(currentDate.getDate() + d)
            const dayStart = format(currentDate, 'yyyy-MM-dd')
            const dayEnd = format(currentDate, 'yyyy-MM-dd')
            
            // Find reservations that overlap with this day
            let dayQuery = supabase
              .from('reservations')
              .select('total_price, cleaning_fee, platform_fee, status, check_in, check_out')
              .eq('owner_id', user.id)
              .lte('check_in', dayEnd)
              .gte('check_out', dayStart)
              .eq('apartment_id', query.apartmentId)
            
            const { data: dayReservations } = await dayQuery
            
            const activeDayReservations = dayReservations?.filter(
              r => r.status !== 'cancelled' && r.status !== 'draft'
            ) || []
            
            // Calculate prorated revenue for this day
            const dayRevenue = activeDayReservations.reduce((sum, r) => {
              const checkIn = new Date(r.check_in)
              const checkOut = new Date(r.check_out)
              const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
              const dailyRate = (Number(r.total_price) || 0) / totalDays
              return sum + dailyRate
            }, 0)
            
            monthlyData.push({
              month: format(currentDate, 'MMM dd'),
              revenue: dayRevenue
            })
          }
        } else {
          // Monthly granularity for longer periods
          let currentDate = new Date(startDateObj)
          currentDate.setDate(1) // Start from the beginning of the month
          
          while (currentDate <= endDateObj) {
            const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd')
            const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd')
            
            // Don't go beyond the selected period
            const effectiveStart = monthStart < startDate ? startDate : monthStart
            const effectiveEnd = monthEnd > endDate ? endDate : monthEnd
            
            // Find reservations that overlap with this month
            let monthQuery = supabase
              .from('reservations')
              .select('total_price, cleaning_fee, platform_fee, status, check_in, check_out')
              .eq('owner_id', user.id)
              .lte('check_in', effectiveEnd)
              .gte('check_out', effectiveStart)
              .eq('apartment_id', query.apartmentId)
            
            const { data: monthReservations } = await monthQuery
            
            const activeMonthReservations = monthReservations?.filter(
              r => r.status !== 'cancelled' && r.status !== 'draft'
            ) || []
            
            // Calculate prorated revenue for this month
            const monthRevenue = activeMonthReservations.reduce((sum, r) => {
              const checkIn = new Date(r.check_in)
              const checkOut = new Date(r.check_out)
              const monthStartDate = new Date(effectiveStart)
              const monthEndDate = new Date(effectiveEnd)
              
              // Calculate total days of the reservation
              const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
              
              // Check if this is a long-term rental (> 30 days)
              const isLongTermRental = totalDays > 30
              
              let proratedAmount = 0
              
              if (isLongTermRental) {
                // For long-term rentals, use fixed monthly rent calculation
                const totalMonths = Math.max(1, Math.round(totalDays / 30))
                const monthlyRent = (Number(r.total_price) || 0) / totalMonths
                
                // Check if current month is fully within the reservation period
                const isFullMonth = checkIn <= monthStartDate && checkOut >= monthEndDate
                
                if (isFullMonth) {
                  proratedAmount = monthlyRent
                } else {
                  // Partial month - calculate based on days occupied
                  const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate
                  const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate
                  const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                  const daysInMonth = new Date(monthEndDate.getFullYear(), monthEndDate.getMonth() + 1, 0).getDate()
                  
                  proratedAmount = (monthlyRent / daysInMonth) * overlapDays
                }
              } else {
                // For short-term rentals, use the original daily rate calculation
                const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate
                const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate
                const overlapDays = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                
                proratedAmount = totalDays > 0 ? (Number(r.total_price) || 0) * (overlapDays / totalDays) : 0
              }
              
              return sum + proratedAmount
            }, 0)
            
            monthlyData.push({
              month: format(currentDate, 'MMM'),
              revenue: monthRevenue
            })
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1)
          }
        }
      }

      return NextResponse.json({
        occupancyRate,
        totalGuests,
        averageRevenue: Math.round(averageRevenue),
        totalRevenue,
        totalReservations,
        monthlyData,
        platformBreakdown,
        totalCleaningFees,
        totalPlatformFees
      })
    }

    // If RPC function exists and works
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Statistics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}