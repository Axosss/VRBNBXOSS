/**
 * @jest-environment node
 */

import { GET as apartmentsGet, POST as apartmentsPost } from '@/app/api/apartments/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
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
})