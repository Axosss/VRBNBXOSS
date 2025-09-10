// Test de la nouvelle logique de calcul pro rata
// Simule le nouveau calcul implémenté dans l'API

function calculateNewProrata(checkInDate, checkOutDate, totalPrice, monthStart, monthEnd) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const monthStartDate = new Date(monthStart);
  const monthEndDate = new Date(monthEnd);
  
  // Calculate total days of the reservation
  const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
  
  // Check if this is a long-term rental (> 30 days)
  const isLongTermRental = totalDays > 30;
  
  let proratedAmount = 0;
  
  if (isLongTermRental) {
    // For long-term rentals, use fixed monthly rent calculation
    
    // Calculate the number of full months in the reservation
    const totalMonths = Math.max(1, Math.round(totalDays / 30));
    const monthlyRent = totalPrice / totalMonths;
    
    // Check if current month is fully within the reservation period
    const isFullMonth = checkIn <= monthStartDate && checkOut >= monthEndDate;
    
    if (isFullMonth) {
      // Full month = full monthly rent
      proratedAmount = monthlyRent;
    } else {
      // Partial month - calculate based on days occupied
      const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate;
      const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate;
      const overlapDays = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1);
      const daysInMonth = new Date(monthEndDate.getFullYear(), monthEndDate.getMonth() + 1, 0).getDate();
      
      // Prorate monthly rent based on days occupied in this month
      proratedAmount = (monthlyRent / daysInMonth) * overlapDays;
    }
  } else {
    // For short-term rentals, use the original daily rate calculation
    const overlapStart = checkIn > monthStartDate ? checkIn : monthStartDate;
    const overlapEnd = checkOut < monthEndDate ? checkOut : monthEndDate;
    const overlapDays = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1);
    
    // Prorate based on daily rate
    proratedAmount = totalDays > 0 ? totalPrice * (overlapDays / totalDays) : 0;
  }
  
  return proratedAmount;
}

console.log('=== TEST DE LA NOUVELLE LOGIQUE DE CALCUL ===\n');

// Test 1: Location longue durée (4 mois) - cas Montaigne
console.log('Test 1: Location longue durée (15/12/2024 au 15/04/2025)');
console.log('Prix total: 12000€ (environ 3000€/mois)');
console.log('----------------------------------------');

const longTermTests = [
  { month: 'Décembre 2024', start: '2024-12-01', end: '2024-12-31' },
  { month: 'Janvier 2025', start: '2025-01-01', end: '2025-01-31' },
  { month: 'Février 2025', start: '2025-02-01', end: '2025-02-28' },
  { month: 'Mars 2025', start: '2025-03-01', end: '2025-03-31' },
  { month: 'Avril 2025', start: '2025-04-01', end: '2025-04-30' }
];

let totalLongTerm = 0;
longTermTests.forEach(({ month, start, end }) => {
  const amount = calculateNewProrata('2024-12-15', '2025-04-15', 12000, start, end);
  console.log(`${month}: ${amount.toFixed(2)}€`);
  totalLongTerm += amount;
});

console.log(`\nTotal calculé: ${totalLongTerm.toFixed(2)}€`);
console.log(`Prix de la réservation: 12000€`);
console.log(`Différence: ${(12000 - totalLongTerm).toFixed(2)}€\n`);

// Test 2: Location courte durée (10 jours)
console.log('Test 2: Location courte durée (01/02/2025 au 10/02/2025)');
console.log('Prix total: 1000€ (100€/jour)');
console.log('----------------------------------------');

const shortTermTests = [
  { month: 'Janvier 2025', start: '2025-01-01', end: '2025-01-31' },
  { month: 'Février 2025', start: '2025-02-01', end: '2025-02-28' },
  { month: 'Mars 2025', start: '2025-03-01', end: '2025-03-31' }
];

let totalShortTerm = 0;
shortTermTests.forEach(({ month, start, end }) => {
  const amount = calculateNewProrata('2025-02-01', '2025-02-10', 1000, start, end);
  if (amount > 0) {
    console.log(`${month}: ${amount.toFixed(2)}€`);
    totalShortTerm += amount;
  }
});

console.log(`\nTotal calculé: ${totalShortTerm.toFixed(2)}€`);
console.log(`Prix de la réservation: 1000€`);

// Test 3: Comparaison avec l'ancienne méthode pour location longue durée
console.log('\n=== COMPARAISON ANCIENNE VS NOUVELLE MÉTHODE ===\n');
console.log('Location longue durée - Février 2025:');

// Ancienne méthode
const checkIn = new Date('2024-12-15');
const checkOut = new Date('2025-04-15');
const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
const oldMethodFeb = (12000 * (28 / totalDays));
console.log(`Ancienne méthode: ${oldMethodFeb.toFixed(2)}€ (basé sur tarif journalier)`);

// Nouvelle méthode
const newMethodFeb = calculateNewProrata('2024-12-15', '2025-04-15', 12000, '2025-02-01', '2025-02-28');
console.log(`Nouvelle méthode: ${newMethodFeb.toFixed(2)}€ (basé sur loyer mensuel fixe)`);
console.log(`Différence: +${(newMethodFeb - oldMethodFeb).toFixed(2)}€ pour février`);

console.log('\n✅ Avec la nouvelle méthode, les mois complets auront tous le même montant !');