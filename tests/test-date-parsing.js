const { UniversalICalParser } = require('./src/lib/ical/parser.ts');

// Exemple d'événement iCal Airbnb typique
const testIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20250917
DTEND;VALUE=DATE:20250920
UID:test-september-reservation
SUMMARY:Reserved
DESCRIPTION:Phone: (1207)
END:VEVENT
END:VCALENDAR`;

console.log('Testing iCal date parsing...\n');
console.log('Input iCal:');
console.log('DTSTART: 20250917 (September 17)');
console.log('DTEND: 20250920 (September 20 - EXCLUSIVE per iCal spec)');
console.log('Expected output: Check-in Sep 17, Check-out Sep 19\n');

const parser = new UniversalICalParser();
const events = parser.parse(testIcal, 'airbnb');

console.log('Parsed result:');
events.forEach(event => {
  console.log('Check-in:', event.checkIn.toISOString().split('T')[0], 
              `(${event.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
  console.log('Check-out:', event.checkOut.toISOString().split('T')[0],
              `(${event.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
});

console.log('\n✅ If dates show Sep 17 - Sep 19, the parser is working correctly.');
console.log('❌ If dates show Sep 17 - Sep 20, the fix is not being applied.');