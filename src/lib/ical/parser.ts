// Airbnb iCal Parser
import * as ical from 'node-ical';
import { ParsedEvent } from './types';

export class AirbnbICalParser {
  /**
   * Parse iCal data string into structured events
   */
  parse(icalData: string): ParsedEvent[] {
    const events = ical.parseICS(icalData);
    const parsed: ParsedEvent[] = [];
    
    for (const key in events) {
      const event = events[key];
      
      // Only process VEVENT types
      if (event.type !== 'VEVENT') continue;
      
      // Check if it's a reservation or just blocked dates
      const summary = event.summary || '';
      const isReservation = summary.toLowerCase().includes('reserved');
      const isBlocked = summary.toLowerCase().includes('not available') || 
                        summary.toLowerCase().includes('airbnb');
      
      // Skip if neither reservation nor blocked
      if (!isReservation && !isBlocked) continue;
      
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
      
      // Extract phone last 4 digits
      // Example: Phone Number (Last 4 Digits): 1207
      let phoneLast4: string | undefined;
      if (event.description) {
        const phoneMatch = event.description.match(/(?:Phone|Tel)[^:]*:\s*(\d{4})/i);
        if (phoneMatch) {
          phoneLast4 = phoneMatch[1];
        }
      }
      
      // Convert dates (Airbnb uses DATE format, not DATETIME)
      const checkIn = this.parseDate(event.start);
      const checkOut = this.parseDate(event.end);
      
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
          const isReservation = summary.toLowerCase().includes('reserved');
          const isBlocked = summary.toLowerCase().includes('not available') || 
                            summary.toLowerCase().includes('airbnb');
          
          if (!isReservation && !isBlocked) continue;
          
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
            
            const phoneMatch = event.description.match(/(?:Phone|Tel)[^:]*:\s*(\d{4})/i);
            if (phoneMatch) {
              phoneLast4 = phoneMatch[1];
            }
          }
          
          const checkIn = this.parseDate(event.start);
          const checkOut = this.parseDate(event.end);
          
          if (!checkIn || !checkOut) continue;
          
          parsed.push({
            uid: event.uid || `${checkIn.getTime()}-${checkOut.getTime()}`,
            checkIn,
            checkOut,
            summary,
            description: event.description,
            isReservation,
            isBlocked,
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
   */
  private parseDate(date: any): Date | null {
    if (!date) return null;
    
    // If it's already a Date object
    if (date instanceof Date) {
      return date;
    }
    
    // If it's a string, try to parse it
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // If it's an object with date properties (from node-ical)
    if (date && typeof date === 'object') {
      // node-ical sometimes returns objects with year, month, day
      if (date.year && date.month && date.day) {
        return new Date(date.year, date.month - 1, date.day);
      }
      
      // Or it might have a dateOnly property
      if (date.dateOnly) {
        const parts = date.dateOnly.toString().match(/(\d{4})(\d{2})(\d{2})/);
        if (parts) {
          return new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
        }
      }
    }
    
    return null;
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