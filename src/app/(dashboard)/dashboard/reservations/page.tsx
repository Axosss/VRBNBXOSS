'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Grid3X3, List, Calendar, Filter, Download, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useReservationStore, type Reservation } from '@/lib/stores/reservation-store'
import { useApartmentStore } from '@/lib/stores/apartment-store'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { ReservationCard } from '@/components/reservations/reservation-card'
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge'

export default function ReservationsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [apartmentFilter, setApartmentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  const { 
    reservations,
    pagination,
    isLoading,
    error,
    isDeleting,
    fetchReservations,
    deleteReservation,
    setFilters,
    clearError
  } = useReservationStore()

  const { 
    apartments, 
    fetchApartments: fetchApartmentsData
  } = useApartmentStore()

  useEffect(() => {
    fetchReservations()
    fetchApartmentsData({ limit: 100 }) // Get all apartments for filter
  }, [fetchReservations, fetchApartmentsData])

  useEffect(() => {
    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== 'all') filters.status = statusFilter
    if (platformFilter !== 'all') filters.platform = platformFilter
    if (apartmentFilter !== 'all') filters.apartmentId = apartmentFilter
    filters.sortBy = sortBy
    filters.sortOrder = sortOrder
    setFilters(filters)
    
    // Reset to page 1 when filters change
    setCurrentPage(1)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchReservations({ page: 1, limit: 100, ...filters })
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, platformFilter, apartmentFilter, sortBy, sortOrder, setFilters, fetchReservations])

  const handlePageChange = (newPage: number) => {
    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== 'all') filters.status = statusFilter
    if (platformFilter !== 'all') filters.platform = platformFilter
    if (apartmentFilter !== 'all') filters.apartmentId = apartmentFilter
    filters.sortBy = sortBy
    filters.sortOrder = sortOrder
    
    setCurrentPage(newPage)
    fetchReservations({ 
      page: newPage, 
      limit: 100, 
      ...filters 
    })
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (pagination && currentPage < pagination.totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleCreateReservation = () => {
    router.push('/dashboard/reservations/new')
  }

  const handleDeleteReservation = async (reservation: Reservation) => {
    if (window.confirm(`Are you sure you want to cancel the reservation for ${reservation.guest?.name}?`)) {
      try {
        await deleteReservation(reservation.id)
      } catch (error) {
        console.error('Failed to delete reservation:', error)
      }
    }
  }

  const getStatusCounts = () => {
    const counts = {
      total: pagination?.total || 0,
      confirmed: 0,
      checked_in: 0,
      pending: 0,
    }

    reservations.forEach(reservation => {
      if (reservation.status === 'confirmed') counts.confirmed++
      if (reservation.status === 'checked_in') counts.checked_in++
      if (reservation.status === 'pending') counts.pending++
    })

    return counts
  }

  const statusCounts = getStatusCounts()

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              clearError()
              fetchReservations()
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
          <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">
            Manage your property reservations across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateReservation} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Reservation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {pagination && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Reservations</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.checked_in}</div>
            <div className="text-sm text-muted-foreground">Currently Checked In</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search and basic filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reservations..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="vrbo">VRBO</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="booking_com">Booking.com</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-3">
              <Select value={apartmentFilter} onValueChange={setApartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {apartments.map(apartment => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="check_in">Check-in Date</SelectItem>
                  <SelectItem value="check_out">Check-out Date</SelectItem>
                  <SelectItem value="total_price">Total Price</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reservations List/Grid */}
      {isLoading && reservations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
          title="No reservations yet"
          description="Create your first reservation to start managing bookings."
          action={
            <Button onClick={handleCreateReservation} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Reservation
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
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                viewMode={viewMode}
                onView={() => router.push(`/dashboard/reservations/${reservation.id}`)}
                onEdit={() => router.push(`/dashboard/reservations/${reservation.id}/edit`)}
                onDelete={() => handleDeleteReservation(reservation)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 100) + 1} to {Math.min(currentPage * 100, pagination.total)} of {pagination.total} reservations
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="px-2">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage >= pagination.totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading overlay for delete operations */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg">
            <LoadingSpinner className="h-6 w-6 mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Cancelling reservation...</p>
          </div>
        </div>
      )}
    </div>
  )
}