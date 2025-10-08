// Centralized IST (India Standard Time) date/time formatting helpers
// Use these utilities everywhere to ensure consistent display in Asia/Kolkata.

const IST_TZ = 'Asia/Kolkata';

export function formatDateTimeIST(input: string | number | Date) {
  const d = new Date(input);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateIST(input: string | number | Date) {
  const d = new Date(input);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}

export function formatTimeIST(input: string | number | Date) {
  const d = new Date(input);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

// YYYY-MM-DD for today's date in IST (Asia/Kolkata)
export function todayISTYYYYMMDD(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST_TZ });
}