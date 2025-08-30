import { z } from 'zod'

// Guest filters schema for GET requests
export const guestFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.enum(['name', 'email', 'created_at', 'updated_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Create guest schema for POST requests
export const createGuestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional().nullable(),
  idDocument: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Update guest schema for PUT requests
export const updateGuestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional().nullable(),
  idDocument: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type GuestFilters = z.infer<typeof guestFiltersSchema>
export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>