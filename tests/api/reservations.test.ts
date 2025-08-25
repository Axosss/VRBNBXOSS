/**
 * @jest-environment node
 */

import { GET as reservationsGet, POST as reservationsPost } from '@/app/api/reservations/route'
import { GET as reservationGet, PUT as reservationPut, DELETE as reservationDelete } from '@/app/api/reservations/[id]/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
  createTestGuest,
  createTestReservation,
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  mockDatabaseSuccess,
  mockDatabaseError,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Reservations API Tests', () => {
  let mockSupabase: any
  const mockUser = createTestUser()
  const mockApartment = createTestApartment()
  const mockGuest = createTestGuest()

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Mock authenticated user by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    jest.clearAllMocks()
  })

  describe('GET /api/reservations', () => {
    it('should return paginated list of user reservations with joins', async () => {
      const mockReservations = [
        createTestReservation({ 
          id: 'res-1',
          apartment_id: mockApartment.id,
          guest_id: mockGuest.id,
        }),
        createTestReservation({ 
          id: 'res-2',
          platform: 'vrbo',
          check_in: '2024-12-30',
          check_out: '2025-01-02',
        }),
      ]

      // Add joined data
      const mockReservationsWithJoins = mockReservations.map(res => ({
        ...res,
        apartment: mockApartment,
        guest: mockGuest,
      }))

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue({
        data: mockReservationsWithJoins,
        error: null,
        count: 2,
      })

      const request = createMockRequest('GET', undefined, { page: '1', limit: '10' })
      const response = await reservationsGet(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('apartment:apartments'), { count: 'exact' })
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })

      expectSuccessResponse(result)
      expect(result.data.reservations).toHaveLength(2)
      expect(result.data.reservations[0]).toHaveProperty('apartment')
      expect(result.data.reservations[0]).toHaveProperty('guest')
      expect(result.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should apply status filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        status: 'confirmed',
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'confirmed')
    })

    it('should apply platform filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        platform: 'airbnb',
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.eq).toHaveBeenCalledWith('platform', 'airbnb')
    })

    it('should apply apartment filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        apartmentId: mockApartment.id,
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.eq).toHaveBeenCalledWith('apartment_id', mockApartment.id)
    })

    it('should apply search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        search: 'AIRBNB123',
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('AIRBNB123'))
    })

    it('should apply date range filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.gte).toHaveBeenCalledWith('check_in', '2024-12-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('check_out', '2024-12-31')
    })

    it('should apply sorting', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        sortBy: 'check_in',
        sortOrder: 'asc',
        page: '1',
        limit: '10' 
      })
      await reservationsGet(request as any)

      expect(mockQuery.order).toHaveBeenCalledWith('check_in', { ascending: true })
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await reservationsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should validate pagination parameters', async () => {
      const request = createMockRequest('GET', undefined, { 
        page: '0', // Invalid page
        limit: '150' // Exceeds maximum
      })
      const response = await reservationsGet(request as any)
      const result = await response.json()

      expectValidationError(result)
    })
  })

  describe('POST /api/reservations', () => {
    const validReservationData = {
      apartmentId: mockApartment.id,
      guestId: mockGuest.id,
      platform: 'airbnb' as const,
      platformReservationId: 'AIRBNB123456',
      checkIn: '2024-12-25',
      checkOut: '2024-12-28',
      guestCount: 2,
      totalPrice: 450.00,
      cleaningFee: 50.00,
      platformFee: 25.00,
      currency: 'USD',
      notes: 'Test reservation',
      contactInfo: {
        phone: '+1234567890',
        email: 'guest@example.com',
      },
    }

    it('should successfully create a new reservation', async () => {
      const mockReservation = createTestReservation({
        apartment: mockApartment,
        guest: mockGuest,
      })

      // Use a single query builder for all operations
      const mockQueryBuilder = mockSupabase._mockQueryBuilder
      mockQueryBuilder.single
        .mockResolvedValueOnce(mockDatabaseSuccess(mockApartment)) // apartment check
        .mockResolvedValueOnce(mockDatabaseSuccess(mockGuest)) // guest check
        .mockResolvedValueOnce(mockDatabaseSuccess(mockReservation)) // reservation insert

      const request = createMockRequest('POST', validReservationData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.message).toBe('Reservation created successfully')
      expect(response.status).toBe(201)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing apartmentId
        platform: 'airbnb',
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guestCount: 2,
        totalPrice: 450.00,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toContain('expected string')
    })

    it('should validate date logic (check-out > check-in)', async () => {
      const invalidData = {
        apartmentId: mockApartment.id,
        guestId: null, // Valid to avoid UUID validation error
        platform: 'airbnb' as const,
        checkIn: '2024-12-28',
        checkOut: '2024-12-25', // Before check-in
        guestCount: 2,
        totalPrice: 450.00,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toContain('Check-out date must be after check-in date')
    })

    it('should validate guest count is positive', async () => {
      const invalidData = {
        apartmentId: mockApartment.id,
        guestId: null, // Valid to avoid UUID validation error
        platform: 'airbnb' as const,
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guestCount: 0, // Invalid guest count
        totalPrice: 450.00,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toContain('Guest count must be at least 1')
    })

    it('should validate platform enum', async () => {
      const invalidData = {
        ...validReservationData,
        platform: 'invalid_platform',
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
    })

    it('should validate negative prices', async () => {
      const invalidData = {
        apartmentId: mockApartment.id,
        guestId: null, // Valid to avoid UUID validation error
        platform: 'airbnb' as const,
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guestCount: 2,
        totalPrice: -100, // Invalid negative price
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toContain('Total price cannot be negative')
    })

    it('should handle apartment not found', async () => {
      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Apartment not found')),
      }

      mockSupabase.from.mockReturnValue(apartmentQuery)

      const request = createMockRequest('POST', validReservationData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found or not owned by user')
    })

    it('should validate guest count against apartment capacity', async () => {
      const mockQueryBuilder = mockSupabase._mockQueryBuilder
      mockQueryBuilder.single.mockResolvedValueOnce(mockDatabaseSuccess({ 
        ...mockApartment, 
        capacity: 1 // Capacity too small
      }))

      const invalidData = {
        apartmentId: mockApartment.id,
        guestId: null, // Valid to avoid UUID validation error
        platform: 'airbnb' as const,
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        guestCount: 2, // Exceeds capacity
        totalPrice: 450.00,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toContain('Guest count (2) exceeds apartment capacity (1)')
    })

    it('should handle guest not found when guestId provided', async () => {
      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      const guestQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Guest not found')),
      }

      mockSupabase.from
        .mockReturnValueOnce(apartmentQuery)
        .mockReturnValueOnce(guestQuery)

      const request = createMockRequest('POST', validReservationData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Guest not found or not owned by user')
    })

    it('should handle double booking error from database trigger', async () => {
      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      const guestQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockGuest)),
      }

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Double booking detected')),
      }

      mockSupabase.from
        .mockReturnValueOnce(apartmentQuery)
        .mockReturnValueOnce(guestQuery)
        .mockReturnValueOnce(insertQuery)

      const request = createMockRequest('POST', validReservationData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 409)
      expect(result.error).toBe('This time slot conflicts with an existing reservation')
    })

    it('should work without guestId (null guest)', async () => {
      const dataWithoutGuest = {
        ...validReservationData,
        guestId: null,
      }

      const mockReservation = createTestReservation({
        guest_id: null,
        apartment: mockApartment,
        guest: null,
      })

      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockReservation)),
      }

      mockSupabase.from
        .mockReturnValueOnce(apartmentQuery)
        .mockReturnValueOnce(insertQuery)

      const request = createMockRequest('POST', dataWithoutGuest)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        guest_id: null,
      }))
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('POST', validReservationData)
      const response = await reservationsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/reservations/[id]', () => {
    const testId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'

    it('should return specific reservation with enriched data', async () => {
      const mockReservation = createTestReservation({
        id: testId,
        apartment: mockApartment,
        guest: mockGuest,
        cleanings: [{
          id: 'clean-1',
          scheduled_date: '2024-12-28T11:00:00Z',
          status: 'scheduled',
          cleaner: {
            id: 'cleaner-1',
            name: 'Test Cleaner',
            phone: '+1234567890',
          }
        }]
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockReservation)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await reservationGet(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('apartment:apartments'))
      expect(mockQuery.eq).toHaveBeenCalledWith('id', testId)
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)

      expectSuccessResponse(result)
      expect(result.data).toHaveProperty('stayDuration')
      expect(result.data).toHaveProperty('pricePerNight')
      expect(result.data).toHaveProperty('totalWithFees')
      expect(result.data).toHaveProperty('apartment')
      expect(result.data).toHaveProperty('guest')
      expect(result.data).toHaveProperty('cleanings')
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('GET')
      const response = await reservationGet(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Invalid reservation ID format')
    })

    it('should handle reservation not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      const mockError = new Error('Row not found')
      mockError.code = 'PGRST116'
      mockQuery.single.mockResolvedValue({ error: mockError, data: null })

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await reservationGet(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Reservation not found')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await reservationGet(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/reservations/[id]', () => {
    const testId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
    const validUpdateData = {
      platform: 'vrbo' as const,
      guestCount: 3,
      totalPrice: 500.00,
      notes: 'Updated reservation notes',
    }

    it('should successfully update reservation', async () => {
      const existingReservation = createTestReservation({ id: testId })
      const updatedReservation = {
        ...existingReservation,
        ...validUpdateData,
        apartment: mockApartment,
        guest: mockGuest,
      }

      // Mock existing reservation check
      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(existingReservation)),
      }

      // Mock apartment capacity check
      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      // Mock update operation
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(updatedReservation)),
      }

      mockSupabase.from
        .mockReturnValueOnce(fetchQuery) // reservation check
        .mockReturnValueOnce(apartmentQuery) // apartment capacity check
        .mockReturnValueOnce(updateQuery) // update operation

      const request = createMockRequest('PUT', validUpdateData)
      const response = await reservationPut(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        platform: validUpdateData.platform,
        guest_count: validUpdateData.guestCount,
        total_price: validUpdateData.totalPrice,
        notes: validUpdateData.notes,
        updated_at: expect.any(String),
      }))

      expectSuccessResponse(result)
      expect(result.message).toBe('Reservation updated successfully')
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('PUT', validUpdateData)
      const response = await reservationPut(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Invalid reservation ID format')
    })

    it('should handle reservation not found', async () => {
      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      const mockError = new Error('Row not found')
      mockError.code = 'PGRST116'
      fetchQuery.single.mockResolvedValue({ error: mockError, data: null })

      mockSupabase.from.mockReturnValue(fetchQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await reservationPut(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Reservation not found')
    })

    it('should validate guest count against apartment capacity on update', async () => {
      const existingReservation = createTestReservation({ id: testId })

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(existingReservation)),
      }

      const apartmentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess({ 
          capacity: 2 // Capacity too small
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce(fetchQuery)
        .mockReturnValueOnce(apartmentQuery)

      const invalidUpdate = {
        guestCount: 5, // Exceeds capacity
      }

      const request = createMockRequest('PUT', invalidUpdate)
      const response = await reservationPut(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toContain('Guest count (5) exceeds apartment capacity (2)')
    })

    it('should handle double booking error on date update', async () => {
      const existingReservation = createTestReservation({ id: testId })

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(existingReservation)),
      }

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Double booking detected')),
      }

      mockSupabase.from
        .mockReturnValueOnce(fetchQuery)
        .mockReturnValueOnce(updateQuery)

      const dateUpdate = {
        checkIn: '2024-12-20',
        checkOut: '2024-12-23',
      }

      const request = createMockRequest('PUT', dateUpdate)
      const response = await reservationPut(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 409)
      expect(result.error).toBe('Updated dates conflict with an existing reservation')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('PUT', validUpdateData)
      const response = await reservationPut(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('DELETE /api/reservations/[id]', () => {
    const testId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'

    it('should successfully soft delete (cancel) reservation', async () => {
      const existingReservation = createTestReservation({ id: testId })

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(existingReservation)),
      }

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      // Mock the update to return success
      updateQuery.update.mockResolvedValue({ error: null })

      mockSupabase.from
        .mockReturnValueOnce(fetchQuery) // reservation check
        .mockReturnValueOnce(updateQuery) // soft delete update

      const request = createMockRequest('DELETE')
      const response = await reservationDelete(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expect(updateQuery.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String),
      })

      expectSuccessResponse(result)
      expect(result.message).toBe('Reservation cancelled successfully')
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('DELETE')
      const response = await reservationDelete(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Invalid reservation ID format')
    })

    it('should handle reservation not found', async () => {
      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      const mockError = new Error('Row not found')
      mockError.code = 'PGRST116'
      fetchQuery.single.mockResolvedValue({ error: mockError, data: null })

      mockSupabase.from.mockReturnValue(fetchQuery)

      const request = createMockRequest('DELETE')
      const response = await reservationDelete(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Reservation not found')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('DELETE')
      const response = await reservationDelete(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      const existingReservation = createTestReservation({ id: testId })

      const fetchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(existingReservation)),
      }

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      updateQuery.update.mockResolvedValue({ error: new Error('Database connection failed') })

      mockSupabase.from
        .mockReturnValueOnce(fetchQuery)
        .mockReturnValueOnce(updateQuery)

      const request = createMockRequest('DELETE')
      const response = await reservationDelete(request as any, { 
        params: { id: testId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toBe('Database connection failed')
    })
  })
})