/**
 * Utility functions for handling date and time operations
 */

/**
 * Convert a datetime-local input value to ISO string preserving the local time
 * 
 * The problem: datetime-local gives us "2024-08-29T09:00" which JavaScript
 * interprets as UTC when we create a Date object. But we want to treat it
 * as local time.
 * 
 * @param datetimeLocal - Value from datetime-local input (e.g., "2024-08-29T09:00")
 * @returns ISO string with proper timezone offset
 */
export function localDateTimeToISO(datetimeLocal: string): string {
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  if (!datetimeLocal) return ''
  
  // Parse the components
  const [datePart, timePart] = datetimeLocal.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Create a date in local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0)
  
  // Return ISO string which includes timezone offset
  return localDate.toISOString()
}

/**
 * Convert an ISO string to datetime-local format for input fields
 * 
 * @param isoString - ISO date string
 * @returns datetime-local format string (e.g., "2024-08-29T09:00")
 */
export function isoToLocalDateTime(isoString: string): string {
  if (!isoString) return ''
  
  const date = new Date(isoString)
  
  // Format: YYYY-MM-DDTHH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Format a date for display in the user's locale
 * 
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short'
  }
): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }
  
  return dateObj.toLocaleString(undefined, options)
}