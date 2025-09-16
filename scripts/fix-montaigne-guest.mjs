import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMontaigneGuest() {
  try {
    // First, find the current Montaigne reservation
    const today = new Date().toISOString().split('T')[0]

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select(`
        *,
        apartment:apartments!inner(name)
      `)
      .eq('apartment.name', 'Montaigne')
      .eq('status', 'confirmed')
      .lte('check_in', today)
      .gt('check_out', today)
      .single()

    if (resError) {
      console.error('Error finding reservation:', resError)
      return
    }

    if (!reservation) {
      console.log('No current reservation found for Montaigne')
      return
    }

    console.log('Found reservation:', {
      id: reservation.id,
      guest_id: reservation.guest_id,
      guest_name: reservation.guest_name,
      check_in: reservation.check_in,
      check_out: reservation.check_out
    })

    // If there's already a guest_id, nothing to do
    if (reservation.guest_id) {
      console.log('Reservation already has a guest_id')
      return
    }

    // Create or find guest named "Sanchez"
    const { data: existingGuest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('name', 'Sanchez')
      .eq('owner_id', reservation.owner_id)
      .single()

    let guestId

    if (existingGuest) {
      guestId = existingGuest.id
      console.log('Found existing guest "Sanchez":', guestId)
    } else {
      // Create new guest
      const { data: newGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          name: 'Sanchez',
          owner_id: reservation.owner_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating guest:', createError)
        return
      }

      guestId = newGuest.id
      console.log('Created new guest "Sanchez":', guestId)
    }

    // Update reservation with guest_id
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        guest_id: guestId,
        guest_name: 'Sanchez',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.id)

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return
    }

    console.log('Successfully updated reservation with guest "Sanchez"')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixMontaigneGuest()