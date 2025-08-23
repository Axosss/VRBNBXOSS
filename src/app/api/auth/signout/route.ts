import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(
      createSuccessResponse(null, 'Signed out successfully'),
      { status: 200 }
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error, 'Failed to sign out')
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}