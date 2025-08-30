import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Guest } from '@/lib/stores/reservation-store'

interface GuestWithDetails extends Guest {
  reservations?: any[]
  totalReservations?: number
  totalRevenue?: number
}

interface GuestState {
  guests: GuestWithDetails[]
  selectedGuest: GuestWithDetails | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    search: string
    sortBy: 'name' | 'email' | 'created_at' | 'updated_at'
    sortOrder: 'asc' | 'desc'
  }
}

interface GuestActions {
  // Fetch actions
  fetchGuests: () => Promise<void>
  fetchGuestById: (id: string) => Promise<void>
  
  // CRUD actions
  createGuest: (guest: Partial<Guest>) => Promise<Guest>
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>
  deleteGuest: (id: string) => Promise<void>
  
  // Filter actions
  setFilters: (filters: Partial<GuestState['filters']>) => void
  setPage: (page: number) => void
  resetFilters: () => void
  
  // State actions
  setSelectedGuest: (guest: GuestWithDetails | null) => void
  clearError: () => void
}

export const useGuestStore = create<GuestState & GuestActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      guests: [],
      selectedGuest: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
      },

      // Fetch guests
      fetchGuests: async () => {
        set({ loading: true, error: null })
        
        try {
          const { filters, pagination } = get()
          const queryParams = new URLSearchParams({
            page: pagination.page.toString(),
            limit: pagination.limit.toString(),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          })
          
          if (filters.search) queryParams.set('search', filters.search)
          
          const response = await fetch(`/api/guests?${queryParams}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch guests')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set({
              guests: data.data.guests,
              pagination: data.data.pagination,
              loading: false,
            })
          } else {
            throw new Error(data.error || 'Failed to fetch guests')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch guests',
            loading: false,
          })
        }
      },

      // Fetch guest by ID
      fetchGuestById: async (id: string) => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch(`/api/guests/${id}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch guest details')
          }
          
          const data = await response.json()
          
          if (data.success) {
            set({
              selectedGuest: data.data,
              loading: false,
            })
          } else {
            throw new Error(data.error || 'Failed to fetch guest details')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch guest details',
            loading: false,
          })
        }
      },

      // Create guest
      createGuest: async (guestData: Partial<Guest>) => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch('/api/guests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(guestData),
          })
          
          if (!response.ok) {
            throw new Error('Failed to create guest')
          }
          
          const data = await response.json()
          
          if (data.success) {
            // Refresh the guest list
            await get().fetchGuests()
            set({ loading: false })
            return data.data
          } else {
            throw new Error(data.error || 'Failed to create guest')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create guest',
            loading: false,
          })
          throw error
        }
      },

      // Update guest
      updateGuest: async (id: string, updates: Partial<Guest>) => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch(`/api/guests/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          })
          
          if (!response.ok) {
            throw new Error('Failed to update guest')
          }
          
          const data = await response.json()
          
          if (data.success) {
            // Update the guest in the list
            set((state) => ({
              guests: state.guests.map((g) =>
                g.id === id ? { ...g, ...data.data } : g
              ),
              selectedGuest:
                state.selectedGuest?.id === id
                  ? { ...state.selectedGuest, ...data.data }
                  : state.selectedGuest,
              loading: false,
            }))
          } else {
            throw new Error(data.error || 'Failed to update guest')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update guest',
            loading: false,
          })
          throw error
        }
      },

      // Delete guest
      deleteGuest: async (id: string) => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch(`/api/guests/${id}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete guest')
          }
          
          const data = await response.json()
          
          if (data.success) {
            // Remove the guest from the list or mark as blacklisted
            set((state) => ({
              guests: state.guests.filter((g) => g.id !== id),
              selectedGuest:
                state.selectedGuest?.id === id ? null : state.selectedGuest,
              loading: false,
            }))
            
            // Refresh the list
            await get().fetchGuests()
          } else {
            throw new Error(data.error || 'Failed to delete guest')
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete guest',
            loading: false,
          })
          throw error
        }
      },

      // Filter actions
      setFilters: (filters: Partial<GuestState['filters']>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset to first page
        }))
      },

      setPage: (page: number) => {
        set((state) => ({
          pagination: { ...state.pagination, page },
        }))
      },

      resetFilters: () => {
        set({
          filters: {
            search: '',
            sortBy: 'created_at',
            sortOrder: 'desc',
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        })
      },

      // State actions
      setSelectedGuest: (guest: GuestWithDetails | null) => {
        set({ selectedGuest: guest })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'guest-store',
    }
  )
)