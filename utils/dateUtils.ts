// Add this utility function to handle date formatting
// This ensures dates are displayed in the correct timezone

/**
 * Format a date string for display, treating it as local date
 * @param dateString - Date string in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormat options
 */
export const formatLocalDate = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
) => {
  // Parse the date string as local date (not UTC)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', options);
};

// Usage in your component:
// Replace this:
// new Date(reservation.date).toLocaleDateString('en-US', {...})

// With this:
// formatLocalDate(reservation.date, {...})