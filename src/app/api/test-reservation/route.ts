import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Test 1: Try raw SQL insert
    const { data: sqlResult, error: sqlError } = await supabase.rpc('test_reservation_insert', {
      p_apartment_id: '63561c46-cbc2-4340-8f51-9c798fde898a',
      p_owner_id: user.id,
      p_check_in: '2025-09-01',
      p_check_out: '2025-09-07',
      p_guest_count: 2,
      p_total_price: 1000,
      p_platform: 'direct'
    }).single()
    
    if (sqlError) {
      console.error('SQL RPC error:', sqlError)
    } else {
      console.log('SQL RPC success:', sqlResult)
    }
    
    // Test 2: Try minimal insert with different dates
    const testData = {
      apartment_id: '63561c46-cbc2-4340-8f51-9c798fde898a',
      owner_id: user.id,
      check_in: '2025-09-15',
      check_out: '2025-09-20',
      guest_count: 1,
      total_price: 500,
      platform: 'direct'
    }
    
    console.log('Test insert data:', testData)
    
    const { data: testResult, error: testError } = await supabase
      .from('reservations')
      .insert(testData)
      .select('id, status')
      .single()
    
    if (testError) {
      console.error('Test insert error:', testError)
      return NextResponse.json({ 
        error: testError.message,
        code: testError.code,
        details: testError
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true,
      reservation: testResult
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}