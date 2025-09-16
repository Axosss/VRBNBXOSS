const ical = require('node-ical');

// URL réelle d'Airbnb fournie par l'utilisateur
const airbnbUrl = 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5';

console.log('Fetching real Airbnb calendar...\n');

ical.fromURL(airbnbUrl, {}, (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  const events = [];
  for (const key in data) {
    const event = data[key];
    if (event.type === 'VEVENT' && event.summary && event.summary.includes('Reserved')) {
      events.push({
        summary: event.summary,
        start: event.start,
        end: event.end,
        uid: event.uid
      });
    }
  }
  
  // Sort by date
  events.sort((a, b) => a.start - b.start);
  
  console.log('Raw Airbnb reservations from iCal:\n');
  console.log('========================================');
  
  events.forEach(event => {
    console.log(`Summary: ${event.summary}`);
    console.log(`UID: ${event.uid}`);
    console.log(`Raw DTSTART: ${event.start}`);
    console.log(`Raw DTEND: ${event.end}`);
    
    // What dates do we actually get?
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    console.log(`Start parsed: ${startDate.toISOString().split('T')[0]}`);
    console.log(`End parsed: ${endDate.toISOString().split('T')[0]}`);
    
    // Using local components
    const formatLocal = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };
    
    console.log(`Start local: ${formatLocal(startDate)}`);
    console.log(`End local: ${formatLocal(endDate)}`);
    console.log('---');
  });
});