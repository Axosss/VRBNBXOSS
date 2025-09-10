const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStatistics() {
  const userId = '4997ae03-f7fe-4709-b885-2b78c435d6cc';
  const currentYear = new Date().getFullYear();
  
  try {
    // Get all reservations for 2025
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_id', userId)
      .lte('check_in', '2025-12-31')
      .gte('check_out', '2025-01-01')
      .order('check_in');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${reservations.length} reservations overlapping 2025\n`);
    
    // Calculate monthly revenue with proration
    const monthlyRevenue = {};
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(2025, month, 1);
      const monthEnd = new Date(2025, month + 1, 0); // Last day of month
      
      let monthTotal = 0;
      
      for (const reservation of reservations) {
        if (reservation.status === 'cancelled' || reservation.status === 'draft') continue;
        
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);
        
        // Check if reservation overlaps with this month
        if (checkOut < monthStart || checkIn > monthEnd) continue;
        
        // Calculate overlap
        const overlapStart = checkIn > monthStart ? checkIn : monthStart;
        const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd;
        
        // Calculate days
        const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
        const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;
        
        // Prorate
        const proratedAmount = (reservation.total_price || 0) * (overlapDays / totalDays);
        
        if (month === 0 || month === 7) { // Debug January and August
          console.log(`${reservation.contact_info?.name || 'Unknown'} (${reservation.check_in} to ${reservation.check_out})`);
          console.log(`  Total: $${reservation.total_price}, Days: ${totalDays}`);
          console.log(`  Overlap days in month: ${overlapDays}`);
          console.log(`  Prorated for month: $${proratedAmount.toFixed(2)}`);
        }
        
        monthTotal += proratedAmount;
      }
      
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
      monthlyRevenue[monthName] = monthTotal;
    }
    
    console.log('\nMonthly Revenue for 2025:');
    console.log('========================');
    Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
      console.log(`${month}: $${revenue.toFixed(2)}`);
    });
    
    const total = Object.values(monthlyRevenue).reduce((sum, val) => sum + val, 0);
    console.log(`\nTotal: $${total.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testStatistics();