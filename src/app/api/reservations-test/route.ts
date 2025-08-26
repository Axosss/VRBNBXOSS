import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create a simpler test table without enums
    const { error: createTableError } = await supabase.rpc('create_test_reservations_table')
    
    if (createTableError) {
      console.log('Table might already exist or creation failed:', createTableError)
    }
    
    // Insert into test table
    const { data: testInsert, error: testError } = await supabase
      .from('test_reservations')
      .insert({
        apartment_id: body.apartmentId,
        owner_id: user.id,
        platform: 'direct',
        check_in: body.checkIn,
        check_out: body.checkOut,
        guest_count: body.guestCount || 1,
        total_price: body.totalPrice || 1000,
        status: 'confirmed'
      })
      .select()
      .single()
    
    if (testError) {
      console.error('Test table insert error:', testError)
      return NextResponse.json({ 
        error: 'Test insert failed',
        details: testError 
      }, { status: 400 })
    }
    
    console.log('Test insert succeeded:', testInsert)
    
    // Now try the real table with explicit status string
    const realData = {
      apartment_id: body.apartmentId,
      owner_id: user.id,
      platform: 'direct',
      check_in: body.checkIn,
      check_out: body.checkOut,
      guest_count: body.guestCount || 1,
      total_price: body.totalPrice || 1000,
      currency: 'USD',
      status: 'confirmed'  // Explicit status
    }
    
    console.log('Attempting real insert with:', realData)
    
    const { data: realInsert, error: realError } = await supabase
      .from('reservations')
      .insert(realData)
      .select('id, status')
      .single()
    
    if (realError) {
      console.error('Real insert error:', realError)
      return NextResponse.json({ 
        error: 'Real insert failed',
        details: realError,
        testInsertWorked: true,
        testId: testInsert.id
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true,
      testReservation: testInsert,
      realReservation: realInsert
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}