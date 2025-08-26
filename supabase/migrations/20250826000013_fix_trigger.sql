-- Fix the prevent_double_booking trigger
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON reservations;
DROP FUNCTION IF EXISTS prevent_double_booking();

CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for overlapping reservations in the same apartment
  -- Using text comparison to avoid enum issues
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.apartment_id = NEW.apartment_id 
    AND r.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND r.status::text NOT LIKE '%cancel%'
    AND r.status::text NOT LIKE '%archive%'
    AND (
      (NEW.check_in >= r.check_in AND NEW.check_in < r.check_out)
      OR
      (NEW.check_out > r.check_in AND NEW.check_out <= r.check_out)
      OR
      (NEW.check_in <= r.check_in AND NEW.check_out >= r.check_out)
    )
  ) THEN
    RAISE EXCEPTION 'Double booking detected for apartment % from % to %', 
      NEW.apartment_id, NEW.check_in, NEW.check_out;
  END IF;
  
  -- Validate guest count against apartment capacity
  IF NEW.guest_count > (SELECT capacity FROM apartments WHERE id = NEW.apartment_id) THEN
    RAISE EXCEPTION 'Guest count (%) exceeds apartment capacity', NEW.guest_count;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();