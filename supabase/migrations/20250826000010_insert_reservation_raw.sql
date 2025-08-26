-- Create a raw insert function to bypass potential issues
CREATE OR REPLACE FUNCTION insert_reservation_raw(
  p_apartment_id UUID,
  p_owner_id UUID,
  p_guest_id UUID,
  p_platform TEXT,
  p_platform_reservation_id TEXT,
  p_check_in DATE,
  p_check_out DATE,
  p_guest_count INT,
  p_total_price DECIMAL,
  p_cleaning_fee DECIMAL,
  p_platform_fee DECIMAL,
  p_currency TEXT,
  p_notes TEXT,
  p_contact_info JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  -- Log what we're receiving
  RAISE NOTICE 'Attempting to insert reservation with platform: %, check_in: %, check_out: %', p_platform, p_check_in, p_check_out;
  
  -- Direct insert with explicit status
  INSERT INTO reservations (
    apartment_id,
    owner_id,
    guest_id,
    platform,
    platform_reservation_id,
    check_in,
    check_out,
    guest_count,
    total_price,
    cleaning_fee,
    platform_fee,
    currency,
    notes,
    contact_info,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_apartment_id,
    p_owner_id,
    p_guest_id,
    p_platform::reservation_platform,  -- Cast to enum type
    p_platform_reservation_id,
    p_check_in,
    p_check_out,
    p_guest_count,
    p_total_price,
    p_cleaning_fee,
    p_platform_fee,
    p_currency,
    p_notes,
    p_contact_info,
    'confirmed'::reservation_status,  -- Explicitly cast status
    NOW(),
    NOW()
  ) RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Raw insert failed: % - SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_reservation_raw TO authenticated;

-- Also check if there's a problem with the enum types
DO $$ 
BEGIN
  -- List all enum values for debugging
  RAISE NOTICE 'reservation_status enum values: %', 
    (SELECT string_agg(enumlabel, ', ') 
     FROM pg_enum 
     WHERE enumtypid = 'reservation_status'::regtype);
  
  RAISE NOTICE 'reservation_platform enum values: %', 
    (SELECT string_agg(enumlabel, ', ') 
     FROM pg_enum 
     WHERE enumtypid = 'reservation_platform'::regtype);
END $$;