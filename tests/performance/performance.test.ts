/**
 * @jest-environment node
 */

import { GET as apartmentsGet, POST as apartmentsPost } from '@/app/api/apartments/route'
import { GET as reservationsGet, POST as reservationsPost } from '@/app/api/reservations/route'
import { GET as reservationGet, PUT as reservationPut } from '@/app/api/reservations/[id]/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
  createTestReservation,
  createTestGuest,
  createMockRequest,
  mockDatabaseSuccess,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Performance Tests', () => {
  let mockSupabase: any
  const mockUser = createTestUser()

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    jest.clearAllMocks()
  })

  describe('API Response Times', () => {
    it('should handle apartment list requests within acceptable time', async () => {
      const mockApartments = Array.from({ length: 100 }, (_, i) => 
        createTestApartment({ 
          name: `Apartment ${i + 1}`,
          id: `apt-${String(i + 1).padStart(3, '0')}-uuid-0000-0000-000000000000`
        })
      )

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess(mockApartments.slice(0, 10)))

      const request = createMockRequest('GET', undefined, { page: '1', limit: '10' })
      
      const startTime = performance.now()
      const response = await apartmentsGet(request as any)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(responseTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle apartment creation within acceptable time', async () => {
      const apartmentData = {
        name: 'Performance Test Apartment',
        address: {
          street: '123 Performance St',
          city: 'Speed City',
          state: 'SC',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
        amenities: ['wifi', 'kitchen', 'parking', 'pool', 'gym'],
        accessCodes: {
          wifi: { network: 'TestNet', password: 'testpass123' },
          door: '1234',
          mailbox: '5678',
        },
      }

      const mockCreatedApartment = createTestApartment(apartmentData)
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockCreatedApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', apartmentData)
      
      const startTime = performance.now()
      const response = await apartmentsPost(request as any)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(responseTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })

  describe('Pagination Performance', () => {
    it('should handle large datasets with efficient pagination', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      
      // Simulate large dataset with efficient range query
      mockQuery.range.mockImplementation((from: number, to: number) => {
        const pageSize = to - from + 1
        const mockData = Array.from({ length: pageSize }, (_, i) => 
          createTestApartment({ 
            name: `Apartment ${from + i + 1}`,
            id: `apt-${String(from + i + 1).padStart(6, '0')}-0000-0000-000000000000`
          })
        )
        return Promise.resolve({
          data: mockData,
          error: null,
          count: 10000, // Large total count
        })
      })

      const testPages = [
        { page: 1, limit: 10 },
        { page: 50, limit: 20 },
        { page: 100, limit: 100 }, // Larger page size
      ]

      for (const { page, limit } of testPages) {
        const request = createMockRequest('GET', undefined, { 
          page: page.toString(), 
          limit: limit.toString() 
        })
        
        const startTime = performance.now()
        const response = await apartmentsGet(request as any)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.data.apartments).toHaveLength(limit)
        expect(responseTime).toBeLessThan(500) // Should be fast even for large pages
        
        // Verify efficient range query is used
        const from = (page - 1) * limit
        const to = from + limit - 1
        expect(mockQuery.range).toHaveBeenCalledWith(from, to)
      }
    })

    it('should handle pagination edge cases efficiently', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      // Test last page with partial results
      const request = createMockRequest('GET', undefined, { 
        page: '1000',  // Very high page number
        limit: '10' 
      })
      
      const startTime = performance.now()
      const response = await apartmentsGet(request as any)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(responseTime).toBeLessThan(200) // Should handle edge cases quickly
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during multiple requests', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const initialMemory = process.memoryUsage().heapUsed

      // Perform multiple requests to test for memory leaks
      const requests = []
      for (let i = 0; i < 50; i++) {
        const request = createMockRequest('GET', undefined, { 
          page: '1', 
          limit: '10',
          search: `search-term-${i}` // Different search terms
        })
        requests.push(apartmentsGet(request as any))
      }

      await Promise.all(requests)

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory should not increase significantly (allowing for some overhead)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent apartment creation requests', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // Create promises for concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        const apartmentData = {
          name: `Concurrent Apartment ${i + 1}`,
          address: {
            street: `${i + 1} Concurrent St`,
            city: 'Concurrent City',
            state: 'CC',
            zipCode: '12345',
            country: 'US',
          },
          capacity: 4,
        }

        const mockApartment = createTestApartment({
          ...apartmentData,
          id: `concurrent-${i}-uuid-0000-0000-000000000000`
        })

        mockQuery.single.mockResolvedValueOnce(mockDatabaseSuccess(mockApartment))

        const request = createMockRequest('POST', apartmentData)
        return apartmentsPost(request as any)
      })

      const startTime = performance.now()
      const responses = await Promise.all(concurrentRequests)
      const endTime = performance.now()

      const totalTime = endTime - startTime

      // All requests should succeed
      for (const response of responses) {
        const result = await response.json()
        expect(result.success).toBe(true)
      }

      // Total time should be reasonable for concurrent execution
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds

      // All inserts should have been called
      expect(mockQuery.insert).toHaveBeenCalledTimes(10)
    })

    it('should handle concurrent read requests efficiently', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      // Create concurrent read requests with different parameters
      const concurrentRequests = Array.from({ length: 20 }, (_, i) => {
        const request = createMockRequest('GET', undefined, {
          page: Math.floor(i / 5 + 1).toString(), // Vary page numbers
          limit: '10',
          search: i % 2 === 0 ? 'test' : undefined, // Some with search, some without
          status: i % 3 === 0 ? 'active' : undefined, // Some with status filter
        })
        return apartmentsGet(request as any)
      })

      const startTime = performance.now()
      const responses = await Promise.all(concurrentRequests)
      const endTime = performance.now()

      const totalTime = endTime - startTime

      // All requests should succeed
      for (const response of responses) {
        const result = await response.json()
        expect(result.success).toBe(true)
      }

      // Should handle concurrent reads efficiently
      expect(totalTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(mockSupabase.from).toHaveBeenCalledTimes(20)
    })
  })

  describe('Large Data Handling', () => {
    it('should handle apartments with large amenities arrays', async () => {
      const largeAmenities = Array.from({ length: 100 }, (_, i) => `amenity-${i + 1}`)
      
      const apartmentData = {
        name: 'Large Amenities Apartment',
        address: {
          street: '123 Large St',
          city: 'Large City',
          state: 'LC',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
        amenities: largeAmenities,
      }

      const mockCreatedApartment = createTestApartment(apartmentData)
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockCreatedApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', apartmentData)
      
      const startTime = performance.now()
      const response = await apartmentsPost(request as any)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.amenities).toHaveLength(100)
      expect(responseTime).toBeLessThan(3000) // Should handle large arrays efficiently
    })

    it('should handle apartments with complex access codes', async () => {
      const complexAccessCodes = {
        wifi: { network: 'ComplexNetwork', password: 'VeryComplexPassword123!' },
        door: '123456',
        mailbox: '654321',
        additional: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`code-${i + 1}`, `value-${i + 1}`])
        )
      }
      
      const apartmentData = {
        name: 'Complex Access Codes Apartment',
        address: {
          street: '123 Complex St',
          city: 'Complex City',
          state: 'CC',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
        accessCodes: complexAccessCodes,
      }

      const mockCreatedApartment = createTestApartment(apartmentData)
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockCreatedApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', apartmentData)
      
      const startTime = performance.now()
      const response = await apartmentsPost(request as any)
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(Object.keys(result.data.access_codes.additional)).toHaveLength(20)
      expect(responseTime).toBeLessThan(3000) // Should handle complex objects efficiently
    })
  })

  describe('Database Query Optimization', () => {
    it('should use efficient queries with proper indexing considerations', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      // Test query with multiple filters (should use indexes)
      const request = createMockRequest('GET', undefined, {
        page: '1',
        limit: '10',
        status: 'active',
        search: 'luxury',
      })

      await apartmentsGet(request as any)

      // Verify that queries are built in optimal order for indexing
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id) // Primary filter
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active') // Indexed filter
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%luxury%') // Text search
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false }) // Time-based ordering
    })

    it('should limit result sets appropriately', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      // Test maximum allowed limit
      const request = createMockRequest('GET', undefined, {
        page: '1',
        limit: '100', // Maximum allowed
      })

      await apartmentsGet(request as any)

      // Verify range limiting is applied
      expect(mockQuery.range).toHaveBeenCalledWith(0, 99) // 100 items: 0-99
    })
  })

  describe('Reservation Performance Tests', () => {
    const mockApartment = createTestApartment()
    const mockGuest = createTestGuest()

    describe('Reservation API Response Times', () => {
      it('should handle reservation list requests with complex joins efficiently', async () => {
        const mockReservations = Array.from({ length: 100 }, (_, i) => 
          createTestReservation({ 
            id: `reservation-${String(i + 1).padStart(3, '0')}`,
            apartment_id: mockApartment.id,
            guest_id: mockGuest.id,
            check_in: `2024-12-${String(i % 28 + 1).padStart(2, '0')}`,
            check_out: `2024-12-${String((i % 28) + 3).padStart(2, '0')}`,
          })
        )

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
        }

        mockSupabase.from.mockReturnValue(mockQuery)
        mockQuery.range.mockResolvedValue({
          data: mockReservations,
          error: null,
          count: mockReservations.length,
        })

        const startTime = performance.now()
        
        const request = createMockRequest('GET', undefined, {
          page: '1',
          limit: '50',
          status: 'confirmed',
          platform: 'airbnb',
          search: 'guest',
          startDate: '2024-12-01',
          endDate: '2024-12-31',
          sortBy: 'check_in',
          sortOrder: 'asc',
        })
        
        const response = await reservationsGet(request as any)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(responseTime).toBeLessThan(2000) // Complex join query should complete within 2 seconds

        // Verify complex query is built correctly for performance
        expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('apartment:apartments'))
        expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('guest:guests'))
        expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'confirmed')
        expect(mockQuery.eq).toHaveBeenCalledWith('platform', 'airbnb')
      })

      it('should handle single reservation fetch with all relations efficiently', async () => {
        const enrichedReservation = {
          ...createTestReservation(),
          apartment: mockApartment,
          guest: mockGuest,
          cleanings: [
            {
              id: 'cleaning-1',
              scheduled_date: '2024-12-28T11:00:00Z',
              status: 'scheduled',
              cleaner: {
                id: 'cleaner-1',
                name: 'Test Cleaner',
                phone: '+1234567890',
              },
            },
          ],
        }

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: enrichedReservation, error: null }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const startTime = performance.now()
        const response = await reservationGet(
          createMockRequest('GET') as any,
          { params: { id: 'reservation-test-id' } }
        )
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(result.data).toHaveProperty('apartment')
        expect(result.data).toHaveProperty('guest')
        expect(result.data).toHaveProperty('cleanings')
        expect(result.data).toHaveProperty('stayDuration')
        expect(result.data).toHaveProperty('pricePerNight')
        expect(result.data).toHaveProperty('totalWithFees')
        expect(responseTime).toBeLessThan(1500) // Complex single query should complete within 1.5 seconds
      })

      it('should handle reservation creation with validation efficiently', async () => {
        const reservationData = {
          apartmentId: mockApartment.id,
          guestId: mockGuest.id,
          platform: 'airbnb' as const,
          platformReservationId: 'AIRBNB123',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 450,
          cleaningFee: 50,
          platformFee: 25,
          currency: 'USD',
          notes: 'Performance test reservation',
          contactInfo: {
            phone: '+1234567890',
            email: 'test@example.com',
          },
        }

        // Mock apartment verification
        const apartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockApartment, error: null }),
        }

        // Mock guest verification
        const guestQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockGuest, error: null }),
        }

        // Mock reservation creation
        const insertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: createTestReservation(reservationData),
            error: null,
          }),
        }

        mockSupabase.from
          .mockReturnValueOnce(apartmentQuery) // Apartment verification
          .mockReturnValueOnce(guestQuery)     // Guest verification
          .mockReturnValueOnce(insertQuery)    // Reservation creation

        const startTime = performance.now()
        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(responseTime).toBeLessThan(3000) // Multi-step validation should complete within 3 seconds
        
        // Verify all validation steps were performed
        expect(apartmentQuery.select).toHaveBeenCalled()
        expect(guestQuery.select).toHaveBeenCalled()
        expect(insertQuery.insert).toHaveBeenCalled()
      })
    })

    describe('Reservation Validation Performance', () => {
      it('should validate complex reservation data efficiently', async () => {
        const complexReservationData = {
          apartmentId: mockApartment.id,
          guestId: mockGuest.id,
          platform: 'booking_com' as const,
          platformReservationId: 'BOOKING-COM-VERY-LONG-RESERVATION-ID-123456789',
          checkIn: '2024-12-25T15:00:00Z',
          checkOut: '2024-12-28T11:00:00Z',
          guestCount: 4,
          totalPrice: 1299.99,
          cleaningFee: 150.00,
          platformFee: 129.99,
          currency: 'EUR',
          notes: 'This is a very long note with special characters: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ and emojis 🏠🗝️💰🧹',
          contactInfo: {
            phone: '+49-123-456-7890',
            email: 'guest.with.long.email@very-long-domain-name-for-testing.com',
            additionalInfo: 'Extra long contact information with special requirements',
            emergencyContact: {
              name: 'Emergency Contact Name',
              phone: '+49-987-654-3210',
              relationship: 'Spouse',
            },
          },
        }

        // Mock validations
        const apartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockApartment, capacity: 6 }, // Higher capacity
            error: null 
          }),
        }

        const guestQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockGuest, error: null }),
        }

        const insertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: createTestReservation(complexReservationData),
            error: null,
          }),
        }

        mockSupabase.from
          .mockReturnValueOnce(apartmentQuery)
          .mockReturnValueOnce(guestQuery)
          .mockReturnValueOnce(insertQuery)

        const startTime = performance.now()
        const request = createMockRequest('POST', complexReservationData)
        const response = await reservationsPost(request as any)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(responseTime).toBeLessThan(4000) // Complex validation should complete within 4 seconds
      })

      it('should handle concurrent reservation requests efficiently', async () => {
        const baseReservationData = {
          apartmentId: mockApartment.id,
          platform: 'direct' as const,
          guestCount: 2,
          totalPrice: 300,
          currency: 'USD',
        }

        // Mock apartment verification (will be called multiple times)
        const apartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockApartment, capacity: 8 }, 
            error: null 
          }),
        }

        // Mock reservation creation
        const insertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        // Create concurrent reservation requests with different dates
        const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
          const checkIn = new Date(2024, 11, i + 1) // Different dates
          const checkOut = new Date(2024, 11, i + 3)
          
          const reservationData = {
            ...baseReservationData,
            checkIn: checkIn.toISOString().split('T')[0],
            checkOut: checkOut.toISOString().split('T')[0],
            notes: `Concurrent reservation ${i + 1}`,
          }

          const mockReservation = createTestReservation(reservationData)
          insertQuery.single.mockResolvedValueOnce({
            data: mockReservation,
            error: null,
          })

          // Mock the Supabase calls for each request
          mockSupabase.from
            .mockReturnValueOnce(apartmentQuery) // Apartment verification
            .mockReturnValueOnce(insertQuery)    // Reservation creation

          const request = createMockRequest('POST', reservationData)
          return reservationsPost(request as any)
        })

        const startTime = performance.now()
        const responses = await Promise.all(concurrentRequests)
        const endTime = performance.now()
        
        const totalTime = endTime - startTime

        // All requests should succeed
        for (const response of responses) {
          const result = await response.json()
          expect(result.success).toBe(true)
        }

        // Concurrent handling should be efficient
        expect(totalTime).toBeLessThan(8000) // 10 concurrent requests should complete within 8 seconds
        expect(apartmentQuery.select).toHaveBeenCalledTimes(10)
        expect(insertQuery.insert).toHaveBeenCalledTimes(10)
      })
    })

    describe('Reservation Query Optimization', () => {
      it('should optimize complex filtered queries', async () => {
        const mockReservations = Array.from({ length: 50 }, (_, i) => 
          createTestReservation({ id: `optimized-${i}` })
        )

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
        }

        mockSupabase.from.mockReturnValue(mockQuery)
        mockQuery.range.mockResolvedValue({
          data: mockReservations,
          error: null,
          count: mockReservations.length,
        })

        const startTime = performance.now()
        
        // Complex query with multiple filters
        const request = createMockRequest('GET', undefined, {
          page: '1',
          limit: '25',
          status: 'confirmed',
          platform: 'airbnb',
          apartmentId: mockApartment.id,
          search: 'guest search term',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          sortBy: 'total_price',
          sortOrder: 'desc',
        })
        
        const response = await reservationsGet(request as any)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(responseTime).toBeLessThan(2500) // Complex filtered query should be optimized

        // Verify query is built in optimal order
        expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id) // Primary ownership filter
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'confirmed') // Indexed status filter
        expect(mockQuery.eq).toHaveBeenCalledWith('platform', 'airbnb') // Indexed platform filter
        expect(mockQuery.eq).toHaveBeenCalledWith('apartment_id', mockApartment.id) // Foreign key filter
        expect(mockQuery.gte).toHaveBeenCalledWith('check_in', '2024-01-01') // Date range filters
        expect(mockQuery.lte).toHaveBeenCalledWith('check_out', '2024-12-31')
        expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('guest search term'))
        expect(mockQuery.order).toHaveBeenCalledWith('total_price', { ascending: false })
        expect(mockQuery.range).toHaveBeenCalledWith(0, 24) // Pagination
      })

      it('should handle large reservation updates efficiently', async () => {
        const largeUpdateData = {
          guestCount: 4,
          totalPrice: 800,
          cleaningFee: 100,
          platformFee: 50,
          notes: 'Large update with lots of text: ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100),
          contactInfo: {
            phone: '+1234567890',
            email: 'updated@example.com',
            notes: 'Additional contact notes: ' + 'Detailed information. '.repeat(50),
            preferences: {
              language: 'English',
              communication: 'Email preferred',
              specialRequests: Array.from({ length: 20 }, (_, i) => `Request ${i + 1}`),
            },
          },
        }

        // Mock existing reservation fetch
        const fetchQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: createTestReservation(),
            error: null,
          }),
        }

        // Mock apartment capacity check
        const apartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockApartment, capacity: 6 },
            error: null,
          }),
        }

        // Mock update operation
        const updateQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: createTestReservation(largeUpdateData),
            error: null,
          }),
        }

        mockSupabase.from
          .mockReturnValueOnce(fetchQuery)    // Existing reservation fetch
          .mockReturnValueOnce(apartmentQuery) // Apartment verification
          .mockReturnValueOnce(updateQuery)    // Update operation

        const startTime = performance.now()
        const request = createMockRequest('PUT', largeUpdateData)
        const response = await reservationPut(request as any, { params: { id: 'test-reservation-id' } })
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        const result = await response.json()

        expect(result.success).toBe(true)
        expect(responseTime).toBeLessThan(4000) // Large update should complete within 4 seconds
        expect(updateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            guest_count: 4,
            total_price: 800,
            cleaning_fee: 100,
            platform_fee: 50,
            notes: expect.stringContaining('Large update'),
            contact_info: expect.objectContaining({
              phone: '+1234567890',
              email: 'updated@example.com',
            }),
            updated_at: expect.any(String),
          })
        )
      })
    })

    describe('Memory and Resource Management', () => {
      it('should not leak memory during reservation operations', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
        }

        mockSupabase.from.mockReturnValue(mockQuery)
        mockQuery.range.mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        })

        const initialMemory = process.memoryUsage().heapUsed

        // Perform multiple reservation requests to test for memory leaks
        const requests = []
        for (let i = 0; i < 100; i++) {
          const request = createMockRequest('GET', undefined, { 
            page: '1', 
            limit: '10',
            search: `reservation-search-${i}`,
            status: i % 2 === 0 ? 'confirmed' : 'pending',
            platform: ['airbnb', 'vrbo', 'direct'][i % 3] as any,
          })
          requests.push(reservationsGet(request as any))
        }

        await Promise.all(requests)

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }

        const finalMemory = process.memoryUsage().heapUsed
        const memoryIncrease = finalMemory - initialMemory

        // Memory should not increase significantly
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // Less than 100MB increase for 100 requests
        expect(mockSupabase.from).toHaveBeenCalledTimes(100)
      })

      it('should handle cleanup after failed reservation operations', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const startTime = performance.now()
        
        try {
          const request = createMockRequest('GET')
          await reservationGet(request as any, { params: { id: 'nonexistent-id' } })
        } catch (error) {
          // Expected to fail
        }

        const endTime = performance.now()
        const responseTime = endTime - startTime

        // Even failed operations should complete quickly
        expect(responseTime).toBeLessThan(1000)
        expect(mockQuery.select).toHaveBeenCalled()
      })
    })
  })
})