#!/usr/bin/env node
import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:3000';
const BOCCADOR_ID = '63561c46-cbc2-4340-8f51-9c798fde898a';

// Les 3 réservations de test
const testReservations = [
  // Airbnb - à cheval sur 2024-2025
  {
    name: 'Sujung Ki',
    platform: 'airbnb',
    checkIn: '2024-12-31',
    checkOut: '2025-01-05',
    guestCount: 4,
    totalPrice: 1494.20,
    notes: 'Réservation à cheval sur 2024-2025'
  },
  // VRBO
  {
    name: 'Robert Gardiner',
    platform: 'vrbo',
    checkIn: '2025-02-20',
    checkOut: '2025-02-28',
    guestCount: 2,
    totalPrice: 1654.39
  },
  // Direct
  {
    name: 'William Tuten',
    platform: 'direct',
    checkIn: '2025-06-04',
    checkOut: '2025-06-27',
    guestCount: 2,
    totalPrice: 5500
  }
];

// Toutes les réservations
const allReservations = [
  // AIRBNB 2025
  { name: 'Sujung Ki', platform: 'airbnb', checkIn: '2024-12-31', checkOut: '2025-01-05', guestCount: 4, totalPrice: 1494.20 },
  { name: 'Hamza Taghy', platform: 'airbnb', checkIn: '2025-01-29', checkOut: '2025-02-02', guestCount: 1, totalPrice: 964.00 },
  { name: 'Javier Alvaredo', platform: 'airbnb', checkIn: '2025-03-03', checkOut: '2025-03-08', guestCount: 4, totalPrice: 1205.00 },
  { name: 'Eduard Kankanyan', platform: 'airbnb', checkIn: '2025-03-09', checkOut: '2025-03-12', guestCount: 2, totalPrice: 771.20 },
  { name: 'Camilla Colombo', platform: 'airbnb', checkIn: '2025-03-14', checkOut: '2025-03-18', guestCount: 4, totalPrice: 964.00 },
  { name: 'Ramon Montoya', platform: 'airbnb', checkIn: '2025-03-18', checkOut: '2025-03-22', guestCount: 3, totalPrice: 964.00 },
  { name: 'Flor Sabatini', platform: 'airbnb', checkIn: '2025-03-22', checkOut: '2025-03-31', guestCount: 4, totalPrice: 1952.10 },
  { name: 'Rahim Gilani', platform: 'airbnb', checkIn: '2025-04-03', checkOut: '2025-04-07', guestCount: 4, totalPrice: 1205.00 },
  { name: 'Poncho Gonzalez', platform: 'airbnb', checkIn: '2025-04-09', checkOut: '2025-04-14', guestCount: 4, totalPrice: 1446.00 },
  { name: 'Jeannie Ryu', platform: 'airbnb', checkIn: '2025-04-14', checkOut: '2025-04-17', guestCount: 4, totalPrice: 915.80 },
  { name: 'Diego Lopez', platform: 'airbnb', checkIn: '2025-05-08', checkOut: '2025-05-11', guestCount: 4, totalPrice: 915.80 },
  { name: 'Roxanna Tirado', platform: 'airbnb', checkIn: '2025-05-14', checkOut: '2025-05-18', guestCount: 4, totalPrice: 1224.28 },
  { name: 'Sandy Hachey', platform: 'airbnb', checkIn: '2025-05-21', checkOut: '2025-05-25', guestCount: 4, totalPrice: 964.00 },
  { name: 'Devi Mehta', platform: 'airbnb', checkIn: '2025-08-10', checkOut: '2025-08-15', guestCount: 4, totalPrice: 1494.20 },
  { name: 'Germano Maia', platform: 'airbnb', checkIn: '2025-09-06', checkOut: '2025-09-09', guestCount: 4, totalPrice: 1012.20 },
  { name: 'Cassandra Wolf', platform: 'airbnb', checkIn: '2025-09-17', checkOut: '2025-09-20', guestCount: 3, totalPrice: 1205.00 },
  
  // VRBO 2025
  { name: 'Robert Gardiner', platform: 'vrbo', checkIn: '2025-02-20', checkOut: '2025-02-28', guestCount: 2, totalPrice: 1654.39 },
  { name: 'Arman Nahavandifar', platform: 'vrbo', checkIn: '2025-04-17', checkOut: '2025-04-30', guestCount: 2, totalPrice: 2688.37 },
  { name: 'Michael Bral', platform: 'vrbo', checkIn: '2025-07-11', checkOut: '2025-07-18', guestCount: 4, totalPrice: 2884.94, notes: '2 adults, 2 children' },
  { name: 'Don Bender', platform: 'vrbo', checkIn: '2025-09-09', checkOut: '2025-09-16', guestCount: 2, totalPrice: 2158.38 },
  
  // Direct 2025
  { name: 'William Tuten', platform: 'direct', checkIn: '2025-06-04', checkOut: '2025-06-27', guestCount: 2, totalPrice: 5500 },
  { name: 'Oga Murray', platform: 'direct', checkIn: '2025-06-28', checkOut: '2025-07-08', guestCount: 4, totalPrice: 2600, email: 'nwobosi@hotmail.com', phone: '1-604-329-6364' },
  { name: 'Laurie Azzano', platform: 'direct', checkIn: '2025-07-08', checkOut: '2025-07-11', guestCount: 4, totalPrice: 1600 },
  { name: 'Prasanthi Venigalla', platform: 'direct', checkIn: '2025-08-20', checkOut: '2025-08-27', guestCount: 3, totalPrice: 2250, phone: '+1-973-980-8084' },
  { name: 'Mark Rice', platform: 'direct', checkIn: '2025-09-24', checkOut: '2025-10-24', guestCount: 2, totalPrice: 7500, email: 'Markhelenrice@gmail.com', phone: '+1 (425) 503-4624' }
];

// Créer une réservation
async function createReservation(reservation, cookies) {
  try {
    // Créer la réservation directement (sans guest ID pour simplifier)
    const reservationData = {
      apartmentId: BOCCADOR_ID,
      platform: reservation.platform,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      guestCount: reservation.guestCount,
      totalPrice: reservation.totalPrice,
      currency: 'EUR',
      status: 'confirmed',
      notes: reservation.notes || `Guest: ${reservation.name}${reservation.email ? ', Email: ' + reservation.email : ''}${reservation.phone ? ', Phone: ' + reservation.phone : ''}`
    };

    console.log(`Creating reservation for ${reservation.name}...`);
    
    const response = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${error.substring(0, 100)}`);
      return false;
    }

    console.log(`✅ Created ${reservation.platform} reservation for ${reservation.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error for ${reservation.name}:`, error.message);
    return false;
  }
}

// Main
async function main() {
  const mode = process.argv[2] || 'test';
  const cookies = process.argv[3];

  if (!cookies) {
    console.log('❌ Missing cookies. Usage:');
    console.log('node create-reservations.mjs test "your-cookie-string"');
    console.log('node create-reservations.mjs all "your-cookie-string"');
    console.log('\nTo get cookies:');
    console.log('1. Open Chrome DevTools on VRBNBXOSS');
    console.log('2. Go to Network tab');
    console.log('3. Find any API request');
    console.log('4. Copy the Cookie header value');
    return;
  }

  const reservations = mode === 'all' ? allReservations : testReservations;
  
  console.log(`Creating ${reservations.length} reservations...`);
  
  let success = 0;
  for (const reservation of reservations) {
    if (await createReservation(reservation, cookies)) {
      success++;
    }
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Successfully created ${success}/${reservations.length} reservations`);
}

main().catch(console.error);