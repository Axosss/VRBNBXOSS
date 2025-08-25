import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ApartmentCreateInput, ApartmentUpdateInput, ApartmentFilterInput, PaginationInput } from '@/lib/validations'

export interface Apartment {
  id: string
  owner_id: string
  name: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  capacity: number
  bedrooms?: number
  bathrooms?: number
  amenities: string[]
  access_codes?: {
    wifi?: {
      network: string
      password: string
    }
    door?: string
    mailbox?: string
    additional?: Record<string, string>
  }
  photos: Array<{
    id: string
    url: string
    filename: string
    size: number
    is_main: boolean
    order: number
  }>
  status: 'active' | 'maintenance' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ApartmentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApartmentState {
  apartments: Apartment[]
  selectedApartment: Apartment | null
  pagination: ApartmentPagination | null
  filters: ApartmentFilterInput
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isUploadingPhotos: boolean
  error: string | null
  
  // Actions
  fetchApartments: (params?: PaginationInput & ApartmentFilterInput) => Promise<void>
  fetchApartment: (id: string) => Promise<void>
  createApartment: (data: ApartmentCreateInput) => Promise<Apartment>
  updateApartment: (id: string, data: ApartmentUpdateInput) => Promise<void>
  deleteApartment: (id: string) => Promise<void>
  uploadPhotos: (apartmentId: string, files: File[]) => Promise<void>
  deletePhoto: (apartmentId: string, photoId: string) => Promise<void>
  reorderPhotos: (apartmentId: string, photoIds: string[]) => Promise<void>
  setMainPhoto: (apartmentId: string, photoId: string) => Promise<void>
  setFilters: (filters: ApartmentFilterInput) => void
  setSelectedApartment: (apartment: Apartment | null) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  apartments: [],
  selectedApartment: null,
  pagination: null,
  filters: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isUploadingPhotos: false,
  error: null,
}

export const useApartmentStore = create<ApartmentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchApartments: async (params = {}) => {
        try {
          set({ isLoading: true, error: null })
          
          const searchParams = new URLSearchParams()
          
          // Add pagination params
          if (params.page) searchParams.set('page', params.page.toString())
          if (params.limit) searchParams.set('limit', params.limit.toString())
          
          // Add filter params
          if (params.status) searchParams.set('status', params.status)
          if (params.search) searchParams.set('search', params.search)
          
          const response = await fetch(`/api/apartments?${searchParams.toString()}`)
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch apartments')
          }
          
          set({
            apartments: data.data.apartments,
            pagination: data.data.pagination,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch apartments'
          set({
            apartments: [],
            pagination: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      fetchApartment: async (id: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch(`/api/apartments/${id}`)
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch apartment')
          }
          
          set({
            selectedApartment: data.data,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch apartment'
          set({
            selectedApartment: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      createApartment: async (apartmentData: ApartmentCreateInput) => {
        try {
          set({ isCreating: true, error: null })
          
          const response = await fetch('/api/apartments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apartmentData),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create apartment')
          }
          
          const newApartment = data.data
          
          set(state => ({
            apartments: [newApartment, ...state.apartments],
            pagination: state.pagination ? {
              ...state.pagination,
              total: state.pagination.total + 1,
              totalPages: Math.ceil((state.pagination.total + 1) / state.pagination.limit),
            } : null,
            isCreating: false,
          }))
          
          return newApartment
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create apartment'
          set({
            isCreating: false,
            error: errorMessage,
          })
          throw error
        }
      },

      updateApartment: async (id: string, updates: ApartmentUpdateInput) => {
        try {
          set({ isUpdating: true, error: null })
          
          const response = await fetch(`/api/apartments/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update apartment')
          }
          
          const updatedApartment = data.data
          
          set(state => ({
            apartments: state.apartments.map(apt => 
              apt.id === id ? updatedApartment : apt
            ),
            selectedApartment: state.selectedApartment?.id === id ? updatedApartment : state.selectedApartment,
            isUpdating: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update apartment'
          set({
            isUpdating: false,
            error: errorMessage,
          })
          throw error
        }
      },

      deleteApartment: async (id: string) => {
        try {
          set({ isDeleting: true, error: null })
          
          const response = await fetch(`/api/apartments/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to delete apartment')
          }
          
          set(state => ({
            apartments: state.apartments.filter(apt => apt.id !== id),
            selectedApartment: state.selectedApartment?.id === id ? null : state.selectedApartment,
            pagination: state.pagination ? {
              ...state.pagination,
              total: state.pagination.total - 1,
              totalPages: Math.ceil((state.pagination.total - 1) / state.pagination.limit),
            } : null,
            isDeleting: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete apartment'
          set({
            isDeleting: false,
            error: errorMessage,
          })
          throw error
        }
      },

      uploadPhotos: async (apartmentId: string, files: File[]) => {
        try {
          set({ isUploadingPhotos: true, error: null })
          
          const formData = new FormData()
          files.forEach(file => {
            formData.append('photos', file)
          })
          
          const response = await fetch(`/api/apartments/${apartmentId}/photos`, {
            method: 'POST',
            body: formData,
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to upload photos')
          }
          
          const updatedApartment = data.data
          
          set(state => ({
            apartments: state.apartments.map(apt => 
              apt.id === apartmentId ? updatedApartment : apt
            ),
            selectedApartment: state.selectedApartment?.id === apartmentId ? updatedApartment : state.selectedApartment,
            isUploadingPhotos: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload photos'
          set({
            isUploadingPhotos: false,
            error: errorMessage,
          })
          throw error
        }
      },

      deletePhoto: async (apartmentId: string, photoId: string) => {
        try {
          set({ error: null })
          
          const response = await fetch(`/api/apartments/${apartmentId}/photos`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ photoId }),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete photo')
          }
          
          const updatedApartment = data.data
          
          set(state => ({
            apartments: state.apartments.map(apt => 
              apt.id === apartmentId ? updatedApartment : apt
            ),
            selectedApartment: state.selectedApartment?.id === apartmentId ? updatedApartment : state.selectedApartment,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo'
          set({ error: errorMessage })
          throw error
        }
      },

      reorderPhotos: async (apartmentId: string, photoIds: string[]) => {
        try {
          set({ error: null })
          
          const response = await fetch(`/api/apartments/${apartmentId}/photos`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'reorder', photoIds }),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to reorder photos')
          }
          
          const updatedApartment = data.data
          
          set(state => ({
            apartments: state.apartments.map(apt => 
              apt.id === apartmentId ? updatedApartment : apt
            ),
            selectedApartment: state.selectedApartment?.id === apartmentId ? updatedApartment : state.selectedApartment,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reorder photos'
          set({ error: errorMessage })
          throw error
        }
      },

      setMainPhoto: async (apartmentId: string, photoId: string) => {
        try {
          set({ error: null })
          
          const response = await fetch(`/api/apartments/${apartmentId}/photos`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'setMain', photoId }),
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to set main photo')
          }
          
          const updatedApartment = data.data
          
          set(state => ({
            apartments: state.apartments.map(apt => 
              apt.id === apartmentId ? updatedApartment : apt
            ),
            selectedApartment: state.selectedApartment?.id === apartmentId ? updatedApartment : state.selectedApartment,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to set main photo'
          set({ error: errorMessage })
          throw error
        }
      },

      setFilters: (filters: ApartmentFilterInput) => {
        set({ filters })
      },

      setSelectedApartment: (apartment: Apartment | null) => {
        set({ selectedApartment: apartment })
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'vrbnbxoss-apartment-store',
    }
  )
)