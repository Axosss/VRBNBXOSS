const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestReservation() {
  console.log('Creating test reservation for Sep 17-20 to test conflict detection...\n');
  
  // Get first apartment
  const { data: apartment } = await supabase
    .from('apartments')
    .select('id, name')
    .limit(1)
    .single();
    
  if (!apartment) {
    console.error('No apartment found');
    return;
  }
  
  console.log(`Using apartment: ${apartment.name}`);
  
  // Create a test guest
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      name: 'Test Guest for Conflict',
      email: 'test@example.com',
      created_by: '4997ae03-f7fe-4709-b885-2b78c435d6cc' // Your user ID
    })
    .select()
    .single();
    
  if (guestError) {
    console.error('Error creating guest:', guestError);
    return;
  }
  
  // Create reservation for Sep 17-20
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      apartment_id: apartment.id,
      guest_id: guest.id,
      check_in: '2025-09-17',
      check_out: '2025-09-20',
      platform: 'direct',
      status: 'confirmed',
      total_price: 1000,
      guest_count: 2,
      notes: 'Test reservation to check conflict detection',
      created_by: '4997ae03-f7fe-4709-b885-2b78c435d6cc'
    })
    .select()
    .single();
    
  if (resError) {
    console.error('Error creating reservation:', resError);
    return;
  }
  
  console.log('\n✅ Test reservation created successfully!');
  console.log(`Reservation ID: ${reservation.id}`);
  console.log(`Dates: Sep 17-20, 2025`);
  console.log('\nNow when you sync, the Sep 17-20 Airbnb reservation should show a CONFLICT badge!');
}

createTestReservation();