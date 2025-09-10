-- ============================================
-- COMBINED MIGRATIONS FOR VRBO INTEGRATION
-- ============================================
-- Copy this entire file and run in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/fdfigwvbawfaefmdhxaj/sql/new

-- ============================================
-- 1. ICAL SYNC TABLES (20250104)
-- ============================================

-- Staging table for incoming iCal events
CREATE TABLE IF NOT EXISTS reservation_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  platform platform_type NOT NULL DEFAULT 'airbnb',
  
  -- Sync metadata
  sync_source VARCHAR(50) NOT NULL DEFAULT 'airbnb_ical',
  sync_uid TEXT UNIQUE NOT NULL,
  sync_url TEXT,
  raw_data JSONB NOT NULL,
  
  -- Parsed fields from iCal
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status_text VARCHAR(100),
  phone_last_four VARCHAR(4),
  guest_name VARCHAR(255),
  
  -- Manual enrichment fields
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
  disappeared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delta tracking for smart history storage
CREATE TABLE IF NOT EXISTS sync_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  sync_timestamp TIMESTAMPTZ NOT NULL,
  delta_type VARCHAR(20) CHECK (delta_type IN ('added', 'removed', 'modified')),
  event_uid TEXT NOT NULL,
  event_data JSONB NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checksum tracking for change detection
CREATE TABLE IF NOT EXISTS sync_checksums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  current_checksum TEXT NOT NULL,
  previous_checksum TEXT,
  last_sync TIMESTAMPTZ NOT NULL,
  events_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(apartment_id)
);

-- Sync history/log
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  sync_timestamp TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) CHECK (status IN ('changes_detected', 'no_changes', 'error')),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-visible sync alerts
CREATE TABLE IF NOT EXISTS sync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(20) CHECK (alert_type IN ('new_booking', 'cancellation', 'conflict', 'sync_error')),
  severity VARCHAR(10) CHECK (severity IN ('info', 'warning', 'critical')),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  staging_id UUID REFERENCES reservation_staging(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservation_staging_apartment ON reservation_staging(apartment_id);
CREATE INDEX IF NOT EXISTS idx_reservation_staging_status ON reservation_staging(stage_status);
CREATE INDEX IF NOT EXISTS idx_reservation_staging_uid ON reservation_staging(sync_uid);
CREATE INDEX IF NOT EXISTS idx_sync_deltas_apartment ON sync_deltas(apartment_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_apartment ON sync_log(apartment_id);
CREATE INDEX IF NOT EXISTS idx_sync_alerts_unread ON sync_alerts(is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE reservation_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_checksums ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their apartment staging" ON reservation_staging
  FOR SELECT USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their apartment staging" ON reservation_staging
  FOR ALL USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their sync deltas" ON sync_deltas
  FOR SELECT USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their sync deltas" ON sync_deltas
  FOR ALL USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their checksums" ON sync_checksums
  FOR SELECT USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their checksums" ON sync_checksums
  FOR ALL USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their sync logs" ON sync_log
  FOR SELECT USING (
    apartment_id IS NULL OR apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sync logs" ON sync_log
  FOR INSERT WITH CHECK (
    apartment_id IS NULL OR apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their alerts" ON sync_alerts
  FOR SELECT USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their alerts" ON sync_alerts
  FOR ALL USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_staging_updated_at 
  BEFORE UPDATE ON reservation_staging
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_checksums_updated_at 
  BEFORE UPDATE ON sync_checksums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. APARTMENT ICAL URLS TABLE (20250106)
-- ============================================

-- Create table for storing iCal URLs per apartment and platform
CREATE TABLE IF NOT EXISTS apartment_ical_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  ical_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(apartment_id, platform)
);

-- Add indexes
CREATE INDEX idx_apartment_ical_urls_apartment ON apartment_ical_urls(apartment_id);
CREATE INDEX idx_apartment_ical_urls_active ON apartment_ical_urls(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE apartment_ical_urls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their apartment iCal URLs" ON apartment_ical_urls
  FOR SELECT
  USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert iCal URLs for their apartments" ON apartment_ical_urls
  FOR INSERT
  WITH CHECK (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their apartment iCal URLs" ON apartment_ical_urls
  FOR UPDATE
  USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their apartment iCal URLs" ON apartment_ical_urls
  FOR DELETE
  USING (
    apartment_id IN (
      SELECT id FROM apartments WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_apartment_ical_urls_updated_at
  BEFORE UPDATE ON apartment_ical_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. INSERT TEST DATA (OPTIONAL)
-- ============================================

-- Find Boccador apartment and add test URLs
DO $$
DECLARE
  boccador_id UUID;
BEGIN
  -- Find Boccador apartment
  SELECT id INTO boccador_id FROM apartments WHERE name = 'Boccador' LIMIT 1;
  
  IF boccador_id IS NOT NULL THEN
    -- Insert Airbnb URL
    INSERT INTO apartment_ical_urls (apartment_id, platform, ical_url)
    VALUES (
      boccador_id,
      'airbnb',
      'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5'
    )
    ON CONFLICT (apartment_id, platform) DO NOTHING;
    
    -- Insert VRBO URL  
    INSERT INTO apartment_ical_urls (apartment_id, platform, ical_url)
    VALUES (
      boccador_id,
      'vrbo',
      'http://www.vrbo.com/icalendar/8494e25875ac49898221299bf80c4973.ics'
    )
    ON CONFLICT (apartment_id, platform) DO NOTHING;
    
    RAISE NOTICE 'Test URLs added for Boccador apartment';
  ELSE
    RAISE NOTICE 'Boccador apartment not found - skipping test data';
  END IF;
END $$;

-- ============================================
-- DONE! Your database is ready for VRBO sync
-- ============================================