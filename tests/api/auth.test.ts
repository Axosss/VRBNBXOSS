/**
 * @jest-environment node
 */

import { POST as signupPost } from '@/app/api/auth/signup/route'
import { POST as signinPost } from '@/app/api/auth/signin/route'
import { POST as signoutPost } from '@/app/api/auth/signout/route'
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

describe('Authentication API Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    jest.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    }

    it('should successfully create a new user account', async () => {
      const mockUser = createTestUser({ email: validSignupData.email })
      const mockSession = { access_token: 'test-token' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const request = createMockRequest('POST', validSignupData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignupData.email,
        password: validSignupData.password,
        options: {
          data: {
            full_name: validSignupData.fullName,
          },
        },
      })

      expectSuccessResponse(result)
      expect(result.data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.user_metadata.full_name,
      })
      expect(result.data.session).toBe(mockSession)
      expect(result.message).toBe('User created successfully. Please check your email to verify your account.')
      expect(response.status).toBe(201)
    })

    it('should handle Supabase auth errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      })

      const request = createMockRequest('POST', validSignupData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Email already registered')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        // Missing fullName
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(response.status).toBe(400)
    })

    it('should validate email format', async () => {
      const invalidData = {
        ...validSignupData,
        email: 'not-an-email',
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/invalid email/i)
    })

    it('should validate password minimum length', async () => {
      const invalidData = {
        ...validSignupData,
        password: '1234567', // 7 characters, minimum is 8
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/password must be at least 8 characters/i)
    })

    it('should validate full name minimum length', async () => {
      const invalidData = {
        ...validSignupData,
        fullName: 'A', // Too short
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/full name must be at least 2 characters/i)
    })

    it('should handle missing request body', async () => {
      const request = createMockRequest('POST')
      const response = await signupPost(request as any)
      const result = await response.json()

      expectErrorResponse(result)
      expect(response.status).toBe(500) // JSON parsing error
    })

    it('should handle when user creation fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const request = createMockRequest('POST', validSignupData)
      const response = await signupPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 500)
      expect(result.error).toBe('Failed to create user')
    })
  })

  describe('POST /api/auth/signin', () => {
    const validSigninData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should successfully sign in a user', async () => {
      const mockUser = createTestUser({ email: validSigninData.email })
      const mockProfile = createTestProfile({ id: mockUser.id })
      const mockSession = { access_token: 'test-token' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseSuccess(mockProfile)),
      })

      const request = createMockRequest('POST', validSigninData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validSigninData.email,
        password: validSigninData.password,
      })

      expectSuccessResponse(result)
      expect(result.data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockProfile.full_name,
        role: mockProfile.role,
        timezone: mockProfile.timezone,
      })
      expect(result.message).toBe('Signed in successfully')
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const request = createMockRequest('POST', validSigninData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Invalid login credentials')
    })

    it('should handle sign in with no user returned', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      const request = createMockRequest('POST', validSigninData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 401)
      expect(result.error).toBe('Invalid credentials')
    })

    it('should handle missing profile gracefully', async () => {
      const mockUser = createTestUser({ email: validSigninData.email })
      const mockSession = { access_token: 'test-token' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockDatabaseError('Profile not found')),
      })

      const request = createMockRequest('POST', validSigninData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expectSuccessResponse(result)
      expect(result.data.user.fullName).toBe(mockUser.user_metadata.full_name)
      expect(result.data.user.role).toBe('owner') // Default role
    })

    it('should validate email format', async () => {
      const invalidData = {
        ...validSigninData,
        email: 'invalid-email',
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/invalid email/i)
    })

    it('should require password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '', // Empty password
      }

      const request = createMockRequest('POST', invalidData)
      const response = await signinPost(request as any)
      const result = await response.json()

      expectValidationError(result)
      expect(result.error).toMatch(/password is required/i)
    })
  })

  describe('POST /api/auth/signout', () => {
    it('should successfully sign out a user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const request = createMockRequest('POST')
      const response = await signoutPost(request as any)
      const result = await response.json()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expectSuccessResponse(result)
      expect(result.message).toBe('Signed out successfully')
    })

    it('should handle signout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Failed to sign out' },
      })

      const request = createMockRequest('POST')
      const response = await signoutPost(request as any)
      const result = await response.json()

      expectErrorResponse(result, 400)
      expect(result.error).toBe('Failed to sign out')
    })
  })
})