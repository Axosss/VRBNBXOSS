-- Create a simple test table without enums
CREATE OR REPLACE FUNCTION create_simple_test_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS simple_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guest_count INTEGER NOT NULL,
    total_price DECIMAL NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END;
$$;

-- Direct insert function
CREATE OR REPLACE FUNCTION direct_reservation_insert(
  p_apartment_id UUID,
  p_owner_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_guest_count INT,
  p_total_price DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Direct SQL insert bypassing all triggers
  INSERT INTO reservations (
    apartment_id,
    owner_id,
    check_in,
    check_out,
    guest_count,
    total_price,
    platform,
    status
  ) VALUES (
    p_apartment_id,
    p_owner_id,
    p_check_in,
    p_check_out,
    p_guest_count,
    p_total_price,
    'direct'::platform_type,
    'confirmed'::reservation_status
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Direct insert error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- List all reservation-related database objects
CREATE OR REPLACE FUNCTION list_reservation_objects()
RETURNS TABLE(
  object_type TEXT,
  object_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'table' as object_type, tablename as object_name
  FROM pg_tables
  WHERE tablename LIKE '%reservation%'
  AND schemaname = 'public'
  
  UNION ALL
  
  SELECT 'view' as object_type, viewname as object_name
  FROM pg_views
  WHERE viewname LIKE '%reservation%'
  AND schemaname = 'public'
  
  UNION ALL
  
  SELECT 'trigger' as object_type, tgname as object_name
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'reservations';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_simple_test_table TO authenticated;
GRANT EXECUTE ON FUNCTION direct_reservation_insert TO authenticated;
GRANT EXECUTE ON FUNCTION list_reservation_objects TO authenticated;