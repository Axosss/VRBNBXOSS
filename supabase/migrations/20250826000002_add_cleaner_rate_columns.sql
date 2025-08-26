-- Add hourly_rate and flat_rate columns to cleaners table
ALTER TABLE cleaners 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL CHECK (hourly_rate >= 0),
ADD COLUMN IF NOT EXISTS flat_rate DECIMAL CHECK (flat_rate >= 0),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

-- Migrate existing rate data to hourly_rate
UPDATE cleaners 
SET hourly_rate = rate 
WHERE rate IS NOT NULL AND hourly_rate IS NULL;

-- Comment on new columns
COMMENT ON COLUMN cleaners.hourly_rate IS 'Hourly rate for cleaning services';
COMMENT ON COLUMN cleaners.flat_rate IS 'Fixed rate per cleaning job';
COMMENT ON COLUMN cleaners.currency IS 'Currency for rates (EUR, USD, GBP, CAD)';

-- Drop the old rate column (optional - uncomment if you want to remove it)
-- ALTER TABLE cleaners DROP COLUMN IF EXISTS rate;