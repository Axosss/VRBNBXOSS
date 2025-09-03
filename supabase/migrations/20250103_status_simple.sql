-- Migration simple pour changer le système de statuts
-- Approche: on garde le type existant mais on simplifie l'utilisation

BEGIN;

-- 1. Mettre à jour toutes les réservations pour n'utiliser que 'confirmed' ou 'cancelled'
UPDATE reservations 
SET status = CASE
    WHEN status IN ('cancelled') THEN 'cancelled'::reservation_status
    ELSE 'confirmed'::reservation_status
END,
updated_at = NOW()
WHERE status NOT IN ('confirmed', 'cancelled');

-- 2. Mettre à jour la fonction de prévention des double-bookings pour ne vérifier que 'confirmed'
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for overlapping reservations in the same apartment
  -- Only check against confirmed reservations (not cancelled)
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE apartment_id = NEW.apartment_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status = 'confirmed'
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

-- 3. Désactiver le trigger de création automatique de nettoyage
DROP TRIGGER IF EXISTS auto_create_cleaning_trigger ON reservations;
DROP FUNCTION IF EXISTS auto_create_cleaning() CASCADE;

-- 4. Mettre à jour la fonction de statistiques pour ne compter que 'confirmed'
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
    AND r.status = 'confirmed'
    AND r.check_in >= start_date
    AND r.check_out <= end_date
    AND r.owner_id = auth.uid();
END;
$$;

-- 5. Mettre à jour ou créer la vue apartment_stats
CREATE OR REPLACE VIEW apartment_stats AS
SELECT 
    a.id,
    a.name,
    COUNT(DISTINCT r.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as active_bookings,
    COALESCE(SUM(CASE WHEN r.status = 'confirmed' THEN r.total_price ELSE 0 END), 0) as total_revenue,
    COALESCE(AVG(CASE WHEN r.status = 'confirmed' THEN r.total_price ELSE NULL END), 0) as avg_price
FROM apartments a
LEFT JOIN reservations r ON a.id = r.apartment_id
GROUP BY a.id, a.name;

-- 6. Ajouter une contrainte pour empêcher l'utilisation d'autres statuts
ALTER TABLE reservations 
ADD CONSTRAINT check_status_simple 
CHECK (status IN ('confirmed', 'cancelled'));

-- 7. Définir 'confirmed' comme valeur par défaut
ALTER TABLE reservations 
    ALTER COLUMN status SET DEFAULT 'confirmed';

-- 8. Afficher le résumé
DO $$
DECLARE
    total_count INTEGER;
    confirmed_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM reservations;
    SELECT COUNT(*) INTO confirmed_count FROM reservations WHERE status = 'confirmed';
    SELECT COUNT(*) INTO cancelled_count FROM reservations WHERE status = 'cancelled';
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total reservations: %', total_count;
    RAISE NOTICE 'Confirmed reservations: %', confirmed_count;
    RAISE NOTICE 'Cancelled reservations: %', cancelled_count;
END $$;

COMMIT;