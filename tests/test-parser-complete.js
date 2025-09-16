const { UniversalICalParser } = require('./src/lib/ical/parser.ts');

async function testParser() {
  const parser = new UniversalICalParser();
  
  // URL Airbnb fournie
  const airbnbUrl = 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5';
  
  console.log('Testing parser with Airbnb URL...\n');
  console.log('Expected dates for existing reservations:');
  console.log('- Sep 2-5 (if exists in feed)');
  console.log('- Sep 6-9 (if exists in feed)'); 
  console.log('- Sep 17-20 (confirmed in feed)\n');
  console.log('========================================\n');
  
  try {
    const events = await parser.parseFromUrlAsync(airbnbUrl);
    
    console.log(`Total events found: ${events.length}`);
    const reservations = events.filter(e => e.isReservation);
    console.log(`Reservations found: ${reservations.length}\n`);
    
    // Helper to format date consistently
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    reservations.forEach(r => {
      console.log(`Guest: ${r.guestName || 'No name'}`);
      console.log(`Phone: ${r.phoneLast4 ? '****' + r.phoneLast4 : 'No phone'}`);
      console.log(`Check-in:  ${formatLocalDate(r.checkIn)}`);
      console.log(`Check-out: ${formatLocalDate(r.checkOut)}`);
      console.log(`Platform: ${r.platform}`);
      console.log('---');
    });
    
    console.log('\n✅ VERIFICATION:');
    console.log('If only Sep 17-20 appears, then Sep 1-4 and Sep 5-8 are OLD DATA');
    console.log('that should be cleaned from staging table.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParser();