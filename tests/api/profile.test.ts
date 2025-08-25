/**
 * @jest-environment node
 */

import { GET as profileGet, PUT as profilePut } from '@/app/api/profile/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createTestUser,
  createTestProfile,
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

describe('Profile API Tests', () => {
  let mockSupabase: any
  const mockUser = createTestUser()
  const mockProfile = createTestProfile({ id: mockUser.id })

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

  describe('GET /api/profile', () => {
    it('should return user profile successfully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await profileGet(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockUser.id)

      expectSuccessResponse(result)
      expect(result.data).toMatchObject({
        id: mockProfile.id,
        fullName: mockProfile.full_name,
        avatarUrl: mockProfile.avatar_url,
        role: mockProfile.role,
        timezone: mockProfile.timezone,
        settings: mockProfile.settings,
        createdAt: mockProfile.created_at,
        updatedAt: mockProfile.updated_at,
      })
    })

    it('should handle profile not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await profileGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Profile not found')
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('GET')
      const response = await profileGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Database connection failed')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('GET')
      const response = await profileGet(request as any)
      const result = await response.json()

      expectErrorResponse(result, 404)
      expect(result.error).toBe('Profile not found')
    })
  })

  describe('PUT /api/profile', () => {
    const validUpdateData = {
      fullName: 'Updated User Name',
      avatarUrl: 'https://example.com/avatar.jpg',
      timezone: 'America/New_York',
      settings: {
        theme: 'dark',
        notifications: true,
      },
    }

    it('should update profile successfully', async () => {
      // Database response with snake_case fields
      const updatedDbProfile = { 
        ...mockProfile, 
        full_name: validUpdateData.fullName,
        avatar_url: validUpdateData.avatarUrl,
        timezone: validUpdateData.timezone,
        settings: validUpdateData.settings,
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(updatedDbProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.update).toHaveBeenCalledWith({
        full_name: validUpdateData.fullName,
        avatar_url: validUpdateData.avatarUrl,
        timezone: validUpdateData.timezone,
        settings: validUpdateData.settings,
        updated_at: expect.any(String),
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockUser.id)

      expectSuccessResponse(result)
      // API response uses camelCase field names
      expect(result.data).toMatchObject({
        id: updatedDbProfile.id,
        fullName: updatedDbProfile.full_name,
        avatarUrl: updatedDbProfile.avatar_url,
        role: updatedDbProfile.role,
        timezone: updatedDbProfile.timezone,
        settings: updatedDbProfile.settings,
        createdAt: updatedDbProfile.created_at,
        updatedAt: updatedDbProfile.updated_at,
      })
      expect(result.message).toBe('Profile updated successfully')
    })

    it('should handle partial updates', async () => {
      const partialUpdate = {
        fullName: 'New Name Only',
      }

      const updatedProfile = { ...mockProfile, full_name: partialUpdate.fullName }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(updatedProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', partialUpdate)
      const response = await profilePut(request as any)
      const result = await response.json()

      expect(mockQuery.update).toHaveBeenCalledWith({
        full_name: partialUpdate.fullName,
        updated_at: expect.any(String),
      })

      expectSuccessResponse(result)
    })

    it('should validate full name minimum length', async () => {
      const invalidData = {
        fullName: 'A', // Too short
      }

      const request = createMockRequest('PUT', invalidData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/full name must be at least 2 characters/i)
    })

    it('should validate avatar URL format', async () => {
      const invalidData = {
        avatarUrl: 'not-a-url', // Invalid URL
      }

      const request = createMockRequest('PUT', invalidData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/invalid avatar url/i)
    })

    it('should handle null avatar URL', async () => {
      const updateData = {
        fullName: 'Test User',
        avatarUrl: null, // Explicitly setting to null
      }

      const updatedProfile = { ...mockProfile, ...updateData }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(updatedProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', updateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expect(mockQuery.update).toHaveBeenCalledWith({
        full_name: updateData.fullName,
        avatar_url: updateData.avatarUrl,
        updated_at: expect.any(String),
      })

      expectSuccessResponse(result)
    })

    it('should handle complex settings object', async () => {
      const complexSettings = {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        preferences: {
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
        },
      }

      const updateData = {
        settings: complexSettings,
      }

      const updatedProfile = { ...mockProfile, settings: complexSettings }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(updatedProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', updateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expect(mockQuery.update).toHaveBeenCalledWith({
        settings: complexSettings,
        updated_at: expect.any(String),
      })

      expectSuccessResponse(result)
    })

    it('should handle unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('PUT', validUpdateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle profile not found during update', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Row not found')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Row not found')
    })

    it('should handle database update errors', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Constraint violation')),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', validUpdateData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Constraint violation')
    })

    it('should handle empty update data', async () => {
      const emptyData = {}

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', emptyData)
      const response = await profilePut(request as any)
      const result = await response.json()

      expect(mockQuery.update).toHaveBeenCalledWith({
        updated_at: expect.any(String),
      })

      expectSuccessResponse(result)
    })

    it('should update timestamp on every update', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockProfile)),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = createMockRequest('PUT', { fullName: 'Test' })
      await profilePut(request as any)

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall).toHaveProperty('updated_at')
      expect(typeof updateCall.updated_at).toBe('string')
      expect(() => new Date(updateCall.updated_at)).not.toThrow()
    })
  })
})