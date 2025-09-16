// Direct test of iCal parsing and database insertion
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' // service role key for testing
);

async function directSync() {
  try {
    console.log('🔄 Fetching iCal data...');
    
    // Fetch iCal data directly
    const icalUrl = 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5';
    const response = await fetch(icalUrl);
    const icalData = await response.text();
    
    console.log(`📊 Fetched ${icalData.length} bytes of iCal data`);
    
    // Parse events (simplified)
    const events = [];
    const lines = icalData.split('\n');
    let currentEvent = null;
    
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('UID:')) {
          currentEvent.uid = line.substring(4).trim();
        } else if (line.startsWith('DTSTART;VALUE=DATE:')) {
          currentEvent.checkIn = line.substring(19).trim();
        } else if (line.startsWith('DTEND;VALUE=DATE:')) {
          currentEvent.checkOut = line.substring(17).trim();
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8).trim();
        }
      }
    }
    
    console.log(`✅ Parsed ${events.length} events`);
    
    // Filter for reservations
    const reservations = events.filter(e => 
      e.summary && !e.summary.includes('Not available') && !e.summary.includes('Airbnb (Not available)')
    );
    
    console.log(`🏠 Found ${reservations.length} reservations`);
    
    // Get or create test user
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    let userId = users?.[0]?.id;
    
    if (!userId) {
      // Create a test user directly in profiles
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: '11111111-1111-1111-1111-111111111111',
          email: 'test@vrbnbxoss.com',
          full_name: 'Test User'
        })
        .select()
        .single();
      
      userId = newProfile?.id || '11111111-1111-1111-1111-111111111111';
    }
    
    console.log(`👤 Using user ID: ${userId}`);
    
    // Use the apartment we just created
    const apartmentId = '51601858-07e4-4d01-939e-da05f8663811';
    
    console.log(`🏠 Using apartment ID: ${apartmentId}`);
    
    // Insert into staging
    let inserted = 0;
    for (const res of reservations) {
      // Parse dates properly
      const checkInStr = res.checkIn;
      const checkOutStr = res.checkOut;
      
      // Convert YYYYMMDD to YYYY-MM-DD
      const checkIn = `${checkInStr.slice(0,4)}-${checkInStr.slice(4,6)}-${checkInStr.slice(6,8)}`;
      const checkOut = `${checkOutStr.slice(0,4)}-${checkOutStr.slice(4,6)}-${checkOutStr.slice(6,8)}`;
      
      // Extract phone if exists
      const phoneMatch = res.summary.match(/\((\d{4})\)/);
      const phoneLast4 = phoneMatch ? phoneMatch[1] : null;
      
      // First check if already exists
      const { data: existing } = await supabase
        .from('reservation_staging')
        .select('id')
        .eq('sync_uid', res.uid)
        .single();

      let error = null;
      
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('reservation_staging')
          .update({
            check_in: checkIn,
            check_out: checkOut,
            status_text: res.summary,
            phone_last_four: phoneLast4,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('reservation_staging')
          .insert({
            apartment_id: apartmentId,
            platform: 'airbnb',
            sync_source: 'airbnb_ical',
            sync_uid: res.uid,
            raw_data: res, // Add the raw event data
            check_in: checkIn,
            check_out: checkOut,
            status_text: res.summary,
            phone_last_four: phoneLast4,
            stage_status: 'pending',
            last_seen_at: new Date().toISOString()
          });
        error = insertError;
      }
      
      if (!error) {
        inserted++;
        console.log(`  ✅ Staged: ${checkIn} to ${checkOut} - ${res.summary}`);
      } else {
        console.log(`  ❌ Error:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully staged ${inserted} reservations`);
    
    // Verify staging table
    const { data: staged, count } = await supabase
      .from('reservation_staging')
      .select('*', { count: 'exact' })
      .eq('stage_status', 'pending');
    
    console.log(`\n📦 Staging table now has ${count} pending imports total`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

directSync();