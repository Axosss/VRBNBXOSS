import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/validations'
import { createErrorResponse, createSuccessResponse, AppError } from '@/lib/utils'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      throw new AppError('Profile not found', 404)
    }
    
    return NextResponse.json(
      createSuccessResponse({
        id: profile.id,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        timezone: profile.timezone,
        settings: profile.settings,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      })
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const updates = profileUpdateSchema.parse(body)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Prepare update data
    const updateData: any = {}
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone
    if (updates.settings !== undefined) updateData.settings = updates.settings
    
    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      throw new AppError(updateError.message, 400)
    }
    
    return NextResponse.json(
      createSuccessResponse(
        {
          id: profile.id,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          timezone: profile.timezone,
          settings: profile.settings,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        'Profile updated successfully'
      )
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