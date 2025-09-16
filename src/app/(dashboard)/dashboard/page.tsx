'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building } from 'lucide-react'
import { AirbnbSyncWidget } from '@/components/dashboard/airbnb-sync-widget'
import { ApartmentReservationsWidget } from '@/components/dashboard/apartment-reservations-widget'

export default function DashboardPage() {
  const [totalProperties, setTotalProperties] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch apartments count
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/apartments?limit=100')
        const data = await response.json()
        if (data.success && data.data) {
          setTotalProperties(data.data.apartments?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {totalProperties === 0 ? 'Add your first property to get started' : `${totalProperties} active propert${totalProperties === 1 ? 'y' : 'ies'}`}
            </p>
          </CardContent>
        </Card>

        {/* Airbnb/VRBO Sync Widget */}
        <div className="lg:col-span-2">
          <AirbnbSyncWidget />
        </div>
      </div>

      {/* Apartment Reservations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Réservations par appartement</h2>
        <ApartmentReservationsWidget />
      </div>
    </div>
  )
}