const ical = require('node-ical');

// Test avec plusieurs formats de dates pour comprendre le problème
const testCases = [
  {
    name: "Airbnb Sep 2-5 (Kam Sangha)",
    ical: `BEGIN:VEVENT
DTSTART;VALUE=DATE:20250902
DTEND;VALUE=DATE:20250905
SUMMARY:Reserved (1207)
END:VEVENT`,
    expected: "Sep 2 - Sep 5"
  },
  {
    name: "Airbnb Sep 6-9 (Germano)",
    ical: `BEGIN:VEVENT
DTSTART;VALUE=DATE:20250906
DTEND;VALUE=DATE:20250909
SUMMARY:Reserved (4075)
END:VEVENT`,
    expected: "Sep 6 - Sep 9"
  },
  {
    name: "Airbnb Sep 17-20 (Cassandra)",
    ical: `BEGIN:VEVENT
DTSTART;VALUE=DATE:20250917
DTEND;VALUE=DATE:20250920
SUMMARY:Reserved (8772)
END:VEVENT`,
    expected: "Sep 17 - Sep 20"
  }
];

console.log('Testing how node-ical parses different dates:\n');
console.log('=====================================');

testCases.forEach(test => {
  const fullIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb//EN
${test.ical}
END:VCALENDAR`;

  const events = ical.parseICS(fullIcal);
  
  for (const key in events) {
    const event = events[key];
    if (event.type === 'VEVENT') {
      console.log(`\n${test.name}`);
      console.log(`Expected: ${test.expected}`);
      
      const start = event.start;
      const end = event.end;
      
      console.log(`Raw start: ${start}`);
      console.log(`Raw end: ${end}`);
      
      // What dates do we get?
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      console.log(`Start parsed: ${startDate.toISOString().split('T')[0]} (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
      console.log(`End parsed: ${endDate.toISOString().split('T')[0]} (${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
      
      // If we add 1 day to both
      const startPlus1 = new Date(start.getTime() + 24*60*60*1000);
      const endPlus1 = new Date(end.getTime() + 24*60*60*1000);
      
      console.log(`Start +1 day: ${startPlus1.toISOString().split('T')[0]} (${startPlus1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
      console.log(`End +1 day: ${endPlus1.toISOString().split('T')[0]} (${endPlus1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`);
      
      console.log(`dateOnly flag: ${start.dateOnly}`);
    }
  }
});

console.log('\n=====================================');
console.log('\nCONCLUSION:');
console.log('- If node-ical gives us Sep 1 for DTSTART:20250902, we need +1 day');
console.log('- If node-ical gives us Sep 4 for DTEND:20250905, we need +0 days (already correct)');
console.log('- So we need: +1 day for START, +0 days for END');