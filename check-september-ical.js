const ical = require('node-ical');

async function checkSeptemberReservation() {
  // URL iCal d'Airbnb pour Boccador
  const icalUrl = 'https://www.airbnb.com/calendar/ical/1251609310007569685.ics?s=2f0f2c95dd488c9e17f1c1f9e90e6ae1';
  
  try {
    console.log('Fetching iCal data...\n');
    const https = require('https');
    
    const icalText = await new Promise((resolve, reject) => {
      https.get(icalUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });
    
    // Parse with node-ical
    const events = ical.parseICS(icalText);
    
    console.log('=== ALL EVENTS IN ICAL ===\n');
    
    // Show ALL events to find Cassandra
    for (const key in events) {
      const event = events[key];
      if (event.type === 'VEVENT') {
        const startDate = event.start;
        const endDate = event.end;
        const summary = event.summary || '';
        
        // Show all reservations (not "Not available")
        if (startDate && endDate && !summary.toLowerCase().includes('not available')) {
          console.log('EVENT:');
          console.log('Summary:', summary);
          console.log('Start:', startDate);
          console.log('End:', endDate);
          
          // Look for Cassandra or September dates
          if (summary.includes('1207') || summary.includes('Cassandra') || 
              (startDate.toString().includes('Sep') && startDate.toString().includes('17'))) {
            console.log('*** POSSIBLE CASSANDRA MATCH ***');
            console.log('UID:', event.uid);
            
            // Find the raw event in the text
            const eventStart = icalText.indexOf(`UID:${event.uid}`);
            if (eventStart !== -1) {
              const beginEvent = icalText.lastIndexOf('BEGIN:VEVENT', eventStart);
              const eventEnd = icalText.indexOf('END:VEVENT', eventStart);
              const rawEvent = icalText.substring(beginEvent, eventEnd + 10);
              console.log('\nRAW ICAL DATA:');
              console.log(rawEvent);
            }
          }
          console.log('-------------------\n');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSeptemberReservation();