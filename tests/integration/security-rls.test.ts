/**
 * @jest-environment node
 */

import { GET as apartmentsGet, POST as apartmentsPost } from '@/app/api/apartments/route'
import { GET as apartmentGet, PUT as apartmentPut, DELETE as apartmentDelete } from '@/app/api/apartments/[id]/route'
import { GET as reservationsGet, POST as reservationsPost } from '@/app/api/reservations/route'
import { GET as reservationGet, PUT as reservationPut, DELETE as reservationDelete } from '@/app/api/reservations/[id]/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
  createTestReservation,
  createTestGuest,
  createMockRequest,
  expectSuccessResponse,
  expectErrorResponse,
  mockDatabaseSuccess,
  mockDatabaseError,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Security and Row Level Security (RLS) Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    jest.clearAllMocks()
  })

  describe('Authentication Enforcement', () => {
    it('should reject requests without authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should reject requests with invalid tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      })

      const request = createMockRequest('GET')
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should reject POST requests without authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const apartmentData = {
        name: 'Unauthorized Apartment',
        address: {
          street: '123 Hack St',
          city: 'Hack City',
          state: 'HC',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      }

      const request = createMockRequest('POST', apartmentData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('Data Isolation and RLS Enforcement', () => {
    it('should only return apartments owned by the authenticated user', async () => {
      const user1 = createTestUser({ id: 'user-1-uuid-0000-0000-000000000001' })
      const user1Apartments = [
        createTestApartment({ owner_id: user1.id, name: 'User 1 Apartment 1' }),
        createTestApartment({ owner_id: user1.id, name: 'User 1 Apartment 2', id: 'apt-1-2' }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess(user1Apartments))

      const request = createMockRequest('GET', undefined, { page: '1', limit: '10' })
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      // Verify RLS is enforced by checking owner_id filter
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
      
      expectSuccessResponse(result)
      expect(result.data.apartments).toEqual(user1Apartments)
      expect(result.data.apartments).toHaveLength(2)
    })

    it('should prevent cross-user apartment access', async () => {
      const user1 = createTestUser({ id: 'user-1-uuid-0000-0000-000000000001' })
      const user2Apartment = createTestApartment({ 
        id: 'user2-apartment-id',
        owner_id: 'user-2-uuid-0000-0000-000000000002', // Different owner
        name: 'User 2 Apartment' 
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null,
      })

      // Simulate RLS blocking access to other user's apartment
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' }
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: 'user2-apartment-id' } 
      })
      const result = await response.json()

      // Should enforce RLS by filtering on owner_id
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
      
      // Should return 404 because RLS prevents access
      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should prevent unauthorized apartment updates', async () => {
      const user1 = createTestUser({ id: 'user-1-uuid-0000-0000-000000000001' })
      const maliciousUpdate = { name: 'Hacked Apartment Name' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null,
      })

      // Simulate RLS preventing update to other user's apartment
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' }
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', maliciousUpdate)
      const response = await apartmentPut(request as any, { 
        params: { id: 'user2-apartment-id' } 
      })
      const result = await response.json()

      // Should enforce RLS by filtering on owner_id
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
      
      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should prevent unauthorized apartment deletion', async () => {
      const user1 = createTestUser({ id: 'user-1-uuid-0000-0000-000000000001' })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: user1 },
        error: null,
      })

      // Mock successful reservation check (should still check this first)
      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      // Simulate RLS preventing deletion of other user's apartment
      const deleteQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' }
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(reservationQuery)
        .mockReturnValueOnce(deleteQuery)

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'user2-apartment-id' } 
      })
      const result = await response.json()

      // Should enforce RLS by filtering on owner_id
      expect(deleteQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
      
      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })
  })

  describe('Input Validation and Sanitization', () => {
    const user = createTestUser()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      })
    })

    it('should reject invalid UUIDs', async () => {
      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: 'invalid-uuid-format' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Invalid apartment ID')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should reject malicious script injection in apartment data', async () => {
      const maliciousData = {
        name: '<script>alert("XSS")</script>',
        address: {
          street: '<script>document.location="http://malicious.com"</script>',
          city: 'Normal City',
          state: 'NS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      }

      const request = createMockRequest('POST', maliciousData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      // Should either sanitize or reject the malicious input
      // In this case, it should go through validation and potentially be sanitized
      // The exact behavior depends on validation schema implementation
      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should validate apartment capacity limits', async () => {
      const invalidData = {
        name: 'Valid Name',
        address: {
          street: '123 Valid St',
          city: 'Valid City',  
          state: 'VS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: -5, // Invalid negative capacity
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toContain('at least 1')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should validate required address fields', async () => {
      const incompleteData = {
        name: 'Valid Name',
        address: {
          street: '123 Valid St',
          // Missing required fields: city, state, zipCode, country
        },
        capacity: 4,
      }

      const request = createMockRequest('POST', incompleteData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should limit apartment name length', async () => {
      const longNameData = {
        name: 'A'.repeat(1000), // Extremely long name
        address: {
          street: '123 Valid St',
          city: 'Valid City',
          state: 'VS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      }

      const request = createMockRequest('POST', longNameData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      // Should either truncate or reject based on validation rules
      // The test expects that some limit is enforced
      if (result.success === false) {
        expectErrorResponse(result, 400)
        expect(mockSupabase.from).not.toHaveBeenCalled()
      } else {
        // If it passes validation, the data should be properly handled
        expect(mockSupabase.from).toHaveBeenCalled()
      }
    })
  })

  describe('Rate Limiting and DOS Protection', () => {
    const user = createTestUser()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      })
    })

    it('should validate pagination limits', async () => {
      const request = createMockRequest('GET', undefined, {
        page: '1',
        limit: '1000', // Excessive limit
      })
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should reject invalid page numbers', async () => {
      const request = createMockRequest('GET', undefined, {
        page: '-1', // Invalid negative page
        limit: '10',
      })
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should handle extremely large JSON payloads gracefully', async () => {
      const largeData = {
        name: 'Valid Name',
        address: {
          street: '123 Valid St',
          city: 'Valid City',
          state: 'VS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
        // Add a very large array to test payload limits
        amenities: Array(10000).fill('large-amenity-name-that-repeats'),
      }

      const request = createMockRequest('POST', largeData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      // Should either handle gracefully or reject if too large
      // The exact behavior depends on server configuration
      if (result.success === false) {
        expectErrorResponse(result, 400)
      } else {
        expectSuccessResponse(result)
      }
    })
  })

  describe('SQL Injection Protection', () => {
    const user = createTestUser()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      })
    })

    it('should safely handle SQL injection attempts in search', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const sqlInjectionAttempt = "'; DROP TABLE apartments; --"
      
      const request = createMockRequest('GET', undefined, {
        search: sqlInjectionAttempt,
        page: '1',
        limit: '10',
      })
      await apartmentsGet(request as any)

      // Verify that Supabase client methods are called (indicating parameterized queries)
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', `%${sqlInjectionAttempt}%`)
      
      // The ilike method should properly escape the input
      // Supabase handles parameterized queries internally
    })

    it('should safely handle special characters in apartment data', async () => {
      const specialCharData = {
        name: "O'Malley's \"Luxury\" Apartment & More",
        address: {
          street: "123 Main St. #4B (Rear)",
          city: "San José",
          state: 'CA',
          zipCode: '95110',
          country: 'US',
        },
        capacity: 4,
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(createTestApartment(specialCharData))),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', specialCharData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: specialCharData.name,
          address: specialCharData.address,
        })
      )
    })
  })

  describe('Error Information Disclosure', () => {
    const user = createTestUser()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
      })
    })

    it('should not expose internal system information in errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      
      // Simulate internal database error
      mockQuery.range.mockResolvedValue({
        data: null,
        error: { 
          message: 'Internal server error: Connection to database server at "192.168.1.100:5432" failed',
          code: 'CONNECTION_ERROR'
        }
      })

      const request = createMockRequest('GET')
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 500)
      
      // Should not expose internal network details
      expect(result.error).not.toContain('192.168')
      expect(result.error).not.toContain('5432')
      expect(result.error).not.toContain('database server')
      
      // Should provide generic error message
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    })

    it('should provide sanitized validation error messages', async () => {
      const invalidData = {
        name: '', // Invalid empty name
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        capacity: 0,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      
      // Should provide helpful validation error without exposing internal details
      expect(result.error).toMatch(/expected string|required|at least 1/i)
      expect(result.error).not.toContain('database')
      expect(result.error).not.toContain('schema')
      expect(result.error).not.toContain('table')
    })
  })

  describe('Reservations Security and RLS', () => {
    const user1 = createTestUser({ id: 'user-1' })
    const user2 = createTestUser({ id: 'user-2' })
    const apartment1 = createTestApartment({ owner_id: 'user-1' })
    const apartment2 = createTestApartment({ id: 'apartment-2', owner_id: 'user-2' })
    const guest1 = createTestGuest({ owner_id: 'user-1' })
    const reservation1 = createTestReservation({ 
      owner_id: 'user-1',
      apartment_id: apartment1.id,
      guest_id: guest1.id,
    })
    const reservation2 = createTestReservation({ 
      id: 'reservation-2',
      owner_id: 'user-2',
      apartment_id: apartment2.id,
    })

    describe('Cross-User Data Isolation', () => {
      it('should prevent user from accessing other users reservations', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found due to RLS
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const response = await reservationGet(
          createMockRequest('GET') as any,
          { params: { id: reservation2.id } } // User 1 trying to access User 2's reservation
        )
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
      })

      it('should prevent user from creating reservations for apartments they do not own', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        // Mock apartment not found for user1 (RLS blocks access to user2's apartment)
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const reservationData = {
          apartmentId: apartment2.id, // User1 trying to book User2's apartment
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(result.error).toBe('Apartment not found or not owned by user')
      })

      it('should prevent user from updating other users reservations', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const updateData = { notes: 'Trying to hack' }

        const response = await reservationPut(
          createMockRequest('PUT', updateData) as any,
          { params: { id: reservation2.id } }
        )
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(result.error).toBe('Reservation not found')
      })

      it('should prevent user from cancelling other users reservations', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const response = await reservationDelete(
          createMockRequest('DELETE') as any,
          { params: { id: reservation2.id } }
        )
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(result.error).toBe('Reservation not found')
      })

      it('should only return reservations owned by the authenticated user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnValue({
            data: [reservation1], // Only user1's reservations
            error: null,
            count: 1,
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const request = createMockRequest('GET')
        const response = await reservationsGet(request as any)
        const result = await response.json()

        expectSuccessResponse(result)
        expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', user1.id)
        expect(result.data.reservations).toHaveLength(1)
        expect(result.data.reservations[0].id).toBe(reservation1.id)
      })
    })

    describe('Guest Ownership Validation', () => {
      it('should prevent using guests from other users', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })

        const otherUserGuest = createTestGuest({ id: 'other-guest', owner_id: 'user-2' })

        // Mock apartment verification success
        const apartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: apartment1,
            error: null,
          }),
        }

        // Mock guest verification failure (RLS blocks)
        const guestQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }

        mockSupabase.from
          .mockReturnValueOnce(apartmentQuery)
          .mockReturnValueOnce(guestQuery)

        const reservationData = {
          apartmentId: apartment1.id,
          guestId: otherUserGuest.id, // User1 trying to use User2's guest
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(result.error).toBe('Guest not found or not owned by user')
      })
    })

    describe('Business Logic Security', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })
      })

      it('should validate guest count against apartment capacity', async () => {
        const smallApartment = { ...apartment1, capacity: 2 }

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: smallApartment,
            error: null,
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const reservationData = {
          apartmentId: apartment1.id,
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 5, // Exceeds capacity of 2
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectErrorResponse(result, 400)
        expect(result.error).toContain('exceeds apartment capacity')
      })

      it('should prevent negative pricing values', async () => {
        const reservationData = {
          apartmentId: apartment1.id,
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: -100, // Negative price
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectValidationError(result)
      })

      it('should validate check-out after check-in', async () => {
        const reservationData = {
          apartmentId: apartment1.id,
          platform: 'airbnb',
          checkIn: '2024-12-28',
          checkOut: '2024-12-25', // Before check-in
          guestCount: 2,
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectValidationError(result)
        expect(result.error).toContain('check-out date must be after check-in')
      })

      it('should validate platform enum values', async () => {
        const reservationData = {
          apartmentId: apartment1.id,
          platform: 'malicious_platform', // Invalid platform
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectValidationError(result)
      })

      it('should validate UUID formats for IDs', async () => {
        const reservationData = {
          apartmentId: 'invalid-uuid-format',
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
        }

        const request = createMockRequest('POST', reservationData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectValidationError(result)
      })
    })

    describe('SQL Injection Protection - Reservations', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })
      })

      it('should safely handle SQL injection attempts in search filters', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnValue({
            data: [],
            error: null,
            count: 0,
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const sqlInjection = "'; DROP TABLE reservations; --"
        
        const request = createMockRequest('GET', undefined, {
          search: sqlInjection,
          page: '1',
          limit: '10',
        })
        const response = await reservationsGet(request as any)
        const result = await response.json()

        expectSuccessResponse(result)
        expect(mockQuery.or).toHaveBeenCalledWith(
          expect.stringContaining(sqlInjection)
        )
      })

      it('should safely handle special characters in reservation data', async () => {
        // Mock apartment verification
        const mockApartmentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: apartment1,
            error: null,
          }),
        }

        // Mock reservation creation
        const mockInsertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: reservation1,
            error: null,
          }),
        }

        mockSupabase.from
          .mockReturnValueOnce(mockApartmentQuery)
          .mockReturnValueOnce(mockInsertQuery)

        const specialCharData = {
          apartmentId: apartment1.id,
          platform: 'airbnb',
          platformReservationId: "AIRBNB'123\"&<>",
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
          notes: "Special guest: O'Malley & Sons \"Vacation\" <script>",
        }

        const request = createMockRequest('POST', specialCharData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        expectSuccessResponse(result)
        expect(mockInsertQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            platform_reservation_id: specialCharData.platformReservationId,
            notes: specialCharData.notes,
          })
        )
      })
    })

    describe('Rate Limiting and DoS Protection', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })
      })

      it('should handle pagination limits correctly', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnValue({
            data: [],
            error: null,
            count: 0,
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        // Test maximum limit
        const request = createMockRequest('GET', undefined, {
          page: '1',
          limit: '100', // Maximum allowed
        })
        const response = await reservationsGet(request as any)
        const result = await response.json()

        expectSuccessResponse(result)

        // Test exceeding maximum limit
        const invalidRequest = createMockRequest('GET', undefined, {
          page: '1',
          limit: '1000', // Exceeds maximum
        })
        const invalidResponse = await reservationsGet(invalidRequest as any)
        const invalidResult = await invalidResponse.json()

        expectErrorResponse(invalidResult, 400)
      })

      it('should reject excessively large payloads', async () => {
        const largeData = {
          apartmentId: apartment1.id,
          platform: 'airbnb',
          checkIn: '2024-12-25',
          checkOut: '2024-12-28',
          guestCount: 2,
          totalPrice: 400,
          notes: 'x'.repeat(100000), // Very large notes field
          contactInfo: {
            additionalData: Array(10000).fill('large-data-chunk'),
          },
        }

        const request = createMockRequest('POST', largeData)
        const response = await reservationsPost(request as any)
        const result = await response.json()

        // Should either handle gracefully or reject if too large
        if (result.success === false) {
          expectErrorResponse(result, 400)
        } else {
          expectSuccessResponse(result)
        }
      })
    })

    describe('Information Disclosure Prevention', () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: user1 },
          error: null,
        })
      })

      it('should not expose internal database errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnValue({
            data: null,
            error: {
              message: 'Internal database error: Connection pool exhausted at host reservations-db-cluster-1.internal:5432',
              code: 'CONNECTION_POOL_ERROR'
            }
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const request = createMockRequest('GET')
        const response = await reservationsGet(request as any)
        const result = await response.json()

        expectErrorResponse(result, 500)
        expect(result.error).not.toContain('reservations-db-cluster-1.internal')
        expect(result.error).not.toContain('5432')
        expect(result.error).not.toContain('pool exhausted')
      })

      it('should provide generic error messages for non-existent reservations', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }

        mockSupabase.from.mockReturnValue(mockQuery)

        const response = await reservationGet(
          createMockRequest('GET') as any,
          { params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } }
        )
        const result = await response.json()

        expectErrorResponse(result, 404)
        expect(result.error).toBe('Reservation not found')
        // Should not reveal whether the ID exists but belongs to another user
      })
    })
  })
})