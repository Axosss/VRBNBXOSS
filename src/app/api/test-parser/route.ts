import { NextResponse } from 'next/server';
import { UniversalICalParser } from '@/lib/ical/parser';

export async function GET() {
  const parser = new UniversalICalParser();
  
  // Test avec un événement Airbnb
  const testIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20250917
DTEND;VALUE=DATE:20250920
UID:cassandra-test
SUMMARY:Reserved - Cassandra Wolf (8772)
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20250902
DTEND;VALUE=DATE:20250905
UID:kam-test
SUMMARY:Reserved - Kam Sangha (1207)
END:VEVENT
END:VCALENDAR`;

  const events = parser.parse(testIcal, 'airbnb');
  
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const result = events.map(e => ({
    guest: e.guestName,
    checkIn: formatLocalDate(e.checkIn),
    checkOut: formatLocalDate(e.checkOut),
    checkInObject: {
      raw: e.checkIn.toString(),
      iso: e.checkIn.toISOString(),
      year: e.checkIn.getFullYear(),
      month: e.checkIn.getMonth() + 1,
      day: e.checkIn.getDate()
    },
    checkOutObject: {
      raw: e.checkOut.toString(),
      iso: e.checkOut.toISOString(),
      year: e.checkOut.getFullYear(),
      month: e.checkOut.getMonth() + 1,
      day: e.checkOut.getDate()
    }
  }));
  
  return NextResponse.json({
    message: 'Parser test results',
    events: result
  });
}