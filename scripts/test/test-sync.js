// Test script to trigger Airbnb sync
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function testSync() {
  try {
    console.log('🔐 Logging in...');
    // Login first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'axel.bocciarelli@gmail.com',
      password: 'Test12345@'
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('✅ Logged in successfully');
    console.log('🔄 Triggering sync...');
    
    // Trigger sync via API
    const response = await fetch('http://localhost:3001/api/sync/airbnb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    console.log('📊 Sync result:', result);
    
    if (result.success) {
      console.log(`✨ Found ${result.reservationsFound} reservations`);
      console.log(`📝 ${result.newReservations || 0} new, ${result.updatedReservations || 0} updated`);
    }
    
    // Check staging table
    const { data: stagingData, error: stagingError } = await supabase
      .from('reservation_staging')
      .select('*')
      .eq('stage_status', 'pending');
    
    if (stagingData) {
      console.log(`\n📦 Staging table has ${stagingData.length} pending imports`);
      stagingData.forEach(item => {
        console.log(`  - ${item.check_in} to ${item.check_out} (${item.status_text})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testSync();