// Main sync orchestration for Airbnb iCal
import { createClient } from '@/lib/supabase/server';
import { AirbnbICalParser } from './parser';
import { DeltaTracker } from './delta';
import { ParsedEvent, SyncResult, StagedReservation, SyncAlert } from './types';

export class AirbnbSync {
  private parser: AirbnbICalParser;
  private deltaTracker: DeltaTracker;
  
  constructor() {
    this.parser = new AirbnbICalParser();
    this.deltaTracker = new DeltaTracker();
  }
  
  /**
   * Main sync function for an apartment
   */
  async syncApartment(apartmentId: string, icalUrl: string): Promise<SyncResult> {
    const supabase = await createClient();
    
    try {
      // 1. Fetch and parse current iCal data
      console.log(`Syncing apartment ${apartmentId}...`);
      const currentEvents = await this.parser.parseFromUrl(icalUrl);
      
      // 2. Calculate checksum of current state
      const currentChecksum = this.deltaTracker.calculateChecksum(currentEvents);
      
      // 3. Get previous checksum
      const { data: checksumData } = await supabase
        .from('sync_checksums')
        .select('current_checksum, events_count')
        .eq('apartment_id', apartmentId)
        .single();
      
      const previousChecksum = checksumData?.current_checksum;
      
      // 4. Quick check: if checksums match, nothing changed
      if (previousChecksum && currentChecksum === previousChecksum) {
        // Log the sync but don't store any data
        await supabase.from('sync_log').insert({
          apartment_id: apartmentId,
          sync_timestamp: new Date().toISOString(),
          status: 'no_changes',
          message: `Checksum unchanged: ${currentEvents.length} events`
        });
        
        return {
          hasChanges: false,
          checksum: currentChecksum,
          eventsFound: currentEvents.length
        };
      }
      
      // 5. Something changed - get previous events to calculate delta
      const previousEvents = await this.getPreviousEvents(apartmentId);
      const delta = this.deltaTracker.calculateDelta(currentEvents, previousEvents);
      
      // 6. Store the delta
      await supabase.from('sync_deltas').insert({
        apartment_id: apartmentId,
        sync_timestamp: new Date().toISOString(),
        events_added: delta.added.length > 0 ? delta.added : null,
        events_removed: delta.removed.length > 0 ? delta.removed : null,
        events_modified: delta.modified.length > 0 ? delta.modified : null,
        total_added: delta.added.length,
        total_removed: delta.removed.length,
        total_modified: delta.modified.length,
        checksum: currentChecksum,
        has_changes: true
      });
      
      // 7. Update or insert checksum
      await supabase.from('sync_checksums').upsert({
        apartment_id: apartmentId,
        current_checksum: currentChecksum,
        last_sync: new Date().toISOString(),
        events_count: currentEvents.length,
        updated_at: new Date().toISOString()
      });
      
      // 8. Process new and modified events into staging
      await this.processEventsToStaging(apartmentId, delta.added, 'new');
      await this.processEventsToStaging(apartmentId, delta.modified.map(m => m.after), 'modified');
      
      // 9. Handle cancellations
      await this.processCancellations(apartmentId, delta.removed);
      
      // 10. Create alerts for changes
      await this.createAlertsForChanges(apartmentId, delta);
      
      // 11. Log the successful sync
      await supabase.from('sync_log').insert({
        apartment_id: apartmentId,
        sync_timestamp: new Date().toISOString(),
        status: 'changes_detected',
        message: this.deltaTracker.generateSummary(delta)
      });
      
      return {
        hasChanges: true,
        checksum: currentChecksum,
        eventsFound: currentEvents.length,
        delta
      };
      
    } catch (error) {
      console.error('Sync error:', error);
      
      // Log the error
      const supabase = await createClient();
      await supabase.from('sync_log').insert({
        apartment_id: apartmentId,
        sync_timestamp: new Date().toISOString(),
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        hasChanges: false,
        checksum: '',
        eventsFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get previous events from the last successful sync
   */
  private async getPreviousEvents(apartmentId: string): Promise<ParsedEvent[]> {
    const supabase = await createClient();
    
    // Get the most recent delta with events
    const { data: lastDelta } = await supabase
      .from('sync_deltas')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('sync_timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (!lastDelta) {
      return [];
    }
    
    // For now, reconstruct from staging table
    // In production, you might want to store a periodic full snapshot
    const { data: stagingData } = await supabase
      .from('reservation_staging')
      .select('*')
      .eq('apartment_id', apartmentId)
      .in('stage_status', ['pending', 'confirmed'])
      .not('disappeared_at', 'is', null);
    
    if (!stagingData || stagingData.length === 0) {
      return [];
    }
    
    // Convert staging data back to ParsedEvent format
    return stagingData.map(s => ({
      uid: s.sync_uid,
      checkIn: new Date(s.check_in),
      checkOut: new Date(s.check_out),
      summary: s.status_text || '',
      isReservation: s.status_text?.toLowerCase().includes('reserved') || false,
      isBlocked: !s.status_text?.toLowerCase().includes('reserved'),
      platformId: s.raw_data?.platformId,
      phoneLast4: s.phone_last_four || undefined,
      reservationUrl: s.sync_url || undefined,
      raw: s.raw_data
    }));
  }
  
  /**
   * Process events into staging table
   */
  private async processEventsToStaging(
    apartmentId: string,
    events: ParsedEvent[],
    type: 'new' | 'modified'
  ): Promise<void> {
    if (events.length === 0) return;
    
    const supabase = await createClient();
    
    for (const event of events) {
      // Only stage actual reservations, not blocked dates
      if (!event.isReservation) continue;
      
      const stagingData: Partial<StagedReservation> = {
        apartmentId,
        platform: 'airbnb',
        syncSource: 'airbnb_ical',
        syncUid: event.uid,
        syncUrl: event.reservationUrl,
        rawData: event.raw,
        checkIn: event.checkIn,
        checkOut: event.checkOut,
        statusText: event.summary,
        phoneLast4: event.phoneLast4,
        stageStatus: 'pending',
        lastSeenAt: new Date()
      };
      
      // Upsert: update if exists, insert if new
      const { error } = await supabase
        .from('reservation_staging')
        .upsert({
          apartment_id: apartmentId,
          platform: 'airbnb',
          sync_source: 'airbnb_ical',
          sync_uid: event.uid,
          sync_url: event.reservationUrl,
          raw_data: event.raw,
          check_in: event.checkIn.toISOString(),
          check_out: event.checkOut.toISOString(),
          status_text: event.summary,
          phone_last_four: event.phoneLast4,
          stage_status: 'pending',
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'sync_uid'
        });
      
      if (error) {
        console.error('Error upserting to staging:', error);
      }
    }
  }
  
  /**
   * Process cancellations (disappeared events)
   */
  private async processCancellations(
    apartmentId: string,
    removedEvents: ParsedEvent[]
  ): Promise<void> {
    if (removedEvents.length === 0) return;
    
    const supabase = await createClient();
    const cancellations = this.deltaTracker.detectCancellations({ 
      added: [], 
      removed: removedEvents, 
      modified: [] 
    });
    
    for (const cancelled of cancellations) {
      // Mark staging entry as disappeared
      await supabase
        .from('reservation_staging')
        .update({
          disappeared_at: new Date().toISOString(),
          stage_status: 'cancelled'
        })
        .eq('sync_uid', cancelled.uid)
        .eq('apartment_id', apartmentId);
      
      // Check if this was a confirmed reservation
      const { data: staging } = await supabase
        .from('reservation_staging')
        .select('reservation_id')
        .eq('sync_uid', cancelled.uid)
        .single();
      
      if (staging?.reservation_id) {
        // Create high-priority cancellation alert
        await this.createAlert({
          alertType: 'cancellation',
          severity: 'critical',
          apartmentId,
          reservationId: staging.reservation_id,
          title: 'Reservation Cancelled on Airbnb',
          message: `Reservation from ${cancelled.checkIn.toLocaleDateString()} to ${cancelled.checkOut.toLocaleDateString()} has been cancelled on Airbnb. Please review and update.`,
          actionUrl: `/reservations?highlight=${staging.reservation_id}`
        });
      }
    }
  }
  
  /**
   * Create alerts for sync changes
   */
  private async createAlertsForChanges(apartmentId: string, delta: any): Promise<void> {
    const supabase = await createClient();
    
    // Alert for new reservations
    const newReservations = delta.added.filter((e: ParsedEvent) => e.isReservation);
    if (newReservations.length > 0) {
      await this.createAlert({
        alertType: 'new_booking',
        severity: 'info',
        apartmentId,
        title: `${newReservations.length} New Airbnb Booking${newReservations.length > 1 ? 's' : ''}`,
        message: `New reservation${newReservations.length > 1 ? 's' : ''} detected from Airbnb iCal sync. Review and confirm in the Reservations page.`,
        actionUrl: '/reservations'
      });
    }
    
    // Alert for cancellations
    const cancellations = delta.removed.filter((e: ParsedEvent) => e.isReservation);
    if (cancellations.length > 0) {
      // Already handled in processCancellations for individual alerts
    }
    
    // Alert for modifications
    if (delta.modified.length > 0) {
      const modifiedReservations = delta.modified.filter((m: any) => m.after.isReservation);
      if (modifiedReservations.length > 0) {
        await this.createAlert({
          alertType: 'new_booking',
          severity: 'warning',
          apartmentId,
          title: `${modifiedReservations.length} Reservation${modifiedReservations.length > 1 ? 's' : ''} Modified`,
          message: `Airbnb reservation${modifiedReservations.length > 1 ? 's have' : ' has'} been modified. Please review the changes.`,
          actionUrl: '/reservations'
        });
      }
    }
  }
  
  /**
   * Create an alert
   */
  private async createAlert(alert: Omit<SyncAlert, 'id' | 'createdAt' | 'isRead' | 'isResolved'>): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('sync_alerts').insert({
      alert_type: alert.alertType,
      severity: alert.severity,
      apartment_id: alert.apartmentId,
      reservation_id: alert.reservationId,
      staging_id: alert.stagingId,
      title: alert.title,
      message: alert.message,
      action_url: alert.actionUrl,
      is_read: false,
      is_resolved: false
    });
  }
  
  /**
   * Manual sync trigger for all apartments
   */
  async syncAllApartments(): Promise<{ apartmentId: string; result: SyncResult }[]> {
    const supabase = await createClient();
    
    // Get all apartments with iCal URLs
    // For now, we'll use environment variables
    // In production, store encrypted URLs in the database
    const apartments = [
      {
        id: process.env.APARTMENT_1_ID,
        icalUrl: process.env.AIRBNB_ICAL_URL_APT1
      },
      // Add more apartments as needed
    ].filter(apt => apt.id && apt.icalUrl);
    
    const results: { apartmentId: string; result: SyncResult }[] = [];
    
    for (const apartment of apartments) {
      if (apartment.id && apartment.icalUrl) {
        const result = await this.syncApartment(apartment.id, apartment.icalUrl);
        results.push({ apartmentId: apartment.id, result });
      }
    }
    
    return results;
  }
}