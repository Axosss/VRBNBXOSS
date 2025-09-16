// API endpoint for manual iCal sync (supports Airbnb and VRBO)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UniversalICalParser } from '@/lib/ical/parser';
import { DeltaTracker } from '@/lib/ical/delta';

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
    
    // Get iCal URLs for this apartment
    const { data: icalUrls, error: urlError } = await supabase
      .from('apartment_ical_urls')
      .select('*')
      .eq('apartment_id', targetApartmentId)
      .eq('is_active', true);
    
    if (urlError || !icalUrls || icalUrls.length === 0) {
      return NextResponse.json(
        { 
          error: 'No iCal URLs configured for this apartment',
          message: 'Please configure iCal URLs in apartment settings'
        },
        { status: 404 }
      );
    }
    
    console.log(`Found ${icalUrls.length} iCal URLs to sync`);
    
    // Parse all iCal feeds
    const parser = new UniversalICalParser();
    let allEvents: any[] = [];
    let allReservations: any[] = [];
    let syncResults: any[] = [];
    
    for (const urlConfig of icalUrls) {
      try {
        console.log(`Syncing ${urlConfig.platform} from ${urlConfig.ical_url.substring(0, 50)}...`);
        
        const events = await parser.parseFromUrlAsync(urlConfig.ical_url);
        console.log(`Parsed ${events.length} events from ${urlConfig.platform}`);
        
        // Filter for reservations only
        const reservations = events.filter(e => e.isReservation);
        console.log(`Found ${reservations.length} reservations from ${urlConfig.platform}`);
        
        // Add platform info to each event
        events.forEach(e => {
          e.platform = urlConfig.platform;
          e.syncSource = `${urlConfig.platform}_ical`;
        });
        
        allEvents = allEvents.concat(events);
        allReservations = allReservations.concat(reservations);
        
        syncResults.push({
          platform: urlConfig.platform,
          eventsFound: events.length,
          reservationsFound: reservations.length,
          url: urlConfig.ical_url.substring(0, 50) + '...'
        });
        
        // Update last sync timestamp for this URL
        await supabase
          .from('apartment_ical_urls')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success'
          })
          .eq('id', urlConfig.id);
          
      } catch (error) {
        console.error(`Error syncing ${urlConfig.platform}:`, error);
        
        // Update error status
        await supabase
          .from('apartment_ical_urls')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error'
          })
          .eq('id', urlConfig.id);
          
        syncResults.push({
          platform: urlConfig.platform,
          error: error.message
        });
      }
    }
    
    console.log(`Total: ${allEvents.length} events, ${allReservations.length} reservations from all platforms`);
    
    // Calculate checksum for change detection
    const deltaTracker = new DeltaTracker();
    const currentChecksum = deltaTracker.calculateChecksum(allEvents);
    
    // Check previous checksum
    const { data: checksumData } = await supabase
      .from('sync_checksums')
      .select('current_checksum')
      .eq('apartment_id', targetApartmentId)
      .single();
    
    // Check if there are actual changes
    const hasChanges = !checksumData || checksumData.current_checksum !== currentChecksum;
    
    if (!hasChanges) {
      // No changes - just log it
      await supabase.from('sync_log').insert({
        apartment_id: targetApartmentId,
        sync_timestamp: new Date().toISOString(),
        status: 'no_changes',
        message: `No changes detected. ${allEvents.length} events unchanged.`,
        metadata: { syncResults }
      });
      
      return NextResponse.json({
        success: true,
        hasChanges: false,
        syncResults,
        message: 'No changes detected',
        eventsFound: allEvents.length,
        reservationsFound: allReservations.length
      });
    }
    
    // Process reservations into staging
    let newCount = 0;
    let updatedCount = 0;
    
    for (const reservation of allReservations) {
      // Debug log to see what dates we're getting from parser
      console.log(`Processing ${reservation.guestName}:`, {
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        checkInISO: reservation.checkIn.toISOString(),
        checkOutISO: reservation.checkOut.toISOString(),
        checkInLocal: reservation.checkIn.toLocaleDateString(),
        checkOutLocal: reservation.checkOut.toLocaleDateString()
      });
      
      // Format dates using local components to avoid timezone issues
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`formatLocalDate: ${date} -> ${result}`);
        return result;
      };
      
      const stagingData = {
        apartment_id: targetApartmentId,
        platform: reservation.platform || 'airbnb' as const,
        sync_source: reservation.syncSource || `${reservation.platform}_ical`,
        sync_uid: reservation.uid,
        sync_url: reservation.reservationUrl,
        raw_data: reservation.raw,
        check_in: formatLocalDate(reservation.checkIn), // Use local date components
        check_out: formatLocalDate(reservation.checkOut), // Use local date components
        status_text: reservation.summary,
        guest_name: reservation.guestName || null, // Add guest name from VRBO
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
        // Update existing - FORCE update all fields including dates
        const { error: updateError } = await supabase
          .from('reservation_staging')
          .update({
            ...stagingData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`Failed to update staging ${reservation.uid}:`, updateError);
        } else {
          console.log(`Updated staging ${reservation.uid}: ${stagingData.check_in} to ${stagingData.check_out}`);
        }
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
      events_count: allEvents.length,
      updated_at: new Date().toISOString()
    });
    
    // Log the sync
    await supabase.from('sync_log').insert({
      apartment_id: targetApartmentId,
      sync_timestamp: new Date().toISOString(),
      status: 'changes_detected',
      message: `Synced ${allReservations.length} reservations. ${newCount} new, ${updatedCount} updated.`,
      metadata: { syncResults }
    });
    
    // Create alert if new reservations
    if (newCount > 0) {
      await supabase.from('sync_alerts').insert({
        alert_type: 'new_booking',
        severity: 'info',
        apartment_id: targetApartmentId,
        title: `${newCount} New Reservation${newCount > 1 ? 's' : ''}`,
        message: `${newCount} new reservation${newCount > 1 ? 's' : ''} detected from iCal sync. Review and confirm in the Reservations page.`,
        action_url: '/reservations',
        is_read: false,
        is_resolved: false
      });
    }
    
    return NextResponse.json({
      success: true,
      hasChanges: true,
      message: `Sync completed. ${newCount} new, ${updatedCount} updated.`,
      eventsFound: allEvents.length,
      reservationsFound: allReservations.length,
      syncResults,
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