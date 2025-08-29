import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID, generateStoragePath, isValidImageType } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: apartmentId } = await params
    
    if (!isValidUUID(apartmentId)) {
      throw new AppError('Invalid apartment ID', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Verify apartment ownership
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, photos')
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .single()
    
    if (apartmentError) {
      if (apartmentError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(apartmentError.message, 500)
    }
    
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new AppError('No file provided', 400)
    }
    
    // Validate file type
    if (!isValidImageType(file.type)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400)
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new AppError('File size too large. Maximum size is 5MB.', 400)
    }
    
    // Generate storage path
    const storagePath = generateStoragePath(user.id, `apartments/${apartmentId}`, file.name)
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apartment-photos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (uploadError) {
      throw new AppError(`Upload failed: ${uploadError.message}`, 500)
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('apartment-photos')
      .getPublicUrl(uploadData.path)
    
    const photoUrl = publicUrlData.publicUrl
    
    // Update apartment photos array
    const currentPhotos = apartment.photos || []
    const updatedPhotos = [...currentPhotos, photoUrl]
    
    const { data: updatedApartment, error: updateError } = await supabase
      .from('apartments')
      .update({ photos: updatedPhotos })
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      // If database update fails, try to delete the uploaded file
      await supabase.storage
        .from('apartment-photos')
        .remove([uploadData.path])
        .catch(() => {}) // Ignore cleanup errors
      
      throw new AppError(updateError.message, 500)
    }
    
    return NextResponse.json(
      createSuccessResponse(
        {
          apartment: updatedApartment,
          uploadedPhoto: {
            url: photoUrl,
            path: uploadData.path,
          },
        },
        'Photo uploaded successfully'
      ),
      { status: 201 }
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: apartmentId } = await params
    const { searchParams } = new URL(request.url)
    const photoUrl = searchParams.get('url')
    
    if (!isValidUUID(apartmentId)) {
      throw new AppError('Invalid apartment ID', 400)
    }
    
    if (!photoUrl) {
      throw new AppError('Photo URL is required', 400)
    }
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AppError('Unauthorized', 401)
    }
    
    // Get apartment and verify ownership
    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select('id, photos')
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .single()
    
    if (apartmentError) {
      if (apartmentError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(apartmentError.message, 500)
    }
    
    const currentPhotos = apartment.photos || []
    
    if (!currentPhotos.includes(photoUrl)) {
      throw new AppError('Photo not found', 404)
    }
    
    // Extract storage path from URL
    const urlParts = photoUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const storagePath = `${user.id}/apartments/${apartmentId}/${fileName}`
    
    // Remove from storage
    const { error: storageError } = await supabase.storage
      .from('apartment-photos')
      .remove([storagePath])
    
    if (storageError) {
      console.warn('Storage deletion failed:', storageError.message)
      // Continue with database update even if storage deletion fails
    }
    
    // Update apartment photos array
    const updatedPhotos = currentPhotos.filter(photo => photo !== photoUrl)
    
    const { data: updatedApartment, error: updateError } = await supabase
      .from('apartments')
      .update({ photos: updatedPhotos })
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      throw new AppError(updateError.message, 500)
    }
    
    return NextResponse.json(
      createSuccessResponse(
        updatedApartment,
        'Photo deleted successfully'
      )
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}