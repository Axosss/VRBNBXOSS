// Cleaning Management Types

export type CleaningStatus = 'needed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'verified';
export type CleaningType = 'standard' | 'deep' | 'maintenance' | 'checkout' | 'checkin';

export interface Cleaner {
  id: string;
  owner_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  rate?: number | null;
  currency?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cleaning {
  id: string;
  apartment_id: string;
  cleaner_id?: string | null;
  reservation_id?: string | null;
  owner_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  status: CleaningStatus;
  cleaning_type: CleaningType;
  instructions?: string | null;
  supplies?: Record<string, any>;
  photos?: string[];
  cost?: number | null;
  currency: string;
  rating?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (when joined)
  apartment?: {
    id: string;
    name: string;
    address: any;
  };
  cleaner?: Cleaner;
  reservation?: {
    id: string;
    check_in: string;
    check_out: string;
    guest_name?: string;
  };
}

export interface CleaningFilters {
  apartment_id?: string;
  cleaner_id?: string;
  status?: CleaningStatus;
  cleaning_type?: CleaningType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface CleanerFilters {
  active?: boolean;
  search?: string;
  min_rating?: number;
  services?: string[];
}

export interface CleaningAvailability {
  date: string;
  available_slots: TimeSlot[];
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
  cleaner_id: string;
  cleaner_name: string;
  available: boolean;
  working_hours?: { start: string; end: string };
  existing_bookings?: { start: string; end: string }[];
}

export interface ConflictInfo {
  type: 'reservation' | 'cleaning' | 'availability';
  start: string;
  end: string;
  description: string;
}

export interface CreateCleaningData {
  apartment_id: string;
  cleaner_id?: string;
  reservation_id?: string;
  scheduled_start: string;
  scheduled_end: string;
  cleaning_type?: CleaningType;
  instructions?: string;
  supplies?: Record<string, any>;
  cost?: number;
  currency?: string;
}

export interface UpdateCleaningData {
  cleaner_id?: string | null;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string | null;
  actual_end?: string | null;
  status?: CleaningStatus;
  cleaning_type?: CleaningType;
  instructions?: string | null;
  supplies?: Record<string, any>;
  photos?: string[];
  cost?: number | null;
  rating?: number | null;
  notes?: string | null;
}

export interface CreateCleanerData {
  name: string;
  email?: string;
  phone?: string;
  hourly_rate?: number;
  flat_rate?: number;
  currency?: string;
}

export interface UpdateCleanerData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  hourly_rate?: number | null;
  flat_rate?: number | null;
  currency?: string;
}