-- Airbnb iCal Sync Tables
-- Safe staging tables that don't affect existing production data

-- Staging table for incoming iCal events
CREATE TABLE IF NOT EXISTS reservation_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  platform platform_type NOT NULL DEFAULT 'airbnb',
  
  -- Sync metadata
  sync_source VARCHAR(50) NOT NULL DEFAULT 'airbnb_ical',
  sync_uid TEXT UNIQUE NOT NULL, -- Airbnb's UID from iCal
  sync_url TEXT, -- Reservation URL from iCal
  raw_data JSONB NOT NULL, -- Complete iCal event data
  
  -- Parsed fields from iCal
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status_text VARCHAR(100), -- "Reserved" or "Not available"
  phone_last_four VARCHAR(4), -- Last 4 digits from iCal
  
  -- Manual enrichment fields (filled by user)
  guest_name VARCHAR(255),
  guest_count INTEGER,
  total_price DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  cleaning_fee DECIMAL(10, 2),
  notes TEXT,
  
  -- Workflow status
  stage_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (stage_status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'duplicate')),
  stage_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Link to real reservation once confirmed
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Tracking timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  disappeared_at TIMESTAMPTZ, -- When it disappeared from iCal (potential cancellation)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delta tracking for smart history storage
CREATE TABLE IF NOT EXISTS sync_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  sync_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Delta tracking (only store changes)
  events_added JSONB, -- New events that appeared
  events_removed JSONB, -- Events that disappeared (cancellations)
  events_modified JSONB, -- Events with changed data
  
  -- Summary counts
  total_added INTEGER DEFAULT 0,
  total_removed INTEGER DEFAULT 0,
  total_modified INTEGER DEFAULT 0,
  
  -- Optimization
  checksum VARCHAR(64), -- SHA-256 hash of current state
  has_changes BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checksum table for quick change detection
CREATE TABLE IF NOT EXISTS sync_checksums (
  apartment_id UUID PRIMARY KEY REFERENCES apartments(id) ON DELETE CASCADE,
  current_checksum VARCHAR(64) NOT NULL,
  last_sync TIMESTAMPTZ NOT NULL,
  events_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple log for unchanged syncs (saves storage)
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  sync_timestamp TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('no_changes', 'changes_detected', 'error', 'manual')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync alerts for user notifications
CREATE TABLE IF NOT EXISTS sync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('new_booking', 'cancellation', 'conflict', 'sync_error')),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Context references
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  staging_id UUID REFERENCES reservation_staging(id) ON DELETE CASCADE,
  
  -- Alert content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staging_status ON reservation_staging(stage_status);
CREATE INDEX IF NOT EXISTS idx_staging_apartment ON reservation_staging(apartment_id);
CREATE INDEX IF NOT EXISTS idx_staging_dates ON reservation_staging(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_staging_sync_uid ON reservation_staging(sync_uid);
CREATE INDEX IF NOT EXISTS idx_sync_deltas_apartment ON sync_deltas(apartment_id, sync_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_apartment ON sync_log(apartment_id, sync_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON sync_alerts(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_apartment ON sync_alerts(apartment_id);

-- RLS Policies (ensure users can only see their own data)
ALTER TABLE reservation_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_checksums ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_alerts ENABLE ROW LEVEL SECURITY;

-- Staging table policies
CREATE POLICY "Users can view their own staging reservations"
  ON reservation_staging FOR SELECT
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage their own staging reservations"
  ON reservation_staging FOR ALL
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

-- Delta tracking policies
CREATE POLICY "Users can view their own sync deltas"
  ON sync_deltas FOR SELECT
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their own sync deltas"
  ON sync_deltas FOR INSERT
  WITH CHECK (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

-- Checksum policies
CREATE POLICY "Users can view their own checksums"
  ON sync_checksums FOR SELECT
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage their own checksums"
  ON sync_checksums FOR ALL
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

-- Log policies
CREATE POLICY "Users can view their own sync logs"
  ON sync_log FOR SELECT
  USING (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their own sync logs"
  ON sync_log FOR INSERT
  WITH CHECK (apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid()));

-- Alert policies
CREATE POLICY "Users can view their own alerts"
  ON sync_alerts FOR SELECT
  USING (
    apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid())
    OR reservation_id IN (SELECT id FROM reservations WHERE apartment_id IN 
      (SELECT id FROM apartments WHERE owner_id = auth.uid()))
  );

CREATE POLICY "Users can update their own alerts"
  ON sync_alerts FOR UPDATE
  USING (
    apartment_id IN (SELECT id FROM apartments WHERE owner_id = auth.uid())
    OR reservation_id IN (SELECT id FROM reservations WHERE apartment_id IN 
      (SELECT id FROM apartments WHERE owner_id = auth.uid()))
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for reservation_staging
CREATE TRIGGER update_reservation_staging_updated_at
  BEFORE UPDATE ON reservation_staging
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check for conflicts when confirming staging reservation
CREATE OR REPLACE FUNCTION check_staging_conflicts(
  p_apartment_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_staging_id UUID DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_reservation_id UUID,
  conflict_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as has_conflict,
    r.id as conflicting_reservation_id,
    CASE
      WHEN r.check_in = p_check_in AND r.check_out = p_check_out THEN 'exact_match'
      WHEN r.check_in <= p_check_in AND r.check_out > p_check_in THEN 'overlaps_start'
      WHEN r.check_in < p_check_out AND r.check_out >= p_check_out THEN 'overlaps_end'
      ELSE 'contains'
    END as conflict_type
  FROM reservations r
  WHERE r.apartment_id = p_apartment_id
    AND r.status IN ('confirmed', 'in_progress')
    AND daterange(r.check_in, r.check_out, '[]') && daterange(p_check_in, p_check_out, '[]')
    AND (p_staging_id IS NULL OR r.id != (SELECT reservation_id FROM reservation_staging WHERE id = p_staging_id))
  LIMIT 1;
  
  -- Return no conflict if nothing found
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE reservation_staging IS 'Staging area for iCal imports awaiting manual review';
COMMENT ON TABLE sync_deltas IS 'Delta storage for tracking changes between syncs';
COMMENT ON TABLE sync_checksums IS 'Quick lookup for detecting if calendar changed';
COMMENT ON TABLE sync_log IS 'Lightweight log for all sync operations';
COMMENT ON TABLE sync_alerts IS 'User notifications for sync events';