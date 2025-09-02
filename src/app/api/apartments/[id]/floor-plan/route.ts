import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, AppError, isValidUUID, generateStoragePath, isValidImageType } from '@/lib/utils'
import { processImage, formatBytes } from '@/lib/image-utils'
import { mapApartmentFromDB } from '@/lib/mappers/apartment.mapper'

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
      .select('id, floor_plan')
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
    const file = formData.get('floor_plan') as File
    
    if (!file) {
      throw new AppError('No file provided', 400)
    }
    
    // Validate file type (accept images and PDFs)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.', 400)
    }
    
    // Validate file size (max 10MB for floor plans)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new AppError('File size too large. Maximum size is 10MB.', 400)
    }
    
    // Delete old floor plan if exists
    if (apartment.floor_plan) {
      try {
        const urlParts = apartment.floor_plan.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const storagePath = `${user.id}/apartments/${apartmentId}/${fileName}`
        
        await supabase.storage
          .from('floor-plans')
          .remove([storagePath])
      } catch (error) {
        console.warn('Failed to delete old floor plan:', error)
      }
    }
    
    let floorPlanUrl: string
    let uploadPath: string
    let optimizationInfo: any = {}
    
    // Check if it's an image or PDF
    const isImage = isValidImageType(file.type)
    
    if (isImage) {
      // Process and optimize image
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Process image with optimization
      const variants = await processImage(buffer, file.name, {
        generateThumbnail: true,
        generateMedium: false, // Don't need medium for floor plans
        generateWebP: false,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 90, // Higher quality for floor plans
      })
      
      // Upload optimized original
      const originalVariant = variants.find(v => v.name === 'original')
      if (!originalVariant) {
        throw new AppError('Failed to process image', 500)
      }
      
      const originalPath = generateStoragePath(
        user.id, 
        `apartments/${apartmentId}`, 
        `floor-plan-${Date.now()}.jpg`
      )
      
      const { data: originalUpload, error: originalError } = await supabase.storage
        .from('floor-plans')
        .upload(originalPath, originalVariant.buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        })
      
      if (originalError) {
        throw new AppError(`Upload failed: ${originalError.message}`, 500)
      }
      
      // Upload thumbnail
      const thumbnailVariant = variants.find(v => v.name === 'thumbnail')
      if (thumbnailVariant) {
        const thumbnailPath = generateStoragePath(
          user.id, 
          `apartments/${apartmentId}/thumbnails`, 
          `floor-plan-${Date.now()}.jpg`
        )
        
        await supabase.storage
          .from('floor-plans')
          .upload(thumbnailPath, thumbnailVariant.buffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/jpeg',
          })
          .catch(err => console.warn('Thumbnail upload failed:', err))
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(originalUpload.path)
      
      floorPlanUrl = publicUrlData.publicUrl
      uploadPath = originalUpload.path
      
      // Calculate optimization info
      const sizeSaved = file.size - originalVariant.size
      const percentSaved = Math.round((sizeSaved / file.size) * 100)
      
      optimizationInfo = {
        originalSize: formatBytes(file.size),
        optimizedSize: formatBytes(originalVariant.size),
        saved: `${formatBytes(sizeSaved)} (${percentSaved}%)`,
      }
    } else {
      // For PDFs, upload as-is
      const storagePath = generateStoragePath(
        user.id, 
        `apartments/${apartmentId}`, 
        `floor-plan-${Date.now()}-${file.name}`
      )
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        })
      
      if (uploadError) {
        throw new AppError(`Upload failed: ${uploadError.message}`, 500)
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(uploadData.path)
      
      floorPlanUrl = publicUrlData.publicUrl
      uploadPath = uploadData.path
    }
    
    // Update apartment with floor plan URL
    const { data: updatedApartment, error: updateError } = await supabase
      .from('apartments')
      .update({ floor_plan: floorPlanUrl })
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      // If database update fails, try to delete the uploaded file
      await supabase.storage
        .from('floor-plans')
        .remove([uploadPath])
        .catch(() => {}) // Ignore cleanup errors
      
      throw new AppError(updateError.message, 500)
    }
    
    // Map the apartment to frontend format
    const mappedApartment = mapApartmentFromDB(updatedApartment)
    
    return NextResponse.json(
      createSuccessResponse(
        {
          apartment: mappedApartment,
          floorPlan: {
            url: floorPlanUrl,
            path: uploadPath,
            ...optimizationInfo,
          },
        },
        'Floor plan uploaded successfully'
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
    
    if (!isValidUUID(apartmentId)) {
      throw new AppError('Invalid apartment ID', 400)
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
      .select('id, floor_plan')
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .single()
    
    if (apartmentError) {
      if (apartmentError.code === 'PGRST116') {
        throw new AppError('Apartment not found', 404)
      }
      throw new AppError(apartmentError.message, 500)
    }
    
    if (!apartment.floor_plan) {
      throw new AppError('No floor plan to delete', 404)
    }
    
    // Extract storage path from URL
    const urlParts = apartment.floor_plan.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const storagePath = `${user.id}/apartments/${apartmentId}/${fileName}`
    
    // Remove from storage
    const { error: storageError } = await supabase.storage
      .from('floor-plans')
      .remove([storagePath])
    
    if (storageError) {
      console.warn('Storage deletion failed:', storageError.message)
      // Continue with database update even if storage deletion fails
    }
    
    // Update apartment to remove floor plan
    const { data: updatedApartment, error: updateError } = await supabase
      .from('apartments')
      .update({ floor_plan: null })
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      throw new AppError(updateError.message, 500)
    }
    
    // Map the apartment to frontend format
    const mappedApartment = mapApartmentFromDB(updatedApartment)
    
    return NextResponse.json(
      createSuccessResponse(
        mappedApartment,
        'Floor plan deleted successfully'
      )
    )
    
  } catch (error) {
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    })
  }
}