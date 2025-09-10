// Types for iCal parsing and sync operations

export interface ParsedEvent {
  uid: string;
  checkIn: Date;
  checkOut: Date;
  summary: string;
  description?: string;
  isReservation: boolean;
  isBlocked: boolean;
  platform?: 'airbnb' | 'vrbo' | 'unknown'; // Detected platform
  guestName?: string; // Extracted guest name
  platformId?: string; // Extracted from URL (e.g., HM25Z3NPQA)
  phoneLast4?: string;
  reservationUrl?: string;
  raw: any; // Original iCal event data
}

export interface SyncDelta {
  added: ParsedEvent[];
  removed: ParsedEvent[];
  modified: {
    uid: string;
    before: ParsedEvent;
    after: ParsedEvent;
    changes: string[];
  }[];
}

export interface SyncResult {
  hasChanges: boolean;
  checksum: string;
  eventsFound: number;
  delta?: SyncDelta;
  error?: string;
}

export interface StagedReservation {
  id?: string;
  apartmentId: string;
  platform: 'airbnb' | 'vrbo' | 'direct';
  syncSource: string;
  syncUid: string;
  syncUrl?: string;
  rawData: any;
  
  // Parsed from iCal
  checkIn: Date;
  checkOut: Date;
  statusText?: string;
  phoneLast4?: string;
  
  // Manual enrichment
  guestName?: string;
  guestCount?: number;
  totalPrice?: number;
  platformFee?: number;
  cleaningFee?: number;
  notes?: string;
  
  // Workflow
  stageStatus: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'duplicate';
  stageNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Link to real reservation
  reservationId?: string;
  
  // Timestamps
  firstSeenAt: Date;
  lastSeenAt: Date;
  disappearedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncAlert {
  id?: string;
  alertType: 'new_booking' | 'cancellation' | 'conflict' | 'sync_error';
  severity: 'info' | 'warning' | 'critical';
  apartmentId?: string;
  reservationId?: string;
  stagingId?: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}