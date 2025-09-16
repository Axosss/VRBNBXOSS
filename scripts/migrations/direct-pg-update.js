const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Parse the Supabase URL to get database connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbUrl = supabaseUrl.replace('https://', '').split('.')[0];

// Construct PostgreSQL connection string
const connectionString = `postgresql://postgres.${dbUrl}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

async function directDatabaseUpdate() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database directly\n');

    // First, let's see what's actually in the database
    const checkResult = await client.query(`
      SELECT id, status, apartment_id 
      FROM reservations 
      WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
      LIMIT 5
    `);
    
    console.log('Sample reservations:');
    checkResult.rows.forEach(row => {
      console.log(`- ${row.id}: status=${row.status}, apartment=${row.apartment_id}`);
    });

    // Check the actual enum values in the database
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'reservation_status'::regtype
      ORDER BY enumsortorder
    `);
    
    console.log('\nActual enum values in database:');
    enumResult.rows.forEach(row => {
      console.log(`- ${row.enumlabel}`);
    });

    // Now try to update directly
    console.log('\nAttempting to update all reservations to Boccador...');
    
    const updateResult = await client.query(`
      UPDATE reservations 
      SET apartment_id = '63561c46-cbc2-4340-8f51-9c798fde898a'
      WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
      RETURNING id
    `);
    
    console.log(`\n✅ Successfully updated ${updateResult.rowCount} reservations!`);

    // Verify the update
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN apartment_id = '63561c46-cbc2-4340-8f51-9c798fde898a' THEN 1 END) as boccador
      FROM reservations 
      WHERE owner_id = '4997ae03-f7fe-4709-b885-2b78c435d6cc'
    `);
    
    const stats = verifyResult.rows[0];
    console.log(`\n📊 Final Status:`);
    console.log(`- Total reservations: ${stats.total}`);
    console.log(`- Assigned to Boccador: ${stats.boccador}`);
    
    if (stats.total === stats.boccador) {
      console.log('\n🎉 All reservations are now assigned to Boccador!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

directDatabaseUpdate();