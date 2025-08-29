import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ReservationCreateInput, ReservationUpdateInput, ReservationFilterInput, PaginationInput } from '@/lib/validations'

export interface Guest {
  id: string
  ownerId: string
  name: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  idDocument?: string
  notes?: string
  blacklisted?: boolean
  createdAt: string
  updatedAt: string
}

export interface Apartment {
  id: string
  ownerId: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  capacity: number
  status: 'active' | 'maintenance' | 'inactive'
}

export interface Reservation {
  id: string
  apartmentId: string
  ownerId: string
  guestId: string
  platform: 'airbnb' | 'vrbo' | 'direct' | 'booking_com'
  platformReservationId?: string
  checkIn: string
  checkOut: string
  guestCount: number
  totalPrice: number
  cleaningFee?: number
  platformFee?: number
  currency: string
  status: 'draft' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'archived'
  notes?: string
  contactInfo?: object
  createdAt: string
  updatedAt: string
  
  // Relations (from API joins)
  apartment?: Apartment
  guest?: Guest
}

export interface ReservationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ReservationState {
  reservations: Reservation[]
  selectedReservation: Reservation | null
  pagination: ReservationPagination | null
  filters: ReservationFilterInput
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  
  // Actions
  fetchReservations: (params?: PaginationInput & ReservationFilterInput) => Promise<void>
  fetchReservation: (id: string) => Promise<void>
  createReservation: (data: ReservationCreateInput) => Promise<Reservation>
  updateReservation: (id: string, data: ReservationUpdateInput) => Promise<void>
  deleteReservation: (id: string) => Promise<void>
  checkAvailability: (apartmentId: string, checkIn: string, checkOut: string, excludeReservationId?: string) => Promise<boolean>
  setFilters: (filters: ReservationFilterInput) => void
  setSelectedReservation: (reservation: Reservation | null) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  reservations: [],
  selectedReservation: null,
  pagination: null,
  filters: {} as ReservationFilterInput,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
}

export const useReservationStore = create<ReservationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchReservations: async (params = {}) => {
        try {
          set({ isLoading: true, error: null })
          
          const searchParams = new URLSearchParams()
          
          // Add pagination params
          if (params.page) searchParams.set('page', params.page.toString())
          if (params.limit) searchParams.set('limit', params.limit.toString())
          
          // Add filter params
          if (params.status) searchParams.set('status', params.status)
          if (params.platform) searchParams.set('platform', params.platform)
          if (params.apartmentId) searchParams.set('apartmentId', params.apartmentId)
          if (params.search) searchParams.set('search', params.search)
          if (params.startDate) searchParams.set('startDate', params.startDate)
          if (params.endDate) searchParams.set('endDate', params.endDate)
          if (params.sortBy) searchParams.set('sortBy', params.sortBy)
          if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
          
          const response = await fetch(`/api/reservations?${searchParams.toString()}`)
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch reservations')
          }
          
          set({
            reservations: data.data.reservations,
            pagination: data.data.pagination,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reservations'
          set({
            reservations: [],
            pagination: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      fetchReservation: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch(`/api/reservations/${id}`)
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch reservation')
          }
          
          set({
            selectedReservation: data.data,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reservation'
          set({
            selectedReservation: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      createReservation: async (reservationData: ReservationCreateInput) => {
        try {
          set({ isCreating: true, error: null })
          
          const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create reservation')
          }
          
          const newReservation = data.data
          
          set(state => ({
            reservations: [newReservation, ...state.reservations],
            pagination: state.pagination ? {
              ...state.pagination,
              total: state.pagination.total + 1,
              totalPages: Math.ceil((state.pagination.total + 1) / state.pagination.limit),
            } : null,
            isCreating: false,
          }))
          
          return newReservation
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation'
          set({
            isCreating: false,
            error: errorMessage,
          })
          throw error
        }
      },

      updateReservation: async (id: string, updates: ReservationUpdateInput) => {
        try {
          set({ isUpdating: true, error: null })
          
          const response = await fetch(`/api/reservations/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update reservation')
          }
          
          const updatedReservation = data.data
          
          set(state => ({
            reservations: state.reservations.map(res => 
              res.id === id ? updatedReservation : res
            ),
            selectedReservation: state.selectedReservation?.id === id ? updatedReservation : state.selectedReservation,
            isUpdating: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update reservation'
          set({
            isUpdating: false,
            error: errorMessage,
          })
          throw error
        }
      },

      deleteReservation: async (id: string) => {
        try {
          set({ isDeleting: true, error: null })
          
          const response = await fetch(`/api/reservations/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to delete reservation')
          }
          
          set(state => ({
            reservations: state.reservations.filter(res => res.id !== id),
            selectedReservation: state.selectedReservation?.id === id ? null : state.selectedReservation,
            pagination: state.pagination ? {
              ...state.pagination,
              total: state.pagination.total - 1,
              totalPages: Math.ceil((state.pagination.total - 1) / state.pagination.limit),
            } : null,
            isDeleting: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete reservation'
          set({
            isDeleting: false,
            error: errorMessage,
          })
          throw error
        }
      },

      checkAvailability: async (apartmentId: string, checkIn: string, checkOut: string, excludeReservationId?: string) => {
        try {
          const searchParams = new URLSearchParams({
            apartmentId,
            checkIn,
            checkOut,
          })
          
          if (excludeReservationId) {
            searchParams.set('excludeReservationId', excludeReservationId)
          }
          
          const response = await fetch(`/api/reservations/availability?${searchParams.toString()}`)
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to check availability')
          }
          
          return data.data.available
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to check availability'
          
          // Check if it's an authentication error
          if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
            set({ error: 'Please log in to check availability' })
          } else {
            set({ error: errorMessage })
          }
          
          return false
        }
      },

      setFilters: (filters: ReservationFilterInput) => {
        set({ filters })
      },

      setSelectedReservation: (reservation: Reservation | null) => {
        set({ selectedReservation: reservation })
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'vrbnbxoss-reservation-store',
    }
  )
)