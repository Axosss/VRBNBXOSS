// API endpoint for manual Airbnb iCal sync
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AirbnbICalParser } from '@/lib/ical/parser';
import { DeltaTracker } from '@/lib/ical/delta';

// Temporary hardcoded iCal URL - in production, store encrypted in database
const BOCCADOR_ICAL_URL = 'https://www.airbnb.fr/calendar/ical/35252063.ics?s=5e6099b3fafb1b558aa139c53ab59ed5';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get apartment ID from request body (optional)
    const body = await request.json().catch(() => ({}));
    const { apartmentId } = body;
    
    // For now, use a hardcoded apartment ID or get the first one
    let targetApartmentId = apartmentId;
    if (!targetApartmentId) {
      // Get the user's first apartment
      const { data: apartments, error: apartmentError } = await supabase
        .from('apartments')
        .select('id, name')
        .eq('owner_id', user.id)
        .limit(1)
        .single();
      
      if (apartmentError || !apartments) {
        // Create a default apartment for testing
        const { data: newApartment, error: createError } = await supabase
          .from('apartments')
          .insert({
            name: 'Boccador Test',
            address: '123 Test St',
            owner_id: user.id,
            created_by: user.id
          })
          .select()
          .single();
          
        if (createError || !newApartment) {
          return NextResponse.json(
            { error: 'No apartments found for user' },
            { status: 404 }
          );
        }
        
        targetApartmentId = newApartment.id;
      } else {
        targetApartmentId = apartments.id;
      }
    }
    
    console.log(`Starting sync for apartment ${targetApartmentId}...`);
    
    // Parse iCal data
    const parser = new AirbnbICalParser();
    const events = await parser.parseFromUrlAsync(BOCCADOR_ICAL_URL);
    
    console.log(`Parsed ${events.length} events from iCal`);
    
    // Filter for reservations only
    const reservations = events.filter(e => e.isReservation);
    console.log(`Found ${reservations.length} reservations`);
    
    // Calculate checksum for change detection
    const deltaTracker = new DeltaTracker();
    const currentChecksum = deltaTracker.calculateChecksum(events);
    
    // Check previous checksum
    const { data: checksumData } = await supabase
      .from('sync_checksums')
      .select('current_checksum')
      .eq('apartment_id', targetApartmentId)
      .single();
    
    const hasChanges = !checksumData || checksumData.current_checksum !== currentChecksum;
    
    if (!hasChanges) {
      // No changes - just log it
      await supabase.from('sync_log').insert({
        apartment_id: targetApartmentId,
        sync_timestamp: new Date().toISOString(),
        status: 'no_changes',
        message: `No changes detected. ${events.length} events unchanged.`
      });
      
      return NextResponse.json({
        success: true,
        hasChanges: false,
        message: 'No changes detected',
        eventsFound: events.length,
        reservationsFound: reservations.length
      });
    }
    
    // Process reservations into staging
    let newCount = 0;
    let updatedCount = 0;
    
    for (const reservation of reservations) {
      const stagingData = {
        apartment_id: targetApartmentId,
        platform: 'airbnb' as const,
        sync_source: 'airbnb_ical',
        sync_uid: reservation.uid,
        sync_url: reservation.reservationUrl,
        raw_data: reservation.raw,
        check_in: reservation.checkIn.toISOString().split('T')[0], // Date only
        check_out: reservation.checkOut.toISOString().split('T')[0], // Date only
        status_text: reservation.summary,
        phone_last_four: reservation.phoneLast4 || null,
        stage_status: 'pending' as const,
        last_seen_at: new Date().toISOString()
      };
      
      // Check if already exists
      const { data: existing } = await supabase
        .from('reservation_staging')
        .select('id')
        .eq('sync_uid', reservation.uid)
        .single();
      
      if (existing) {
        // Update existing
        await supabase
          .from('reservation_staging')
          .update({
            ...stagingData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        updatedCount++;
      } else {
        // Insert new
        await supabase
          .from('reservation_staging')
          .insert(stagingData);
        newCount++;
      }
    }
    
    // Update checksum
    await supabase.from('sync_checksums').upsert({
      apartment_id: targetApartmentId,
      current_checksum: currentChecksum,
      last_sync: new Date().toISOString(),
      events_count: events.length,
      updated_at: new Date().toISOString()
    });
    
    // Log the sync
    await supabase.from('sync_log').insert({
      apartment_id: targetApartmentId,
      sync_timestamp: new Date().toISOString(),
      status: 'changes_detected',
      message: `Synced ${reservations.length} reservations. ${newCount} new, ${updatedCount} updated.`
    });
    
    // Create alert if new reservations
    if (newCount > 0) {
      await supabase.from('sync_alerts').insert({
        alert_type: 'new_booking',
        severity: 'info',
        apartment_id: targetApartmentId,
        title: `${newCount} New Airbnb Reservation${newCount > 1 ? 's' : ''}`,
        message: `${newCount} new reservation${newCount > 1 ? 's' : ''} detected from Airbnb. Review and confirm in the Reservations page.`,
        action_url: '/reservations',
        is_read: false,
        is_resolved: false
      });
    }
    
    return NextResponse.json({
      success: true,
      hasChanges: true,
      message: `Sync completed. ${newCount} new, ${updatedCount} updated.`,
      eventsFound: events.length,
      reservationsFound: reservations.length,
      newReservations: newCount,
      updatedReservations: updatedCount
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    
    // Log error
    const supabase = await createClient();
    await supabase.from('sync_log').insert({
      apartment_id: null,
      sync_timestamp: new Date().toISOString(),
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's apartments
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id')
      .eq('owner_id', user.id);
    
    if (!apartments || apartments.length === 0) {
      return NextResponse.json({
        lastSync: null,
        pendingCount: 0,
        alerts: []
      });
    }
    
    const apartmentIds = apartments.map(a => a.id);
    
    // Get last sync log
    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('*')
      .in('apartment_id', apartmentIds)
      .order('sync_timestamp', { ascending: false })
      .limit(1)
      .single();
    
    // Get pending staging count
    const { count: pendingCount } = await supabase
      .from('reservation_staging')
      .select('id', { count: 'exact' })
      .in('apartment_id', apartmentIds)
      .eq('stage_status', 'pending');
    
    // Get unread alerts
    const { data: alerts } = await supabase
      .from('sync_alerts')
      .select('*')
      .in('apartment_id', apartmentIds)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      lastSync,
      pendingCount: pendingCount || 0,
      alerts: alerts || []
    });
    
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}