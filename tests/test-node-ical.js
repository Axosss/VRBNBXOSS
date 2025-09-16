const ical = require('node-ical');

// Exemple d'événement iCal Airbnb avec dates au format DATE (pas DATETIME)
const testIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20250917
DTEND;VALUE=DATE:20250920
UID:test-september
SUMMARY:Reserved (1207)
END:VEVENT
END:VCALENDAR`;

console.log('Testing node-ical parsing...\n');
console.log('Input: DTSTART=20250917, DTEND=20250920\n');

const events = ical.parseICS(testIcal);

for (const key in events) {
  const event = events[key];
  if (event.type === 'VEVENT') {
    console.log('Raw event.start:', event.start);
    console.log('Type of event.start:', typeof event.start);
    console.log('Is Date?:', event.start instanceof Date);
    
    if (event.start && typeof event.start === 'object' && !event.start instanceof Date) {
      console.log('Properties:', Object.keys(event.start));
      console.log('Full object:', JSON.stringify(event.start, null, 2));
    }
    
    console.log('\nRaw event.end:', event.end);
    console.log('Type of event.end:', typeof event.end);
    console.log('Is Date?:', event.end instanceof Date);
    
    if (event.end && typeof event.end === 'object' && !event.end instanceof Date) {
      console.log('Properties:', Object.keys(event.end));
      console.log('Full object:', JSON.stringify(event.end, null, 2));
    }
  }
}