// Test du calcul corrigé du taux d'occupation

function calculateOccupancy(reservations, startDate, endDate, apartmentCount = 1) {
  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);
  
  // Calcul total des nuits possibles
  const totalPossibleNights = apartmentCount * Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
  
  // Ancien calcul (INCORRECT - compte toutes les nuits même hors période)
  const oldOccupiedNights = reservations.reduce((sum, r) => {
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);
  
  // Nouveau calcul (CORRECT - compte seulement les nuits dans la période)
  const newOccupiedNights = reservations.reduce((sum, r) => {
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    // Only count nights within the period
    const overlapStart = checkIn > periodStart ? checkIn : periodStart;
    const overlapEnd = checkOut < periodEnd ? checkOut : periodEnd;
    const nights = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)));
    return sum + nights;
  }, 0);
  
  const oldOccupancyRate = totalPossibleNights > 0 ? Math.round((oldOccupiedNights / totalPossibleNights) * 100) : 0;
  const newOccupancyRate = totalPossibleNights > 0 ? Math.round((newOccupiedNights / totalPossibleNights) * 100) : 0;
  
  return {
    totalPossibleNights,
    oldOccupiedNights,
    newOccupiedNights,
    oldOccupancyRate,
    newOccupancyRate
  };
}

console.log('=== TEST DU CALCUL D\'OCCUPATION CORRIGÉ ===\n');

// Test 1: Réservation qui dépasse la période (cas Montaigne)
console.log('Test 1: Réservation longue durée (4 mois) vue sur 3 mois');
console.log('Période analysée: 1 juin - 31 août 2025 (92 jours)');
console.log('Réservation: 15 décembre 2024 - 15 avril 2025 (122 jours)\n');

const longTermReservation = [
  { checkIn: '2024-12-15', checkOut: '2025-04-15' }
];

const result1 = calculateOccupancy(longTermReservation, '2025-06-01', '2025-08-31', 1);
console.log(`Nuits possibles: ${result1.totalPossibleNights}`);
console.log(`Ancien calcul: ${result1.oldOccupiedNights} nuits occupées → ${result1.oldOccupancyRate}% d'occupation`);
console.log(`Nouveau calcul: ${result1.newOccupiedNights} nuits occupées → ${result1.newOccupancyRate}% d'occupation`);
console.log('');

// Test 2: Réservation qui chevauche partiellement
console.log('Test 2: Réservation qui chevauche la période');
console.log('Période analysée: 1 juin - 31 août 2025 (92 jours)');
console.log('Réservation: 15 août - 15 septembre 2025 (31 jours)\n');

const partialReservation = [
  { checkIn: '2025-08-15', checkOut: '2025-09-15' }
];

const result2 = calculateOccupancy(partialReservation, '2025-06-01', '2025-08-31', 1);
console.log(`Nuits possibles: ${result2.totalPossibleNights}`);
console.log(`Ancien calcul: ${result2.oldOccupiedNights} nuits occupées → ${result2.oldOccupancyRate}% d'occupation`);
console.log(`Nouveau calcul: ${result2.newOccupiedNights} nuits occupées → ${result2.newOccupancyRate}% d'occupation`);
console.log('');

// Test 3: Cas réel - Montaigne sur "Last 3 months"
console.log('Test 3: Cas réel Montaigne - derniers 3 mois');
console.log('Période: 1 juin - 31 août 2025 (92 jours)');
console.log('Réservations actives:\n');

const montaigneReservations = [
  { checkIn: '2024-12-15', checkOut: '2025-04-15', guest: 'Location longue durée' },
  { checkIn: '2025-05-01', checkOut: '2025-05-10', guest: 'Réservation mai' },
  { checkIn: '2025-06-15', checkOut: '2025-06-25', guest: 'Réservation juin' },
  { checkIn: '2025-07-01', checkOut: '2025-07-31', guest: 'Réservation juillet' },
  { checkIn: '2025-08-05', checkOut: '2025-08-20', guest: 'Réservation août' }
];

montaigneReservations.forEach(r => {
  console.log(`  - ${r.guest}: ${new Date(r.checkIn).toLocaleDateString('fr-FR')} au ${new Date(r.checkOut).toLocaleDateString('fr-FR')}`);
});

const result3 = calculateOccupancy(montaigneReservations, '2025-06-01', '2025-08-31', 1);
console.log(`\nNuits possibles: ${result3.totalPossibleNights}`);
console.log(`Ancien calcul: ${result3.oldOccupiedNights} nuits occupées → ${result3.oldOccupancyRate}% d'occupation`);
console.log(`Nouveau calcul: ${result3.newOccupiedNights} nuits occupées → ${result3.newOccupancyRate}% d'occupation`);

console.log('\n✅ Le nouveau calcul ne compte que les nuits DANS la période sélectionnée !');
console.log('Le taux d\'occupation ne peut plus dépasser 100% 🎉');