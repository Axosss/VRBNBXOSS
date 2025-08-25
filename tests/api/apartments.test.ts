/**
 * @jest-environment node
 */

import { GET as apartmentsGet, POST as apartmentsPost } from '@/app/api/apartments/route'
import { GET as apartmentGet, PUT as apartmentPut, DELETE as apartmentDelete } from '@/app/api/apartments/[id]/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestApartment,
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

describe('Apartments API Tests', () => {
  let mockSupabase: any
  const mockUser = createTestUser()

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

  describe('GET /api/apartments', () => {
    it('should return paginated list of user apartments', async () => {
      const mockApartments = [
        createTestApartment({ name: 'Apartment 1' }),
        createTestApartment({ name: 'Apartment 2', id: 'apt-2' }),
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue({
        data: mockApartments,
        error: null,
        count: 2,
      })

      const request = createMockRequest('GET', undefined, { page: '1', limit: '10' })
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('apartments')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })

      expectSuccessResponse(result)
      expect(result.data.apartments).toHaveLength(2)
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
        status: 'active',
        page: '1',
        limit: '10' 
      })
      await apartmentsGet(request as any)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should apply search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseSuccess([]))

      const request = createMockRequest('GET', undefined, { 
        search: 'downtown',
        page: '1',
        limit: '10' 
      })
      await apartmentsGet(request as any)

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%downtown%')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue(mockDatabaseError('Database connection failed'))

      const request = createMockRequest('GET')
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toBe('Database connection failed')
    })

    it('should validate pagination parameters', async () => {
      const request = createMockRequest('GET', undefined, { 
        page: '0', // Invalid page
        limit: '150' // Exceeds maximum
      })
      const response = await apartmentsGet(request as any)
      const result = await response.json()

      expectValidationError(result)
    })
  })

  describe('POST /api/apartments', () => {
    const validApartmentData = {
      name: 'Test Apartment',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
      },
      capacity: 4,
      bedrooms: 2,
      bathrooms: 1.5,
      amenities: ['wifi', 'kitchen'],
      accessCodes: {
        wifi: { network: 'TestNet', password: 'testpass' },
        door: '1234',
      },
    }

    it('should successfully create a new apartment', async () => {
      const mockApartment = createTestApartment(validApartmentData)

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', validApartmentData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('apartments')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        owner_id: mockUser.id,
        name: validApartmentData.name,
        address: validApartmentData.address,
        capacity: validApartmentData.capacity,
        bedrooms: validApartmentData.bedrooms,
        bathrooms: validApartmentData.bathrooms,
        amenities: validApartmentData.amenities,
        access_codes: validApartmentData.accessCodes,
        photos: [],
        status: 'active',
      })

      expectSuccessResponse(result)
      expect(result.message).toBe('Apartment created successfully')
      expect(response.status).toBe(201)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing name
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        capacity: 4,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      // Zod v4 returns "Invalid input: expected string, received undefined" for missing required string fields
      expect(result.error).toContain('expected string')
    })

    it('should validate address fields', async () => {
      const invalidData = {
        ...validApartmentData,
        address: {
          street: '123 Test St',
          // Missing required fields
        },
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
    })

    it('should validate capacity is positive', async () => {
      const invalidData = {
        ...validApartmentData,
        capacity: 0, // Invalid capacity
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      // Zod v4 returns different error format
      expect(result.error).toContain('at least 1')
    })

    it('should handle negative bedrooms/bathrooms', async () => {
      const invalidData = {
        ...validApartmentData,
        bedrooms: -1,
        bathrooms: -0.5,
      }

      const request = createMockRequest('POST', invalidData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectValidationError(result)
    })

    it('should handle database insertion errors', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Unique constraint violation')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('POST', validApartmentData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Unique constraint violation')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('POST', validApartmentData)
      const response = await apartmentsPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/apartments/[id]', () => {
    it('should return specific apartment by ID', async () => {
      const mockApartment = createTestApartment()

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: mockApartment.id } 
      })
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('apartments')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockApartment.id)
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)

      expectSuccessResponse(result)
      expect(result.data).toMatchObject(mockApartment)
    })

    it('should handle apartment not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toBe('Invalid apartment ID')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await apartmentGet(request as any, { 
        params: { id: 'valid-uuid-1234-5678-9abc-def012345678' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/apartments/[id]', () => {
    const validUpdateData = {
      name: 'Updated Apartment',
      capacity: 6,
      amenities: ['wifi', 'kitchen', 'parking'],
    }

    it('should successfully update apartment', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const mockApartment = createTestApartment({ ...validUpdateData, id: apartmentId })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await apartmentPut(request as any, { 
        params: { id: apartmentId } 
      })
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('apartments')
      expect(mockQuery.update).toHaveBeenCalledWith({
        name: validUpdateData.name,
        capacity: validUpdateData.capacity,
        amenities: validUpdateData.amenities,
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', apartmentId)
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)

      expectSuccessResponse(result)
      expect(result.message).toBe('Apartment updated successfully')
      expect(result.data).toMatchObject(mockApartment)
    })

    it('should handle partial updates', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const partialUpdate = { name: 'Just New Name' }
      const mockApartment = createTestApartment({ ...partialUpdate, id: apartmentId })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', partialUpdate)
      const response = await apartmentPut(request as any, { 
        params: { id: apartmentId } 
      })
      const result = await response.json()

      expect(mockQuery.update).toHaveBeenCalledWith({ name: partialUpdate.name })
      expectSuccessResponse(result)
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('PUT', validUpdateData)
      const response = await apartmentPut(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toBe('Invalid apartment ID')
    })

    it('should validate update data', async () => {
      const invalidData = {
        capacity: -1, // Invalid capacity
      }

      const request = createMockRequest('PUT', invalidData)
      const response = await apartmentPut(request as any, { 
        params: { id: 'valid-uuid-1234-5678-9abc-def012345678' } 
      })
      const result = await response.json()

      expectValidationError(result)
    })

    it('should handle apartment not found', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await apartmentPut(request as any, { 
        params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('PUT', validUpdateData)
      const response = await apartmentPut(request as any, { 
        params: { id: 'valid-uuid-1234-5678-9abc-def012345678' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle database update errors', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database constraint violation')
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await apartmentPut(request as any, { 
        params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Database constraint violation')
    })
  })

  describe('DELETE /api/apartments/[id]', () => {
    it('should successfully soft delete apartment', async () => {
      const mockApartment = createTestApartment({ status: 'inactive' })

      // Mock reservation check
      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])), // No active reservations
      }

      // Mock apartment update
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockApartment)),
      }

      mockSupabase.from
        .mockReturnValueOnce(reservationQuery) // First call for reservations check
        .mockReturnValueOnce(updateQuery) // Second call for apartment update

      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: apartmentId } 
      })
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('reservations')
      expect(reservationQuery.select).toHaveBeenCalledWith('id')
      expect(reservationQuery.eq).toHaveBeenCalledWith('apartment_id', apartmentId)
      expect(reservationQuery.in).toHaveBeenCalledWith('status', ['confirmed', 'checked_in'])

      expect(mockSupabase.from).toHaveBeenCalledWith('apartments')
      expect(updateQuery.update).toHaveBeenCalledWith({ status: 'inactive' })
      expect(updateQuery.eq).toHaveBeenCalledWith('id', apartmentId)
      expect(updateQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id)

      expectSuccessResponse(result)
      expect(result.message).toBe('Apartment deleted successfully')
      expect(result.data.status).toBe('inactive')
    })

    it('should prevent deletion when active reservations exist', async () => {
      const apartmentId = 'a1b2c3d4-e5f6-4789-8abc-123456789012'
      const mockActiveReservation = createTestReservation({ status: 'confirmed' })

      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([mockActiveReservation])),
      }

      mockSupabase.from.mockReturnValue(reservationQuery)

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: apartmentId } 
      })
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Cannot delete apartment with active reservations')
    })

    it('should validate UUID format', async () => {
      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'invalid-uuid' } 
      })
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toBe('Invalid apartment ID')
    })

    it('should handle apartment not found', async () => {
      // Mock empty reservations check
      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      // Mock apartment not found
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      const mockError = new Error('Row not found')
      mockError.code = 'PGRST116'
      updateQuery.single.mockResolvedValue({ error: mockError, data: null })

      mockSupabase.from
        .mockReturnValueOnce(reservationQuery)
        .mockReturnValueOnce(updateQuery)

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'a1b2c3d4-e5f6-4789-8abc-123456789012' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Apartment not found')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'valid-uuid-1234-5678-9abc-def012345678' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle reservation check database errors', async () => {
      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseError('Database connection failed')),
      }

      mockSupabase.from.mockReturnValue(reservationQuery)

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'test-apartment-id' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toBe('Error checking reservations')
    })

    it('should handle apartment update database errors', async () => {
      // Mock successful reservation check
      const reservationQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDatabaseSuccess([])),
      }

      // Mock apartment update failure
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Database connection failed')),
      }

      mockSupabase.from
        .mockReturnValueOnce(reservationQuery)
        .mockReturnValueOnce(updateQuery)

      const request = createMockRequest('DELETE')
      const response = await apartmentDelete(request as any, { 
        params: { id: 'test-apartment-id' } 
      })
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toBe('Database connection failed')
    })
  })
})