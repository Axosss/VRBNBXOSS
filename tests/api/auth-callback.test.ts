/**
 * @jest-environment node
 */

import { GET as authCallbackGet } from '@/app/api/auth/callback/route'
import { createClient } from '@/lib/supabase/server'
import {
  createMockSupabaseClient,
  createMockRequest,
} from '../utils/test-helpers'

// Mock the Supabase client
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Auth Callback API Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase)
    
    // Mock process.env
    process.env.NODE_ENV = 'test'
    
    jest.clearAllMocks()
  })

  describe('GET /api/auth/callback', () => {
    it('should handle successful auth code exchange in development', async () => {
      process.env.NODE_ENV = 'development'
      
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      })

      const url = 'http://localhost:3000/api/auth/callback?code=auth-code&next=/dashboard'
      const request = {
        url,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code')
      expect(response.status).toBe(307) // Temporary redirect
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('should handle successful auth code exchange in production with forwarded host', async () => {
      process.env.NODE_ENV = 'production'
      
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      })

      const url = 'http://localhost:3000/api/auth/callback?code=auth-code&next=/dashboard'
      const request = {
        url,
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-host') return 'myapp.com'
            return null
          }),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code')
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://myapp.com/dashboard')
    })

    it('should use default next path when not provided', async () => {
      process.env.NODE_ENV = 'development'
      
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      })

      const url = 'http://localhost:3000/api/auth/callback?code=auth-code'
      const request = {
        url,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('should handle missing auth code', async () => {
      const url = 'http://localhost:3000/api/auth/callback'
      const request = {
        url,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/auth-code-error')
    })

    it('should handle auth code exchange error', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid code' },
      })

      const url = 'http://localhost:3000/api/auth/callback?code=invalid-code'
      const request = {
        url,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/auth-code-error')
    })

    it('should handle exceptions gracefully', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockRejectedValue(new Error('Network error'))

      const url = 'http://localhost:3000/api/auth/callback?code=auth-code'
      const request = {
        url,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const response = await authCallbackGet(request as any)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/auth-code-error')
    })
  })
})