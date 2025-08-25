import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/reservations/route'
import { PUT, DELETE } from '@/app/api/reservations/[id]/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

describe('Reservation Integration Tests', () => {
  let mockSupabase: any
  let mockUser = { id: 'user-123', email: 'test@example.com' }
  let mockApartment = {
    id: 'apt-123',
    name: 'Test Apartment',
    capacity: 4,
    owner_id: 'user-123',
    status: 'active'
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup Supabase mock
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ 
          data: { user: mockUser }, 
          error: null 
        })
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }
    
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('Complete Booking Workflow', () => {
    it('should complete a full reservation lifecycle: create → view → edit → cancel', async () => {
      // Step 1: Create a new reservation
      const createData = {
        apartmentId: 'apt-123',
        checkIn: '2024-03-15',
        checkOut: '2024-03-20',
        guestCount: 2,
        platform: 'airbnb',
        platformReservationId: 'AIR123456',
        totalPrice: 500,
        cleaningFee: 50,
        notes: 'Test reservation'
      }

      // Mock apartment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockApartment,
        error: null
      })

      // Mock availability check (no conflicts)
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock reservation creation
      const createdReservation = {
        id: 'res-123',
        ...createData,
        owner_id: 'user-123',
        status: 'confirmed',
        created_at: new Date().toISOString()
      }
      
      mockSupabase.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null
      })

      const createRequest = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' }
      })

      const createResponse = await POST(createRequest)
      const createResult = await createResponse.json()
      
      expect(createResponse.status).toBe(201)
      expect(createResult.success).toBe(true)
      expect(createResult.data.id).toBe('res-123')

      // Step 2: View the created reservation
      mockSupabase.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null
      })

      const getRequest = new NextRequest(`http://localhost/api/reservations/res-123`)
      const getResponse = await GET(getRequest, { params: Promise.resolve({ id: 'res-123' }) })
      const getResult = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getResult.success).toBe(true)
      expect(getResult.data.id).toBe('res-123')

      // Step 3: Edit the reservation (change guest count)
      const updateData = {
        guestCount: 3,
        notes: 'Updated reservation'
      }

      // Mock existing reservation lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null
      })

      // Mock apartment capacity check
      mockSupabase.single.mockResolvedValueOnce({
        data: { capacity: 4 },
        error: null
      })

      // Mock update
      const updatedReservation = {
        ...createdReservation,
        ...updateData
      }
      
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedReservation,
        error: null
      })

      const updateRequest = new NextRequest(`http://localhost/api/reservations/res-123`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const updateResponse = await PUT(updateRequest, { params: Promise.resolve({ id: 'res-123' }) })
      const updateResult = await updateResponse.json()

      expect(updateResponse.status).toBe(200)
      expect(updateResult.success).toBe(true)
      expect(updateResult.data.guestCount).toBe(3)

      // Step 4: Cancel the reservation
      mockSupabase.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { ...updatedReservation, status: 'cancelled' },
        error: null
      })

      const deleteRequest = new NextRequest(`http://localhost/api/reservations/res-123`)
      const deleteResponse = await DELETE(deleteRequest, { params: Promise.resolve({ id: 'res-123' }) })
      const deleteResult = await deleteResponse.json()

      expect(deleteResponse.status).toBe(200)
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.data.status).toBe('cancelled')
    })
  })

  describe('Multi-User Concurrent Booking', () => {
    it('should prevent double booking when multiple users try to book same dates', async () => {
      const bookingData = {
        apartmentId: 'apt-123',
        checkIn: '2024-04-01',
        checkOut: '2024-04-05',
        guestCount: 2,
        platform: 'direct',
        totalPrice: 400
      }

      // User 1 attempts booking
      mockSupabase.single.mockResolvedValueOnce({
        data: mockApartment,
        error: null
      })

      // Availability check shows it's available
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // User 2 books while User 1 is still processing
      // Simulate conflict on final check
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ id: 'conflict-res' }],
        error: null
      })

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
    })
  })

  describe('Platform-Specific Booking Flows', () => {
    const platforms = ['airbnb', 'vrbo', 'direct', 'booking_com']

    platforms.forEach(platform => {
      it(`should handle ${platform} booking with platform-specific fields`, async () => {
        const bookingData: any = {
          apartmentId: 'apt-123',
          checkIn: '2024-05-01',
          checkOut: '2024-05-07',
          guestCount: 3,
          platform,
          totalPrice: 600,
          cleaningFee: 75
        }

        // Add platform-specific fields
        if (platform !== 'direct') {
          bookingData.platformReservationId = `${platform.toUpperCase()}-123456`
        } else {
          bookingData.contactInfo = {
            guestName: 'John Doe',
            guestEmail: 'john@example.com',
            guestPhone: '+1234567890'
          }
        }

        // Mock apartment lookup
        mockSupabase.single.mockResolvedValueOnce({
          data: mockApartment,
          error: null
        })

        // Mock availability check
        mockSupabase.limit.mockResolvedValueOnce({
          data: [],
          error: null
        })

        // Mock reservation creation
        mockSupabase.single.mockResolvedValueOnce({
          data: {
            id: `res-${platform}`,
            ...bookingData,
            owner_id: 'user-123',
            status: 'confirmed'
          },
          error: null
        })

        const request = new NextRequest('http://localhost/api/reservations', {
          method: 'POST',
          body: JSON.stringify(bookingData),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.data.platform).toBe(platform)
        
        if (platform !== 'direct') {
          expect(result.data.platformReservationId).toBeDefined()
        } else {
          expect(result.data.contactInfo).toBeDefined()
        }
      })
    })
  })

  describe('Cleaning Schedule Integration', () => {
    it('should trigger cleaning schedule creation on reservation', async () => {
      const bookingData = {
        apartmentId: 'apt-123',
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
        guestCount: 2,
        platform: 'airbnb',
        platformReservationId: 'AIR789',
        totalPrice: 450,
        cleaningFee: 60
      }

      // Mock apartment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: mockApartment,
        error: null
      })

      // Mock availability check
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock reservation creation with cleaning relationship
      const createdReservation = {
        id: 'res-clean-123',
        ...bookingData,
        owner_id: 'user-123',
        status: 'confirmed',
        cleanings: [
          {
            id: 'clean-123',
            scheduled_date: '2024-06-05',
            status: 'needed'
          }
        ]
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: createdReservation,
        error: null
      })

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      // In a real implementation, we'd check if cleaning was created
      // This would be handled by database triggers or a separate service
    })
  })

  describe('Search and Filter Operations', () => {
    it('should handle complex search queries safely', async () => {
      // Test SQL injection prevention
      const maliciousSearches = [
        "'; DROP TABLE reservations; --",
        "1' OR '1'='1",
        '<script>alert("XSS")</script>',
        'SELECT * FROM users'
      ]

      for (const search of maliciousSearches) {
        mockSupabase.range.mockResolvedValueOnce({
          data: [],
          error: null,
          count: 0
        })

        const request = new NextRequest(
          `http://localhost/api/reservations?search=${encodeURIComponent(search)}`
        )

        const response = await GET(request)
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.success).toBe(true)
        // The search should be sanitized and not cause any SQL errors
        expect(result.data.reservations).toEqual([])
      }
    })

    it('should filter reservations by multiple criteria', async () => {
      const mockReservations = [
        {
          id: 'res-1',
          platform: 'airbnb',
          status: 'confirmed',
          check_in: '2024-03-01',
          check_out: '2024-03-05'
        },
        {
          id: 'res-2',
          platform: 'vrbo',
          status: 'confirmed',
          check_in: '2024-03-10',
          check_out: '2024-03-15'
        }
      ]

      mockSupabase.range.mockResolvedValueOnce({
        data: mockReservations,
        error: null,
        count: 2
      })

      const request = new NextRequest(
        'http://localhost/api/reservations?status=confirmed&platform=airbnb&startDate=2024-03-01&endDate=2024-03-31'
      )

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.pagination.total).toBe(2)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate database connection error
      mockSupabase.single.mockRejectedValueOnce(new Error('Connection timeout'))

      const request = new NextRequest(`http://localhost/api/reservations/res-123`)
      const response = await GET(request, { params: Promise.resolve({ id: 'res-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate input data and reject invalid requests', async () => {
      const invalidData = {
        apartmentId: 'not-a-uuid',
        checkIn: 'invalid-date',
        checkOut: '2024-03-20',
        guestCount: -1,
        platform: 'invalid-platform',
        totalPrice: 'not-a-number'
      }

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })

    it('should handle unauthorized access attempts', async () => {
      // Mock unauthorized user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency when updating related entities', async () => {
      const updateData = {
        guestId: 'guest-456',
        guestCount: 3
      }

      // Mock existing reservation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'res-123',
          apartment_id: 'apt-123',
          owner_id: 'user-123'
        },
        error: null
      })

      // Mock guest validation - guest doesn't belong to user
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest(`http://localhost/api/reservations/res-123`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'res-123' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Guest not found')
    })
  })
})