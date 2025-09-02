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
    const files = formData.getAll('photos') as File[]
    
    if (!files || files.length === 0) {
      throw new AppError('No files provided', 400)
    }
    
    const uploadedPhotos = []
    const updatedPhotoUrls = apartment.photos || []
    
    // Process each file
    for (const file of files) {
      // Validate file type
      if (!isValidImageType(file.type)) {
        throw new AppError(`Invalid file type for ${file.name}. Only JPEG, PNG, and WebP images are allowed.`, 400)
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new AppError(`File ${file.name} is too large. Maximum size is 5MB.`, 400)
      }
      
      // Convert File to Buffer for processing
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Process image and generate variants
      const variants = await processImage(buffer, file.name, {
        generateThumbnail: true,
        generateMedium: true,
        generateWebP: false, // Skip WebP for now to keep it simple
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 85,
      })
      
      // Upload each variant
      const uploadedVariants: Record<string, string> = {}
      
      for (const variant of variants) {
        const variantPath = generateStoragePath(
          user.id, 
          `apartments/${apartmentId}/${variant.name}`, 
          file.name.replace(/\.[^/.]+$/, '.jpg') // Always use .jpg extension for processed images
        )
        
        // Upload variant to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('apartment-photos')
          .upload(variantPath, variant.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: variant.format === 'webp' ? 'image/webp' : 'image/jpeg',
          })
        
        if (uploadError) {
          // Clean up already uploaded variants on error
          for (const uploadedPath of Object.values(uploadedVariants)) {
            await supabase.storage
              .from('apartment-photos')
              .remove([uploadedPath])
              .catch(() => {}) // Ignore cleanup errors
          }
          throw new AppError(`Upload failed for ${file.name} (${variant.name}): ${uploadError.message}`, 500)
        }
        
        // Get public URL for variant
        const { data: publicUrlData } = supabase.storage
          .from('apartment-photos')
          .getPublicUrl(uploadData.path)
        
        uploadedVariants[variant.name] = publicUrlData.publicUrl
      }
      
      // Use the original optimized version as the main photo URL
      const photoUrl = uploadedVariants.original
      updatedPhotoUrls.push(photoUrl)
      
      // Calculate size saved
      const originalVariant = variants.find(v => v.name === 'original')
      const sizeSaved = file.size - (originalVariant?.size || file.size)
      const percentSaved = Math.round((sizeSaved / file.size) * 100)
      
      uploadedPhotos.push({
        url: photoUrl,
        variants: uploadedVariants,
        originalSize: formatBytes(file.size),
        optimizedSize: formatBytes(originalVariant?.size || file.size),
        saved: `${formatBytes(sizeSaved)} (${percentSaved}%)`,
      })
    }
    
    // Update apartment photos array
    const updatedPhotos = updatedPhotoUrls
    
    const { data: updatedApartment, error: updateError } = await supabase
      .from('apartments')
      .update({ photos: updatedPhotos })
      .eq('id', apartmentId)
      .eq('owner_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      // If database update fails, try to delete the uploaded files
      for (const photo of uploadedPhotos) {
        if (photo.variants) {
          for (const variantUrl of Object.values(photo.variants)) {
            // Extract path from URL
            const pathMatch = variantUrl.match(/apartment-photos\/(.+)$/)
            if (pathMatch) {
              await supabase.storage
                .from('apartment-photos')
                .remove([pathMatch[1]])
                .catch(() => {}) // Ignore cleanup errors
            }
          }
        }
      }
      
      throw new AppError(updateError.message, 500)
    }
    
    // Map the apartment to frontend format
    const mappedApartment = mapApartmentFromDB(updatedApartment)
    
    return NextResponse.json(
      createSuccessResponse(
        mappedApartment,
        `${uploadedPhotos.length} photo(s) uploaded successfully`
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
    
    // Map the apartment to frontend format
    const mappedApartment = mapApartmentFromDB(updatedApartment)
    
    return NextResponse.json(
      createSuccessResponse(
        mappedApartment,
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