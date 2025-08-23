import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email, password } = signInSchema.parse(body)
    
    const supabase = await createClient()
    
    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw new AppError(error.message, 401)
    }
    
    if (!data.user || !data.session) {
      throw new AppError('Invalid credentials', 401)
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      // Profile might not exist yet, that's okay for new users
      console.warn('Profile not found:', profileError.message)
    }
    
    return NextResponse.json(
      createSuccessResponse(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: profile?.full_name || data.user.user_metadata?.full_name,
            avatarUrl: profile?.avatar_url,
            role: profile?.role || 'owner',
            timezone: profile?.timezone || 'UTC',
            settings: profile?.settings || {},
          },
          session: data.session,
        },
        'Signed in successfully'
      ),
      { status: 200 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(new AppError(error.errors[0].message, 400)),
        { status: 400 }
      )
    }
    
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}