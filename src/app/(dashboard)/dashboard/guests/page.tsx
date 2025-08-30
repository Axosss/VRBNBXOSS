'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Grid, List, Users, Mail, Phone, Ban, UserCheck } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useGuestStore } from '@/lib/stores/guest-store'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type ViewMode = 'grid' | 'list'

export default function GuestsPage() {
  const router = useRouter()
  const {
    guests,
    pagination,
    filters,
    loading,
    error,
    fetchGuests,
    setFilters,
    setPage,
    resetFilters,
    deleteGuest,
    updateGuest,
    clearError
  } = useGuestStore()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')

  // Load guests on mount
  useEffect(() => {
    fetchGuests()
  }, [])

  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchQuery })
      fetchGuests()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleViewGuest = (guestId: string) => {
    router.push(`/dashboard/guests/${guestId}`)
  }

  const handleEditGuest = (guestId: string) => {
    router.push(`/dashboard/guests/${guestId}/edit`)
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      try {
        await deleteGuest(guestId)
      } catch (error) {
        console.error('Failed to delete guest:', error)
      }
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value })
    fetchGuests()
  }

  const clearFilters = () => {
    setSearchQuery('')
    resetFilters()
    fetchGuests()
  }

  const hasActiveFilters = searchQuery

  // Stats calculation
  const totalGuests = pagination.total || 0

  if (loading && guests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guests</h1>
          <p className="text-muted-foreground mt-1">
            Manage your guest information and history
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/guests/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGuests}</div>
        </CardContent>
      </Card>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>



            {/* Sort */}
            <Select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('_')
                setFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any })
                fetchGuests()
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="updated_at_desc">Recently Updated</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guest List/Grid */}
      {guests.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12 text-muted-foreground" />}
          title="No guests found"
          description={hasActiveFilters ? "Try adjusting your filters" : "Add your first guest to get started"}
          action={
            <Button onClick={hasActiveFilters ? clearFilters : () => router.push('/dashboard/guests/new')}>
              {hasActiveFilters ? "Clear Filters" : "Add Guest"}
            </Button>
          }
        />
      ) : viewMode === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <TableRow 
                  key={guest.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewGuest(guest.id)}
                >
                  <TableCell className="font-medium">
                    {guest.name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {guest.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(guest.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleViewGuest(guest.id)
                        }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleEditGuest(guest.id)
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGuest(guest.id)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guests.map((guest) => (
            <Card 
              key={guest.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewGuest(guest.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{guest.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleViewGuest(guest.id)
                      }}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleEditGuest(guest.id)
                      }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGuest(guest.id)
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {guest.email}
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {guest.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-end pt-2">
                    <span className="text-xs text-muted-foreground">
                      Added {format(new Date(guest.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} guests
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPage(pagination.page - 1)
                fetchGuests()
              }}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPage(pagination.page + 1)
                fetchGuests()
              }}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}