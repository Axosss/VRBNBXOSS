/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react'
import { useReservationStore, type Reservation } from '@/lib/stores/reservation-store'
import { type ReservationCreateInput, type ReservationUpdateInput } from '@/lib/validations'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Test data factory
const createMockReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: 'test-reservation-1',
  apartmentId: 'test-apartment-1',
  ownerId: 'test-owner-1',
  guestId: 'test-guest-1',
  platform: 'airbnb',
  platformReservationId: 'AIRBNB123',
  checkIn: '2024-12-25',
  checkOut: '2024-12-28',
  guestCount: 2,
  totalPrice: 450,
  cleaningFee: 50,
  platformFee: 25,
  currency: 'USD',
  status: 'confirmed',
  notes: 'Test reservation',
  contactInfo: { phone: '+1234567890' },
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z',
  apartment: {
    id: 'test-apartment-1',
    ownerId: 'test-owner-1',
    name: 'Test Apartment',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
    },
    capacity: 4,
    status: 'active',
  },
  guest: {
    id: 'test-guest-1',
    owner_id: 'test-owner-1',
    name: 'Test Guest',
    email: 'guest@example.com',
    phone: '+1234567890',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
  ...overrides,
})

const createMockApiResponse = (data: any, success = true) => ({
  ok: success,
  status: success ? 200 : 400,
  json: jest.fn().mockResolvedValue({
    success,
    data: success ? data : undefined,
    error: success ? undefined : data,
  }),
})

