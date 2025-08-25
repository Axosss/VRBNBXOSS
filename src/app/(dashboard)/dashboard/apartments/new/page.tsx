'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { ApartmentForm } from '@/components/apartments/apartment-form'
import type { ApartmentCreateInput, ApartmentUpdateInput } from '@/lib/validations'

export default function NewApartmentPage() {
  const router = useRouter()
  const { createApartment, isCreating } = useApartmentStore()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: ApartmentCreateInput) => {
    try {
      setError(null)
      const newApartment = await createApartment(data)
      router.push(`/dashboard/apartments/${newApartment.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create apartment')
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/apartments')
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
          Back to Properties
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Property</h1>
          <p className="text-muted-foreground">
            Create a new rental property listing
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ApartmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isCreating}
            submitLabel="Create Property"
          />
        </CardContent>
      </Card>
    </div>
  )
}