/**
 * Utility functions for date and time operations
 */

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format time to HH:MM format using user's locale
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format date to YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get the difference in minutes between two dates
 */
export function getMinutesDifference(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Create a Date object from date string and time string
 */
export function createDateFromStrings(dateString: string, timeString: string): Date {
  const { hours, minutes } = parseTimeString(timeString);
  const date = new Date(dateString);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes
  );
}

/**
 * Get days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = getStartOfDay(startDate);
  const end = getStartOfDay(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get an array of dates between start and end
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Create a local date from date and time strings without timezone conversion
 */
export function createLocalDateTime(dateStr: string, timeStr: string): Date {
  // Create a date object that represents the local time without timezone conversion
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  // Create date in local timezone
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Convert Date to ISO string but preserve local timezone intent
 */
export function toLocalISOString(date: Date): string {
  // Get timezone offset in minutes
  const timezoneOffset = date.getTimezoneOffset();
  // Create a new date adjusted for timezone to maintain local time
  const adjustedDate = new Date(date.getTime() - (timezoneOffset * 60 * 1000));
  return adjustedDate.toISOString();
}

/**
 * Format date to localized format using user's locale
 */
export function formatLocalizedDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date to localized short format using user's locale
 */
export function formatLocalizedDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
  });
}

/**
 * Format time to localized format using user's locale (with 12/24 hour based on user preference)
 */
export function formatLocalizedTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date to full localized format using user's locale
 */
export function formatLocalizedDateFull(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
