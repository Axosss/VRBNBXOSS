-- Fix reservation_status enum to match what's actually in the database
-- This migration ensures the enum includes all necessary values

-- First, check if checked_out exists in the enum
DO $$ 
BEGIN
    -- Check if 'checked_out' is already in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'checked_out' 
        AND enumtypid = 'reservation_status'::regtype
    ) THEN
        -- Add 'checked_out' to the enum if it doesn't exist
        ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'checked_out' AFTER 'checked_in';
    END IF;
    
    -- Check if 'in_progress' exists (from TypeScript types)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'in_progress' 
        AND enumtypid = 'reservation_status'::regtype
    ) THEN
        -- Add 'in_progress' to the enum if it doesn't exist
        ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'confirmed';
    END IF;
    
    -- Check if 'completed' exists (from TypeScript types)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'completed' 
        AND enumtypid = 'reservation_status'::regtype
    ) THEN
        -- Add 'completed' to the enum if it doesn't exist
        ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'completed' AFTER 'checked_out';
    END IF;
    
    -- Check if 'draft' exists (from original schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'draft' 
        AND enumtypid = 'reservation_status'::regtype
    ) THEN
        -- Add 'draft' to the enum if it doesn't exist
        ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending';
    END IF;
    
    -- Check if 'archived' exists (from original schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'archived' 
        AND enumtypid = 'reservation_status'::regtype
    ) THEN
        -- Add 'archived' to the enum if it doesn't exist
        ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'archived' AFTER 'cancelled';
    END IF;
END $$;

-- Now update all reservations to use Boccador apartment
UPDATE reservations 
SET apartment_id = '63561c46-cbc2-4340-8f51-9c798fde898a',
    updated_at = now()
WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc';

-- Verify the update
DO $$
DECLARE
    total_count INTEGER;
    boccador_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM reservations
    WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
    
    SELECT COUNT(*) INTO boccador_count
    FROM reservations
    WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
    AND apartment_id = '63561c46-cbc2-4340-8f51-9c798fde898a';
    
    RAISE NOTICE 'Total reservations: %', total_count;
    RAISE NOTICE 'Reservations assigned to Boccador: %', boccador_count;
    
    IF total_count = boccador_count THEN
        RAISE NOTICE '✅ All reservations successfully updated to Boccador!';
    ELSE
        RAISE NOTICE '⚠️ Some reservations were not updated. Check for errors.';
    END IF;
END $$;