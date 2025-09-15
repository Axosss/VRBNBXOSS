'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { localDateTimeToISO, isoToLocalDateTime } from '@/lib/utils/datetime'
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
import type { CreateCleaningData, UpdateCleaningData, Cleaning } from '@/types/cleaning'
import { z } from 'zod'

interface CleaningFormProps {
  initialData?: Partial<Cleaning>
  mode: 'create' | 'edit'
  onSubmit: (data: CreateCleaningData | UpdateCleaningData) => Promise<void>
  onCancel: () => void
}

// Use the schemas directly - they're already in camelCase
const createFormSchema = createCleaningSchema
const updateFormSchema = updateCleaningSchema

type FormData = z.infer<typeof createCleaningSchema> | z.infer<typeof updateCleaningSchema>


export function CleaningForm({ initialData, mode, onSubmit, onCancel }: CleaningFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { apartments, fetchApartments, isLoading: isLoadingApartments } = useApartmentStore()

  const form = useForm<FormData>({
    resolver: zodResolver(mode === 'create' ? createCleaningSchema : updateCleaningSchema),
    defaultValues: mode === 'create' 
      ? {
          apartmentId: initialData?.apartmentId || '',
          cleanerId: initialData?.cleanerId || null,
          reservationId: initialData?.reservationId || null,
          scheduledStart: initialData?.scheduledStart ? isoToLocalDateTime(initialData.scheduledStart) : '',
          scheduledEnd: initialData?.scheduledEnd ? isoToLocalDateTime(initialData.scheduledEnd) : '',
          cleaningType: 'standard',
          instructions: initialData?.instructions || '',
          supplies: initialData?.supplies || {},
          cost: initialData?.cost || null,
          currency: initialData?.currency || 'EUR',
        }
      : {
          cleanerId: initialData?.cleanerId || null,
          scheduledStart: initialData?.scheduledStart ? isoToLocalDateTime(initialData.scheduledStart) : '',
          scheduledEnd: initialData?.scheduledEnd ? isoToLocalDateTime(initialData.scheduledEnd) : '',
          status: initialData?.status || 'scheduled',
          cleaningType: initialData?.cleaningType || 'standard',
          instructions: initialData?.instructions || '',
          supplies: initialData?.supplies || {},
          cost: initialData?.cost || null,
          currency: initialData?.currency || 'EUR',
        },
  })

  const watchedValues = form.watch()
  const selectedApartmentId = 'apartmentId' in watchedValues ? watchedValues.apartmentId : initialData?.apartmentId
  const scheduledStart = watchedValues.scheduledStart || initialData?.scheduledStart

  useEffect(() => {
    // Only fetch if apartments are not already loaded
    if (apartments.length === 0 && !isLoadingApartments) {
      fetchApartments({ limit: 100 })
    }
  }, []) // Empty dependency array - only run once on mount

  const selectedApartment = apartments.find(apt => apt.id === selectedApartmentId)

  // Auto-calculate end time when start time changes ONLY if end time is empty
  useEffect(() => {
    if (scheduledStart && !watchedValues.scheduledEnd) {
      const startDate = new Date(scheduledStart)
      const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // Add 2 hours
      form.setValue('scheduledEnd', endDate.toISOString().slice(0, 16))
    }
  }, [scheduledStart]) // Remove watchedValues.scheduledEnd from dependencies to prevent overriding

  const handleSubmit = async (data: FormData) => {
    // Prevent double submission
    if (isSubmitting) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      if (mode === 'create') {
        const createData = data as z.infer<typeof createCleaningSchema>
        
        const transformedData = {
          apartmentId: createData.apartmentId,
          cleanerId: createData.cleanerId,
          reservationId: createData.reservationId,
          scheduledStart: localDateTimeToISO(createData.scheduledStart),
          scheduledEnd: localDateTimeToISO(createData.scheduledEnd),
          cleaningType: createData.cleaningType,
          instructions: createData.instructions,
          supplies: createData.supplies,
          cost: createData.cost,
          currency: createData.currency
        }
        await onSubmit(transformedData)
      } else {
        const updateData = data as z.infer<typeof updateCleaningSchema>
        const transformedData = {
          cleanerId: updateData.cleanerId,
          scheduledStart: updateData.scheduledStart ? localDateTimeToISO(updateData.scheduledStart) : undefined,
          scheduledEnd: updateData.scheduledEnd ? localDateTimeToISO(updateData.scheduledEnd) : undefined,
          status: updateData.status,
          cleaningType: updateData.cleaningType,
          instructions: updateData.instructions,
          supplies: updateData.supplies,
          cost: updateData.cost,
          currency: updateData.currency
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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

          {/* Completion Details section removed - cleanings are purely informational */}

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