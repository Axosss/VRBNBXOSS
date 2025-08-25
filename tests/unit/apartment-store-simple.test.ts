/**
 * @jest-environment node
 */

import { useApartmentStore } from '@/lib/stores/apartment-store'
import {
  createTestApartment,
} from '../utils/test-helpers'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('Apartment Store Unit Tests', () => {
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

  describe('State Management Actions', () => {
    it('should set filters correctly', () => {
      const store = useApartmentStore.getState()
      
      store.setFilters({ status: 'active', search: 'downtown' })
      
      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.filters).toEqual({ status: 'active', search: 'downtown' })
    })

    it('should set selected apartment', () => {
      const store = useApartmentStore.getState()
      const apartment = createTestApartment()

      store.setSelectedApartment(apartment)
      
      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.selectedApartment).toEqual(apartment)
    })

    it('should clear error', () => {
      // Set an error first
      useApartmentStore.setState({ error: 'Some error' })
      
      let store = useApartmentStore.getState()
      expect(store.error).toBe('Some error')

      store.clearError()
      
      store = useApartmentStore.getState()
      expect(store.error).toBeNull()
    })

    it('should reset store to initial state', () => {
      const apartment = createTestApartment()

      // Modify state
      useApartmentStore.setState({
        apartments: [apartment],
        selectedApartment: apartment,
        isLoading: true,
        error: 'Some error',
        filters: { status: 'active' },
      })

      // Reset
      const store = useApartmentStore.getState()
      store.reset()
      
      const resetStore = useApartmentStore.getState()
      expect(resetStore.apartments).toEqual([])
      expect(resetStore.selectedApartment).toBeNull()
      expect(resetStore.pagination).toBeNull()
      expect(resetStore.filters).toEqual({})
      expect(resetStore.isLoading).toBe(false)
      expect(resetStore.error).toBeNull()
    })
  })

  describe('fetchApartments', () => {
    it('should build correct query string with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          apartments: [],
          pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      
      await store.fetchApartments({
        page: 2,
        limit: 5,
        status: 'active',
        search: 'downtown',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/apartments?page=2&limit=5&status=active&search=downtown'
      )
    })

    it('should handle fetch error correctly', async () => {
      const mockError = { success: false, error: 'Failed to fetch apartments' }
      
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const store = useApartmentStore.getState()

      try {
        await store.fetchApartments()
      } catch (error) {
        // Expected to throw
      }

      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.apartments).toEqual([])
      expect(updatedStore.pagination).toBeNull()
      expect(updatedStore.isLoading).toBe(false)
      expect(updatedStore.error).toBe('Failed to fetch apartments')
    })
  })

  describe('fetchApartment', () => {
    it('should call correct API endpoint', async () => {
      const mockApartment = createTestApartment()
      const mockResponse = { success: true, data: mockApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.fetchApartment(mockApartment.id)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${mockApartment.id}`)
      
      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.selectedApartment).toEqual(mockApartment)
      expect(updatedStore.error).toBeNull()
    })

    it('should handle single apartment fetch error', async () => {
      const mockError = { success: false, error: 'Apartment not found' }
      
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const store = useApartmentStore.getState()

      try {
        await store.fetchApartment('non-existent-id')
      } catch (error) {
        // Expected to throw
      }

      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.selectedApartment).toBeNull()
      expect(updatedStore.error).toBe('Apartment not found')
    })
  })

  describe('createApartment', () => {
    it('should make correct API call', async () => {
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

      const store = useApartmentStore.getState()
      const result = await store.createApartment(apartmentData as any)

      expect(mockFetch).toHaveBeenCalledWith('/api/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apartmentData),
      })

      expect(result).toEqual(mockCreatedApartment)
      
      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.apartments).toContain(mockCreatedApartment)
      expect(updatedStore.error).toBeNull()
    })

    it('should handle create apartment error', async () => {
      const apartmentData = { name: 'New Apartment', capacity: 4 }
      const mockError = { success: false, error: 'Validation failed' }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const store = useApartmentStore.getState()

      try {
        await store.createApartment(apartmentData as any)
      } catch (error) {
        // Expected to throw
      }

      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.apartments).toEqual([])
      expect(updatedStore.error).toBe('Validation failed')
    })
  })

  describe('updateApartment', () => {
    it('should make correct API call', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const initialApartment = createTestApartment({ id: apartmentId, name: 'Old Name' })
      const updateData = { name: 'New Name' }
      const updatedApartment = { ...initialApartment, ...updateData }

      // Set initial state with apartment
      useApartmentStore.setState({
        apartments: [initialApartment],
        selectedApartment: initialApartment,
      })

      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.updateApartment(apartmentId, updateData)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const finalStore = useApartmentStore.getState()
      expect(finalStore.apartments[0]).toEqual(updatedApartment)
      expect(finalStore.selectedApartment).toEqual(updatedApartment)
      expect(finalStore.error).toBeNull()
    })
  })

  describe('deleteApartment', () => {
    it('should make correct API call and update state', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const apartmentToDelete = createTestApartment({ id: apartmentId })
      const otherApartment = createTestApartment({ 
        id: 'b2c3d4e5-f6g7-5890-9def-234567890123',
        name: 'Other Apartment' 
      })

      // Set initial state with apartments
      useApartmentStore.setState({
        apartments: [apartmentToDelete, otherApartment],
        selectedApartment: apartmentToDelete,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })

      mockFetch.mockResolvedValue({ ok: true })

      const store = useApartmentStore.getState()
      await store.deleteApartment(apartmentId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}`, {
        method: 'DELETE',
      })

      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.apartments).toEqual([otherApartment])
      expect(updatedStore.selectedApartment).toBeNull()
      expect(updatedStore.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
      expect(updatedStore.error).toBeNull()
    })

    it('should handle delete error', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const mockError = { success: false, error: 'Cannot delete apartment with active reservations' }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      const store = useApartmentStore.getState()

      try {
        await store.deleteApartment(apartmentId)
      } catch (error) {
        // Expected to throw
      }

      const updatedStore = useApartmentStore.getState()
      expect(updatedStore.error).toBe('Cannot delete apartment with active reservations')
    })
  })

  describe('Photo Management', () => {
    it('should call upload photos API', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' }),
      ] as File[]

      const updatedApartment = createTestApartment({ 
        id: apartmentId,
        photos: [
          { id: 'photo1', url: 'url1', filename: 'image1.jpg', size: 1000, is_main: true, order: 1 },
          { id: 'photo2', url: 'url2', filename: 'image2.jpg', size: 2000, is_main: false, order: 2 },
        ]
      })

      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.uploadPhotos(apartmentId, mockFiles)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}/photos`, {
        method: 'POST',
        body: expect.any(FormData),
      })
    })

    it('should call delete photo API', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const photoId = 'photo1'
      
      const updatedApartment = createTestApartment({ id: apartmentId })
      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.deletePhoto(apartmentId, photoId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      })
    })

    it('should call reorder photos API', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const photoIds = ['photo2', 'photo1', 'photo3']
      
      const updatedApartment = createTestApartment({ id: apartmentId })
      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.reorderPhotos(apartmentId, photoIds)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', photoIds }),
      })
    })

    it('should call set main photo API', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const photoId = 'photo2'
      
      const updatedApartment = createTestApartment({ id: apartmentId })
      const mockResponse = { success: true, data: updatedApartment }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const store = useApartmentStore.getState()
      await store.setMainPhoto(apartmentId, photoId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/apartments/${apartmentId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setMain', photoId }),
      })
    })
  })
})