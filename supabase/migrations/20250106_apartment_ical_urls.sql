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
  
  -- Ensure only one URL per platform per apartment
  UNIQUE(apartment_id, platform)
);

-- Add index for faster queries
CREATE INDEX idx_apartment_ical_urls_apartment ON apartment_ical_urls(apartment_id);
CREATE INDEX idx_apartment_ical_urls_active ON apartment_ical_urls(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE apartment_ical_urls ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only apartment owner can manage URLs
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

-- Insert test data for Boccador apartment (if exists)
-- Note: These URLs are for testing. In production, users will add their own URLs via UI
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
  END IF;
END $$;