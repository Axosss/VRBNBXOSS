'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { ApartmentForm } from '@/components/apartments/apartment-form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { createClient } from '@/lib/supabase/client'
import type { ApartmentUpdateInput } from '@/lib/validations'

export default function EditApartmentPage() {
  const router = useRouter()
  const params = useParams()
  const apartmentId = params.id as string
  
  const { 
    selectedApartment,
    fetchApartment,
    updateApartment,
    isLoading,
    isUpdating,
    error,
  } = useApartmentStore()
  
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [icalUrls, setICalUrls] = useState<{ airbnb?: string; vrbo?: string }>({})
  const supabase = createClient()

  useEffect(() => {
    if (apartmentId) {
      fetchApartment(apartmentId)
      fetchICalUrls(apartmentId)
    }
  }, [apartmentId, fetchApartment])

  const fetchICalUrls = async (apartmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('apartment_ical_urls')
        .select('platform, ical_url')
        .eq('apartment_id', apartmentId)
        .eq('is_active', true)

      if (!error && data) {
        const urls: { airbnb?: string; vrbo?: string } = {}
        data.forEach(item => {
          if (item.platform === 'airbnb' || item.platform === 'vrbo') {
            urls[item.platform] = item.ical_url
          }
        })
        setICalUrls(urls)
      }
    } catch (err) {
      console.error('Error fetching iCal URLs:', err)
    }
  }

  const handleICalUrlsChange = async (urls: { airbnb?: string; vrbo?: string }) => {
    try {
      // Save Airbnb URL
      if (urls.airbnb !== undefined) {
        if (urls.airbnb) {
          await supabase
            .from('apartment_ical_urls')
            .upsert({
              apartment_id: apartmentId,
              platform: 'airbnb',
              ical_url: urls.airbnb,
              is_active: true
            }, {
              onConflict: 'apartment_id,platform'
            })
        } else {
          // Delete if empty
          await supabase
            .from('apartment_ical_urls')
            .delete()
            .eq('apartment_id', apartmentId)
            .eq('platform', 'airbnb')
        }
      }

      // Save VRBO URL
      if (urls.vrbo !== undefined) {
        if (urls.vrbo) {
          await supabase
            .from('apartment_ical_urls')
            .upsert({
              apartment_id: apartmentId,
              platform: 'vrbo',
              ical_url: urls.vrbo,
              is_active: true
            }, {
              onConflict: 'apartment_id,platform'
            })
        } else {
          // Delete if empty
          await supabase
            .from('apartment_ical_urls')
            .delete()
            .eq('apartment_id', apartmentId)
            .eq('platform', 'vrbo')
        }
      }
    } catch (err) {
      console.error('Error saving iCal URLs:', err)
      throw err
    }
  }

  const handleSubmit = async (data: ApartmentUpdateInput) => {
    try {
      setUpdateError(null)
      await updateApartment(apartmentId, data)
      router.push(`/dashboard/apartments/${apartmentId}`)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update apartment')
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/apartments/${apartmentId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/apartments')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Property</h1>
          </div>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (!selectedApartment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/apartments')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Property</h1>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Property not found</p>
        </div>
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
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Property
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Property</h1>
          <p className="text-muted-foreground">
            Update details for {selectedApartment.name}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {updateError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{updateError}</p>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ApartmentForm
            initialData={{
              name: selectedApartment.name,
              address: selectedApartment.address,
              capacity: selectedApartment.capacity,
              bedrooms: selectedApartment.bedrooms,
              bathrooms: selectedApartment.bathrooms,
              amenities: selectedApartment.amenities,
              accessCodes: selectedApartment.accessCodes,
              icalUrls: icalUrls,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onICalUrlsChange={handleICalUrlsChange}
            isLoading={isUpdating}
            submitLabel="Update Property"
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}