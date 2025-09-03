// Cleaning Management Types

// Simplified status system - legacy values are mapped to 'active' in the UI
export type CleaningStatus = 'active' | 'cancelled' | 'needed' | 'scheduled' | 'in_progress' | 'completed' | 'verified';
export type CleaningType = 'standard' | 'checkout';

export interface Cleaner {
  id: string;
  ownerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  rate?: number | null;
  hourlyRate?: number | null;
  flatRate?: number | null;
  currency?: string | null;
  active?: boolean;
  services?: string[];
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Cleaning {
  id: string;
  apartmentId: string;
  cleanerId?: string | null;
  reservationId?: string | null;
  ownerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: CleaningStatus;
  cleaningType: CleaningType;
  instructions?: string | null;
  supplies?: Record<string, unknown>;
  photos?: string[];
  cost?: number | null;
  currency: string;
  rating?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations (when joined)
  apartment?: {
    id: string;
    name: string;
    address: any;
  };
  cleaner?: Cleaner;
  reservation?: {
    id: string;
    checkIn: string;
    checkOut: string;
    guestName?: string;
  };
}

export interface CleaningFilters {
  apartmentId?: string;
  cleanerId?: string;
  status?: CleaningStatus;
  cleaningType?: CleaningType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CleanerFilters {
  active?: boolean;
  search?: string;
  minRating?: number;
  services?: string[];
  page?: number;
  limit?: number;
}

export interface CleaningAvailability {
  date: string;
  availableSlots: TimeSlot[];
  cleaners: CleanerAvailability[];
  conflicts: ConflictInfo[];
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export interface CleanerAvailability {
  cleanerId: string;
  cleanerName: string;
  available: boolean;
  workingHours?: { start: string; end: string };
  existingBookings?: { start: string; end: string }[];
}

export interface ConflictInfo {
  type: 'reservation' | 'cleaning' | 'availability';
  start: string;
  end: string;
  description: string;
}

export interface CreateCleaningData {
  apartmentId: string;
  cleanerId?: string;
  reservationId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  cleaningType?: CleaningType;
  instructions?: string;
  supplies?: Record<string, unknown>;
  cost?: number;
  currency?: string;
}

export interface UpdateCleaningData {
  cleanerId?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status?: CleaningStatus;
  cleaningType?: CleaningType;
  instructions?: string | null;
  supplies?: Record<string, unknown>;
  photos?: string[];
  cost?: number | null;
  rating?: number | null;
  notes?: string | null;
}

export interface CreateCleanerData {
  name: string;
  email?: string;
  phone?: string;
  rate?: number;
  currency?: string;
}

export interface UpdateCleanerData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  rate?: number | null;
  currency?: string;
}