describe('ReservationStore', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    // Reset store to initial state
    useReservationStore.getState().reset()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useReservationStore())
      
      expect(result.current.reservations).toEqual([])
      expect(result.current.selectedReservation).toBeNull()
      expect(result.current.pagination).toBeNull()
      expect(result.current.filters).toEqual({})
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchReservations', () => {
    it('should fetch reservations successfully', async () => {
      const mockReservations = [
        createMockReservation(),
        createMockReservation({ id: 'test-reservation-2' }),
      ]
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      }

      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({
          reservations: mockReservations,
          pagination: mockPagination,
        }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        await result.current.fetchReservations()
      })

      expect(result.current.reservations).toEqual(mockReservations)
      expect(result.current.pagination).toEqual(mockPagination)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch reservations with pagination parameters', async () => {
      const params = { page: 2, limit: 5 }
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({
          reservations: [],
          pagination: { ...params, total: 0, totalPages: 0 },
        }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        await result.current.fetchReservations(params)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2&limit=5')
      )
    })

    it('should handle fetch reservations with filter parameters', async () => {
      const params = {
        status: 'confirmed' as const,
        platform: 'airbnb' as const,
        apartmentId: 'apartment-1',
        search: 'guest name',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        sortBy: 'check_in' as const,
        sortOrder: 'asc' as const,
      }

      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({
          reservations: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        await result.current.fetchReservations(params)
      })

      const expectedUrl = expect.stringContaining('/api/reservations?')
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl)
      
      const callUrl = (mockFetch.mock.calls[0][0] as string)
      expect(callUrl).toContain('status=confirmed')
      expect(callUrl).toContain('platform=airbnb')
      expect(callUrl).toContain('apartmentId=apartment-1')
      expect(callUrl).toContain('search=guest%20name')
      expect(callUrl).toContain('startDate=2024-12-01')
      expect(callUrl).toContain('endDate=2024-12-31')
      expect(callUrl).toContain('sortBy=check_in')
      expect(callUrl).toContain('sortOrder=asc')
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => { resolvePromise = resolve })
      
      mockFetch.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useReservationStore())

      // Start the fetch
      act(() => {
        result.current.fetchReservations()
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      await act(async () => {
        resolvePromise!(createMockApiResponse({
          reservations: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }))
      })

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle fetch reservations error', async () => {
      const errorMessage = 'Failed to fetch reservations'
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(errorMessage, false) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.fetchReservations()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.reservations).toEqual([])
      expect(result.current.pagination).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('should handle network errors during fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.fetchReservations()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchReservation', () => {
    it('should fetch single reservation successfully', async () => {
      const mockReservation = createMockReservation()
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(mockReservation) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        await result.current.fetchReservation('test-reservation-1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/reservations/test-reservation-1')
      expect(result.current.selectedReservation).toEqual(mockReservation)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch single reservation error', async () => {
      const errorMessage = 'Reservation not found'
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(errorMessage, false) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.fetchReservation('nonexistent-id')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.selectedReservation).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('createReservation', () => {
    const mockCreateData: ReservationCreateInput = {
      apartmentId: 'apartment-1',
      platform: 'airbnb',
      checkIn: '2024-12-25',
      checkOut: '2024-12-28',
      guestCount: 2,
      totalPrice: 450,
      cleaningFee: 50,
      platformFee: 25,
      currency: 'USD',
      notes: 'Test reservation',
    }

    it('should create reservation successfully', async () => {
      const mockNewReservation = createMockReservation()
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(mockNewReservation) as any
      )

      const { result } = renderHook(() => useReservationStore())

      // Set initial pagination
      act(() => {
        result.current.fetchReservations()
      })

      let createdReservation: Reservation
      await act(async () => {
        createdReservation = await result.current.createReservation(mockCreateData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockCreateData),
      })
      expect(createdReservation!).toEqual(mockNewReservation)
      expect(result.current.reservations).toContain(mockNewReservation)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should update pagination after successful creation', async () => {
      const mockNewReservation = createMockReservation()
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(mockNewReservation) as any
      )

      const { result } = renderHook(() => useReservationStore())

      // Set initial pagination
      act(() => {
        result.current.reservations = []
        result.current.pagination = { page: 1, limit: 10, total: 5, totalPages: 1 }
      })

      await act(async () => {
        await result.current.createReservation(mockCreateData)
      })

      expect(result.current.pagination!.total).toBe(6)
      expect(result.current.pagination!.totalPages).toBe(1)
    })

    it('should set creating state during creation', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => { resolvePromise = resolve })
      
      mockFetch.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useReservationStore())

      // Start the creation
      act(() => {
        result.current.createReservation(mockCreateData)
      })

      // Should be creating
      expect(result.current.isCreating).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      await act(async () => {
        resolvePromise!(createMockApiResponse(createMockReservation()))
      })

      // Should no longer be creating
      expect(result.current.isCreating).toBe(false)
    })

    it('should handle creation error', async () => {
      const errorMessage = 'Failed to create reservation'
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(errorMessage, false) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.createReservation(mockCreateData)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('updateReservation', () => {
    const mockUpdateData: ReservationUpdateInput = {
      guestCount: 3,
      totalPrice: 500,
      notes: 'Updated reservation',
    }

    it('should update reservation successfully', async () => {
      const originalReservation = createMockReservation()
      const updatedReservation = createMockReservation({
        ...mockUpdateData,
        updatedAt: '2024-12-02T00:00:00Z',
      })
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(updatedReservation) as any
      )

      const { result } = renderHook(() => useReservationStore())

      // Set initial state
      act(() => {
        result.current.reservations = [originalReservation]
        result.current.selectedReservation = originalReservation
      })

      await act(async () => {
        await result.current.updateReservation('test-reservation-1', mockUpdateData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/reservations/test-reservation-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      })
      expect(result.current.reservations[0]).toEqual(updatedReservation)
      expect(result.current.selectedReservation).toEqual(updatedReservation)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should update only the specific reservation in the list', async () => {
      const reservation1 = createMockReservation({ id: 'reservation-1' })
      const reservation2 = createMockReservation({ id: 'reservation-2' })
      const updatedReservation1 = createMockReservation({ 
        id: 'reservation-1', 
        ...mockUpdateData 
      })
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(updatedReservation1) as any
      )

      const { result } = renderHook(() => useReservationStore())

      // Set initial state with multiple reservations
      act(() => {
        result.current.reservations = [reservation1, reservation2]
      })

      await act(async () => {
        await result.current.updateReservation('reservation-1', mockUpdateData)
      })

      expect(result.current.reservations).toHaveLength(2)
      expect(result.current.reservations[0]).toEqual(updatedReservation1)
      expect(result.current.reservations[1]).toEqual(reservation2) // Unchanged
    })

    it('should set updating state during update', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => { resolvePromise = resolve })
      
      mockFetch.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useReservationStore())

      // Start the update
      act(() => {
        result.current.updateReservation('test-reservation-1', mockUpdateData)
      })

      // Should be updating
      expect(result.current.isUpdating).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      await act(async () => {
        resolvePromise!(createMockApiResponse(createMockReservation()))
      })

      // Should no longer be updating
      expect(result.current.isUpdating).toBe(false)
    })

    it('should handle update error', async () => {
      const errorMessage = 'Failed to update reservation'
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(errorMessage, false) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.updateReservation('test-reservation-1', mockUpdateData)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.isUpdating).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('deleteReservation', () => {
    it('should delete reservation successfully', async () => {
      const reservationToDelete = createMockReservation()
      const otherReservation = createMockReservation({ id: 'other-reservation' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as any)

      const { result } = renderHook(() => useReservationStore())

      // Set initial state
      act(() => {
        result.current.reservations = [reservationToDelete, otherReservation]
        result.current.selectedReservation = reservationToDelete
        result.current.pagination = { page: 1, limit: 10, total: 2, totalPages: 1 }
      })

      await act(async () => {
        await result.current.deleteReservation('test-reservation-1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/reservations/test-reservation-1', {
        method: 'DELETE',
      })
      expect(result.current.reservations).toEqual([otherReservation])
      expect(result.current.selectedReservation).toBeNull()
      expect(result.current.pagination!.total).toBe(1)
      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should not clear selectedReservation if different reservation is selected', async () => {
      const reservationToDelete = createMockReservation({ id: 'to-delete' })
      const selectedReservation = createMockReservation({ id: 'selected' })
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as any)

      const { result } = renderHook(() => useReservationStore())

      // Set initial state
      act(() => {
        result.current.reservations = [reservationToDelete, selectedReservation]
        result.current.selectedReservation = selectedReservation
      })

      await act(async () => {
        await result.current.deleteReservation('to-delete')
      })

      expect(result.current.selectedReservation).toEqual(selectedReservation)
    })

    it('should set deleting state during deletion', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => { resolvePromise = resolve })
      
      mockFetch.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useReservationStore())

      // Start the deletion
      act(() => {
        result.current.deleteReservation('test-reservation-1')
      })

      // Should be deleting
      expect(result.current.isDeleting).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({ success: true }) })
      })

      // Should no longer be deleting
      expect(result.current.isDeleting).toBe(false)
    })

    it('should handle deletion error', async () => {
      const errorMessage = 'Failed to delete reservation'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: errorMessage }),
      } as any)

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.deleteReservation('test-reservation-1')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.isDeleting).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('checkAvailability', () => {
    it('should check availability successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({ available: true }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      let isAvailable: boolean
      await act(async () => {
        isAvailable = await result.current.checkAvailability(
          'apartment-1',
          '2024-12-25',
          '2024-12-28'
        )
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reservations/availability?apartmentId=apartment-1&checkIn=2024-12-25&checkOut=2024-12-28'
      )
      expect(isAvailable!).toBe(true)
    })

    it('should check availability with exclusion', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({ available: false }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      let isAvailable: boolean
      await act(async () => {
        isAvailable = await result.current.checkAvailability(
          'apartment-1',
          '2024-12-25',
          '2024-12-28',
          'exclude-reservation-id'
        )
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('excludeReservationId=exclude-reservation-id')
      )
      expect(isAvailable!).toBe(false)
    })

    it('should handle availability check error', async () => {
      const errorMessage = 'Failed to check availability'
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(errorMessage, false) as any
      )

      const { result } = renderHook(() => useReservationStore())

      let isAvailable: boolean
      await act(async () => {
        isAvailable = await result.current.checkAvailability(
          'apartment-1',
          '2024-12-25',
          '2024-12-28'
        )
      })

      expect(isAvailable!).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('Store Actions', () => {
    it('should set filters', () => {
      const { result } = renderHook(() => useReservationStore())
      const filters = { status: 'confirmed' as const, platform: 'airbnb' as const }

      act(() => {
        result.current.setFilters(filters)
      })

      expect(result.current.filters).toEqual(filters)
    })

    it('should set selected reservation', () => {
      const { result } = renderHook(() => useReservationStore())
      const reservation = createMockReservation()

      act(() => {
        result.current.setSelectedReservation(reservation)
      })

      expect(result.current.selectedReservation).toEqual(reservation)
    })

    it('should clear selected reservation', () => {
      const { result } = renderHook(() => useReservationStore())

      // First set a reservation
      act(() => {
        result.current.setSelectedReservation(createMockReservation())
      })

      // Then clear it
      act(() => {
        result.current.setSelectedReservation(null)
      })

      expect(result.current.selectedReservation).toBeNull()
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useReservationStore())

      // First set an error
      act(() => {
        result.current.error = 'Test error'
      })

      // Then clear it
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useReservationStore())

      // Set some state
      act(() => {
        result.current.reservations = [createMockReservation()]
        result.current.selectedReservation = createMockReservation()
        result.current.error = 'Test error'
        result.current.isLoading = true
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.reservations).toEqual([])
      expect(result.current.selectedReservation).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Malformed JSON')),
      } as any)

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.fetchReservations()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Malformed JSON')
    })

    it('should handle network connectivity issues', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'))

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        try {
          await result.current.createReservation({
            apartmentId: 'apartment-1',
            platform: 'airbnb',
            checkIn: '2024-12-25',
            checkOut: '2024-12-28',
            guestCount: 2,
            totalPrice: 450,
          })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBe('Network request failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty reservation list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse({
          reservations: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }) as any
      )

      const { result } = renderHook(() => useReservationStore())

      await act(async () => {
        await result.current.fetchReservations()
      })

      expect(result.current.reservations).toEqual([])
      expect(result.current.pagination!.total).toBe(0)
    })

    it('should handle updating non-existent reservation', async () => {
      const updatedReservation = createMockReservation({ id: 'nonexistent' })
      
      mockFetch.mockResolvedValueOnce(
        createMockApiResponse(updatedReservation) as any
      )

      const { result } = renderHook(() => useReservationStore())

      // Set initial state with different reservations
      act(() => {
        result.current.reservations = [createMockReservation({ id: 'existing' })]
      })

      await act(async () => {
        await result.current.updateReservation('nonexistent', { notes: 'updated' })
      })

      // Original reservation should remain, no new one added since ID doesn't match
      expect(result.current.reservations).toHaveLength(1)
      expect(result.current.reservations[0].id).toBe('existing')
    })

    it('should handle deleting non-existent reservation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      } as any)

      const { result } = renderHook(() => useReservationStore())

      // Set initial state
      const existingReservation = createMockReservation({ id: 'existing' })
      act(() => {
        result.current.reservations = [existingReservation]
      })

      await act(async () => {
        await result.current.deleteReservation('nonexistent')
      })

      // Original reservation should remain unchanged
      expect(result.current.reservations).toEqual([existingReservation])
    })
  })
})