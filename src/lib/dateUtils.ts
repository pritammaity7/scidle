// Default start date - today (so games are available immediately)
export function getDefaultStartDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get today's date at midnight
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Format date as YYYY-MM-DD (alias for consistency)
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse ISO date string (YYYY-MM-DD) to Date
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Format date for display (e.g., "January 15, 2025")
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Parse date string to Date object
export function parseDate(dateString: string): Date {
  const date = new Date(dateString + 'T00:00:00');
  return date;
}

// Check if a date is valid for playing
export function isValidPlayDate(date: Date, startDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Cannot play before start date
  if (checkDate < start) {
    return false;
  }
  
  // Cannot play future dates
  if (checkDate > today) {
    return false;
  }
  
  return true;
}

// Get puzzle number for a date (days since start date + 1)
export function getPuzzleNumber(date: Date, startDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const diffTime = checkDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays + 1;
}

// Get all playable dates from start date to today
export function getPlayableDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  while (current <= today) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Check if date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return today.getTime() === checkDate.getTime();
}

// Get days until next puzzle
export function getDaysUntilNext(startDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  if (start <= today) {
    return 0;
  }
  
  const diffTime = start.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get next puzzle time
export function getNextPuzzleTime(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// Format time until next puzzle
export function formatTimeUntilNext(): string {
  const now = new Date();
  const next = getNextPuzzleTime();
  
  const diffMs = next.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
