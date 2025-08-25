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
    
    console.log('Profile API - User:', user ? user.id : 'null', 'Error:', userError?.message || 'none')
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('Profile query result - Profile:', !!profile, 'Error:', profileError?.message || 'none')
    
    if (profileError) {
      // If profile doesn't exist, create it automatically
      if (profileError.code === 'PGRST116') { // No rows found
        console.log('Creating missing profile for user:', user.id)
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'owner',
            timezone: 'UTC',
            settings: {}
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Failed to create profile:', createError)
          throw new AppError('Failed to create profile', 500)
        }
        
        console.log('Profile created successfully:', newProfile)
        
        return NextResponse.json(
          createSuccessResponse({
            id: newProfile.id,
            fullName: newProfile.full_name,
            avatarUrl: newProfile.avatar_url,
            role: newProfile.role,
            timezone: newProfile.timezone,
            settings: newProfile.settings,
            createdAt: newProfile.created_at,
            updatedAt: newProfile.updated_at,
          })
        )
      }
      
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
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()
    
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
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}