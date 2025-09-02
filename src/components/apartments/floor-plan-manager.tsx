'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  X, 
  FileImage,
  FileText,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useApartmentStore, type Apartment } from '@/lib/stores/apartment-store'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface FloorPlanManagerProps {
  apartment: Apartment
}

export function FloorPlanManager({ apartment }: FloorPlanManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null)
  const [inputKey, setInputKey] = useState(0) // Force input reset
  
  const { 
    uploadFloorPlan, 
    deleteFloorPlan,
    isUploadingPhotos: isUploading,
    error,
  } = useApartmentStore()

  const handleFileSelect = useCallback((file: File) => {
    const acceptedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const acceptedDocTypes = ['application/pdf']
    const acceptedTypes = [...acceptedImageTypes, ...acceptedDocTypes]
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    // Check file type
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Only JPG, PNG, WebP images and PDF files are allowed')
      return
    }
    
    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setUploadError(`File too large (${sizeMB}MB). Maximum is 10MB`)
      return
    }
    
    setUploadError(null)
    
    // Generate preview URL for images
    if (acceptedImageTypes.includes(file.type.toLowerCase())) {
      const url = URL.createObjectURL(file)
      setPreviewFile({ file, url })
    } else {
      // For PDFs, just store the file without preview
      setPreviewFile({ file, url: '' })
    }
  }, [])

  const handleUploadConfirm = useCallback(async () => {
    if (!previewFile) return
    
    try {
      await uploadFloorPlan(apartment.id, previewFile.file)
      // Clear preview after successful upload
      if (previewFile.url) {
        URL.revokeObjectURL(previewFile.url)
      }
      setPreviewFile(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload floor plan')
    }
  }, [apartment.id, uploadFloorPlan, previewFile])

  const handleCancelPreview = useCallback(() => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url)
    }
    setPreviewFile(null)
    setUploadError(null)
  }, [previewFile])

  const handleDeleteFloorPlan = async () => {
    try {
      setUploadError(null)
      await deleteFloorPlan(apartment.id)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete floor plan')
    }
  }

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
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const isPDF = (url: string) => {
    return url.toLowerCase().includes('.pdf')
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {(uploadError || error) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-destructive text-sm">{uploadError || error}</p>
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
      {previewFile && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPreview}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUploadConfirm}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewFile.url ? (
              <div className="relative">
                <img
                  src={previewFile.url}
                  alt="Floor plan preview"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">{previewFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(previewFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Floor Plan or Upload Area */}
      {apartment.floorPlan && !previewFile ? (
        <Card>
          <CardContent className="p-4">
            {isPDF(apartment.floorPlan) ? (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Floor Plan PDF</p>
                    <p className="text-sm text-muted-foreground">
                      Click to view in new tab
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(apartment.floorPlan, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteFloorPlan}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={apartment.floorPlan}
                  alt="Floor plan"
                  className="w-full rounded-lg cursor-pointer"
                  onClick={() => window.open(apartment.floorPlan, '_blank')}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(apartment.floorPlan, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteFloorPlan}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !previewFile ? (
        <Card className="border-2 border-dashed">
          <CardContent 
            className={`
              p-8 text-center transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground">Uploading floor plan...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Hidden input */}
                <input
                  id="floor-plan-hidden-input"
                  key={inputKey}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    console.log('File input changed:', e.target.files);
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('File selected:', file.name, file.type, file.size);
                      handleFileSelect(file);
                      setInputKey(prev => prev + 1); // Reset input
                    }
                  }}
                />
                
                {/* Button that triggers the input */}
                <button
                  onClick={() => {
                    console.log('Button clicked, triggering input');
                    // Try with a timeout to ensure React has rendered
                    setTimeout(() => {
                      const input = document.getElementById('floor-plan-hidden-input') as HTMLInputElement;
                      console.log('Found input:', input);
                      if (input) {
                        input.value = ''; // Clear value first
                        input.click();
                        console.log('Clicked input');
                      } else {
                        console.error('Could not find input element');
                      }
                    }, 100);
                  }}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span>Choose Floor Plan</span>
                  </div>
                </button>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Or drag and drop your floor plan here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports JPG, PNG, WebP images or PDF (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}