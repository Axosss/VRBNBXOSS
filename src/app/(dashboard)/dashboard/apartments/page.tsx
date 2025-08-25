'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SimpleApartmentsPage() {
  const router = useRouter()
  const [apartments, setApartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Direct fetch without store
    fetch('/api/apartments')
      .then(res => res.json())
      .then(data => {
        console.log('Simple page - API response:', data)
        if (data.success) {
          setApartments(data.data.apartments || [])
        } else {
          setError(data.error || 'Failed to load apartments')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Simple page - Fetch error:', err)
        setError('Failed to fetch apartments')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Button onClick={() => router.push('/dashboard/apartments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {apartments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No properties found</p>
            <Button onClick={() => router.push('/dashboard/apartments/new')}>
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map(apartment => (
            <Card 
              key={apartment.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboard/apartments/${apartment.id}`)}
            >
              <CardHeader>
                <CardTitle>{apartment.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {apartment.address?.street}, {apartment.address?.city}
                </p>
                <div className="flex justify-between text-sm">
                  <span>Capacity: {apartment.capacity} guests</span>
                  <span className="capitalize px-2 py-1 bg-green-100 text-green-800 rounded">
                    {apartment.status}
                  </span>
                </div>
                {apartment.bedrooms && (
                  <p className="text-sm mt-2">
                    {apartment.bedrooms} bedroom(s), {apartment.bathrooms || 0} bathroom(s)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}