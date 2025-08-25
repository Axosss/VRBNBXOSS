/**
 * @jest-environment node
 */

import { useApartmentStore } from '@/lib/stores/apartment-store'
import {
  createTestApartment,
  createTestReservation,
  mockDatabaseSuccess,
  mockDatabaseError,
} from '../utils/test-helpers'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Apartment Store Tests', () => {
  beforeEach(() => {
    // Reset the store before each test
    useApartmentStore.getState().reset()
    mockFetch.mockClear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useApartmentStore.getState()
      
      expect(store.apartments).toEqual([])
      expect(store.selectedApartment).toBeNull()
      expect(store.pagination).toBeNull()
      expect(store.filters).toEqual({})
      expect(store.isLoading).toBe(false)
      expect(store.isCreating).toBe(false)
      expect(store.isUpdating).toBe(false)
      expect(store.isDeleting).toBe(false)
      expect(store.isUploadingPhotos).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchApartments', () => {
    it('should fetch apartments successfully', async () => {
      const mockApartments = [
        createTestApartment({ name: 'Apartment 1' }),
        createTestApartment({ name: 'Apartment 2', id: 'b2c3d4e5-f6g7-5890-9def-234567890123' }),
      ]

      const mockResponse = {
        success: true,
        data: {
          apartments: mockApartments,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      
      await store.fetchApartments({ page: 1, limit: 10 })
      
      const updatedStore = useApartmentStore.getState()

      expect(mockFetch).toHaveBeenCalledWith('/api/apartments?page=1&limit=10')
      expect(updatedStore.apartments).toEqual(mockApartments)
      expect(updatedStore.pagination).toEqual(mockResponse.data.pagination)
      expect(updatedStore.isLoading).toBe(false)
      expect(updatedStore.error).toBeNull()
    })

    it('should handle fetch apartments error', async () => {
      const mockError = { success: false, error: 'Failed to fetch apartments' }
      
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        try {
          await result.current.fetchApartments()
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.apartments).toEqual([])
      expect(result.current.pagination).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to fetch apartments')
    })

    it('should apply filters and pagination params', async () => {
      const mockResponse = {
        success: true,
        data: { apartments: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        await result.current.fetchApartments({
          page: 2,
          limit: 5,
          status: 'active',
          search: 'downtown',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/apartments?page=2&limit=5&status=active&search=downtown'
      )
    })
  })

  describe('fetchApartment', () => {
    it('should fetch single apartment successfully', async () => {
      const mockApartment = createTestApartment()
      const mockResponse = { success: true, data: mockApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        await result.current.fetchApartment(mockApartment.id)
      })

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${mockApartment.id}`)
      expect(result.current.selectedApartment).toEqual(mockApartment)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch single apartment error', async () => {
      const mockError = { success: false, error: 'Apartment not found' }
      
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        try {
          await result.current.fetchApartment('non-existent-id')
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.selectedApartment).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Apartment not found')
    })
  })

  describe('createApartment', () => {
    it('should create apartment successfully', async () => {
      const apartmentData = {
        name: 'New Apartment',
        address: {
          street: '123 New St',
          city: 'New City',
          state: 'NC',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      }

      const mockCreatedApartment = createTestApartment(apartmentData)
      const mockResponse = { success: true, data: mockCreatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 201,
      })

      const { result } = renderHook(() => useApartmentStore())

      let createdApartment
      await act(async () => {
        createdApartment = await result.current.createApartment(apartmentData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apartmentData),
      })

      expect(createdApartment).toEqual(mockCreatedApartment)
      expect(result.current.apartments).toContain(mockCreatedApartment)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle create apartment error', async () => {
      const apartmentData = { name: 'New Apartment', capacity: 4 }
      const mockError = { success: false, error: 'Validation failed' }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        try {
          await result.current.createApartment(apartmentData)
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.apartments).toEqual([])
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBe('Validation failed')
    })

    it('should update pagination after creating apartment', async () => {
      const apartmentData = { name: 'New Apartment', capacity: 4 }
      const mockCreatedApartment = createTestApartment(apartmentData)
      const mockResponse = { success: true, data: mockCreatedApartment }

      // Set initial pagination
      act(() => {
        useApartmentStore.setState({
          apartments: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        })
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 201,
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        await result.current.createApartment(apartmentData)
      })

      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })
  })

  describe('updateApartment', () => {
    it('should update apartment successfully', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const initialApartment = createTestApartment({ id: apartmentId, name: 'Old Name' })
      const updateData = { name: 'New Name' }
      const updatedApartment = { ...initialApartment, ...updateData }

      // Set initial state with apartment
      act(() => {
        useApartmentStore.setState({
          apartments: [initialApartment],
          selectedApartment: initialApartment,
        })
      })

      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        await result.current.updateApartment(apartmentId, updateData)
      })

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      expect(result.current.apartments[0]).toEqual(updatedApartment)
      expect(result.current.selectedApartment).toEqual(updatedApartment)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle update apartment error', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const updateData = { name: 'New Name' }
      const mockError = { success: false, error: 'Apartment not found' }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        try {
          await result.current.updateApartment(apartmentId, updateData)
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.isUpdating).toBe(false)
      expect(result.current.error).toBe('Apartment not found')
    })
  })

  describe('deleteApartment', () => {
    it('should delete apartment successfully', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const apartmentToDelete = createTestApartment({ id: apartmentId })
      const otherApartment = createTestApartment({ 
        id: 'b2c3d4e5-f6g7-5890-9def-234567890123',
        name: 'Other Apartment' 
      })

      // Set initial state with apartments
      act(() => {
        useApartmentStore.setState({
          apartments: [apartmentToDelete, otherApartment],
          selectedApartment: apartmentToDelete,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        })
      })

      mockFetch.mockResolvedValue({ ok: true })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        await result.current.deleteApartment(apartmentId)
      })

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}`, {
        method: 'DELETE',
      })

      expect(result.current.apartments).toEqual([otherApartment])
      expect(result.current.selectedApartment).toBeNull()
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle delete apartment error', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const mockError = { success: false, error: 'Cannot delete apartment with active reservations' }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const { result } = renderHook(() => useApartmentStore())

      await act(async () => {
        try {
          await result.current.deleteApartment(apartmentId)
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBe('Cannot delete apartment with active reservations')
    })
  })

  describe('State Management Actions', () => {
    it('should set filters correctly', () => {
      const { result } = renderHook(() => useApartmentStore())

      act(() => {
        result.current.setFilters({ status: 'active', search: 'downtown' })
      })

      expect(result.current.filters).toEqual({ status: 'active', search: 'downtown' })
    })

    it('should set selected apartment', () => {
      const { result } = renderHook(() => useApartmentStore())
      const apartment = createTestApartment()

      act(() => {
        result.current.setSelectedApartment(apartment)
      })

      expect(result.current.selectedApartment).toEqual(apartment)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useApartmentStore())

      // Set an error first
      act(() => {
        useApartmentStore.setState({ error: 'Some error' })
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useApartmentStore())
      const apartment = createTestApartment()

      // Modify state
      act(() => {
        useApartmentStore.setState({
          apartments: [apartment],
          selectedApartment: apartment,
          isLoading: true,
          error: 'Some error',
          filters: { status: 'active' },
        })
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.apartments).toEqual([])
      expect(result.current.selectedApartment).toBeNull()
      expect(result.current.pagination).toBeNull()
      expect(result.current.filters).toEqual({})
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Loading States', () => {
    it('should set loading state during fetchApartments', async () => {
      mockFetch.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { apartments: [], pagination: {} } }),
          })
        }, 100)
      }))

      const { result } = renderHook(() => useApartmentStore())

      const fetchPromise = act(async () => {
        result.current.fetchApartments()
      })

      // Check loading state is set
      expect(result.current.isLoading).toBe(true)

      await fetchPromise

      // Check loading state is cleared
      expect(result.current.isLoading).toBe(false)
    })

    it('should set creating state during createApartment', async () => {
      const apartmentData = { name: 'New Apartment', capacity: 4 }

      mockFetch.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createTestApartment(apartmentData) }),
            status: 201,
          })
        }, 100)
      }))

      const { result } = renderHook(() => useApartmentStore())

      const createPromise = act(async () => {
        result.current.createApartment(apartmentData)
      })

      // Check creating state is set
      expect(result.current.isCreating).toBe(true)

      await createPromise

      // Check creating state is cleared
      expect(result.current.isCreating).toBe(false)
    })
  })
})