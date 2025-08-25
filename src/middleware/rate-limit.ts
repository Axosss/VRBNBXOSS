import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/lib/utils'

// Simple in-memory rate limiter
// In production, use Redis or similar for distributed rate limiting
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // Start new window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (record.count >= this.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - record.count)
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return Date.now() + this.windowMs
    }
    return record.resetTime
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Different rate limiters for different operations
const readLimiter = new RateLimiter(60000, 100) // 100 requests per minute for reads
const writeLimiter = new RateLimiter(60000, 10) // 10 requests per minute for writes
const authLimiter = new RateLimiter(300000, 5) // 5 requests per 5 minutes for auth

// Cleanup old entries every minute
setInterval(() => {
  readLimiter.cleanup()
  writeLimiter.cleanup()
  authLimiter.cleanup()
}, 60000)

export async function rateLimit(
  request: NextRequest,
  type: 'read' | 'write' | 'auth' = 'read'
): Promise<NextResponse | null> {
  // Get client IP or use a fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'

  const limiter = type === 'auth' ? authLimiter : 
                  type === 'write' ? writeLimiter : 
                  readLimiter

  const identifier = `${ip}-${type}`
  const allowed = await limiter.checkLimit(identifier)

  if (!allowed) {
    const resetTime = limiter.getResetTime(identifier)
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': type === 'auth' ? '5' : type === 'write' ? '10' : '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }

  // Add rate limit headers to successful responses
  const remaining = limiter.getRemainingRequests(identifier)
  const resetTime = limiter.getResetTime(identifier)
  
  // Return null to indicate request should proceed
  // The calling function should add these headers to the response
  return null
}

export function addRateLimitHeaders(
  response: NextResponse,
  type: 'read' | 'write' | 'auth' = 'read',
  identifier: string
): NextResponse {
  const limiter = type === 'auth' ? authLimiter : 
                  type === 'write' ? writeLimiter : 
                  readLimiter

  const remaining = limiter.getRemainingRequests(identifier)
  const resetTime = limiter.getResetTime(identifier)

  response.headers.set('X-RateLimit-Limit', type === 'auth' ? '5' : type === 'write' ? '10' : '100')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

  return response
}