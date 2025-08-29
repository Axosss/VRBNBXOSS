'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { CleanerSelector } from '@/components/cleaning/cleaner-selector'
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import type { CleaningStatus, CleaningType, UpdateCleaningData } from '@/types/cleaning'

interface EditCleaningPageProps {
  params: Promise<{ id: string }>
}

export default function EditCleaningPage({ params }: EditCleaningPageProps) {
  const router = useRouter()
  const { id: cleaningId } = use(params)
  
  const { 
    selectedCleaning, 
    isLoading, 
    error,
    fetchCleaning,
    updateCleaning
  } = useCleaningStore()
  
  const { apartments, fetchApartments } = useApartmentStore()
  
  const [formData, setFormData] = useState<UpdateCleaningData>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  
  // Fetch cleaning data
  useEffect(() => {
    if (cleaningId && !hasFetched) {
      setHasFetched(true)
      fetchCleaning(cleaningId)
      fetchApartments()
    }
  }, [cleaningId, fetchCleaning, fetchApartments, hasFetched])
  
  // Initialize form data when cleaning is loaded
  useEffect(() => {
    if (selectedCleaning) {
      setFormData({
        apartmentId: selectedCleaning.apartmentId,
        cleanerId: selectedCleaning.cleanerId,
        scheduledStart: selectedCleaning.scheduledStart ? 
          new Date(selectedCleaning.scheduledStart).toISOString().slice(0, 16) : '',
        scheduledEnd: selectedCleaning.scheduledEnd ? 
          new Date(selectedCleaning.scheduledEnd).toISOString().slice(0, 16) : '',
        status: selectedCleaning.status,
        cleaningType: selectedCleaning.cleaningType,
        instructions: selectedCleaning.instructions || '',
        cost: selectedCleaning.cost,
        notes: selectedCleaning.notes || ''
      })
    }
  }, [selectedCleaning])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Remove apartmentId as it cannot be updated
      const { apartmentId, ...updateData } = formData
      
      // Convert datetime-local format to ISO string
      const dataToSubmit: UpdateCleaningData = {
        ...updateData,
        scheduledStart: updateData.scheduledStart ? 
          new Date(updateData.scheduledStart).toISOString() : undefined,
        scheduledEnd: updateData.scheduledEnd ? 
          new Date(updateData.scheduledEnd).toISOString() : undefined
      }
      
      await updateCleaning(cleaningId, dataToSubmit)
      router.push(`/dashboard/cleaning/${cleaningId}`)
    } catch (error) {
      console.error('Failed to update cleaning:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading || !selectedCleaning) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Error Loading Cleaning</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/dashboard/cleaning')}>
          Back to Cleanings
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Cleaning</h1>
          <p className="text-muted-foreground">
            Update cleaning details and schedule
          </p>
        </div>
      </div>
      
      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apartment">Property (Cannot be changed)</Label>
                <Select
                  value={formData.apartmentId}
                  disabled
                >
                  <SelectTrigger id="apartment" disabled>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Cleaner Selection */}
              <div className="space-y-2">
                <Label htmlFor="cleaner">Assigned Cleaner</Label>
                <CleanerSelector
                  value={formData.cleanerId || null}
                  onValueChange={(value) => setFormData({ ...formData, cleanerId: value || undefined })}
                  apartmentId={formData.apartmentId}
                  scheduledDate={formData.scheduledStart}
                />
              </div>
            </div>
            
            {/* Schedule */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Start Time</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={formData.scheduledStart || ''}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">End Time</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  value={formData.scheduledEnd || ''}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                  required
                />
              </div>
            </div>
            
            {/* Type and Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Cleaning Type</Label>
                <Select
                  value={formData.cleaningType}
                  onValueChange={(value: CleaningType) => setFormData({ ...formData, cleaningType: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep Clean</SelectItem>
                    <SelectItem value="checkout">Checkout</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: CleaningStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Cost */}
            <div className="space-y-2 md:w-1/2">
              <Label htmlFor="cost">Cost (€)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for the cleaner..."
                value={formData.instructions || ''}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={4}
              />
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this cleaning..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}