'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  Upload, 
  X, 
  Star, 
  StarOff, 
  Image as ImageIcon, 
  Trash2,
  GripVertical,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useApartmentStore, type Apartment } from '@/lib/stores/apartment-store'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface PhotoManagerProps {
  apartment: Apartment
}

interface FilePreview {
  file: File
  url: string
}

export function PhotoManager({ apartment }: PhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<FilePreview[]>([])
  
  const { 
    uploadPhotos, 
    deletePhoto, 
    setMainPhoto, 
    reorderPhotos,
    isUploadingPhotos,
    error,
  } = useApartmentStore()

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url))
    }
  }, [previews])

  const handleFileSelect = useCallback((files: FileList) => {
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB
    const errors: string[] = []
    
    const validFiles = Array.from(files).filter(file => {
      // Check file type more precisely
      if (!acceptedTypes.includes(file.type.toLowerCase())) {
        errors.push(`${file.name}: Invalid format. Only JPG, PNG, and WebP are allowed`)
        return false
      }
      // Check file size
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
        errors.push(`${file.name}: File too large (${sizeMB}MB). Maximum is 5MB`)
        return false
      }
      return true
    })
    
    if (errors.length > 0) {
      setUploadError(errors.join('\n'))
      return
    }

    if (validFiles.length > 0) {
      setUploadError(null)
      // Generate preview URLs
      const newPreviews = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }))
      setPreviews(current => [...current, ...newPreviews])
    }
  }, [])

  const handleUploadConfirm = useCallback(async () => {
    if (previews.length === 0) return
    
    try {
      const files = previews.map(p => p.file)
      await uploadPhotos(apartment.id, files)
      // Clear previews after successful upload
      previews.forEach(preview => URL.revokeObjectURL(preview.url))
      setPreviews([])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload photos')
    }
  }, [apartment.id, uploadPhotos, previews])

  const handleRemovePreview = useCallback((index: number) => {
    setPreviews(current => {
      const newPreviews = [...current]
      URL.revokeObjectURL(newPreviews[index].url)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setUploadError(null)
      await deletePhoto(apartment.id, photoId)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete photo')
    }
  }

  const handleSetMainPhoto = async (photoId: string) => {
    try {
      setUploadError(null)
      await setMainPhoto(apartment.id, photoId)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to set main photo')
    }
  }

  // Sort photos by order, with main photo first
  const sortedPhotos = [...apartment.photos].sort((a, b) => {
    if (a.isMain) return -1
    if (b.isMain) return 1
    return a.order - b.order
  })

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed">
        <CardContent 
          className={`
            p-8 text-center transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
            ${isUploadingPhotos ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {isUploadingPhotos ? (
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Uploading photos...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-5 w-5" />
                Choose Photos
              </Button>
              <div>
                <p className="font-medium text-foreground">
                  Or drag and drop photos here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG, WebP up to 5MB each
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {(uploadError || error) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-destructive text-sm whitespace-pre-line">{uploadError || error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Preview Section */}
      {previews.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-semibold">Preview ({previews.length} photo{previews.length !== 1 ? 's' : ''})</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  previews.forEach(p => URL.revokeObjectURL(p.url))
                  setPreviews([])
                }}
                disabled={isUploadingPhotos}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUploadConfirm}
                disabled={isUploadingPhotos}
              >
                {isUploadingPhotos ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {previews.map((preview, index) => (
                <div key={`preview-${index}-${preview.file.name}`} className="relative group">
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePreview(index)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(preview.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      {sortedPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPhotos.map((photo, index) => (
            <PhotoCard
              key={photo.id || `photo-${index}-${photo.url}`}
              photo={photo}
              isMain={photo.isMain}
              onDelete={() => handleDeletePhoto(photo.id)}
              onSetMain={() => handleSetMainPhoto(photo.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 flex items-center justify-center mb-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-muted-foreground">No photos uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add photos to showcase your property
          </p>
        </div>
      )}
    </div>
  )
}

function PhotoCard({
  photo,
  isMain,
  onDelete,
  onSetMain,
}: {
  photo: Apartment['photos'][0]
  isMain: boolean
  onDelete: () => void
  onSetMain: () => void
}) {
  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Main Photo Badge */}
        {isMain && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Main
          </div>
        )}

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            {!isMain && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onSetMain}
                className="gap-1"
              >
                <Star className="h-3 w-3" />
                Set Main
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {photo.filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {(photo.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}