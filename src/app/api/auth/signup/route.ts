import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signUpSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email, password, fullName } = signUpSchema.parse(body)
    
    const supabase = await createClient()
    
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    
    if (error) {
      throw new AppError(error.message, 400)
    }
    
    if (!data.user) {
      throw new AppError('Failed to create user', 500)
    }
    
    return NextResponse.json(
      createSuccessResponse(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata.full_name,
          },
          session: data.session,
        },
        'User created successfully. Please check your email to verify your account.'
      ),
      { status: 201 }
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