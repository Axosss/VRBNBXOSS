import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find Montaigne apartment
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('id, name')
      .eq('name', 'Montaigne')
      .eq('owner_id', user.id)
      .single()

    if (aptError || !apartment) {
      return NextResponse.json({ error: 'Montaigne apartment not found' }, { status: 404 })
    }

    // Find current reservation for Montaigne
    const today = new Date().toISOString().split('T')[0]

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('apartment_id', apartment.id)
      .eq('status', 'confirmed')
      .lte('check_in', today)
      .gt('check_out', today)
      .single()

    if (resError || !reservation) {
      return NextResponse.json({ error: 'No current reservation found for Montaigne' }, { status: 404 })
    }

    console.log('Found Montaigne reservation:', {
      id: reservation.id,
      guest_id: reservation.guest_id,
      contact_info: reservation.contact_info
    })

    // If already has guest_id, nothing to do
    if (reservation.guest_id) {
      return NextResponse.json({
        message: 'Reservation already has a guest_id',
        reservation
      })
    }

    // Get guest name from contact_info or default to 'Sanchez'
    const guestName = reservation.contact_info?.name ||
                     reservation.contact_info?.guestName ||
                     'Sanchez'

    const { data: existingGuest, error: guestCheckError } = await supabase
      .from('guests')
      .select('*')
      .eq('name', guestName)
      .eq('owner_id', user.id)
      .maybeSingle()

    let guestId

    if (existingGuest) {
      guestId = existingGuest.id
      console.log('Found existing guest:', guestName, guestId)
    } else {
      // Create new guest
      const { data: newGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          name: guestName,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating guest:', createError)
        return NextResponse.json({ error: 'Failed to create guest', details: createError }, { status: 500 })
      }

      guestId = newGuest.id
      console.log('Created new guest:', guestName, guestId)
    }

    // Update reservation with guest_id
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        guest_id: guestId,
        contact_info: { name: guestName },
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return NextResponse.json({ error: 'Failed to update reservation', details: updateError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked guest "${guestName}" to Montaigne reservation`,
      reservation: updatedReservation
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
}