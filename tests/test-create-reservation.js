const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateReservation() {
  console.log('Testing reservation creation...\n');
  
  // Get staging reservation
  const { data: staging } = await supabase
    .from('reservation_staging')
    .select('*')
    .eq('stage_status', 'pending')
    .limit(1)
    .single();
    
  if (!staging) {
    console.log('No pending staging reservation found');
    return;
  }
  
  console.log('Found staging reservation:', {
    guest_name: staging.guest_name,
    dates: `${staging.check_in} to ${staging.check_out}`,
    platform: staging.platform
  });
  
  // Try to create reservation with all required fields
  const reservationData = {
    apartment_id: staging.apartment_id,
    owner_id: '4997ae03-f7fe-4709-b885-2b78c435d6cc', // Your user ID
    guest_id: null,
    platform: staging.platform,
    check_in: staging.check_in,
    check_out: staging.check_out,
    total_price: 0,
    cleaning_fee: 0,
    guest_count: 2,
    status: 'confirmed',
    notes: 'Test import'
  };
  
  console.log('\nAttempting to create reservation with:', reservationData);
  
  const { data: newRes, error } = await supabase
    .from('reservations')
    .insert(reservationData)
    .select()
    .single();
    
  if (error) {
    console.error('\n❌ Error creating reservation:', error);
  } else {
    console.log('\n✅ Successfully created reservation!');
    console.log('Reservation ID:', newRes.id);
  }
}

testCreateReservation();