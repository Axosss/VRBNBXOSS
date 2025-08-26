-- Temporarily disable the trigger to see if it's causing the issue
ALTER TABLE reservations DISABLE TRIGGER prevent_double_booking_trigger;

-- Check if there are any other triggers
SELECT tgname, tgtype, proname 
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'reservations'::regclass;

-- Re-enable after testing
-- ALTER TABLE reservations ENABLE TRIGGER prevent_double_booking_trigger;