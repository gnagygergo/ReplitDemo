/**
 * Timezone conversion utilities using Intl APIs.
 * 
 * Key principles:
 * - Storage: Always UTC
 * - Display: User's timezone (from user preferences or browser)
 * - Date-only fields: Timezone-agnostic (preserve calendar day)
 * - DateTime fields: Timezone-aware (convert between UTC and user timezone)
 * 
 * CRITICAL: We work with milliseconds directly and use Intl to compute offsets,
 * avoiding the bug of constructing Dates in the browser's timezone when we need the user's timezone.
 */

/**
 * Get the timezone offset in milliseconds for a given date in a timezone.
 * Returns the difference between UTC and the local time in the timezone.
 * 
 * @param date - The date to get the offset for
 * @param timezone - IANA timezone ID
 * @returns Offset in milliseconds (positive means ahead of UTC)
 */
function getTimezoneOffset(date: Date, timezone: string): number {
  // Get the date/time components in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  // Construct the date as if these components were in UTC
  const utcTime = Date.UTC(
    parseInt(getValue("year"), 10),
    parseInt(getValue("month"), 10) - 1,
    parseInt(getValue("day"), 10),
    parseInt(getValue("hour"), 10),
    parseInt(getValue("minute"), 10),
    parseInt(getValue("second"), 10)
  );

  // The offset is the difference between the original time and the UTC interpretation
  return date.getTime() - utcTime;
}

/**
 * Convert a UTC Date to a Date representing the same moment in the user's timezone.
 * The returned Date's local methods (.getFullYear(), .getHours(), etc.) will return
 * values in the user's timezone, NOT the browser's timezone.
 * 
 * @param utcDate - Date in UTC
 * @param userTimezone - IANA timezone ID (e.g., "America/New_York")
 * @param mode - "Date" means date-only (ignore timezone), "Time" or "DateTime" means timezone-aware
 * @returns Date object where local methods return user timezone values
 */
export function utcToUserZoned(
  utcDate: Date,
  userTimezone: string,
  mode: "Date" | "Time" | "DateTime"
): Date {
  // For date-only fields, preserve the calendar day (no timezone conversion)
  if (mode === "Date") {
    // Return a date with the UTC components as local components
    return new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      0,
      0,
      0,
      0
    );
  }

  // For Time/DateTime fields, convert to user's timezone
  // Get the offset for the user's timezone
  const offset = getTimezoneOffset(utcDate, userTimezone);
  
  // Create a new date by shifting by the offset
  // This makes the local methods return the user's timezone values
  return new Date(utcDate.getTime() + offset);
}

/**
 * Convert a date in the user's timezone to UTC.
 * Takes a Date object where the local methods (.getHours(), .getDate(), etc.) represent
 * values in the user's timezone, and returns a Date in UTC representing the same moment.
 * 
 * @param localDate - Date with local methods representing user's timezone values
 * @param userTimezone - IANA timezone ID
 * @param mode - "Date" means date-only (ignore timezone), "Time" or "DateTime" means timezone-aware
 * @returns UTC Date
 */
export function userZonedToUtc(
  localDate: Date,
  userTimezone: string,
  mode: "Date" | "Time" | "DateTime"
): Date {
  // For date-only fields, store as UTC midnight (no timezone conversion)
  if (mode === "Date") {
    return new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      0,
      0,
      0,
      0
    ));
  }

  // For Time/DateTime fields, interpret the local components as being in the user's timezone
  // We need to find the UTC time that, when converted to the user's timezone, gives us these components
  
  // Create a reference date in UTC with the same wall-clock values
  const referenceUTC = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    localDate.getHours(),
    localDate.getMinutes(),
    localDate.getSeconds(),
    0
  ));
  
  // Get the offset for this date in the user's timezone
  const offset = getTimezoneOffset(referenceUTC, userTimezone);
  
  // The UTC time is the reference time minus the offset
  return new Date(referenceUTC.getTime() - offset);
}

/**
 * Parse user input from date/time controls, accounting for browser vs user timezone difference.
 * 
 * When a user picks a date/time in a browser control, the browser gives us a Date object
 * where the local methods (.getHours(), etc.) return values in the BROWSER's timezone.
 * But we want to interpret those values as being in the USER's timezone.
 * 
 * @param value - Date from browser's date/time input (components in browser timezone)
 * @param mode - Field type
 * @param userTimezone - User's preferred timezone
 * @param browserTimezone - Browser's timezone
 * @returns UTC Date
 */
export function parseDateInput(
  value: Date,
  mode: "Date" | "Time" | "DateTime",
  userTimezone: string,
  browserTimezone: string
): Date {
  // Extract the wall-clock values (what the user sees in the picker)
  const year = value.getFullYear();
  const month = value.getMonth();
  const date = value.getDate();
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const seconds = value.getSeconds();
  
  // Create a new date with these wall-clock values
  // This date's local methods will return these values in the BROWSER's timezone
  const wallClock = new Date(year, month, date, hours, minutes, seconds, 0);
  
  // If user timezone matches browser timezone, simple conversion
  if (userTimezone === browserTimezone || mode === "Date") {
    return userZonedToUtc(wallClock, userTimezone, mode);
  }
  
  // If different, we need to reinterpret the wall-clock values as being in the user's timezone
  // The user sees "3:00 PM" and expects it to mean "3:00 PM in their timezone"
  // But the browser gave us "3:00 PM in browser timezone"
  // So we use the wall-clock values directly and convert from user timezone
  return userZonedToUtc(wallClock, userTimezone, mode);
}
