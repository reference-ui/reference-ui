/**
 * Calendar public barrel: the compound root plus the curated ISO kit.
 * Re-exports the root module, then the Gregorian date, week, and grid
 * helpers by name — the only dates/ members that leave this component.
 */
export * from './Calendar'
// Gregorian ISO kit (ported verbatim from b19c73bee; see dates/iso.ts).
// Curated — NOT `export *` — so only the names listed here leave dates/iso.ts.
// Its template-literal date type is CanonicalISODate; the public ISODate
// (= string, owned by Calendar.tsx) stays what DateField imports from '../Calendar'.
// Calendar.tsx remains the owner of the public ISODate (= string),
// CalendarMode, and DateRangeValue names.
export {
  type ISOMonth,
  type ISOYear,
  type CalendarWeekday,
  type CalendarDateRange,
  isLeapYear,
  getDaysInMonth,
  isValidISODate,
  isValidISOMonth,
  isValidISOYear,
  parseISODate,
  parseISOMonth,
  parseISOYear,
  formatISODate,
  formatISOMonth,
  formatISOYear,
  getDayOfWeek,
  addCalendarDays,
  addCalendarMonths,
  calendarMonth,
  startOfCalendarMonth,
  endOfCalendarMonth,
  startOfCalendarYear,
  endOfCalendarYear,
  compareISODate,
  normalizeDateRange,
  isDateInRange,
} from './dates/iso'
export {
  weekStartData,
  validateLocale,
  getWeekStart,
  type WeekdayHeader,
  getWeekdayHeaders,
} from './dates/week'
export { type GridDay, type MonthGrid, buildMonthGrid } from './dates/grid'
