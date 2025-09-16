// Test du calcul pro rata pour une réservation longue durée
// Simulation d'une réservation du 15 décembre 2024 au 15 avril 2025
// avec un loyer mensuel de 3000€

const checkIn = new Date('2024-12-15');
const checkOut = new Date('2025-04-15');
const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
const totalPrice = 12000; // Prix total pour la période (environ 4 mois)
const dailyRate = totalPrice / totalDays;

console.log('=== ANALYSE DU CALCUL PRO RATA ===\n');
console.log(`Réservation du ${checkIn.toLocaleDateString('fr-FR')} au ${checkOut.toLocaleDateString('fr-FR')}`);
console.log(`Durée totale: ${totalDays} jours`);
console.log(`Prix total: ${totalPrice}€`);
console.log(`Prix par jour: ${dailyRate.toFixed(2)}€`);
console.log('\n=== CALCUL ACTUEL (CODE EXISTANT) ===\n');

// Fonction qui reproduit le calcul actuel du code
function calculateCurrentMethod(month, year) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // Dernier jour du mois
  
  // Calculate the overlap period with this month
  const overlapStart = checkIn > monthStart ? checkIn : monthStart;
  const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd;
  
  // Calculate days in the overlap period
  const overlapDays = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1);
  
  // Prorate the revenue for this month
  const proratedAmount = totalDays > 0 ? totalPrice * (overlapDays / totalDays) : 0;
  
  return {
    monthName: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    daysInMonth: monthEnd.getDate(),
    overlapDays: overlapDays,
    proratedAmount: proratedAmount.toFixed(2),
    dailyRevenue: overlapDays > 0 ? (proratedAmount / overlapDays).toFixed(2) : 0
  };
}

// Calcul pour chaque mois
const months = [
  { month: 11, year: 2024 }, // Décembre 2024
  { month: 0, year: 2025 },  // Janvier 2025
  { month: 1, year: 2025 },  // Février 2025
  { month: 2, year: 2025 },  // Mars 2025
  { month: 3, year: 2025 },  // Avril 2025
];

let totalCalculated = 0;
months.forEach(({ month, year }) => {
  const result = calculateCurrentMethod(month, year);
  console.log(`${result.monthName}:`);
  console.log(`  Jours dans le mois: ${result.daysInMonth}`);
  console.log(`  Jours de réservation: ${result.overlapDays}`);
  console.log(`  Montant calculé: ${result.proratedAmount}€`);
  console.log(`  Revenu quotidien: ${result.dailyRevenue}€/jour`);
  console.log('');
  totalCalculated += parseFloat(result.proratedAmount);
});

console.log(`Total calculé: ${totalCalculated.toFixed(2)}€`);
console.log(`Prix total réservation: ${totalPrice}€`);
console.log(`Différence: ${(totalPrice - totalCalculated).toFixed(2)}€`);

console.log('\n=== CALCUL IDÉAL (LOYER MENSUEL FIXE) ===\n');

// Calcul idéal pour un loyer mensuel fixe
function calculateIdealMonthlyRent(month, year) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthlyRent = 3000; // Loyer mensuel fixe
  
  // Déterminer le pourcentage du mois occupé
  let daysOccupied = 0;
  let fullMonth = false;
  
  if (checkIn <= monthStart && checkOut >= monthEnd) {
    // Mois complet
    fullMonth = true;
    daysOccupied = monthEnd.getDate();
  } else if (checkIn > monthStart && checkIn <= monthEnd && checkOut >= monthEnd) {
    // Début partiel
    daysOccupied = monthEnd.getDate() - checkIn.getDate() + 1;
  } else if (checkIn <= monthStart && checkOut >= monthStart && checkOut <= monthEnd) {
    // Fin partielle
    daysOccupied = checkOut.getDate();
  } else if (checkIn > monthStart && checkOut < monthEnd) {
    // Début et fin dans le même mois
    daysOccupied = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  const prorata = fullMonth ? monthlyRent : (monthlyRent / monthEnd.getDate()) * daysOccupied;
  
  return {
    monthName: new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    daysInMonth: monthEnd.getDate(),
    daysOccupied: daysOccupied,
    fullMonth: fullMonth,
    monthlyRent: monthlyRent,
    calculatedRent: prorata.toFixed(2)
  };
}

console.log('Pour un loyer mensuel de 3000€:');
let totalIdeal = 0;
months.forEach(({ month, year }) => {
  const result = calculateIdealMonthlyRent(month, year);
  if (result.daysOccupied > 0) {
    console.log(`${result.monthName}:`);
    console.log(`  ${result.fullMonth ? 'Mois complet' : `${result.daysOccupied}/${result.daysInMonth} jours`}`);
    console.log(`  Montant: ${result.calculatedRent}€`);
    console.log('');
    totalIdeal += parseFloat(result.calculatedRent);
  }
});

console.log(`Total avec loyer mensuel fixe: ${totalIdeal.toFixed(2)}€`);

console.log('\n=== PROBLÈME IDENTIFIÉ ===\n');
console.log('Le calcul actuel divise le prix total par le nombre total de jours,');
console.log('puis multiplie par les jours dans chaque mois.');
console.log('');
console.log('Problème: Février ayant moins de jours (28), il reçoit une part plus faible');
console.log('du montant total, même si le loyer mensuel devrait être identique.');
console.log('');
console.log('Solution proposée: Pour les réservations longue durée (> 30 jours),');
console.log('utiliser un calcul basé sur un loyer mensuel fixe plutôt qu\'un tarif journalier.');