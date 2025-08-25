'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { useReservationStore } from '@/lib/stores/reservation-store'
import { type ReservationUpdateInput } from '@/lib/validations'

interface EditReservationPageProps {
  params: {
    id: string
  }
}

export default function EditReservationPage({ params }: EditReservationPageProps) {
  const router = useRouter()
  
  const { 
    selectedReservation, 
    isLoading, 
    error, 
    fetchReservation, 
    updateReservation,
    clearError 
  } = useReservationStore()

  useEffect(() => {
    if (params.id) {
      fetchReservation(params.id)
    }
  }, [params.id, fetchReservation])

  const handleSubmit = async (data: ReservationUpdateInput) => {
    try {
      await updateReservation(params.id, data)
      router.push(`/dashboard/reservations/${params.id}`)
    } catch (error) {
      console.error('Failed to update reservation:', error)
      throw error
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/reservations/${params.id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Reservation</h1>
            <p className="text-muted-foreground">Loading reservation details...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
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
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Error Loading Reservation</h3>
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              clearError()
              fetchReservation(params.id)
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!selectedReservation) {
    notFound()
  }

  // Convert reservation data to form format
  const formData = {
    apartmentId: selectedReservation.apartment_id,
    guestId: selectedReservation.guest_id,
    platform: selectedReservation.platform,
    platformReservationId: selectedReservation.platform_reservation_id || '',
    checkIn: selectedReservation.check_in.split('T')[0], // Convert to YYYY-MM-DD format
    checkOut: selectedReservation.check_out.split('T')[0],
    guestCount: selectedReservation.guest_count,
    totalPrice: selectedReservation.total_price,
    cleaningFee: selectedReservation.cleaning_fee || 0,
    platformFee: selectedReservation.platform_fee || 0,
    currency: selectedReservation.currency,
    notes: selectedReservation.notes || '',
    contactInfo: selectedReservation.contact_info || {},
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Reservation</h1>
          <p className="text-muted-foreground">
            Modify the reservation for {selectedReservation.guest?.name || 'Guest'}
          </p>
        </div>
      </div>

      {/* Form */}
      <ReservationForm
        mode="edit"
        initialData={formData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}