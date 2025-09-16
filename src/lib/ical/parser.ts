// Universal iCal Parser (supports Airbnb and VRBO)
import * as ical from 'node-ical';
import { ParsedEvent } from './types';

export type Platform = 'airbnb' | 'vrbo' | 'unknown';

export class UniversalICalParser {
  /**
   * Detect platform from iCal data
   */
  detectPlatform(icalData: string): Platform {
    if (icalData.includes('HomeAway.com')) return 'vrbo';
    if (icalData.includes('Airbnb') || icalData.includes('airbnb.com')) return 'airbnb';
    return 'unknown';
  }

  /**
   * Check if event is a reservation based on platform
   */
  private isReservation(summary: string, platform: Platform): boolean {
    const summaryLower = summary.toLowerCase();
    
    if (platform === 'vrbo') {
      // VRBO uses "Reserved - Name" format
      return summary.startsWith('Reserved - ');
    } else {
      // Airbnb uses various formats but contains "reserved" or guest info
      return summaryLower.includes('reserved') && 
             !summaryLower.includes('not available');
    }
  }

  /**
   * Check if event is blocked/unavailable
   */
  private isBlocked(summary: string, platform: Platform): boolean {
    const summaryLower = summary.toLowerCase();
    
    if (platform === 'vrbo') {
      // VRBO uses "Blocked" for unavailable dates
      return summary === 'Blocked';
    } else {
      // Airbnb uses "Not available" or "Airbnb (Not available)"
      return summaryLower.includes('not available') || 
             summaryLower.includes('airbnb');
    }
  }

