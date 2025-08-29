-- Script SQL pour insérer les réservations
-- IDs nécessaires
-- User ID: 4997ae03-f7fe-4709-b885-2b78c435d6cc (d'après les logs)
-- Boccador ID: 63561c46-cbc2-4340-8f51-9c798fde898a
-- Montaigne ID: 987be56d-3c36-42a9-89a6-2a06300a59e9

-- D'abord, créer le profil s'il n'existe pas
INSERT INTO profiles (id, full_name, created_at, updated_at)
VALUES ('4997ae03-f7fe-4709-b885-2b78c435d6cc', 'Axel B', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Créer les appartements s'ils n'existent pas
INSERT INTO apartments (id, owner_id, name, address, capacity, bedrooms, bathrooms, status, amenities, access_codes, created_at, updated_at)
VALUES 
  ('63561c46-cbc2-4340-8f51-9c798fde898a', '4997ae03-f7fe-4709-b885-2b78c435d6cc', 'Boccador', 
   '{"street": "3 rue du boccador", "city": "paris", "state": "France", "zipCode": "75008", "country": "France"}',
   4, 2, 2, 'active', ARRAY['Parking']::text[], 
   '{"wifi": {"network": "Bbox-A8BE8039", "password": "WifiPassword123"}, "door": "1234"}'::jsonb,
   NOW(), NOW()),
  ('987be56d-3c36-42a9-89a6-2a06300a59e9', '4997ae03-f7fe-4709-b885-2b78c435d6cc', 'Montaigne',
   '{"street": "26 Avenue Montaigne", "city": "Paris", "state": "France", "zipCode": "75008", "country": "France"}',
   4, 1, 1, 'active', ARRAY[]::text[],
   '{"wifi": {"network": "26Montaigne", "password": "BienvenueaParis"}, "additional": {"Porte 1": "35A91", "Porte 2": "49B05"}}'::jsonb,
   NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Créer les guests (3 de test d'abord)
INSERT INTO guests (id, owner_id, name, created_at, updated_at) VALUES
  (gen_random_uuid(), '4997ae03-f7fe-4709-b885-2b78c435d6cc', 'Sujung Ki', NOW(), NOW()),
  (gen_random_uuid(), '4997ae03-f7fe-4709-b885-2b78c435d6cc', 'Robert Gardiner', NOW(), NOW()),
  (gen_random_uuid(), '4997ae03-f7fe-4709-b885-2b78c435d6cc', 'William Tuten', NOW(), NOW());

-- Créer les 3 réservations de test (1 Airbnb, 1 VRBO, 1 Direct)
WITH guest_ids AS (
  SELECT id, name FROM guests WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
)
INSERT INTO reservations (
  id, owner_id, apartment_id, guest_id, platform, 
  check_in, check_out, guest_count, total_price, currency, status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '4997ae03-f7fe-4709-b885-2b78c435d6cc',
  '63561c46-cbc2-4340-8f51-9c798fde898a', -- Boccador
  guest_ids.id,
  CASE 
    WHEN guest_ids.name = 'Sujung Ki' THEN 'airbnb'
    WHEN guest_ids.name = 'Robert Gardiner' THEN 'vrbo'
    WHEN guest_ids.name = 'William Tuten' THEN 'direct'
  END,
  CASE 
    WHEN guest_ids.name = 'Sujung Ki' THEN '2024-12-31'::date
    WHEN guest_ids.name = 'Robert Gardiner' THEN '2025-02-20'::date
    WHEN guest_ids.name = 'William Tuten' THEN '2025-06-04'::date
  END,
  CASE 
    WHEN guest_ids.name = 'Sujung Ki' THEN '2025-01-05'::date
    WHEN guest_ids.name = 'Robert Gardiner' THEN '2025-02-28'::date
    WHEN guest_ids.name = 'William Tuten' THEN '2025-06-27'::date
  END,
  CASE 
    WHEN guest_ids.name = 'Sujung Ki' THEN 4
    WHEN guest_ids.name = 'Robert Gardiner' THEN 2
    WHEN guest_ids.name = 'William Tuten' THEN 2
  END,
  CASE 
    WHEN guest_ids.name = 'Sujung Ki' THEN 1494.20
    WHEN guest_ids.name = 'Robert Gardiner' THEN 1654.39
    WHEN guest_ids.name = 'William Tuten' THEN 5500.00
  END,
  'EUR',
  'confirmed',
  NOW(),
  NOW()
FROM guest_ids
WHERE guest_ids.name IN ('Sujung Ki', 'Robert Gardiner', 'William Tuten');

-- Vérification
SELECT 
  r.id,
  g.name as guest_name,
  a.name as apartment,
  r.platform,
  r.check_in,
  r.check_out,
  r.guest_count,
  r.total_price,
  r.status
FROM reservations r
JOIN guests g ON r.guest_id = g.id
JOIN apartments a ON r.apartment_id = a.id
WHERE r.owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
ORDER BY r.check_in;