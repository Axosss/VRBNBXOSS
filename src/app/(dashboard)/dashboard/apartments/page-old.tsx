'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Grid3X3, List, MapPin, Users, Bed, Bath, Wifi, Settings } from 'lucide-react'
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
import { useApartmentStore, type Apartment } from '@/lib/stores/apartment-store'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'

export default function ApartmentsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { 
    apartments,
    pagination,
    isLoading,
    error,
    fetchApartments,
    setFilters,
    clearError
  } = useApartmentStore()

  useEffect(() => {
    fetchApartments()
  }, [fetchApartments])

  useEffect(() => {
    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== 'all') filters.status = statusFilter
    setFilters(filters)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchApartments({ page: 1, limit: 12, ...filters })
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, setFilters, fetchApartments])

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      const filters: any = {}
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== 'all') filters.status = statusFilter
      
      fetchApartments({ 
        page: pagination.page + 1, 
        limit: 12, 
        ...filters 
      })
    }
  }

  const handleCreateApartment = () => {
    router.push('/dashboard/apartments/new')
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              clearError()
              fetchApartments()
            }}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties and their details
          </p>
        </div>
        <Button onClick={handleCreateApartment} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{pagination.total}</div>
            <div className="text-sm text-muted-foreground">Total Properties</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {apartments.filter(apt => apt.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {apartments.filter(apt => apt.status === 'maintenance').length}
            </div>
            <div className="text-sm text-muted-foreground">In Maintenance</div>
          </Card>
        </div>
      )}

      {/* Apartments List/Grid */}
      {isLoading && apartments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : apartments.length === 0 ? (
        <EmptyState
          icon={<Settings className="h-12 w-12 text-muted-foreground" />}
          title="No properties yet"
          description="Create your first property to start managing your rentals."
          action={
            <Button onClick={handleCreateApartment} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Property
            </Button>
          }
        />
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                viewMode={viewMode}
                onView={() => router.push(`/dashboard/apartments/${apartment.id}`)}
                onEdit={() => router.push(`/dashboard/apartments/${apartment.id}/edit`)}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ApartmentCard({ 
  apartment, 
  viewMode, 
  onView, 
  onEdit 
}: { 
  apartment: Apartment
  viewMode: 'grid' | 'list'
  onView: () => void
  onEdit: () => void
}) {
  const mainPhoto = apartment.photos.find(photo => photo.is_main) || apartment.photos[0]
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {mainPhoto ? (
                <img
                  src={mainPhoto.url}
                  alt={apartment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Settings className="h-8 w-8" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{apartment.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {apartment.address.city}, {apartment.address.state}
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs border ${statusColors[apartment.status]}`}>
                  {apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1)}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{apartment.capacity} guests</span>
                </div>
                {apartment.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    <span>{apartment.bedrooms} bed{apartment.bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {apartment.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    <span>{apartment.bathrooms} bath{apartment.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {apartment.amenities.includes('WiFi') && (
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    <span>WiFi</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={onView}>
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {mainPhoto ? (
          <img
            src={mainPhoto.url}
            alt={apartment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Settings className="h-12 w-12" />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="truncate text-base">{apartment.name}</CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs border flex-shrink-0 ${statusColors[apartment.status]}`}>
            {apartment.status.charAt(0).toUpperCase() + apartment.status.slice(1)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {apartment.address.city}, {apartment.address.state}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{apartment.capacity}</span>
          </div>
          {apartment.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              <span>{apartment.bedrooms}</span>
            </div>
          )}
          {apartment.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              <span>{apartment.bathrooms}</span>
            </div>
          )}
          {apartment.amenities.includes('WiFi') && (
            <Wifi className="h-3 w-3" />
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          Edit Property
        </Button>
      </CardContent>
    </Card>
  )
}