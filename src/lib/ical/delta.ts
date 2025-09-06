// Delta calculation for smart history storage
import { createHash } from 'crypto';
import { ParsedEvent, SyncDelta } from './types';

export class DeltaTracker {
  /**
   * Calculate checksum of current state for quick change detection
   */
  calculateChecksum(events: ParsedEvent[]): string {
    // Sort events by UID for consistent ordering
    const sorted = [...events].sort((a, b) => a.uid.localeCompare(b.uid));
    
    // Create a string representation of the current state
    const content = sorted.map(e => 
      `${e.uid}:${e.checkIn.toISOString()}:${e.checkOut.toISOString()}:${e.summary}:${e.isReservation}`
    ).join('|');
    
    // Generate SHA-256 hash
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Calculate differences between two sets of events
   */
  calculateDelta(currentEvents: ParsedEvent[], previousEvents: ParsedEvent[]): SyncDelta {
    const currentMap = new Map(currentEvents.map(e => [e.uid, e]));
    const previousMap = new Map(previousEvents.map(e => [e.uid, e]));
    
    // Find added events (in current but not in previous)
    const added = currentEvents.filter(e => !previousMap.has(e.uid));
    
    // Find removed events (in previous but not in current)
    const removed = previousEvents.filter(e => !currentMap.has(e.uid));
    
    // Find modified events
    const modified: SyncDelta['modified'] = [];
    
    for (const [uid, currentEvent] of currentMap) {
      const previousEvent = previousMap.get(uid);
      if (previousEvent) {
        const changes = this.detectChanges(currentEvent, previousEvent);
        if (changes.length > 0) {
          modified.push({
            uid,
            before: previousEvent,
            after: currentEvent,
            changes
          });
        }
      }
    }
    
    return { added, removed, modified };
  }
  
  /**
   * Detect what changed between two events
   */
  private detectChanges(current: ParsedEvent, previous: ParsedEvent): string[] {
    const changes: string[] = [];
    
    // Check dates
    if (current.checkIn.getTime() !== previous.checkIn.getTime()) {
      changes.push(`check_in: ${previous.checkIn.toISOString()} → ${current.checkIn.toISOString()}`);
    }
    
    if (current.checkOut.getTime() !== previous.checkOut.getTime()) {
      changes.push(`check_out: ${previous.checkOut.toISOString()} → ${current.checkOut.toISOString()}`);
    }
    
    // Check summary
    if (current.summary !== previous.summary) {
      changes.push(`summary: "${previous.summary}" → "${current.summary}"`);
    }
    
    // Check status
    if (current.isReservation !== previous.isReservation) {
      changes.push(`status: ${previous.isReservation ? 'reservation' : 'blocked'} → ${current.isReservation ? 'reservation' : 'blocked'}`);
    }
    
    // Check phone
    if (current.phoneLast4 !== previous.phoneLast4) {
      changes.push(`phone_last_4: ${previous.phoneLast4 || 'none'} → ${current.phoneLast4 || 'none'}`);
    }
    
    return changes;
  }
  
  /**
   * Check if anything actually changed (using checksums)
   */
  hasChanges(currentChecksum: string, previousChecksum: string): boolean {
    return currentChecksum !== previousChecksum;
  }
  
  /**
   * Reconstruct state from a base snapshot and deltas
   */
  reconstructState(
    baseEvents: ParsedEvent[],
    deltas: Array<{ timestamp: Date; delta: SyncDelta }>
  ): ParsedEvent[] {
    let state = [...baseEvents];
    const stateMap = new Map(state.map(e => [e.uid, e]));
    
    // Apply each delta in order
    for (const { delta } of deltas) {
      // Remove disappeared events
      for (const removed of delta.removed) {
        stateMap.delete(removed.uid);
      }
      
      // Add new events
      for (const added of delta.added) {
        stateMap.set(added.uid, added);
      }
      
      // Apply modifications
      for (const mod of delta.modified) {
        stateMap.set(mod.uid, mod.after);
      }
    }
    
    return Array.from(stateMap.values()).sort((a, b) => 
      a.checkIn.getTime() - b.checkIn.getTime()
    );
  }
  
  /**
   * Generate a summary of changes for user display
   */
  generateSummary(delta: SyncDelta): string {
    const parts: string[] = [];
    
    if (delta.added.length > 0) {
      const reservations = delta.added.filter(e => e.isReservation);
      const blocked = delta.added.filter(e => !e.isReservation);
      
      if (reservations.length > 0) {
        parts.push(`${reservations.length} new reservation${reservations.length > 1 ? 's' : ''}`);
      }
      if (blocked.length > 0) {
        parts.push(`${blocked.length} new blocked period${blocked.length > 1 ? 's' : ''}`);
      }
    }
    
    if (delta.removed.length > 0) {
      const reservations = delta.removed.filter(e => e.isReservation);
      if (reservations.length > 0) {
        parts.push(`${reservations.length} cancellation${reservations.length > 1 ? 's' : ''}`);
      }
    }
    
    if (delta.modified.length > 0) {
      parts.push(`${delta.modified.length} modification${delta.modified.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }
  
  /**
   * Identify potential cancellations (events that disappeared)
   */
  detectCancellations(delta: SyncDelta): ParsedEvent[] {
    // Only consider disappeared reservations as cancellations
    // (blocked dates disappearing is normal)
    return delta.removed.filter(e => e.isReservation);
  }
  
  /**
   * Identify potential conflicts with existing reservations
   */
  detectPotentialConflicts(
    newEvents: ParsedEvent[],
    existingReservations: Array<{ checkIn: Date; checkOut: Date; id: string }>
  ): Array<{ event: ParsedEvent; conflictsWith: string[] }> {
    const conflicts: Array<{ event: ParsedEvent; conflictsWith: string[] }> = [];
    
    for (const event of newEvents) {
      if (!event.isReservation) continue;
      
      const conflictingIds: string[] = [];
      
      for (const existing of existingReservations) {
        // Check for date overlap
        if (this.datesOverlap(
          event.checkIn, event.checkOut,
          existing.checkIn, existing.checkOut
        )) {
          conflictingIds.push(existing.id);
        }
      }
      
      if (conflictingIds.length > 0) {
        conflicts.push({ event, conflictsWith: conflictingIds });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Check if two date ranges overlap
   */
  private datesOverlap(
    start1: Date, end1: Date,
    start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}