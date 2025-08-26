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
    
    const tests = []
    
    // Test 1: Absolute minimum fields
    const test1 = {
      apartment_id: '63561c46-cbc2-4340-8f51-9c798fde898a',
      owner_id: user.id,
      platform: 'direct',
      check_in: '2025-10-01',
      check_out: '2025-10-07',
      guest_count: 1,
      total_price: 1000
    }
    
    console.log('Test 1 - Minimum fields:', test1)
    const { error: error1 } = await supabase
      .from('reservations')
      .insert(test1)
      .select('id')
      .single()
    
    tests.push({ test: 'minimum', data: test1, error: error1 })
    
    if (!error1) {
      console.log('Test 1 SUCCESS!')
      return NextResponse.json({ success: true, test: 'minimum' })
    }
    
    // Test 2: Add currency field
    const test2 = {
      ...test1,
      currency: 'USD'
    }
    
    console.log('Test 2 - With currency:', test2)
    const { error: error2 } = await supabase
      .from('reservations')
      .insert(test2)
      .select('id')
      .single()
    
    tests.push({ test: 'with_currency', data: test2, error: error2 })
    
    if (!error2) {
      console.log('Test 2 SUCCESS!')
      return NextResponse.json({ success: true, test: 'with_currency' })
    }
    
    // Test 3: Add EUR currency
    const test3 = {
      ...test1,
      currency: 'EUR'
    }
    
    console.log('Test 3 - With EUR:', test3)
    const { error: error3 } = await supabase
      .from('reservations')
      .insert(test3)
      .select('id')
      .single()
    
    tests.push({ test: 'with_EUR', data: test3, error: error3 })
    
    if (!error3) {
      console.log('Test 3 SUCCESS!')
      return NextResponse.json({ success: true, test: 'with_EUR' })
    }
    
    // Test 4: Add contact_info
    const test4 = {
      ...test1,
      contact_info: { guestName: 'Test' }
    }
    
    console.log('Test 4 - With contact_info:', test4)
    const { error: error4 } = await supabase
      .from('reservations')
      .insert(test4)
      .select('id')
      .single()
    
    tests.push({ test: 'with_contact', data: test4, error: error4 })
    
    if (!error4) {
      console.log('Test 4 SUCCESS!')
      return NextResponse.json({ success: true, test: 'with_contact' })
    }
    
    // All tests failed
    console.error('All tests failed:', tests)
    return NextResponse.json({ 
      error: 'All tests failed',
      tests: tests.map(t => ({
        test: t.test,
        error: t.error?.message || 'Unknown error'
      }))
    }, { status: 400 })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}