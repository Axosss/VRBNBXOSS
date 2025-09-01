-- Function to get simple statistics for the dashboard
CREATE OR REPLACE FUNCTION get_simple_statistics(
    p_owner_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_apartment_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_apartment_count INTEGER;
    v_total_nights INTEGER;
    v_occupied_nights INTEGER;
    v_total_revenue NUMERIC;
    v_total_guests INTEGER;
    v_total_reservations INTEGER;
    v_occupancy_rate INTEGER;
    v_average_revenue NUMERIC;
    v_monthly_data JSON;
BEGIN
    -- Get apartment count for occupancy calculation
    SELECT COUNT(*)
    INTO v_apartment_count
    FROM apartments
    WHERE owner_id = p_owner_id
        AND status = 'active'
        AND (p_apartment_id IS NULL OR id = p_apartment_id);

    -- Calculate total possible nights
    v_total_nights := v_apartment_count * (p_end_date - p_start_date + 1);

    -- Get reservation statistics
    SELECT 
        COALESCE(SUM(
            LEAST(check_out::DATE, p_end_date) - 
            GREATEST(check_in::DATE, p_start_date)
        ), 0) as occupied_nights,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COALESCE(SUM(guest_count), 0) as total_guests,
        COUNT(*) as total_reservations
    INTO v_occupied_nights, v_total_revenue, v_total_guests, v_total_reservations
    FROM reservations
    WHERE owner_id = p_owner_id
        AND status NOT IN ('cancelled', 'draft')
        AND check_out > p_start_date
        AND check_in <= p_end_date
        AND (p_apartment_id IS NULL OR apartment_id = p_apartment_id);

    -- Calculate occupancy rate and average revenue
    v_occupancy_rate := CASE 
        WHEN v_total_nights > 0 THEN ROUND((v_occupied_nights::NUMERIC / v_total_nights) * 100)
        ELSE 0
    END;

    v_average_revenue := CASE
        WHEN v_total_reservations > 0 THEN ROUND(v_total_revenue / v_total_reservations)
        ELSE 0
    END;

    -- Get monthly data for the current year (January to December)
    WITH months AS (
        SELECT 
            date_trunc('month', generate_series(
                date_trunc('year', CURRENT_DATE),
                date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
                '1 month'::interval
            ))::DATE as month_start,
            date_trunc('month', generate_series(
                date_trunc('year', CURRENT_DATE),
                date_trunc('year', CURRENT_DATE) + INTERVAL '11 months',
                '1 month'::interval
            ))::DATE + INTERVAL '1 month - 1 day' as month_end
    )
    SELECT json_agg(
        json_build_object(
            'month', to_char(m.month_start, 'Mon'),
            'revenue', COALESCE(SUM(r.total_price), 0)
        ) ORDER BY m.month_start
    )
    INTO v_monthly_data
    FROM months m
    LEFT JOIN reservations r ON 
        r.owner_id = p_owner_id
        AND r.status NOT IN ('cancelled', 'draft')
        AND r.check_in <= m.month_end
        AND r.check_out >= m.month_start
        AND (p_apartment_id IS NULL OR r.apartment_id = p_apartment_id)
    GROUP BY m.month_start, m.month_end;

    -- Build result JSON
    v_result := json_build_object(
        'occupancyRate', v_occupancy_rate,
        'totalGuests', v_total_guests,
        'averageRevenue', v_average_revenue,
        'totalRevenue', v_total_revenue,
        'totalReservations', v_total_reservations,
        'monthlyData', v_monthly_data
    );

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_simple_statistics(UUID, DATE, DATE, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_simple_statistics IS 'Returns simple statistics for the analytics dashboard';