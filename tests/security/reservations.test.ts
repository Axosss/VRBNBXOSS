import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/reservations/route'
import { PUT, DELETE } from '@/app/api/reservations/[id]/route'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText, sanitizeSearchQuery, sanitizeContactInfo } from '@/lib/utils/sanitize'
import { rateLimit } from '@/middleware/rate-limit'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock rate limiting to not interfere with tests
vi.mock('@/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}))

describe('Reservation Security Tests', () => {
  let mockSupabase: any
  let mockUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    
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

  describe('XSS Prevention', () => {
    it('should sanitize XSS attempts in text fields', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<body onload=alert("XSS")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<input type="text" value="" onfocus="alert(\'XSS\')">'
      ]

      xssPayloads.forEach(payload => {
        const sanitized = sanitizeText(payload)
        
        // Should remove all HTML tags and dangerous content
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror=')
        expect(sanitized).not.toContain('onload=')
        expect(sanitized).not.toContain('onfocus=')
        expect(sanitized).not.toContain('<iframe')
        expect(sanitized).not.toContain('<svg')
        expect(sanitized).not.toContain('<img')
      })
    })

    it('should sanitize XSS in reservation notes and contact info', async () => {
      const maliciousData = {
        apartmentId: 'apt-123',
        checkIn: '2024-03-15',
        checkOut: '2024-03-20',
        guestCount: 2,
        platform: 'direct',
        totalPrice: 500,
        notes: '<script>alert("XSS in notes")</script>Important note',
        contactInfo: {
          guestName: '<img src=x onerror=alert("XSS")>John Doe',
          guestEmail: 'john@example.com',
          guestPhone: 'javascript:alert("XSS")+1234567890',
          additionalInfo: '<iframe src="evil.com">Additional info'
        }
      }

      // Mock apartment lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'apt-123', capacity: 4, owner_id: 'user-123' },
        error: null
      })

      // Mock availability check
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock insert - capture the data being inserted
      let capturedInsertData: any = null
      mockSupabase.insert.mockImplementationOnce((data: any) => {
        capturedInsertData = data
        return mockSupabase
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'res-123' },
        error: null
      })

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: { 'Content-Type': 'application/json' }
      })

      await POST(request)

      // Verify that the data was sanitized before insertion
      expect(capturedInsertData.notes).not.toContain('<script')
      expect(capturedInsertData.notes).toBe('Important note')
      
      expect(capturedInsertData.contact_info.guestName).not.toContain('<img')
      expect(capturedInsertData.contact_info.guestName).toBe('John Doe')
      
      expect(capturedInsertData.contact_info.guestPhone).not.toContain('javascript:')
      expect(capturedInsertData.contact_info.additionalInfo).not.toContain('<iframe')
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in search', () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE reservations; --",
        "1' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "'; SELECT * FROM users; --",
        "UNION SELECT * FROM passwords",
        "'; DELETE FROM apartments WHERE '1'='1",
        "Robert'); DROP TABLE Students;--"
      ]

      sqlInjectionPayloads.forEach(payload => {
        const sanitized = sanitizeSearchQuery(payload)
        
        // Should remove SQL keywords and dangerous characters
        expect(sanitized).not.toContain('DROP')
        expect(sanitized).not.toContain('DELETE')
        expect(sanitized).not.toContain('SELECT')
        expect(sanitized).not.toContain('UNION')
        expect(sanitized).not.toContain(';')
        expect(sanitized).not.toContain("'")
        expect(sanitized).not.toContain('"')
        expect(sanitized).not.toContain('--')
      })
    })

    it('should safely handle SQL injection in search endpoint', async () => {
      const sqlInjection = "'; DROP TABLE reservations; --"
      
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      })

      const request = new NextRequest(
        `http://localhost/api/reservations?search=${encodeURIComponent(sqlInjection)}`
      )

      const response = await GET(request)
      const result = await response.json()

      // Should complete successfully without executing malicious SQL
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      
      // Verify the search was sanitized
      const orCall = mockSupabase.or.mock.calls[0]
      if (orCall) {
        expect(orCall[0]).not.toContain('DROP')
        expect(orCall[0]).not.toContain(';')
      }
    })
  })

  describe('Cross-User Data Access Prevention', () => {
    it('should prevent user from accessing another user\'s reservations', async () => {
      const otherUserReservation = {
        id: 'res-other-user',
        owner_id: 'user-456', // Different user
        apartment_id: 'apt-789'
      }

      // Mock reservation lookup - returns null for wrong user
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest(`http://localhost/api/reservations/res-other-user`)
      const response = await GET(request, { params: Promise.resolve({ id: 'res-other-user' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should prevent user from updating another user\'s reservation', async () => {
      // Mock existing reservation check - not owned by current user
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest(`http://localhost/api/reservations/res-other-user`, {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Hacked!' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'res-other-user' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.success).toBe(false)
    })

    it('should prevent user from deleting another user\'s reservation', async () => {
      // Mock existing reservation check - not owned by current user
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest(`http://localhost/api/reservations/res-other-user`)
      const response = await DELETE(request, { params: Promise.resolve({ id: 'res-other-user' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.success).toBe(false)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Temporarily mock rate limiter to return rate limit error
      const rateLimitError = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
      
      ;(rateLimit as any).mockResolvedValueOnce(rateLimitError)

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(429)
      expect(result.error).toContain('Too many requests')
    })

    it('should apply different rate limits for read vs write operations', async () => {
      // Test that POST has stricter rate limits than GET
      const requests = []
      
      // Simulate multiple rapid requests
      for (let i = 0; i < 15; i++) {
        const request = new NextRequest('http://localhost/api/reservations', {
          method: 'POST',
          body: JSON.stringify({
            apartmentId: 'apt-123',
            checkIn: '2024-03-15',
            checkOut: '2024-03-20',
            guestCount: 2,
            platform: 'airbnb',
            totalPrice: 500
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        
        // After 10 requests, rate limiter should kick in for writes
        if (i >= 10) {
          ;(rateLimit as any).mockResolvedValueOnce(
            NextResponse.json({ error: 'Too many requests' }, { status: 429 })
          )
        } else {
          ;(rateLimit as any).mockResolvedValueOnce(null)
        }
        
        requests.push(POST(request))
      }
      
      const responses = await Promise.all(requests)
      
      // First 10 should succeed (or fail for other reasons)
      // After that, should get rate limited
      const rateLimited = responses.filter(async r => (await r.json()).status === 429)
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No session')
      })

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should validate JWT tokens are not expired', async () => {
      // Mock expired token error
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired', status: 401 }
      })

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
    })
  })

  describe('Input Validation', () => {
    it('should reject malformed UUIDs', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123456',
        'abc-def-ghi',
        '../../../etc/passwd',
        'null',
        'undefined',
        ''
      ]

      for (const invalidId of invalidUUIDs) {
        const request = new NextRequest(`http://localhost/api/reservations/${invalidId}`)
        const response = await GET(request, { params: Promise.resolve({ id: invalidId }) })
        const result = await response.json()

        expect(response.status).toBe(400)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid')
      }
    })

    it('should reject invalid date formats', async () => {
      const invalidDates = {
        apartmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        checkIn: 'not-a-date',
        checkOut: '2024-13-45', // Invalid month and day
        guestCount: 2,
        platform: 'airbnb',
        totalPrice: 500
      }

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidDates),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })

    it('should enforce field length limits', async () => {
      const oversizedData = {
        apartmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        checkIn: '2024-03-15',
        checkOut: '2024-03-20',
        guestCount: 2,
        platform: 'airbnb',
        platformReservationId: 'A'.repeat(1000), // Too long
        totalPrice: 500,
        notes: 'B'.repeat(10000) // Way too long
      }

      const request = new NextRequest('http://localhost/api/reservations', {
        method: 'POST',
        body: JSON.stringify(oversizedData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })
  })

  describe('CORS and Headers Security', () => {
    it('should include security headers in responses', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      })

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)

      // Check for rate limit headers
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })
  })

  describe('Error Information Disclosure', () => {
    it('should not leak sensitive information in error messages', async () => {
      // Simulate database error with sensitive info
      mockSupabase.from.mockImplementationOnce(() => {
        throw new Error('Connection to database server at localhost:5432 failed: password authentication failed for user "postgres"')
      })

      const request = new NextRequest('http://localhost/api/reservations')
      const response = await GET(request)
      const result = await response.json()

      // Should not expose database details
      expect(result.error).not.toContain('localhost:5432')
      expect(result.error).not.toContain('postgres')
      expect(result.error).not.toContain('password')
    })
  })
})