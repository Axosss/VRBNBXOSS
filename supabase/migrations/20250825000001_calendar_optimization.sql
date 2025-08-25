-- Calendar Optimization Migration
-- Adds indexes and database functions for efficient calendar queries

-- Create indexes for fast calendar queries
CREATE INDEX IF NOT EXISTS idx_reservations_apartment_checkin 
ON public.reservations (apartment_id, check_in);

CREATE INDEX IF NOT EXISTS idx_reservations_apartment_checkout 
ON public.reservations (apartment_id, check_out);

CREATE INDEX IF NOT EXISTS idx_reservations_owner_checkin 
ON public.reservations (owner_id, check_in);

CREATE INDEX IF NOT EXISTS idx_reservations_owner_dates 
ON public.reservations (owner_id, check_in, check_out) 
WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_reservations_apartment_dates_status 
ON public.reservations (apartment_id, check_in, check_out, status);

-- Add index on cleanings for calendar integration
CREATE INDEX IF NOT EXISTS idx_cleanings_apartment_date 
ON public.cleanings (apartment_id, scheduled_date);

-- Function to get calendar data efficiently
CREATE OR REPLACE FUNCTION get_calendar_data(
    p_owner_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_apartment_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    apartment_id UUID,
    apartment_name TEXT,
    guest_name TEXT,
    platform TEXT,
    check_in DATE,
    check_out DATE,
    guest_count INTEGER,
    total_price NUMERIC,
    status TEXT,
    notes TEXT,
    contact_info JSONB,
    cleaning_id UUID,
    cleaning_status TEXT,
    cleaning_date TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.apartment_id,
        a.name as apartment_name,
        COALESCE(g.name, 
            CASE 
                WHEN r.contact_info->>'name' IS NOT NULL THEN r.contact_info->>'name'
                WHEN r.contact_info->>'guest_name' IS NOT NULL THEN r.contact_info->>'guest_name'
                ELSE 'Guest'
            END
        ) as guest_name,
        r.platform,
        r.check_in::DATE,
        r.check_out::DATE,
        r.guest_count,
        r.total_price,
        r.status,
        r.notes,
        r.contact_info,
        c.id as cleaning_id,
        c.status as cleaning_status,
        c.scheduled_date as cleaning_date
    FROM reservations r
    INNER JOIN apartments a ON r.apartment_id = a.id
    LEFT JOIN guests g ON r.guest_id = g.id
    LEFT JOIN cleanings c ON c.reservation_id = r.id 
        AND c.scheduled_date BETWEEN p_start_date AND p_end_date
    WHERE 
        r.owner_id = p_owner_id
        AND r.status != 'cancelled'
        AND (
            (r.check_in BETWEEN p_start_date AND p_end_date)
            OR (r.check_out BETWEEN p_start_date AND p_end_date)
            OR (r.check_in <= p_start_date AND r.check_out >= p_end_date)
        )
        AND (
            p_apartment_ids IS NULL 
            OR r.apartment_id = ANY(p_apartment_ids)
        )
    ORDER BY r.check_in ASC, a.name ASC;
END;
$$;

-- Function to check availability for a date range
CREATE OR REPLACE FUNCTION check_availability(
    p_apartment_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM reservations
    WHERE 
        apartment_id = p_apartment_id
        AND status != 'cancelled'
        AND (
            (check_in < p_check_out AND check_out > p_check_in)
        )
        AND (
            p_exclude_reservation_id IS NULL 
            OR id != p_exclude_reservation_id
        );
    
    RETURN conflict_count = 0;
END;
$$;

-- Function to get availability gaps for an apartment
CREATE OR REPLACE FUNCTION get_availability_gaps(
    p_apartment_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_min_gap_days INTEGER DEFAULT 1
)
RETURNS TABLE (
    gap_start DATE,
    gap_end DATE,
    gap_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH reservation_dates AS (
        SELECT 
            check_in,
            check_out,
            LAG(check_out) OVER (ORDER BY check_in) AS prev_checkout
        FROM reservations
        WHERE 
            apartment_id = p_apartment_id
            AND status != 'cancelled'
            AND check_out >= p_start_date
            AND check_in <= p_end_date
        ORDER BY check_in
    ),
    gaps AS (
        SELECT 
            GREATEST(COALESCE(prev_checkout, p_start_date), p_start_date) AS gap_start,
            LEAST(check_in, p_end_date) AS gap_end
        FROM reservation_dates
        WHERE 
            prev_checkout IS NOT NULL
            AND prev_checkout < check_in
        
        UNION ALL
        
        -- Gap at the beginning
        SELECT 
            p_start_date,
            LEAST((SELECT MIN(check_in) FROM reservation_dates), p_end_date)
        WHERE (SELECT MIN(check_in) FROM reservation_dates) > p_start_date
        
        UNION ALL
        
        -- Gap at the end
        SELECT 
            GREATEST((SELECT MAX(check_out) FROM reservation_dates), p_start_date),
            p_end_date
        WHERE (SELECT MAX(check_out) FROM reservation_dates) < p_end_date
    )
    SELECT 
        g.gap_start,
        g.gap_end,
        (g.gap_end - g.gap_start)::INTEGER as gap_days
    FROM gaps g
    WHERE 
        g.gap_end > g.gap_start
        AND (g.gap_end - g.gap_start) >= p_min_gap_days
    ORDER BY g.gap_start;
END;
$$;

-- Function to get occupancy statistics for calendar view
CREATE OR REPLACE FUNCTION get_calendar_stats(
    p_owner_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_apartment_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    total_nights INTEGER,
    occupied_nights INTEGER,
    occupancy_rate NUMERIC,
    total_revenue NUMERIC,
    total_reservations BIGINT,
    platform_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_possible_nights INTEGER;
    apartment_count INTEGER;
BEGIN
    -- Calculate total possible nights
    SELECT 
        CASE 
            WHEN p_apartment_ids IS NULL THEN COUNT(*)
            ELSE array_length(p_apartment_ids, 1)
        END * (p_end_date - p_start_date)
    INTO apartment_count, total_possible_nights
    FROM apartments
    WHERE 
        owner_id = p_owner_id
        AND status = 'active'
        AND (
            p_apartment_ids IS NULL 
            OR id = ANY(p_apartment_ids)
        );

    RETURN QUERY
    WITH reservation_stats AS (
        SELECT 
            SUM((LEAST(check_out::DATE, p_end_date) - GREATEST(check_in::DATE, p_start_date)))::INTEGER as occupied_nights,
            SUM(total_price) as total_revenue,
            COUNT(*) as reservation_count,
            JSONB_OBJECT_AGG(platform, platform_count) as platform_breakdown
        FROM (
            SELECT 
                r.check_in,
                r.check_out,
                r.total_price,
                r.platform,
                COUNT(*) as platform_count
            FROM reservations r
            WHERE 
                r.owner_id = p_owner_id
                AND r.status NOT IN ('cancelled', 'draft')
                AND r.check_out > p_start_date
                AND r.check_in < p_end_date
                AND (
                    p_apartment_ids IS NULL 
                    OR r.apartment_id = ANY(p_apartment_ids)
                )
            GROUP BY r.id, r.check_in, r.check_out, r.total_price, r.platform
        ) sub
        GROUP BY platform
    )
    SELECT 
        total_possible_nights,
        COALESCE(rs.occupied_nights, 0),
        CASE 
            WHEN total_possible_nights > 0 THEN 
                ROUND((COALESCE(rs.occupied_nights, 0)::NUMERIC / total_possible_nights) * 100, 2)
            ELSE 0
        END,
        COALESCE(rs.total_revenue, 0),
        COALESCE(rs.reservation_count, 0),
        COALESCE(rs.platform_breakdown, '{}'::JSONB)
    FROM reservation_stats rs;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_calendar_data(UUID, DATE, DATE, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_availability(UUID, DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_availability_gaps(UUID, DATE, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_stats(UUID, DATE, DATE, UUID[]) TO authenticated;

-- Create a view for simplified calendar queries
CREATE OR REPLACE VIEW calendar_view AS
SELECT 
    r.id,
    r.apartment_id,
    r.owner_id,
    a.name as apartment_name,
    COALESCE(g.name, 
        CASE 
            WHEN r.contact_info->>'name' IS NOT NULL THEN r.contact_info->>'name'
            WHEN r.contact_info->>'guest_name' IS NOT NULL THEN r.contact_info->>'guest_name'
            ELSE 'Guest'
        END
    ) as guest_name,
    r.platform,
    r.check_in,
    r.check_out,
    r.guest_count,
    r.total_price,
    r.status,
    r.notes,
    r.contact_info,
    -- Calculate duration in nights
    (r.check_out::DATE - r.check_in::DATE) as nights,
    -- Add cleaning information
    c.id as cleaning_id,
    c.status as cleaning_status,
    c.scheduled_date as cleaning_date
FROM reservations r
INNER JOIN apartments a ON r.apartment_id = a.id
LEFT JOIN guests g ON r.guest_id = g.id
LEFT JOIN cleanings c ON c.reservation_id = r.id
WHERE r.status != 'cancelled';

-- Grant access to the view
GRANT SELECT ON calendar_view TO authenticated;

-- Note: Views in PostgreSQL don't support RLS policies directly
-- Security is enforced through the RLS policies on the underlying tables
-- The view will automatically respect the RLS on reservations, apartments, etc.

-- Add comments for documentation
COMMENT ON FUNCTION get_calendar_data(UUID, DATE, DATE, UUID[]) IS 
'Efficiently retrieves calendar data for a date range with optional apartment filtering';

COMMENT ON FUNCTION check_availability(UUID, DATE, DATE, UUID) IS 
'Checks if an apartment is available for the specified date range, optionally excluding a reservation';

COMMENT ON FUNCTION get_availability_gaps(UUID, DATE, DATE, INTEGER) IS 
'Finds available gaps between reservations for an apartment in a date range';

COMMENT ON FUNCTION get_calendar_stats(UUID, DATE, DATE, UUID[]) IS 
'Calculates occupancy and revenue statistics for calendar view';

COMMENT ON VIEW calendar_view IS 
'Simplified view for calendar queries with guest names and cleaning information';