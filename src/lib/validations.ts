import { z } from 'zod'

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Profile schemas
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  avatarUrl: z.union([
    z.string().url('Invalid avatar URL'),
    z.literal(''),
    z.null()
  ]).optional(),
  timezone: z.string().optional(),
  settings: z.object({}).catchall(z.any()).optional(),
})

// Apartment schemas
export const apartmentCreateSchema = z.object({
  name: z.string().min(1, 'Apartment name is required'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  bedrooms: z.number().int().min(0, 'Bedrooms cannot be negative').optional(),
  bathrooms: z.number().min(0, 'Bathrooms cannot be negative').optional(),
  amenities: z.array(z.string()).optional(),
  accessCodes: z.object({
    wifi: z.object({
      network: z.string(),
      password: z.string(),
    }).optional(),
    door: z.string().optional(),
    mailbox: z.string().optional(),
    additional: z.object({}).catchall(z.string()).optional(),
  }).optional(),
})

export const apartmentUpdateSchema = apartmentCreateSchema.partial()

// Guest schemas
export const guestCreateSchema = z.object({
  name: z.string().min(1, 'Guest name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  idDocument: z.string().optional().nullable(),
})

export const guestUpdateSchema = guestCreateSchema.partial()

// Reservation schemas
export const reservationCreateSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  guestId: z.string().uuid('Invalid guest ID').optional().nullable(),
  platform: z.enum(['airbnb', 'vrbo', 'direct', 'booking_com', 'rent']),
  platformReservationId: z.string().optional().nullable(),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  cleaningFee: z.number().min(0, 'Cleaning fee cannot be negative').optional(),
  platformFee: z.number().min(0, 'Platform fee cannot be negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('EUR'),
  notes: z.string().optional(),
  contactInfo: z.object({}).catchall(z.any()).optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
)

export const reservationUpdateSchema = reservationCreateSchema.partial().omit({ apartmentId: true }).extend({
  guestName: z.string().min(1, 'Guest name is required').optional()
})

// Cleaner schemas
export const cleanerCreateSchema = z.object({
  name: z.string().min(1, 'Cleaner name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  rate: z.number().min(0, 'Rate cannot be negative').optional().nullable(),
})

export const cleanerUpdateSchema = cleanerCreateSchema.partial()

// Cleaning schemas
export const cleaningCreateSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  cleanerId: z.string().uuid('Invalid cleaner ID').optional().nullable(),
  reservationId: z.string().uuid('Invalid reservation ID').optional().nullable(),
  scheduledDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid scheduled date'),
  duration: z.string().optional().nullable(), // PostgreSQL interval format
  instructions: z.string().optional(),
  supplies: z.object({}).catchall(z.any()).optional(),
})

export const cleaningUpdateSchema = cleaningCreateSchema.partial().omit({ apartmentId: true })

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const dateRangeSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

export const apartmentFilterSchema = z.object({
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
  search: z.string().optional(),
})

export const reservationFilterSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']).optional(),
  platform: z.enum(['airbnb', 'vrbo', 'direct', 'booking_com', 'rent']).optional(),
  apartmentId: z.string().uuid().optional(),
  search: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  sortBy: z.enum(['created_at', 'check_in', 'check_out', 'total_price']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const cleaningFilterSchema = z.object({
  status: z.enum(['needed', 'scheduled', 'in_progress', 'completed', 'verified', 'cancelled']).optional(),
  apartmentId: z.string().uuid().optional(),
  cleanerId: z.string().uuid().optional(),
})

// Calendar schemas
export const calendarFiltersSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  apartmentIds: z.array(z.string().uuid()).optional(),
  view: z.enum(['month', 'week', 'day']).default('month'),
  includeCleanings: z.boolean().default(false),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

export const availabilityCheckSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  excludeReservationId: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
)

export const quickReservationSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guestName: z.string().min(1, 'Guest name is required').max(100, 'Guest name too long'),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(50, 'Guest count too high'),
  platform: z.enum(['airbnb', 'vrbo', 'direct', 'booking_com', 'rent']),
  totalPrice: z.number().min(0, 'Total price cannot be negative').max(999999, 'Total price too high'),
  notes: z.string().max(1000, 'Notes too long').optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
)

export const calendarStatsSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  apartmentIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ApartmentCreateInput = z.infer<typeof apartmentCreateSchema>
export type ApartmentUpdateInput = z.infer<typeof apartmentUpdateSchema>
export type GuestCreateInput = z.infer<typeof guestCreateSchema>
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>
export type CleanerCreateInput = z.infer<typeof cleanerCreateSchema>
export type CleanerUpdateInput = z.infer<typeof cleanerUpdateSchema>
export type CleaningCreateInput = z.infer<typeof cleaningCreateSchema>
export type CleaningUpdateInput = z.infer<typeof cleaningUpdateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type ApartmentFilterInput = z.infer<typeof apartmentFilterSchema>
export type ReservationFilterInput = z.infer<typeof reservationFilterSchema>
export type CleaningFilterInput = z.infer<typeof cleaningFilterSchema>
export type CalendarFiltersInput = z.infer<typeof calendarFiltersSchema>
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>
export type QuickReservationInput = z.infer<typeof quickReservationSchema>
export type CalendarStatsInput = z.infer<typeof calendarStatsSchema>