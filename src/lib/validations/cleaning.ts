import { z } from 'zod';

// Enums
export const cleaningStatusEnum = z.enum([
  'needed',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'verified'
]);

export const cleaningTypeEnum = z.enum([
  'standard',
  'deep',
  'maintenance',
  'checkout',
  'checkin'
]);

// Cleaner schemas
export const createCleanerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.union([
    z.string().email('Invalid email'),
    z.string().length(0),
    z.null()
  ]).optional(),
  phone: z.union([
    z.string().min(5).max(20),
    z.string().length(0),
    z.null()
  ]).optional(),
  rate: z.number().min(0).max(9999.99).optional().nullable(),
  currency: z.string().length(3).default('EUR'),
});

export const updateCleanerSchema = createCleanerSchema.partial();

export const cleanerFiltersSchema = z.object({
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  services: z.array(z.string()).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Cleaning schemas
export const createCleaningSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  cleanerId: z.string().uuid('Invalid cleaner ID').optional().nullable(),
  reservationId: z.string().uuid('Invalid reservation ID').optional().nullable(),
  scheduledStart: z.string().datetime({ offset: true }),
  scheduledEnd: z.string().datetime({ offset: true }),
  cleaningType: cleaningTypeEnum.default('standard'),
  instructions: z.string().max(1000).optional().nullable(),
  supplies: z.record(z.any()).optional(),
  cost: z.number().min(0).max(9999.99).optional().nullable(),
  currency: z.string().length(3).default('EUR'),
}).refine(
  (data) => new Date(data.scheduledEnd) > new Date(data.scheduledStart),
  {
    message: 'Scheduled end must be after scheduled start',
    path: ['scheduledEnd'],
  }
);

export const updateCleaningSchema = z.object({
  cleanerId: z.string().uuid('Invalid cleaner ID').optional().nullable(),
  scheduledStart: z.string().datetime({ offset: true }).optional(),
  scheduledEnd: z.string().datetime({ offset: true }).optional(),
  actualStart: z.string().datetime({ offset: true }).optional().nullable(),
  actualEnd: z.string().datetime({ offset: true }).optional().nullable(),
  status: cleaningStatusEnum.optional(),
  cleaningType: cleaningTypeEnum.optional(),
  instructions: z.string().max(1000).optional().nullable(),
  supplies: z.record(z.any()).optional(),
  photos: z.array(z.string().url()).optional(),
  cost: z.number().min(0).max(9999.99).optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => {
    if (data.scheduledStart && data.scheduledEnd) {
      return new Date(data.scheduledEnd) > new Date(data.scheduledStart);
    }
    return true;
  },
  {
    message: 'Scheduled end must be after scheduled start',
    path: ['scheduledEnd'],
  }
).refine(
  (data) => {
    if (data.actualStart && data.actualEnd) {
      return new Date(data.actualEnd) >= new Date(data.actualStart);
    }
    return true;
  },
  {
    message: 'Actual end must be after actual start',
    path: ['actualEnd'],
  }
);

export const cleaningFiltersSchema = z.object({
  apartmentId: z.string().uuid().optional(),
  cleanerId: z.string().uuid().optional(),
  status: cleaningStatusEnum.optional(),
  cleaningType: cleaningTypeEnum.optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['scheduled_start', 'created_at', 'status']).default('scheduled_start'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const availabilityCheckSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  date: z.string().datetime({ offset: true }),
  duration: z.number().min(30).max(480).default(120), // Duration in minutes
  cleanerId: z.string().uuid().optional(),
});