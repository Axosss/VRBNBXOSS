'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, DollarSign, MapPin, Sparkles, FileText, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { CleanerSelector } from './cleaner-selector'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { createCleaningSchema, updateCleaningSchema } from '@/lib/validations/cleaning'
import type { CreateCleaningData, UpdateCleaningData, CleaningType, Cleaning } from '@/types/cleaning'
import { z } from 'zod'

interface CleaningFormProps {
  initialData?: Partial<Cleaning>
  mode: 'create' | 'edit'
  onSubmit: (data: CreateCleaningData | UpdateCleaningData) => Promise<void>
  onCancel: () => void
}

// Transform the schema keys to match our form structure
const createFormSchema = createCleaningSchema.transform(data => ({
  apartment_id: data.apartmentId,
  cleaner_id: data.cleanerId,
  reservation_id: data.reservationId,
  scheduled_start: data.scheduledStart,
  scheduled_end: data.scheduledEnd,
  cleaning_type: data.cleaningType,
  instructions: data.instructions,
  supplies: data.supplies,
  cost: data.cost,
  currency: data.currency
}))

const updateFormSchema = updateCleaningSchema.transform(data => ({
  cleaner_id: data.cleanerId,
  scheduled_start: data.scheduledStart,
  scheduled_end: data.scheduledEnd,
  actual_start: data.actualStart,
  actual_end: data.actualEnd,
  status: data.status,
  cleaning_type: data.cleaningType,
  instructions: data.instructions,
  supplies: data.supplies,
  photos: data.photos,
  cost: data.cost,
  rating: data.rating,
  notes: data.notes
}))

type FormData = z.infer<typeof createCleaningSchema> | z.infer<typeof updateCleaningSchema>

const cleaningTypes: { value: CleaningType; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard Cleaning', description: 'Regular cleaning service' },
  { value: 'deep', label: 'Deep Cleaning', description: 'Thorough cleaning with extra attention to detail' },
  { value: 'checkout', label: 'Checkout Cleaning', description: 'Cleaning after guest checkout' },
  { value: 'checkin', label: 'Check-in Prep', description: 'Preparation cleaning before guest arrival' },
  { value: 'maintenance', label: 'Maintenance', description: 'Cleaning during maintenance or repairs' }
]

export function CleaningForm({ initialData, mode, onSubmit, onCancel }: CleaningFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { apartments, fetchApartments } = useApartmentStore()

  const form = useForm<FormData>({
    resolver: zodResolver(mode === 'create' ? createCleaningSchema : updateCleaningSchema),
    defaultValues: mode === 'create' 
      ? {
          apartmentId: initialData?.apartment_id || '',
          cleanerId: initialData?.cleaner_id || null,
          reservationId: initialData?.reservation_id || null,
          scheduledStart: initialData?.scheduled_start || '',
          scheduledEnd: initialData?.scheduled_end || '',
          cleaningType: (initialData?.cleaning_type as CleaningType) || 'standard',
          instructions: initialData?.instructions || '',
          supplies: initialData?.supplies || {},
          cost: initialData?.cost || null,
          currency: initialData?.currency || 'EUR',
        }
      : {
          cleanerId: initialData?.cleaner_id || null,
          scheduledStart: initialData?.scheduled_start || '',
          scheduledEnd: initialData?.scheduled_end || '',
          actualStart: initialData?.actual_start || null,
          actualEnd: initialData?.actual_end || null,
          status: initialData?.status || 'needed',
          cleaningType: (initialData?.cleaning_type as CleaningType) || 'standard',
          instructions: initialData?.instructions || '',
          supplies: initialData?.supplies || {},
          photos: initialData?.photos || [],
          cost: initialData?.cost || null,
          rating: initialData?.rating || null,
          notes: initialData?.notes || '',
        },
  })

  const watchedValues = form.watch()
  const selectedApartmentId = 'apartmentId' in watchedValues ? watchedValues.apartmentId : initialData?.apartment_id
  const scheduledStart = watchedValues.scheduledStart || initialData?.scheduled_start

  useEffect(() => {
    fetchApartments({ limit: 100 })
  }, [fetchApartments])

  const selectedApartment = apartments.find(apt => apt.id === selectedApartmentId)

  // Auto-calculate end time when start time changes (default 2 hours duration)
  useEffect(() => {
    if (scheduledStart && (!watchedValues.scheduledEnd || mode === 'create')) {
      const startDate = new Date(scheduledStart)
      const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // Add 2 hours
      form.setValue('scheduledEnd', endDate.toISOString().slice(0, 16))
    }
  }, [scheduledStart, form, mode, watchedValues.scheduledEnd])

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      
      if (mode === 'create') {
        const createData = data as z.infer<typeof createCleaningSchema>
        const transformedData = {
          apartment_id: createData.apartmentId,
          cleaner_id: createData.cleanerId,
          reservation_id: createData.reservationId,
          scheduled_start: createData.scheduledStart,
          scheduled_end: createData.scheduledEnd,
          cleaning_type: createData.cleaningType,
          instructions: createData.instructions,
          supplies: createData.supplies,
          cost: createData.cost,
          currency: createData.currency
        }
        await onSubmit(transformedData)
      } else {
        const updateData = data as z.infer<typeof updateCleaningSchema>
        const transformedData = {
          cleaner_id: updateData.cleanerId,
          scheduled_start: updateData.scheduledStart,
          scheduled_end: updateData.scheduledEnd,
          actual_start: updateData.actualStart,
          actual_end: updateData.actualEnd,
          status: updateData.status,
          cleaning_type: updateData.cleaningType,
          instructions: updateData.instructions,
          supplies: updateData.supplies,
          photos: updateData.photos,
          cost: updateData.cost,
          rating: updateData.rating,
          notes: updateData.notes
        }
        await onSubmit(transformedData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Property & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mode === 'create' && (
                <FormField
                  control={form.control}
                  name="apartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                          <SelectContent>
                            {apartments.filter(apt => apt.status === 'active').map(apartment => (
                              <SelectItem key={apartment.id} value={apartment.id}>
                                <div className="flex items-center gap-2">
                                  <span>{apartment.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    • {apartment.capacity} guests
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedApartment && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Address:</strong> {selectedApartment.address.street}, {selectedApartment.address.city}</p>
                    <p><strong>Capacity:</strong> {selectedApartment.capacity} guests</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Start *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled End *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          min={scheduledStart || new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cleaning Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Cleaning Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="cleaningType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleaning Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cleaningTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="space-y-1">
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cleanerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Cleaner</FormLabel>
                    <FormControl>
                      <CleanerSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        apartmentId={selectedApartmentId}
                        scheduledDate={scheduledStart}
                        showAvailability={true}
                        placeholder="Select a cleaner (optional)"
                      />
                    </FormControl>
                    <FormDescription>
                      You can assign a cleaner now or later
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Any special instructions for the cleaner..."
                        className="w-full h-20 px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any specific requirements or areas that need special attention
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Edit mode: Actual completion times and notes */}
          {mode === 'edit' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Completion Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actualStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actualEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Rating</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                          value={field.value?.toString() || ''}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Rate the cleaning quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                            <SelectItem value="4">⭐⭐⭐⭐ Good</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ Average</SelectItem>
                            <SelectItem value="2">⭐⭐ Below Average</SelectItem>
                            <SelectItem value="1">⭐ Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Any additional notes about the cleaning..."
                          className="w-full h-20 px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Cleaning' : 'Update Cleaning'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}