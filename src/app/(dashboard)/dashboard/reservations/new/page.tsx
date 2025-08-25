'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { useReservationStore } from '@/lib/stores/reservation-store'
import { type ReservationCreateInput } from '@/lib/validations'

export default function NewReservationPage() {
  const router = useRouter()
  const { createReservation } = useReservationStore()

  const handleSubmit = async (data: ReservationCreateInput) => {
    try {
      const newReservation = await createReservation(data)
      router.push(`/dashboard/reservations/${newReservation.id}`)
    } catch (error) {
      console.error('Failed to create reservation:', error)
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/reservations')
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
          <h1 className="text-2xl font-bold text-foreground">Create New Reservation</h1>
          <p className="text-muted-foreground">
            Add a new booking to your reservation management system
          </p>
        </div>
      </div>

      {/* Form */}
      <ReservationForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}