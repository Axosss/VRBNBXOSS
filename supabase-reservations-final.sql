-- Script SQL pour Supabase - Version finale
-- À exécuter dans l'éditeur SQL de Supabase

-- Variables (remplacez ces IDs par ceux de votre environnement)
DO $$
DECLARE
  v_user_id UUID := '4997ae03-f7fe-4709-b885-2b78c435d6cc'; -- Remplacez par votre user_id
  v_boccador_id UUID := '63561c46-cbc2-4340-8f51-9c798fde898a'; -- ID de Boccador
  v_montaigne_id UUID := '987be56d-3c36-42a9-89a6-2a06300a59e9'; -- ID de Montaigne
  v_guest_id UUID;
BEGIN
  -- Créer tous les guests (sans ON CONFLICT car pas de contrainte unique sur owner_id+name)
  INSERT INTO guests (owner_id, name) VALUES
    (v_user_id, 'Sujung Ki'),
    (v_user_id, 'Hamza Taghy'),
    (v_user_id, 'Javier Alvaredo'),
    (v_user_id, 'Eduard Kankanyan'),
    (v_user_id, 'Camilla Colombo'),
    (v_user_id, 'Ramon Montoya'),
    (v_user_id, 'Flor Sabatini'),
    (v_user_id, 'Rahim Gilani'),
    (v_user_id, 'Poncho Gonzalez'),
    (v_user_id, 'Jeannie Ryu'),
    (v_user_id, 'Diego Lopez'),
    (v_user_id, 'Roxanna Tirado'),
    (v_user_id, 'Sandy Hachey'),
    (v_user_id, 'Devi Mehta'),
    (v_user_id, 'Germano Maia'),
    (v_user_id, 'Cassandra Wolf'),
    (v_user_id, 'Robert Gardiner'),
    (v_user_id, 'Arman Nahavandifar'),
    (v_user_id, 'Michael Bral'),
    (v_user_id, 'Don Bender'),
    (v_user_id, 'William Tuten'),
    (v_user_id, 'Oga Murray'),
    (v_user_id, 'Laurie Azzano'),
    (v_user_id, 'Prasanthi Venigalla'),
    (v_user_id, 'Mark Rice');

  -- AIRBNB 2025
  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Sujung Ki' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status, notes)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2024-12-31', '2025-01-05', 4, 1494.20, 'EUR', 'confirmed', 'Réservation à cheval sur 2024-2025');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Hamza Taghy' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-01-29', '2025-02-02', 1, 964.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Javier Alvaredo' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-03-03', '2025-03-08', 4, 1205.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Eduard Kankanyan' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-03-09', '2025-03-12', 2, 771.20, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Camilla Colombo' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-03-14', '2025-03-18', 4, 964.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Ramon Montoya' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-03-18', '2025-03-22', 3, 964.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Flor Sabatini' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-03-22', '2025-03-31', 4, 1952.10, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Rahim Gilani' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-04-03', '2025-04-07', 4, 1205.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Poncho Gonzalez' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-04-09', '2025-04-14', 4, 1446.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Jeannie Ryu' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-04-14', '2025-04-17', 4, 915.80, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Diego Lopez' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-05-08', '2025-05-11', 4, 915.80, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Roxanna Tirado' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-05-14', '2025-05-18', 4, 1224.28, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Sandy Hachey' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-05-21', '2025-05-25', 4, 964.00, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Devi Mehta' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-08-10', '2025-08-15', 4, 1494.20, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Germano Maia' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'airbnb'::reservation_platform, '2025-09-06', '2025-09-09', 4, 1012.20, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Cassandra Wolf' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'airbnb'::reservation_platform, '2025-09-17', '2025-09-20', 3, 1205.00, 'EUR', 'confirmed');

  -- VRBO 2025
  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Robert Gardiner' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'vrbo'::reservation_platform, '2025-02-20', '2025-02-28', 2, 1654.39, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Arman Nahavandifar' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'vrbo'::reservation_platform, '2025-04-17', '2025-04-30', 2, 2688.37, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Michael Bral' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status, notes)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'vrbo'::reservation_platform, '2025-07-11', '2025-07-18', 4, 2884.94, 'EUR', 'confirmed', '2 adults, 2 children');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Don Bender' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'vrbo'::reservation_platform, '2025-09-09', '2025-09-16', 2, 2158.38, 'EUR', 'confirmed');

  -- Direct 2025
  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'William Tuten' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'direct'::reservation_platform, '2025-06-04', '2025-06-27', 2, 5500, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Oga Murray' ORDER BY created_at DESC LIMIT 1;
  UPDATE guests SET email = 'nwobosi@hotmail.com', phone = '1-604-329-6364' WHERE id = v_guest_id;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'direct'::reservation_platform, '2025-06-28', '2025-07-08', 4, 2600, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Laurie Azzano' ORDER BY created_at DESC LIMIT 1;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'direct'::reservation_platform, '2025-07-08', '2025-07-11', 4, 1600, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Prasanthi Venigalla' ORDER BY created_at DESC LIMIT 1;
  UPDATE guests SET phone = '+1-973-980-8084' WHERE id = v_guest_id;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_montaigne_id, v_guest_id, 'direct'::reservation_platform, '2025-08-20', '2025-08-27', 3, 2250, 'EUR', 'confirmed');

  SELECT id INTO v_guest_id FROM guests WHERE owner_id = v_user_id AND name = 'Mark Rice' ORDER BY created_at DESC LIMIT 1;
  UPDATE guests SET email = 'Markhelenrice@gmail.com', phone = '+1 (425) 503-4624' WHERE id = v_guest_id;
  INSERT INTO reservations (owner_id, apartment_id, guest_id, platform, check_in, check_out, guest_count, total_price, currency, status)
  VALUES (v_user_id, v_boccador_id, v_guest_id, 'direct'::reservation_platform, '2025-09-24', '2025-10-24', 2, 7500, 'EUR', 'confirmed');

  RAISE NOTICE 'Toutes les réservations ont été créées avec succès !';
END $$;

-- Vérifier les réservations créées
SELECT 
  a.name as apartment,
  COUNT(*) as total_reservations,
  COUNT(CASE WHEN r.platform = 'airbnb' THEN 1 END) as airbnb,
  COUNT(CASE WHEN r.platform = 'vrbo' THEN 1 END) as vrbo,
  COUNT(CASE WHEN r.platform = 'direct' THEN 1 END) as direct,
  SUM(r.total_price) as revenue_total
FROM reservations r
JOIN apartments a ON r.apartment_id = a.id
WHERE r.owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
GROUP BY a.name
ORDER BY a.name;