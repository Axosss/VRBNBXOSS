-- Functions and triggers for business logic validation
-- Auto-profile creation, double-booking prevention, and audit logging

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to prevent double bookings
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for overlapping reservations in the same apartment
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE apartment_id = NEW.apartment_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled', 'archived')
    AND (
      -- New booking starts during existing booking
      (NEW.check_in >= check_in AND NEW.check_in < check_out)
      OR
      -- New booking ends during existing booking
      (NEW.check_out > check_in AND NEW.check_out <= check_out)
      OR
      -- New booking encompasses existing booking
      (NEW.check_in <= check_in AND NEW.check_out >= check_out)
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

-- Trigger for double booking prevention
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON reservations;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

-- Function to auto-create cleaning after checkout
CREATE OR REPLACE FUNCTION auto_create_cleaning()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create cleaning when reservation status changes to checked_out
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    INSERT INTO cleanings (apartment_id, reservation_id, scheduled_date, status)
    VALUES (
      NEW.apartment_id,
      NEW.id,
      NEW.check_out + INTERVAL '2 hours', -- Default 2 hours after checkout
      'needed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto cleaning creation
DROP TRIGGER IF EXISTS auto_create_cleaning_trigger ON reservations;
CREATE TRIGGER auto_create_cleaning_trigger
  AFTER UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION auto_create_cleaning();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_apartments_updated_at ON apartments;
CREATE TRIGGER update_apartments_updated_at
  BEFORE UPDATE ON apartments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cleanings_updated_at ON cleanings;
CREATE TRIGGER update_cleanings_updated_at
  BEFORE UPDATE ON cleanings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cleaners_updated_at ON cleaners;
CREATE TRIGGER update_cleaners_updated_at
  BEFORE UPDATE ON cleaners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Encryption functions for sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto for encryption with a key from environment
  RETURN encode(
    encrypt(
      data::bytea, 
      current_setting('app.encryption_key', true)::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrypt using pgcrypto
  RETURN convert_from(
    decrypt(
      decode(encrypted_data, 'base64'), 
      current_setting('app.encryption_key', true)::bytea, 
      'aes'
    ), 
    'utf8'
  );
END;
$$;

-- Function to get apartment statistics
CREATE OR REPLACE FUNCTION get_apartment_stats(apartment_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
  total_revenue DECIMAL,
  total_nights INTEGER,
  occupancy_rate DECIMAL,
  avg_nightly_rate DECIMAL,
  total_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(r.total_price), 0) as total_revenue,
    COALESCE(SUM(r.check_out::date - r.check_in::date), 0) as total_nights,
    CASE 
      WHEN (end_date - start_date) > 0 
      THEN ROUND((COALESCE(SUM(r.check_out::date - r.check_in::date), 0) * 100.0) / (end_date - start_date), 2)
      ELSE 0
    END as occupancy_rate,
    CASE 
      WHEN SUM(r.check_out::date - r.check_in::date) > 0
      THEN ROUND(SUM(r.total_price) / SUM(r.check_out::date - r.check_in::date), 2)
      ELSE 0
    END as avg_nightly_rate,
    COUNT(*)::INTEGER as total_bookings
  FROM reservations r
  WHERE r.apartment_id = apartment_uuid
    AND r.status IN ('confirmed', 'checked_in', 'checked_out')
    AND r.check_in >= start_date
    AND r.check_out <= end_date
    AND r.owner_id = auth.uid(); -- Ensure user can only access their data
END;
$$;