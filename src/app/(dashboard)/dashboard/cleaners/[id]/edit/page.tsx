'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Sparkles,
  FileText,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { useCleaningStore } from '@/lib/stores/cleaning-store'
import { updateCleanerSchema } from '@/lib/validations/cleaning'
import type { UpdateCleanerData } from '@/types/cleaning'
import { z } from 'zod'

interface CleanerEditPageProps {
  params: Promise<{ id: string }>
}

type FormData = z.infer<typeof updateCleanerSchema>

const commonServices = [
  'Standard Cleaning',
  'Deep Cleaning',
  'Window Cleaning',
  'Carpet Cleaning',
  'Kitchen Deep Clean',
  'Bathroom Deep Clean',
  'Appliance Cleaning',
  'Post-Construction Cleanup',
  'Move-in/Move-out Cleaning',
  'Eco-friendly Cleaning'
]

export default function EditCleanerPage({ params }: CleanerEditPageProps) {
  const router = useRouter()
  const { id: cleanerId } = use(params)
  const { 
    selectedCleaner, 
    isLoading, 
    error,
    fetchCleaner,
    updateCleaner
  } = useCleaningStore()
  // const [customService, setCustomService] = useState('')

  useEffect(() => {
    if (cleanerId) {
      fetchCleaner(cleanerId)
    }
  }, [cleanerId, fetchCleaner])

  const form = useForm<FormData>({
    resolver: zodResolver(updateCleanerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      rate: undefined,
      currency: 'EUR',
    },
  })

  // Update form when cleaner data is loaded
  useEffect(() => {
    if (selectedCleaner) {
      form.reset({
        name: selectedCleaner.name,
        email: selectedCleaner.email || '',
        phone: selectedCleaner.phone || '',
        rate: selectedCleaner.rate || undefined,
        currency: selectedCleaner.currency || 'EUR',
      })
    }
  }, [selectedCleaner, form])

  // const watchedServices = form.watch('services') || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    notFound()
  }

  if (!selectedCleaner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  const handleSubmit = async (data: FormData) => {
    try {
      const updateData: UpdateCleanerData = {
        name: data.name,
        email: data.email && data.email.trim() !== '' ? data.email : null,
        phone: data.phone && data.phone.trim() !== '' ? data.phone : null,
        rate: data.rate || null,
        currency: data.currency,
      }

      await updateCleaner(selectedCleaner.id, updateData)
      router.push(`/dashboard/cleaners/${selectedCleaner.id}`)
    } catch (error) {
      console.error('Failed to update cleaner:', error)
    }
  }

  // Service functions removed - fields don't exist in database

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
        <div>
          <h1 className="text-2xl font-bold">Edit Cleaner</h1>
          <p className="text-muted-foreground">
            Update {selectedCleaner.name}&apos;s information
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter cleaner's full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="cleaner@example.com"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Used for notifications and communication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Primary contact number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Rate for cleaning services
                      </FormDescription>
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
            </CardContent>
          </Card>

          {/* Services & Skills - Hidden as not in current schema */}
          {false && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Services & Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FormLabel className="text-sm font-medium mb-3 block">
                  Available Services
                </FormLabel>
                
                {/* Current Services */}
                {watchedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {watchedServices.map((service) => (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Common Services */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Select from common services:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonServices
                      .filter(service => !watchedServices.includes(service))
                      .map((service) => (
                        <Button
                          key={service}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addService(service)}
                          className="h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {service}
                        </Button>
                      ))}
                  </div>
                </div>

                {/* Custom Service Input */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Or add a custom service:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom service..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomService()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustomService}
                      disabled={!customService.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

          {/* Additional Notes - Hidden as not in current schema */}
          {false && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Any additional notes about this cleaner (availability, special skills, preferences, etc.)"
                        className="w-full h-24 px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any important details that will help with scheduling and management
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                'Update Cleaner'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}