async function getTestApartment() {
  console.log('🏠 Finding test apartment...\n');
  
  // List of apartment IDs from the console logs
  const knownApartmentIds = [
    '987be56d-3c36-42a9-89a6-2a06300a59e9',
    '63561c46-cbc2-4340-8f51-9c798fde898a'
  ];
  
  console.log('📱 Public Page URLs to test:\n');
  
  knownApartmentIds.forEach((id, index) => {
    console.log(`Apartment ${index + 1}:`);
    console.log(`  ID: ${id}`);
    console.log(`  Public URL: http://localhost:3000/p/${id}`);
    console.log(`  Dashboard URL: http://localhost:3000/dashboard/apartments/${id}`);
    console.log('');
  });
  
  console.log('🎯 How to test:');
  console.log('1. Open any public URL above in your browser');
  console.log('2. No login required - it\'s publicly accessible!');
  console.log('3. You\'ll see photos, calendar, amenities, etc.');
  console.log('');
  console.log('📤 To share:');
  console.log('1. Go to the Dashboard URL');
  console.log('2. Click the "Share" button');
  console.log('3. The public URL is copied to clipboard');
  console.log('4. Send it to anyone - they can view without login!');
}

getTestApartment().catch(console.error);