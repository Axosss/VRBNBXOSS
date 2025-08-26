-- Update cleanings foreign key constraint to handle reservation deletion properly
-- This allows reservations to be deleted while preserving cleaning records

-- Drop the existing constraint if it exists
ALTER TABLE cleanings 
DROP CONSTRAINT IF EXISTS cleanings_reservation_id_fkey;

-- Add the new constraint with ON DELETE SET NULL
-- This will set reservation_id to NULL when a reservation is deleted
-- Preserves the cleaning record for historical/accounting purposes
ALTER TABLE cleanings 
ADD CONSTRAINT cleanings_reservation_id_fkey 
FOREIGN KEY (reservation_id) 
REFERENCES reservations(id) 
ON DELETE SET NULL;

-- Add a comment explaining the behavior
COMMENT ON COLUMN cleanings.reservation_id IS 'Reference to the reservation. Set to NULL if reservation is deleted.';