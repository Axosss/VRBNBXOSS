'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { 
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
  Waves,
  Dumbbell,
  Shield,
  X,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apartmentCreateSchema, apartmentUpdateSchema, type ApartmentCreateInput, type ApartmentUpdateInput } from '@/lib/validations'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface ApartmentFormProps {
  initialData?: Partial<ApartmentCreateInput>
  onSubmit: (data: ApartmentCreateInput | ApartmentUpdateInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
  isEdit?: boolean
}

const COMMON_AMENITIES = [
  { id: 'WiFi', label: 'WiFi', icon: Wifi },
  { id: 'Parking', label: 'Parking', icon: Car },
  { id: 'Kitchen', label: 'Kitchen', icon: Coffee },
  { id: 'TV', label: 'TV', icon: Tv },
  { id: 'AC', label: 'Air Conditioning', icon: Snowflake },
  { id: 'Pool', label: 'Pool', icon: Waves },
  { id: 'Gym', label: 'Gym', icon: Dumbbell },
  { id: 'Security', label: '24/7 Security', icon: Shield },
]

export function ApartmentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Property',
  isEdit = false,
}: ApartmentFormProps) {
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [showDoorCode, setShowDoorCode] = useState(false)
  const [showMailboxCode, setShowMailboxCode] = useState(false)
  
  const schema = isEdit ? apartmentUpdateSchema : apartmentCreateSchema
  
  const form = useForm<ApartmentCreateInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      address: {
        street: initialData?.address?.street || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        zipCode: initialData?.address?.zipCode || '',
        country: initialData?.address?.country || 'United States',
      },
      capacity: initialData?.capacity || 2,
      bedrooms: initialData?.bedrooms || 1,
      bathrooms: initialData?.bathrooms || 1,
      amenities: initialData?.amenities || [],
      accessCodes: {
        wifi: initialData?.accessCodes?.wifi || {
          network: '',
          password: '',
        },
        door: initialData?.accessCodes?.door || '',
        mailbox: initialData?.accessCodes?.mailbox || '',
        additional: initialData?.accessCodes?.additional || {},
      },
    },
  })

  const { fields: additionalCodeFields, append: appendAdditionalCode, remove: removeAdditionalCode } = useFieldArray({
    control: form.control,
    name: 'accessCodes.additional',
  })

  const selectedAmenities = form.watch('amenities')
  
  const toggleAmenity = (amenityId: string) => {
    const current = selectedAmenities || []
    if (current.includes(amenityId)) {
      form.setValue('amenities', current.filter(id => id !== amenityId))
    } else {
      form.setValue('amenities', [...current, amenityId])
    }
  }

  const handleSubmit = async (data: ApartmentCreateInput) => {
    // Clean up empty access codes
    const cleanedData = {
      ...data,
      accessCodes: {
        wifi: data.accessCodes?.wifi?.network && data.accessCodes?.wifi?.password 
          ? data.accessCodes.wifi 
          : undefined,
        door: data.accessCodes?.door || undefined,
        mailbox: data.accessCodes?.mailbox || undefined,
        additional: data.accessCodes?.additional && Object.keys(data.accessCodes.additional).length > 0 
          ? data.accessCodes.additional 
          : undefined,
      },
    }
    
    // Remove undefined values from accessCodes
    if (!cleanedData.accessCodes?.wifi && !cleanedData.accessCodes?.door && !cleanedData.accessCodes?.mailbox && !cleanedData.accessCodes?.additional) {
      delete cleanedData.accessCodes
    }
    
    await onSubmit(cleanedData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Downtown Loft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Capacity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="20"
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="10"
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.5"
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address.zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities?.includes(amenity.id)
                const Icon = amenity.icon
                
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
                      ${isSelected 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Access Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Access Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WiFi */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">WiFi Credentials</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accessCodes.wifi.network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Name</FormLabel>
                      <FormControl>
                        <Input placeholder="WiFi Network" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accessCodes.wifi.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            type={showWifiPassword ? "text" : "password"}
                            placeholder="WiFi Password" 
                            {...field} 
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowWifiPassword(!showWifiPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Door Code */}
            <FormField
              control={form.control}
              name="accessCodes.door"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Door Code</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showDoorCode ? "text" : "password"}
                        placeholder="Door access code" 
                        {...field} 
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowDoorCode(!showDoorCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showDoorCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mailbox Code */}
            <FormField
              control={form.control}
              name="accessCodes.mailbox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mailbox Code</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showMailboxCode ? "text" : "password"}
                        placeholder="Mailbox access code" 
                        {...field} 
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowMailboxCode(!showMailboxCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showMailboxCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Codes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Additional Access Codes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAdditionalCode({ '': '' } as any)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Code
                </Button>
              </div>
              
              {Object.entries(form.watch('accessCodes.additional') || {}).map(([key, value], index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Code name (e.g., Garage)"
                    value={key}
                    onChange={(e) => {
                      const additional = { ...form.getValues('accessCodes.additional') }
                      delete additional[key]
                      additional[e.target.value] = value
                      form.setValue('accessCodes.additional', additional)
                    }}
                  />
                  <Input
                    type="password"
                    placeholder="Access code"
                    value={value}
                    onChange={(e) => {
                      const additional = { ...form.getValues('accessCodes.additional') }
                      additional[key] = e.target.value
                      form.setValue('accessCodes.additional', additional)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const additional = { ...form.getValues('accessCodes.additional') }
                      delete additional[key]
                      form.setValue('accessCodes.additional', additional)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            {submitLabel}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}