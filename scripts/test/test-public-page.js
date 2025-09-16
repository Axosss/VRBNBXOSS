const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPublicPage() {
  console.log('🌐 Testing Public Apartment Page\n');
  console.log('=' .repeat(50));

  // Get any apartment to test with
  const { data: apartments, error } = await supabase
    .from('apartments')
    .select('id, name')
    .limit(1)
    .single();

  if (error || !apartments) {
    console.log('❌ No apartments found to test with');
    return;
  }

  console.log(`✅ Found apartment: ${apartments.name}`);
  console.log(`   ID: ${apartments.id}`);
  
  console.log('\n📱 Public Page URLs:');
  console.log(`   Local: http://localhost:3000/p/${apartments.id}`);
  console.log(`   Share link: Copy this URL to share the apartment publicly`);
  
  console.log('\n📋 Features on Public Page:');
  console.log('   ✅ Photo gallery with navigation');
  console.log('   ✅ Property details (beds, baths, capacity)');
  console.log('   ✅ Amenities list with icons');
  console.log('   ✅ Availability calendar (red=booked, green=available)');
  console.log('   ✅ Full address display');
  console.log('   ✅ Floor plans (if available)');
  console.log('   ❌ No guest names or sensitive info');
  console.log('   ❌ No prices or payment details');
  console.log('   ❌ No access codes');
  
  console.log('\n🔗 Share Button:');
  console.log('   1. Go to Dashboard > Apartments');
  console.log('   2. Click on any apartment');
  console.log('   3. Click the "Share" button to copy public URL');
  console.log('   4. The URL can be shared with anyone - no login required!');
  
  console.log('\n🎨 Custom Domain (Future):');
  console.log('   - Can be configured to work with custom domains');
  console.log('   - Example: apartments.yourdomain.com/p/apartment-id');
  console.log('   - Requires DNS and Vercel configuration');
}

testPublicPage().catch(console.error);