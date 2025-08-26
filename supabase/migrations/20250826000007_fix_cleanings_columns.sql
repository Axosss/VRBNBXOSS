-- Migrate cleanings table from scheduled_date to scheduled_start and scheduled_end
-- First check if the columns already exist to avoid errors
DO $$ 
BEGIN
    -- Add scheduled_start if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='scheduled_start') THEN
        ALTER TABLE cleanings ADD COLUMN scheduled_start TIMESTAMPTZ;
    END IF;

    -- Add scheduled_end if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='scheduled_end') THEN
        ALTER TABLE cleanings ADD COLUMN scheduled_end TIMESTAMPTZ;
    END IF;

    -- Add owner_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='owner_id') THEN
        ALTER TABLE cleanings ADD COLUMN owner_id UUID;
    END IF;

    -- Add cleaning_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='cleaning_type') THEN
        -- First check if the type exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cleaning_type') THEN
            CREATE TYPE cleaning_type AS ENUM ('standard', 'deep', 'maintenance', 'checkout', 'checkin');
        END IF;
        ALTER TABLE cleanings ADD COLUMN cleaning_type cleaning_type DEFAULT 'standard';
    END IF;

    -- Add actual_start if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='actual_start') THEN
        ALTER TABLE cleanings ADD COLUMN actual_start TIMESTAMPTZ;
    END IF;

    -- Add actual_end if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='actual_end') THEN
        ALTER TABLE cleanings ADD COLUMN actual_end TIMESTAMPTZ;
    END IF;

    -- Add photos if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='photos') THEN
        ALTER TABLE cleanings ADD COLUMN photos TEXT[];
    END IF;

    -- Add cost if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='cost') THEN
        ALTER TABLE cleanings ADD COLUMN cost DECIMAL CHECK (cost >= 0);
    END IF;

    -- Add currency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='currency') THEN
        ALTER TABLE cleanings ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
    END IF;

    -- Add rating if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='rating') THEN
        ALTER TABLE cleanings ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;

    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cleanings' AND column_name='notes') THEN
        ALTER TABLE cleanings ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Migrate existing data from scheduled_date to scheduled_start and scheduled_end
UPDATE cleanings 
SET 
    scheduled_start = COALESCE(scheduled_start, scheduled_date),
    scheduled_end = COALESCE(scheduled_end, scheduled_date + COALESCE(duration, interval '2 hours'))
WHERE scheduled_date IS NOT NULL 
  AND (scheduled_start IS NULL OR scheduled_end IS NULL);

-- Set owner_id from apartment relationship if missing
UPDATE cleanings c
SET owner_id = a.owner_id
FROM apartments a
WHERE c.apartment_id = a.id
  AND c.owner_id IS NULL;

-- Make scheduled_start and scheduled_end NOT NULL after migration
ALTER TABLE cleanings ALTER COLUMN scheduled_start SET NOT NULL;
ALTER TABLE cleanings ALTER COLUMN scheduled_end SET NOT NULL;
ALTER TABLE cleanings ALTER COLUMN owner_id SET NOT NULL;

-- Add foreign key constraint for owner_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'cleanings' 
                   AND constraint_name = 'cleanings_owner_id_fkey') THEN
        ALTER TABLE cleanings ADD CONSTRAINT cleanings_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop old columns if they exist
ALTER TABLE cleanings DROP COLUMN IF EXISTS scheduled_date CASCADE;
ALTER TABLE cleanings DROP COLUMN IF EXISTS duration CASCADE;

-- Create new indexes
DROP INDEX IF EXISTS idx_cleanings_scheduled_date;
CREATE INDEX IF NOT EXISTS idx_cleanings_scheduled_start ON cleanings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_cleanings_scheduled_end ON cleanings(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_cleanings_owner_id ON cleanings(owner_id);

-- Update RLS policies to use owner_id
DROP POLICY IF EXISTS "cleanings_select_policy" ON cleanings;
DROP POLICY IF EXISTS "cleanings_insert_policy" ON cleanings;
DROP POLICY IF EXISTS "cleanings_update_policy" ON cleanings;
DROP POLICY IF EXISTS "cleanings_delete_policy" ON cleanings;

CREATE POLICY "cleanings_select_policy" ON cleanings 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "cleanings_insert_policy" ON cleanings 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "cleanings_update_policy" ON cleanings 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "cleanings_delete_policy" ON cleanings 
  FOR DELETE USING (auth.uid() = owner_id);