  /**
   * Extract guest name based on platform format
   */
  private extractGuestName(summary: string, platform: Platform): string | undefined {
    if (platform === 'vrbo' && summary.startsWith('Reserved - ')) {
      // VRBO: "Reserved - Michael" -> "Michael"
      return summary.replace('Reserved - ', '').trim();
    } else if (platform === 'airbnb') {
      // Airbnb: Try to extract name from summary (varies by format)
      // Could be "Reserved - Name (XXXX)" or just "Name (XXXX)"
      const match = summary.match(/^(?:Reserved - )?([^(]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  /**
   * Extract phone last 4 digits (Airbnb only)
   */
  private extractPhoneLast4(summary: string, description: string, platform: Platform): string | undefined {
    if (platform === 'vrbo') {
      // VRBO doesn't include phone in iCal
      return undefined;
    }
    
    // Try summary first (Airbnb sometimes has it as "(XXXX)")
    const summaryMatch = summary.match(/\((\d{4})\)/);
    if (summaryMatch) {
      return summaryMatch[1];
    }
    
    // Then try description
    if (description) {
      const phoneMatch = description.match(/(?:Phone|Tel)[^:]*:\s*(\d{4})/i);
      if (phoneMatch) {
        return phoneMatch[1];
      }
    }
    
    return undefined;
  }
  /**
   * Parse iCal data string into structured events
   */
  parse(icalData: string, platformOverride?: Platform): ParsedEvent[] {
    const platform = platformOverride || this.detectPlatform(icalData);
    const events = ical.parseICS(icalData);
    const parsed: ParsedEvent[] = [];
    
    for (const key in events) {
      const event = events[key];
      
      // Only process VEVENT types
      if (event.type !== 'VEVENT') continue;
      
      // Check if it's a reservation or just blocked dates
      const summary = event.summary || '';
      const isReservation = this.isReservation(summary, platform);
      const isBlocked = this.isBlocked(summary, platform);
      
      // Skip if neither reservation nor blocked
      if (!isReservation && !isBlocked) continue;
      
      // Extract guest name based on platform format
      const guestName = this.extractGuestName(summary, platform);
      
      // Extract reservation ID from URL
      // Example: https://www.airbnb.com/hosting/reservations/details/HM25Z3NPQA
      let platformId: string | undefined;
      let reservationUrl: string | undefined;
      
      if (event.description) {
        const urlMatch = event.description.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          reservationUrl = urlMatch[0];
          const idMatch = reservationUrl.match(/\/([A-Z0-9]+)$/);
          if (idMatch) {
            platformId = idMatch[1];
          }
        }
      }
      
      // Extract phone last 4 digits (platform-aware)
      const phoneLast4 = this.extractPhoneLast4(summary, event.description || '', platform);
      
      // Convert dates (Airbnb uses DATE format, not DATETIME)
      const checkIn = this.parseDate(event.start, false);
      let checkOut = this.parseDate(event.end, true); // Pass true for end date
      
      if (!checkIn || !checkOut) {
        console.warn(`Skipping event with invalid dates: ${event.uid}`);
        continue;
      }
      
      parsed.push({
        uid: event.uid || `${checkIn.getTime()}-${checkOut.getTime()}`,
        checkIn,
        checkOut,
        summary,
        description: event.description,
        isReservation,
        isBlocked,
        platform,
        guestName,
        platformId,
        phoneLast4,
        reservationUrl,
        raw: event
      });
    }
    
    return parsed.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
  }
  
  /**
   * Parse iCal from URL
   */
  async parseFromUrl(url: string): Promise<ParsedEvent[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VRBNBXOSS/1.0',
          'Accept': 'text/calendar'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
      }
      
      const icalData = await response.text();
      return this.parse(icalData);
    } catch (error) {
      console.error('Error fetching iCal:', error);
      throw error;
    }
  }
  
  /**
   * Parse iCal using node-ical's async method
   */
  parseFromUrlAsync(url: string): Promise<ParsedEvent[]> {
    return new Promise((resolve, reject) => {
      ical.fromURL(url, {}, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        const parsed: ParsedEvent[] = [];
        
        for (const key in data) {
          const event = data[key];
          
          if (event.type !== 'VEVENT') continue;
          
          const summary = event.summary || '';
          const platform = this.detectPlatform(JSON.stringify(data)); // Quick detection from data
          const isReservation = this.isReservation(summary, platform);
          const isBlocked = this.isBlocked(summary, platform);
          
          if (!isReservation && !isBlocked) continue;
          
          const guestName = this.extractGuestName(summary, platform);
          
          let platformId: string | undefined;
          let reservationUrl: string | undefined;
          let phoneLast4: string | undefined;
          
          if (event.description) {
            const urlMatch = event.description.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
              reservationUrl = urlMatch[0];
              const idMatch = reservationUrl.match(/\/([A-Z0-9]+)$/);
              if (idMatch) {
                platformId = idMatch[1];
              }
            }
            
            phoneLast4 = this.extractPhoneLast4(summary, event.description || '', platform);
          }
          
          const checkIn = this.parseDate(event.start, false);
          const checkOut = this.parseDate(event.end, true); // Pass true for end date
          
          if (!checkIn || !checkOut) continue;
          
          parsed.push({
            uid: event.uid || `${checkIn.getTime()}-${checkOut.getTime()}`,
            checkIn,
            checkOut,
            summary,
            description: event.description,
            isReservation,
            isBlocked,
            platform,
            guestName,
            platformId,
            phoneLast4,
            reservationUrl,
            raw: event
          });
        }
        
        resolve(parsed.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime()));
      });
    });
  }
  
  /**
   * Helper to parse various date formats
   * @param date - The date to parse
   * @param isEndDate - If true and date is DATE format (not DATETIME), adjust for exclusive end
   */
  private parseDate(date: any, isEndDate: boolean = false): Date | null {
    if (!date) return null;
    
    let parsedDate: Date | null = null;
    let isDateOnly = false;
    
    // node-ical returns a Date object with a 'dateOnly' property for DATE format
    // Check for this special case first
    if (date instanceof Date || (date && typeof date.getTime === 'function')) {
      // Check if it has the dateOnly flag (node-ical adds this for VALUE=DATE)
      if ((date as any).dateOnly === true) {
        isDateOnly = true;
        // For DATE values, node-ical creates dates at local midnight
        // We need to use the local date, not UTC
        parsedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        parsedDate = new Date(date.getTime());
      }
    }
    // If it's a string, try to parse it
    else if (typeof date === 'string') {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
    }
    // If it's an object with date properties (from node-ical)
    else if (date && typeof date === 'object') {
      // node-ical sometimes returns objects with year, month, day
      if (date.year && date.month && date.day) {
        parsedDate = new Date(date.year, date.month - 1, date.day);
        isDateOnly = true; // This is a DATE format (no time)
      }
      // Or it might have a dateOnly property as a string
      else if (date.dateOnly && typeof date.dateOnly === 'string') {
        const parts = date.dateOnly.toString().match(/(\d{4})(\d{2})(\d{2})/);
        if (parts) {
          parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
          isDateOnly = true; // This is a DATE format (no time)
        }
      }
    }
    
    // For DATE format (not DATETIME), DTEND is exclusive per iCal spec
    // But node-ical already handles this, so we don't need to subtract again
    // We just need to ensure we're using the correct date
    if (parsedDate && isEndDate && isDateOnly) {
      // Don't subtract here - node-ical already did it
      // Just ensure we're using the local date, not UTC
      parsedDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    }
    
    return parsedDate;
  }
  
  /**
   * Extract platform-specific data from description
   */
  extractMetadata(description: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    if (!description) return metadata;
    
    // Extract all key-value pairs
    const lines = description.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key.trim()] = value.trim();
      }
    }
    
    return metadata;
  }
}

// Export with both names for compatibility
export const AirbnbICalParser = UniversalICalParser;