const { UniversalICalParser } = require('./src/lib/ical/parser.ts');

async function testSync() {
  const parser = new UniversalICalParser();
  
  // Test Airbnb URL real
  const airbnbUrl = 'https://www.airbnb.com/calendar/ical/923031099322882923.ics?s=75e673bc7ba7e66f3f8c5e0d1e056b5a';
  
  console.log('Fetching Airbnb calendar...\n');
  
  try {
    const events = await parser.parseFromUrlAsync(airbnbUrl);
    
    console.log(`Found ${events.length} total events\n`);
    
    const reservations = events.filter(e => e.isReservation);
    console.log(`Found ${reservations.length} reservations:\n`);
    
    reservations.forEach(r => {
      console.log(`${r.guestName || 'Unknown'}:`);
      console.log(`  Raw checkIn: ${r.checkIn}`);
      console.log(`  Raw checkOut: ${r.checkOut}`);
      console.log(`  ISO checkIn: ${r.checkIn.toISOString().split('T')[0]}`);
      console.log(`  ISO checkOut: ${r.checkOut.toISOString().split('T')[0]}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSync();