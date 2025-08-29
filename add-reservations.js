// Script pour ajouter les réservations
// IDs des appartements (basé sur l'URL actuelle)
const BOCCADOR_ID = '63561c46-cbc2-4340-8f51-9c798fde898a';
const MONTAIGNE_ID = '987be56d-3c36-42a9-89a6-2a06300a59e9';

// Réservations de test (1 de chaque plateforme)
const testReservations = [
  // Airbnb
  {
    apartmentId: BOCCADOR_ID,
    guestName: 'Sujung Ki',
    platform: 'airbnb',
    checkIn: '2024-12-31',
    checkOut: '2025-01-05',
    guestCount: 4,
    totalPrice: 1494.20,
    currency: 'EUR',
    status: 'confirmed',
    notes: 'Réservation à cheval sur 2024-2025'
  },
  // VRBO
  {
    apartmentId: BOCCADOR_ID,
    guestName: 'Robert Gardiner',
    platform: 'vrbo',
    checkIn: '2025-02-20',
    checkOut: '2025-02-28',
    guestCount: 2,
    totalPrice: 1654.39,
    currency: 'EUR',
    status: 'confirmed'
  },
  // Direct
  {
    apartmentId: BOCCADOR_ID,
    guestName: 'William Tuten',
    platform: 'direct',
    checkIn: '2025-06-04',
    checkOut: '2025-06-27',
    guestCount: 2,
    totalPrice: 5500,
    currency: 'EUR',
    status: 'confirmed'
  }
];

