// Force complete resync by calling the API directly
const fetch = require('node-fetch');

async function forceResync() {
  console.log('Forcing complete resync with corrected date logic...\n');
  
  try {
    // Call the sync endpoint
    const response = await fetch('http://localhost:3001/api/sync/airbnb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add your session cookie here
        'Cookie': '' // Add your cookie from the browser
      },
      body: JSON.stringify({
        forceRefresh: true
      })
    });
    
    if (!response.ok) {
      console.error('Sync failed:', response.status, response.statusText);
      console.log('\n⚠️  Please run this sync from the web interface instead.');
      console.log('The date correction is now in place and will apply to new syncs.');
      return;
    }
    
    const result = await response.json();
    console.log('Sync result:', result);
    
    if (result.success) {
      console.log('\n✅ Sync completed successfully!');
      console.log(`Found ${result.eventsFound} events`);
      console.log(`${result.newReservations} new reservations`);
      console.log(`${result.updatedReservations} updated reservations`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n⚠️  Could not connect to localhost:3001');
    console.log('Please make sure the dev server is running and try clicking "Sync Now" in the web interface.');
  }
}

console.log('================================================================');
console.log('IMPORTANT: The date correction has been applied to the parser.');
console.log('');
console.log('To see the corrected dates, you need to:');
console.log('1. Click "Sync Now" in the web interface');
console.log('2. The system will re-import all reservations with correct dates');
console.log('');
console.log('The old entries with wrong dates will be updated automatically.');
console.log('================================================================\n');

// Don't run automatically - just show instructions
console.log('Please go to your browser and click the "Sync Now" button.');