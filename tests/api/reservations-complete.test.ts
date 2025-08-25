import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/reservations/route'
import { GET as GetById, PUT, DELETE } from '@/app/api/reservations/[id]/route'
import { createMockSupabaseClient, createTestUser, createTestApartment, createTestGuest, createTestReservation, createMockRequest, expectSuccessResponse, expectErrorResponse, expectValidationError, mockDatabaseSuccess, mockDatabaseError } from '../utils/test-helpers'

// Mock Supabase
const mockSupabaseClient = createMockSupabaseClient()
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock utilities
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  isValidUUID: jest.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
  getDaysBetween: jest.fn((start: Date, end: Date) => Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
}))

describe('Reservations API - Complete Test Suite', () => {
  const testUser = createTestUser()
  const testApartment = createTestApartment()
  const testGuest = createTestGuest()
  const testReservation = createTestReservation()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock query builder
    Object.values(mockSupabaseClient._mockQueryBuilder).forEach(mock => {
      if (typeof mock === 'function') mock.mockReturnThis()
    })
  })

  describe('GET /api/reservations - List Reservations', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      })
    })

    it('should return paginated reservations with default filters', async () => {
      const mockReservations = [testReservation, { ...testReservation, id: 'test-reservation-2' }]
      
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue(
        mockDatabaseSuccess(mockReservations[0])
      )
      // Mock the query chain for list
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockReservations).data = mockReservations, mockDatabaseSuccess(mockReservations).count = 2, mockDatabaseSuccess(mockReservations)),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data.reservations).toHaveLength(2)
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should handle pagination parameters correctly', async () => {
      const mockReservations = Array.from({ length: 5 }, (_, i) => ({
        ...testReservation,
        id: `reservation-${i + 1}`,
      }))

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: mockReservations.slice(2, 4), // Page 2, limit 2
          error: null,
          count: 5,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?page=2&limit=2')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data.reservations).toHaveLength(2)
      expect(data.data.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })

    it('should filter reservations by status', async () => {
      const confirmedReservations = [{ ...testReservation, status: 'confirmed' }]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: confirmedReservations,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?status=confirmed')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'confirmed')
    })

    it('should filter reservations by platform', async () => {
      const airbnbReservations = [{ ...testReservation, platform: 'airbnb' }]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: airbnbReservations,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?platform=airbnb')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.eq).toHaveBeenCalledWith('platform', 'airbnb')
    })

    it('should filter reservations by apartment ID', async () => {
      const apartmentReservations = [{ ...testReservation, apartment_id: testApartment.id }]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: apartmentReservations,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest(`http://localhost:3000/api/reservations?apartmentId=${testApartment.id}`)
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.eq).toHaveBeenCalledWith('apartment_id', testApartment.id)
    })

    it('should search reservations by guest name', async () => {
      const searchResults = [testReservation]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: searchResults,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?search=john')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.or).toHaveBeenCalledWith(
        expect.stringContaining('guests.name.ilike.%john%')
      )
    })

    it('should filter reservations by date range', async () => {
      const dateFilteredReservations = [testReservation]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: dateFilteredReservations,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?startDate=2024-12-01&endDate=2024-12-31')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.gte).toHaveBeenCalledWith('check_in', '2024-12-01')
      expect(mockSupabaseClient._mockQueryBuilder.lte).toHaveBeenCalledWith('check_out', '2024-12-31')
    })

    it('should sort reservations by different columns', async () => {
      const sortedReservations = [testReservation]
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: sortedReservations,
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations?sortBy=total_price&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(mockSupabaseClient._mockQueryBuilder.order).toHaveBeenCalledWith('total_price', { ascending: false })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations')
      const response = await GET(request)
      const data = await response.json()

      expectErrorResponse(data, 401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database query errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
          count: null,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations')
      const response = await GET(request)
      const data = await response.json()

      expectErrorResponse(data, 500)
    })

    it('should validate pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/reservations?page=0&limit=150')
      const response = await GET(request)
      const data = await response.json()

      expectErrorResponse(data, 400)
    })

    it('should include related apartment and guest data', async () => {
      const reservationWithJoins = {
        ...testReservation,
        apartment: testApartment,
        guest: testGuest,
      }
      
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient._mockQueryBuilder,
        range: jest.fn().mockResolvedValue({
          data: [reservationWithJoins],
          error: null,
          count: 1,
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/reservations')
      const response = await GET(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data.reservations[0]).toHaveProperty('apartment')
      expect(data.data.reservations[0]).toHaveProperty('guest')
      expect(mockSupabaseClient._mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.stringContaining('apartment:apartments')
      )
      expect(mockSupabaseClient._mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.stringContaining('guest:guests')
      )
    })
  })

  describe('POST /api/reservations - Create Reservation', () => {
    const validReservationData = {
      apartmentId: testApartment.id,
      guestId: testGuest.id,
      platform: 'airbnb' as const,
      platformReservationId: 'AIRBNB123',
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

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      })
    })

    it('should create a new reservation with valid data', async () => {
      // Mock apartment verification
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testApartment,
        error: null,
      })

      // Mock guest verification
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testGuest,
        error: null,
      })

      // Mock reservation creation
      const createdReservation = { ...testReservation, ...validReservationData }
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null,
      })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data).toHaveProperty('id')
      expect(data.message).toBe('Reservation created successfully')
      expect(response.status).toBe(201)
    })

    it('should validate required fields', async () => {
      const invalidData = { ...validReservationData }
      delete invalidData.apartmentId

      const request = createMockRequest('POST', invalidData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectValidationError(data)
    })

    it('should validate check-in and check-out dates', async () => {
      const invalidData = {
        ...validReservationData,
        checkIn: '2024-12-28',
        checkOut: '2024-12-25', // Check-out before check-in
      }

      const request = createMockRequest('POST', invalidData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectValidationError(data)
    })

    it('should validate guest count against apartment capacity', async () => {
      // Mock apartment with capacity 2
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...testApartment, capacity: 2 },
        error: null,
      })

      const invalidData = {
        ...validReservationData,
        guestCount: 5, // Exceeds capacity
      }

      const request = createMockRequest('POST', invalidData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(data, 400)
      expect(data.error).toContain('exceeds apartment capacity')
    })

    it('should verify apartment ownership', async () => {
      // Mock apartment not owned by user
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Apartment not found or not owned by user')
    })

    it('should verify guest ownership when guestId provided', async () => {
      // Mock apartment verification success
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testApartment,
        error: null,
      })

      // Mock guest not owned by user
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Guest not found or not owned by user')
    })

    it('should handle database double-booking errors', async () => {
      // Mock apartment and guest verification success
      mockSupabaseClient._mockQueryBuilder.single
        .mockResolvedValueOnce({ data: testApartment, error: null })
        .mockResolvedValueOnce({ data: testGuest, error: null })

      // Mock double-booking error from database
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Double booking detected'),
      })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(data, 409)
      expect(data.error).toBe('This time slot conflicts with an existing reservation')
    })

    it('should work without guestId (direct booking scenario)', async () => {
      const dataWithoutGuest = { ...validReservationData }
      delete dataWithoutGuest.guestId

      // Mock apartment verification
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testApartment,
        error: null,
      })

      // Mock reservation creation
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...testReservation, guest_id: null },
        error: null,
      })

      const request = createMockRequest('POST', dataWithoutGuest) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectSuccessResponse(data)
    })

    it('should validate platform enum values', async () => {
      const invalidData = {
        ...validReservationData,
        platform: 'invalid_platform',
      }

      const request = createMockRequest('POST', invalidData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectValidationError(data)
    })

    it('should validate numeric fields are non-negative', async () => {
      const invalidData = {
        ...validReservationData,
        totalPrice: -100,
      }

      const request = createMockRequest('POST', invalidData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectValidationError(data)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)
      const data = await response.json()

      expectErrorResponse(data, 401)
    })

    it('should transform camelCase to snake_case for database', async () => {
      // Mock successful creation flow
      mockSupabaseClient._mockQueryBuilder.single
        .mockResolvedValueOnce({ data: testApartment, error: null })
        .mockResolvedValueOnce({ data: testGuest, error: null })
        .mockResolvedValueOnce({ data: testReservation, error: null })

      const request = createMockRequest('POST', validReservationData) as NextRequest
      const response = await POST(request)

      // Verify insert was called with snake_case fields
      expect(mockSupabaseClient._mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          apartment_id: validReservationData.apartmentId,
          guest_id: validReservationData.guestId,
          platform_reservation_id: validReservationData.platformReservationId,
          check_in: validReservationData.checkIn,
          check_out: validReservationData.checkOut,
          guest_count: validReservationData.guestCount,
          total_price: validReservationData.totalPrice,
          cleaning_fee: validReservationData.cleaningFee,
          platform_fee: validReservationData.platformFee,
          contact_info: validReservationData.contactInfo,
        })
      )
    })
  })

  describe('GET /api/reservations/[id] - Get Single Reservation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      })
    })

    it('should return reservation with detailed information', async () => {
      const enrichedReservation = {
        ...testReservation,
        apartment: testApartment,
        guest: testGuest,
        cleanings: [],
      }

      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: enrichedReservation,
        error: null,
      })

      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data).toHaveProperty('stayDuration')
      expect(data.data).toHaveProperty('pricePerNight')
      expect(data.data).toHaveProperty('totalWithFees')
      expect(data.data.apartment).toEqual(testApartment)
      expect(data.data.guest).toEqual(testGuest)
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/invalid-id'),
        { params: { id: 'invalid-id' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 400)
      expect(data.error).toBe('Invalid reservation ID format')
    })

    it('should return 404 for non-existent reservation', async () => {
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Reservation not found')
    })

    it('should enforce user ownership through RLS', async () => {
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expect(mockSupabaseClient._mockQueryBuilder.eq).toHaveBeenCalledWith('owner_id', testUser.id)
      expectErrorResponse(data, 404)
    })

    it('should calculate derived fields correctly', async () => {
      const reservationWith3Days = {
        ...testReservation,
        check_in: '2024-12-25',
        check_out: '2024-12-28',
        total_price: 300,
      }

      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: reservationWith3Days,
        error: null,
      })

      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.data.stayDuration).toBe(3)
      expect(data.data.pricePerNight).toBe(100)
      expect(data.data.totalWithFees).toBe(375) // 300 + 50 + 25
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 401)
    })
  })

  describe('PUT /api/reservations/[id] - Update Reservation', () => {
    const updateData = {
      guestCount: 3,
      totalPrice: 500,
      notes: 'Updated reservation',
    }

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      })
    })

    it('should update reservation with valid data', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testReservation,
        error: null,
      })

      // Mock apartment capacity check
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...testApartment, capacity: 4 },
        error: null,
      })

      // Mock update result
      const updatedReservation = { ...testReservation, ...updateData }
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: updatedReservation,
        error: null,
      })

      const response = await PUT(
        createMockRequest('PUT', updateData) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.message).toBe('Reservation updated successfully')
    })

    it('should validate guest count against apartment capacity when updating', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testReservation,
        error: null,
      })

      // Mock apartment with capacity 2
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...testApartment, capacity: 2 },
        error: null,
      })

      const invalidUpdate = { guestCount: 5 }

      const response = await PUT(
        createMockRequest('PUT', invalidUpdate) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 400)
      expect(data.error).toContain('exceeds apartment capacity')
    })

    it('should verify guest ownership when updating guestId', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testReservation,
        error: null,
      })

      // Mock guest not found
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const updateWithInvalidGuest = { guestId: 'invalid-guest-id' }

      const response = await PUT(
        createMockRequest('PUT', updateWithInvalidGuest) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Guest not found or not owned by user')
    })

    it('should handle double-booking conflicts on date updates', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testReservation,
        error: null,
      })

      // Mock update with double-booking error
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Double booking detected'),
      })

      const dateUpdate = {
        checkIn: '2024-12-30',
        checkOut: '2025-01-02',
      }

      const response = await PUT(
        createMockRequest('PUT', dateUpdate) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 409)
      expect(data.error).toBe('Updated dates conflict with an existing reservation')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await PUT(
        createMockRequest('PUT', updateData) as NextRequest,
        { params: { id: 'invalid-id' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 400)
      expect(data.error).toBe('Invalid reservation ID format')
    })

    it('should return 404 for non-existent reservation', async () => {
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const response = await PUT(
        createMockRequest('PUT', updateData) as NextRequest,
        { params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Reservation not found')
    })

    it('should allow partial updates', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: testReservation,
        error: null,
      })

      // Mock successful update
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...testReservation, notes: 'Just updating notes' },
        error: null,
      })

      const partialUpdate = { notes: 'Just updating notes' }

      const response = await PUT(
        createMockRequest('PUT', partialUpdate) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectSuccessResponse(data)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const response = await PUT(
        createMockRequest('PUT', updateData) as NextRequest,
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 401)
    })

    it('should transform camelCase to snake_case for database update', async () => {
      // Mock existing reservation and successful update
      mockSupabaseClient._mockQueryBuilder.single
        .mockResolvedValueOnce({ data: testReservation, error: null })
        .mockResolvedValueOnce({ data: testReservation, error: null })

      const camelCaseUpdate = {
        platformReservationId: 'NEW123',
        checkIn: '2024-12-26',
        checkOut: '2024-12-29',
        guestCount: 3,
        totalPrice: 600,
        cleaningFee: 60,
        platformFee: 30,
        contactInfo: { phone: '+9876543210' },
      }

      const response = await PUT(
        createMockRequest('PUT', camelCaseUpdate) as NextRequest,
        { params: { id: testReservation.id } }
      )

      expect(mockSupabaseClient._mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          platform_reservation_id: 'NEW123',
          check_in: '2024-12-26',
          check_out: '2024-12-29',
          guest_count: 3,
          total_price: 600,
          cleaning_fee: 60,
          platform_fee: 30,
          contact_info: { phone: '+9876543210' },
          updated_at: expect.any(String),
        })
      )
    })
  })

  describe('DELETE /api/reservations/[id] - Cancel Reservation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      })
    })

    it('should soft delete (cancel) reservation successfully', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: testReservation,
        error: null,
      })

      // Mock successful update (soft delete)
      mockSupabaseClient._mockQueryBuilder.update.mockResolvedValue({
        data: null,
        error: null,
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectSuccessResponse(data)
      expect(data.message).toBe('Reservation cancelled successfully')
      expect(mockSupabaseClient._mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String),
      })
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/invalid'),
        { params: { id: 'invalid-id' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 400)
      expect(data.error).toBe('Invalid reservation ID format')
    })

    it('should return 404 for non-existent reservation', async () => {
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } }
      )
      const data = await response.json()

      expectErrorResponse(data, 404)
      expect(data.error).toBe('Reservation not found')
    })

    it('should enforce user ownership through RLS', async () => {
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: testReservation,
        error: null,
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )

      expect(mockSupabaseClient._mockQueryBuilder.eq).toHaveBeenCalledWith('owner_id', testUser.id)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 401)
    })

    it('should handle database errors during deletion', async () => {
      // Mock existing reservation fetch
      mockSupabaseClient._mockQueryBuilder.single.mockResolvedValue({
        data: testReservation,
        error: null,
      })

      // Mock deletion error
      mockSupabaseClient._mockQueryBuilder.update.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      })

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reservations/123'),
        { params: { id: testReservation.id } }
      )
      const data = await response.json()

      expectErrorResponse(data, 500)
    })
  })
})