// Toutes les réservations
const allReservations = [
  // AIRBNB 2025
  { apartmentId: BOCCADOR_ID, guestName: 'Sujung Ki', platform: 'airbnb', checkIn: '2024-12-31', checkOut: '2025-01-05', guestCount: 4, totalPrice: 1494.20, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Hamza Taghy', platform: 'airbnb', checkIn: '2025-01-29', checkOut: '2025-02-02', guestCount: 1, totalPrice: 964.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Javier Alvaredo', platform: 'airbnb', checkIn: '2025-03-03', checkOut: '2025-03-08', guestCount: 4, totalPrice: 1205.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Eduard Kankanyan', platform: 'airbnb', checkIn: '2025-03-09', checkOut: '2025-03-12', guestCount: 2, totalPrice: 771.20, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Camilla Colombo', platform: 'airbnb', checkIn: '2025-03-14', checkOut: '2025-03-18', guestCount: 4, totalPrice: 964.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Ramon Montoya', platform: 'airbnb', checkIn: '2025-03-18', checkOut: '2025-03-22', guestCount: 3, totalPrice: 964.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Flor Sabatini', platform: 'airbnb', checkIn: '2025-03-22', checkOut: '2025-03-31', guestCount: 4, totalPrice: 1952.10, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Rahim Gilani', platform: 'airbnb', checkIn: '2025-04-03', checkOut: '2025-04-07', guestCount: 4, totalPrice: 1205.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Poncho Gonzalez', platform: 'airbnb', checkIn: '2025-04-09', checkOut: '2025-04-14', guestCount: 4, totalPrice: 1446.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Jeannie Ryu', platform: 'airbnb', checkIn: '2025-04-14', checkOut: '2025-04-17', guestCount: 4, totalPrice: 915.80, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Diego Lopez', platform: 'airbnb', checkIn: '2025-05-08', checkOut: '2025-05-11', guestCount: 4, totalPrice: 915.80, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Roxanna Tirado', platform: 'airbnb', checkIn: '2025-05-14', checkOut: '2025-05-18', guestCount: 4, totalPrice: 1224.28, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Sandy Hachey', platform: 'airbnb', checkIn: '2025-05-21', checkOut: '2025-05-25', guestCount: 4, totalPrice: 964.00, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Devi Mehta', platform: 'airbnb', checkIn: '2025-08-10', checkOut: '2025-08-15', guestCount: 4, totalPrice: 1494.20, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Germano Maia', platform: 'airbnb', checkIn: '2025-09-06', checkOut: '2025-09-09', guestCount: 4, totalPrice: 1012.20, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Cassandra Wolf', platform: 'airbnb', checkIn: '2025-09-17', checkOut: '2025-09-20', guestCount: 3, totalPrice: 1205.00, currency: 'EUR', status: 'confirmed' },
  
  // VRBO 2025
  { apartmentId: BOCCADOR_ID, guestName: 'Robert Gardiner', platform: 'vrbo', checkIn: '2025-02-20', checkOut: '2025-02-28', guestCount: 2, totalPrice: 1654.39, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Arman Nahavandifar', platform: 'vrbo', checkIn: '2025-04-17', checkOut: '2025-04-30', guestCount: 2, totalPrice: 2688.37, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Michael Bral', platform: 'vrbo', checkIn: '2025-07-11', checkOut: '2025-07-18', guestCount: 4, totalPrice: 2884.94, currency: 'EUR', status: 'confirmed', notes: '2 adults, 2 children' },
  { apartmentId: BOCCADOR_ID, guestName: 'Don Bender', platform: 'vrbo', checkIn: '2025-09-09', checkOut: '2025-09-16', guestCount: 2, totalPrice: 2158.38, currency: 'EUR', status: 'confirmed' },
  
  // Direct 2025
  { apartmentId: BOCCADOR_ID, guestName: 'William Tuten', platform: 'direct', checkIn: '2025-06-04', checkOut: '2025-06-27', guestCount: 2, totalPrice: 5500, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Oga Murray', platform: 'direct', checkIn: '2025-06-28', checkOut: '2025-07-08', guestCount: 4, totalPrice: 2600, currency: 'EUR', status: 'confirmed', contactInfo: { phone: '1-604-329-6364', email: 'nwobosi@hotmail.com' } },
  { apartmentId: BOCCADOR_ID, guestName: 'Laurie Azzano', platform: 'direct', checkIn: '2025-07-08', checkOut: '2025-07-11', guestCount: 4, totalPrice: 1600, currency: 'EUR', status: 'confirmed' },
  { apartmentId: BOCCADOR_ID, guestName: 'Prasanthi Venigalla', platform: 'direct', checkIn: '2025-08-20', checkOut: '2025-08-27', guestCount: 3, totalPrice: 2250, currency: 'EUR', status: 'confirmed', contactInfo: { phone: '+1-973-980-8084' } },
  { apartmentId: BOCCADOR_ID, guestName: 'Mark Rice', platform: 'direct', checkIn: '2025-09-24', checkOut: '2025-10-24', guestCount: 2, totalPrice: 7500, currency: 'EUR', status: 'confirmed', contactInfo: { phone: '+1 (425) 503-4624', email: 'Markhelenrice@gmail.com' } }
];

// Fonction pour créer un guest
async function createGuest(name, email = null, phone = null) {
  const response = await fetch('http://localhost:3000/api/guests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, email, phone })
  });
  
  if (!response.ok) {
    console.error(`Failed to create guest ${name}:`, await response.text());
    return null;
  }
  
  const result = await response.json();
  return result.data.id;
}

// Fonction pour créer une réservation
async function createReservation(reservation) {
  // D'abord créer le guest
  const guestId = await createGuest(
    reservation.guestName,
    reservation.contactInfo?.email,
    reservation.contactInfo?.phone
  );
  
  if (!guestId) {
    console.error(`Skipping reservation for ${reservation.guestName} - guest creation failed`);
    return;
  }
  
  const reservationData = {
    apartmentId: reservation.apartmentId,
    guestId: guestId,
    platform: reservation.platform,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    guestCount: reservation.guestCount,
    totalPrice: reservation.totalPrice,
    currency: reservation.currency,
    status: reservation.status,
    notes: reservation.notes || ''
  };
  
  const response = await fetch('http://localhost:3000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(reservationData)
  });
  
  if (!response.ok) {
    console.error(`Failed to create reservation for ${reservation.guestName}:`, await response.text());
    return;
  }
  
  console.log(`✅ Created reservation for ${reservation.guestName} (${reservation.platform})`);
}

// Fonction principale
async function main() {
  const mode = process.argv[2] || 'test';
  
  if (mode === 'test') {
    console.log('Creating 3 test reservations (1 Airbnb, 1 VRBO, 1 Direct)...');
    for (const reservation of testReservations) {
      await createReservation(reservation);
    }
  } else if (mode === 'all') {
    console.log('Creating all 25 reservations...');
    for (const reservation of allReservations) {
      await createReservation(reservation);
    }
  } else {
    console.log('Usage: node add-reservations.js [test|all]');
    console.log('  test - Create 3 test reservations');
    console.log('  all  - Create all 25 reservations');
  }
}

// Note: Ce script doit être exécuté dans le navigateur ou avec les cookies de session
console.log('Copy this script and run it in the browser console while logged in to VRBNBXOSS');
console.log('Or use: node add-reservations.js test');