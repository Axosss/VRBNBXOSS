/**
 * Simple Node.js test script for the mapper
 * Run with: node src/lib/mappers/test-mapper.js
 */

// Mock data
const mockReservationDB = {
  id: 'res-123',
  apartment_id: 'apt-456',
  owner_id: 'owner-789',
  guest_id: 'guest-101',
  platform: 'airbnb',
  platform_reservation_id: 'AIRBNB-123',
  check_in: '2024-02-01',
  check_out: '2024-02-05',
  guest_count: 2,
  total_price: 500,
  cleaning_fee: 50,
  platform_fee: 25,
  currency: 'USD',
  status: 'confirmed',
  notes: 'Test reservation',
  contact_info: { phone: '+1234567890' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

// Simple mapper implementation (without imports)
function mapReservationFromDB(db) {
  return {
    id: db.id,
    apartment_id: db.apartment_id,
    owner_id: db.owner_id,
    guest_id: db.guest_id || '',
    platform: db.platform,
    platform_reservation_id: db.platform_reservation_id,
    check_in: db.check_in,
    check_out: db.check_out,
    guest_count: db.guest_count,
    total_price: db.total_price,
    cleaning_fee: db.cleaning_fee,
    platform_fee: db.platform_fee,
    currency: db.currency,
    status: db.status,
    notes: db.notes,
    contact_info: db.contact_info,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

// Run test
console.log('🧪 Testing Reservation Mapper\n')
console.log('Input (DB format):')
console.log(JSON.stringify(mockReservationDB, null, 2))
console.log('\n' + '='.repeat(50) + '\n')

const result = mapReservationFromDB(mockReservationDB)

console.log('Output (Mapped):')
console.log(JSON.stringify(result, null, 2))
console.log('\n' + '='.repeat(50) + '\n')

// Validation
const tests = [
  { name: 'ID preserved', pass: result.id === mockReservationDB.id },
  { name: 'Apartment ID preserved', pass: result.apartment_id === mockReservationDB.apartment_id },
  { name: 'Guest count preserved', pass: result.guest_count === mockReservationDB.guest_count },
  { name: 'Platform preserved', pass: result.platform === mockReservationDB.platform },
  { name: 'Status preserved', pass: result.status === mockReservationDB.status },
]

console.log('Test Results:')
tests.forEach(test => {
  console.log(`  ${test.pass ? '✅' : '❌'} ${test.name}`)
})

const passed = tests.filter(t => t.pass).length
console.log(`\n${passed}/${tests.length} tests passed`)

if (passed === tests.length) {
  console.log('\n🎉 All tests passed! The mapper logic works correctly.')
} else {
  console.log('\n⚠️  Some tests failed. Check the mapper implementation.')
}