-- Simplification du système de statuts des réservations
-- On garde seulement confirmed et cancelled pour simplifier la gestion

-- 1. Dabord, sauvegarder les données actuelles et convertir les statuts existants
BEGIN;

-- Créer une table temporaire pour stocker les anciens statuts (au cas où)
CREATE TABLE IF NOT EXISTS _backup_reservation_status AS
SELECT id, status::text as status, updated_at
FROM reservations;

-- 2. Sauvegarder et supprimer les vues qui dépendent de la colonne status
-- Supprimer temporairement les vues pour pouvoir modifier le type
DROP VIEW IF EXISTS apartment_stats CASCADE;
DROP VIEW IF EXISTS yearly_apartment_stats CASCADE;
DROP VIEW IF EXISTS monthly_apartment_stats CASCADE;

-- 3. Convertir la colonne status en TEXT temporairement pour eviter les erreurs de type
ALTER TABLE reservations 
    ALTER COLUMN status TYPE TEXT;

-- 4. Mettre a jour tous les statuts vers le systeme simplifie (en TEXT)
UPDATE reservations 
SET status = CASE
    -- Les statuts annulés restent "cancelled"
    WHEN status = 'cancelled' 
    THEN 'cancelled'
    -- Tous les autres statuts deviennent "confirmed"
    ELSE 'confirmed'
END,
updated_at = NOW();

-- 5. Supprimer l'ancien type enum et créer le nouveau
DROP TYPE IF EXISTS reservation_status CASCADE;

CREATE TYPE reservation_status AS ENUM (
    'confirmed',
    'cancelled'
);

-- 6. Convertir la colonne pour utiliser le nouveau type enum
ALTER TABLE reservations 
    ALTER COLUMN status TYPE reservation_status 
    USING status::reservation_status;

-- 7. Definir confirmed comme valeur par defaut
ALTER TABLE reservations 
    ALTER COLUMN status SET DEFAULT 'confirmed';

-- 8. Mettre a jour la fonction de prevention des double-bookings
-- Elle fonctionne deja correctement en excluant cancelled
-- Pas de changement necessaire car elle verifie deja NOT IN (cancelled, archived)
-- On va juste loptimiser pour le nouveau systeme

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
    AND status = 'confirmed'  -- Simplifié: on vérifie seulement les confirmées
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

-- 9. Desactiver le trigger de creation automatique de nettoyage base sur le statut
-- (puisquon na plus de statut checked_out)
DROP TRIGGER IF EXISTS auto_create_cleaning_trigger ON reservations;
DROP FUNCTION IF EXISTS auto_create_cleaning();

-- 10. Mettre a jour la fonction de statistiques pour le nouveau systeme
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
    AND r.status = 'confirmed'  -- Simplifié: seulement les confirmées comptent
    AND r.check_in >= start_date
    AND r.check_out <= end_date
    AND r.owner_id = auth.uid();
END;
$$;

-- 11. Recreer les vues qui dependaient de la colonne status
-- Recreer apartment_stats avec le nouveau systeme de statuts
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

-- 12. Afficher un resume de la migration
DO $$
DECLARE
    total_count INTEGER;
    confirmed_count INTEGER;
    cancelled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM reservations;
    SELECT COUNT(*) INTO confirmed_count FROM reservations WHERE status = 'confirmed';
    SELECT COUNT(*) INTO cancelled_count FROM reservations WHERE status = 'cancelled';
    
    RAISE NOTICE 'Migration terminee avec succes!';
    RAISE NOTICE 'Total des reservations: %', total_count;
    RAISE NOTICE 'Reservations confirmees: %', confirmed_count;
    RAISE NOTICE 'Reservations annulees: %', cancelled_count;
END $$;

COMMIT;