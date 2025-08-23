// VRBNBXOSS Calendar Sync Edge Function
// Synchronizes with external calendar platforms (Airbnb, VRBO)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CalendarSyncRequest {
  apartmentId: string;
  platform: 'airbnb' | 'vrbo' | 'direct';
  icalUrl?: string;
  action: 'sync' | 'export';
}

export async function handleCalendarSync(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const requestBody: CalendarSyncRequest = await req.json();
    const { apartmentId, platform, icalUrl, action } = requestBody;

    if (!apartmentId || !platform || !action) {
      return new Response(
        JSON.stringify({ error: 'apartmentId, platform, and action are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📅 Calendar ${action} for apartment ${apartmentId} on ${platform}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'sync' && icalUrl) {
      return await syncFromIcal(supabase, apartmentId, platform, icalUrl);
    } else if (action === 'export') {
      return await exportToIcal(supabase, apartmentId, platform);
    } else {
      throw new Error('Invalid action or missing icalUrl for sync action');
    }

  } catch (error) {
    console.error('❌ Calendar sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Calendar sync failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function syncFromIcal(
  supabase: any,
  apartmentId: string,
  platform: string,
  icalUrl: string
): Promise<Response> {
  try {
    console.log(`📥 Fetching iCal data from ${icalUrl}`);
    
    // Fetch iCal data
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      throw new Error(`Failed to fetch iCal: ${icalResponse.statusText}`);
    }

    const icalData = await icalResponse.text();
    
    // Parse iCal data (simplified parsing)
    const events = parseIcalData(icalData, platform);
    
    console.log(`📊 Found ${events.length} events to sync`);

    // Get existing reservations to avoid duplicates
    const { data: existingReservations, error: fetchError } = await supabase
      .from('reservations')
      .select('platform_reservation_id, check_in, check_out')
      .eq('apartment_id', apartmentId)
      .eq('platform', platform);

    if (fetchError) {
      throw new Error(`Failed to fetch existing reservations: ${fetchError.message}`);
    }

    const existingIds = new Set(existingReservations.map((r: any) => r.platform_reservation_id));
    const newEvents = events.filter(event => !existingIds.has(event.platform_reservation_id));

    console.log(`📝 Syncing ${newEvents.length} new reservations`);

    // Insert new reservations
    if (newEvents.length > 0) {
      const reservationsToInsert = newEvents.map(event => ({
        apartment_id: apartmentId,
        platform,
        platform_reservation_id: event.platform_reservation_id,
        guest_name: event.guest_name || 'External Booking',
        guest_email: event.guest_email,
        check_in: event.check_in,
        check_out: event.check_out,
        guests: event.guests || 1,
        total_amount: event.total_amount || 0,
        status: 'confirmed',
        special_requests: event.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('reservations')
        .insert(reservationsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert reservations: ${insertError.message}`);
      }
    }

    // Log the sync operation
    await supabase
      .from('calendar_sync_logs')
      .insert({
        apartment_id: apartmentId,
        platform,
        action: 'import',
        events_processed: events.length,
        events_imported: newEvents.length,
        ical_url: icalUrl,
        synced_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        action: 'sync',
        apartmentId,
        platform,
        totalEvents: events.length,
        newEvents: newEvents.length,
        syncedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ iCal sync error:', error);
    throw error;
  }
}

async function exportToIcal(
  supabase: any,
  apartmentId: string,
  platform: string
): Promise<Response> {
  try {
    console.log(`📤 Exporting calendar for apartment ${apartmentId}`);

    // Get reservations for the apartment
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('apartment_id', apartmentId)
      .in('status', ['confirmed', 'checked_in'])
      .order('check_in');

    if (fetchError) {
      throw new Error(`Failed to fetch reservations: ${fetchError.message}`);
    }

    // Generate iCal content
    const icalContent = generateIcalContent(reservations, apartmentId);

    // Store the generated iCal file
    const filename = `calendar-${apartmentId}-${platform}.ics`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('calendars')
      .upload(filename, icalContent, {
        contentType: 'text/calendar',
        cacheControl: '300', // 5 minutes cache
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload calendar: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('calendars')
      .getPublicUrl(filename);

    // Log the export operation
    await supabase
      .from('calendar_sync_logs')
      .insert({
        apartment_id: apartmentId,
        platform,
        action: 'export',
        events_processed: reservations.length,
        export_url: publicUrl,
        synced_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        action: 'export',
        apartmentId,
        platform,
        totalEvents: reservations.length,
        icalUrl: publicUrl,
        exportedAt: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ iCal export error:', error);
    throw error;
  }
}

function parseIcalData(icalData: string, platform: string): any[] {
  const events: any[] = [];
  const lines = icalData.split('\n');
  
  let currentEvent: any = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      currentEvent = {
        platform_reservation_id: null,
        guest_name: null,
        guest_email: null,
        check_in: null,
        check_out: null,
        guests: 1,
        total_amount: 0,
        description: null
      };
    } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
      if (currentEvent.check_in && currentEvent.check_out) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'UID':
          currentEvent.platform_reservation_id = value;
          break;
        case 'SUMMARY':
          // Extract guest name from summary (format varies by platform)
          currentEvent.guest_name = value.replace(/^(Reserved|Blocked|Booked)\s*/i, '') || 'External Booking';
          break;
        case 'DTSTART;VALUE=DATE':
        case 'DTSTART':
          currentEvent.check_in = formatDate(value);
          break;
        case 'DTEND;VALUE=DATE':
        case 'DTEND':
          currentEvent.check_out = formatDate(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          // Try to extract email from description
          const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            currentEvent.guest_email = emailMatch[1];
          }
          break;
      }
    }
  }
  
  return events;
}

function formatDate(dateString: string): string {
  // Handle different date formats from iCal
  if (dateString.length === 8) {
    // YYYYMMDD format
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  } else if (dateString.includes('T')) {
    // ISO datetime format
    return dateString.split('T')[0];
  }
  
  return dateString;
}

function generateIcalContent(reservations: any[], apartmentId: string): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VRBNBXOSS//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:VRBNBXOSS - Apartment ${apartmentId}`,
    'X-WR-CALDESC:Reservation calendar for VRBNBXOSS apartment',
    ''
  ].join('\r\n');

  for (const reservation of reservations) {
    const startDate = reservation.check_in.replace(/-/g, '');
    const endDate = reservation.check_out.replace(/-/g, '');
    const uid = `${reservation.id}@vrbnbxoss.com`;
    
    icalContent += [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `DTSTAMP:${now}`,
      `SUMMARY:Reserved - ${reservation.guest_name}`,
      `DESCRIPTION:Reservation #${reservation.id}\\nGuest: ${reservation.guest_name}\\nGuests: ${reservation.guests}\\nPlatform: ${reservation.platform.toUpperCase()}`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
      'END:VEVENT',
      ''
    ].join('\r\n');
  }

  icalContent += 'END:VCALENDAR\r\n';
  
  return icalContent;
}

// Export for standalone usage
export default serve(handleCalendarSync);