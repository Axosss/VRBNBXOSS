import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize text input to prevent XSS attacks
 * Removes all HTML tags and dangerous content
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return ''
  
  // Remove all HTML tags and dangerous content
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  })
  
  // Additional cleanup for common injection patterns
  return cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize object with text fields
 * Applies sanitization to all string values in the object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value) as any
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value)
    }
  }
  
  return sanitized
}

/**
 * Sanitize contact info specifically
 * Preserves structure but sanitizes all text fields
 */
export function sanitizeContactInfo(contactInfo: any): any {
  if (!contactInfo) return null
  
  return {
    ...contactInfo,
    guestName: sanitizeText(contactInfo.guestName),
    guestEmail: sanitizeText(contactInfo.guestEmail),
    guestPhone: sanitizeText(contactInfo.guestPhone),
    additionalInfo: sanitizeText(contactInfo.additionalInfo),
  }
}

/**
 * Validate and sanitize search query
 * Prevents SQL injection in search parameters
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return ''
  
  // Remove SQL keywords and dangerous characters
  return query
    .replace(/['"`;\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|FROM|WHERE|OR|AND|UNION|EXEC|SCRIPT)\b/gi, '') // Remove SQL keywords
    .slice(0, 100) // Limit length
    .trim()
}