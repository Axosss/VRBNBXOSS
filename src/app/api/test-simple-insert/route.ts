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
    
    // First, create a simple test table without enums
    const { error: createError } = await supabase.rpc('create_simple_test_table')
    
    if (createError && !createError.message.includes('already exists')) {
      console.log('Could not create test table:', createError)
    }
    
    // Try inserting into the simple table
    const simpleData = {
      apartment_id: '63561c46-cbc2-4340-8f51-9c798fde898a',
      owner_id: user.id,
      check_in: '2025-10-01',
      check_out: '2025-10-07',
      guest_count: 1,
      total_price: 1000,
      platform: 'direct',  // String instead of enum
      status: 'confirmed'  // String instead of enum
    }
    
    console.log('Inserting into simple_reservations:', simpleData)
    
    const { data: simpleResult, error: simpleError } = await supabase
      .from('simple_reservations')
      .insert(simpleData)
      .select()
      .single()
    
    if (simpleError) {
      console.error('Simple insert error:', simpleError)
      
      // Now try the real table with explicit column list
      const { data: directResult, error: directError } = await supabase
        .rpc('direct_reservation_insert', {
          p_apartment_id: '63561c46-cbc2-4340-8f51-9c798fde898a',
          p_owner_id: user.id,
          p_check_in: '2025-10-01',
          p_check_out: '2025-10-07',
          p_guest_count: 1,
          p_total_price: 1000
        })
      
      if (directError) {
        console.error('Direct RPC error:', directError)
        
        // Last attempt: check if there's a view or something interfering
        const { data: tables, error: tablesError } = await supabase
          .rpc('list_reservation_objects')
        
        return NextResponse.json({
          error: 'All methods failed',
          simpleError: simpleError?.message,
          directError: directError?.message,
          tables: tables || [],
          tablesError: tablesError?.message
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        method: 'direct_rpc',
        result: directResult
      })
    }
    
    return NextResponse.json({
      success: true,
      method: 'simple_table',
      result: simpleResult
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // For easy browser testing
  return POST(request)
}