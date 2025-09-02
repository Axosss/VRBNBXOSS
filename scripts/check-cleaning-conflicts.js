const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCleaningConflicts() {
  console.log('Checking cleaning conflicts and data...\n')

  try {
    // Get all cleanings
    const { data: cleanings, error: cleaningsError } = await supabase
      .from('cleanings')
      .select('*')
      .order('scheduled_start', { ascending: false })

    if (cleaningsError) {
      console.error('Error fetching cleanings:', cleaningsError)
      return
    }

    console.log(`Found ${cleanings.length} cleanings:`)
    cleanings.forEach(cleaning => {
      console.log(`- ID: ${cleaning.id}`)
      console.log(`  Apartment: ${cleaning.apartment_id}`)
      console.log(`  Scheduled: ${cleaning.scheduled_start} to ${cleaning.scheduled_end}`)
      console.log(`  Status: ${cleaning.status}`)
      console.log(`  Type: ${cleaning.cleaning_type}`)
      console.log('')
    })

    // Get all reservations to see if there are any upcoming ones
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, apartment_id, check_in, check_out, status, contact_info')
      .gte('check_out', new Date().toISOString())
      .neq('status', 'cancelled')
      .order('check_in', { ascending: true })
      .limit(10)

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return
    }

    console.log(`\nUpcoming reservations (${reservations.length}):`)
    reservations.forEach(res => {
      const guestName = res.contact_info?.name || res.contact_info?.guestName || 'Unknown'
      console.log(`- Reservation: ${res.id}`)
      console.log(`  Guest: ${guestName}`)
      console.log(`  Check-in: ${res.check_in}`)
      console.log(`  Check-out: ${res.check_out}`)
      console.log(`  Status: ${res.status}`)
      console.log('')
    })

    // Get all apartments
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('id, name')

    if (!apartmentsError) {
      console.log('\nApartments:')
      apartments.forEach(apt => {
        console.log(`- ${apt.name}: ${apt.id}`)
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkCleaningConflicts()