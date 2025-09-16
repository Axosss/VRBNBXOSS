-- Add 'rent' to reservation_platform enum
-- Note: This must be run outside of a transaction
DO $$
BEGIN
  -- Check if 'rent' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'rent' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'reservation_platform'
    )
  ) THEN
    -- Add the new value
    ALTER TYPE reservation_platform ADD VALUE 'rent';
  END IF;
END
$$;