import type { CalendarWeekday } from './iso'

// Data from Unicode CLDR / @internationalized/date/src/weekStartData.ts
// 0 = Sunday, 1 = Monday, 5 = Friday, 6 = Saturday
export const weekStartData: Record<string, number> = {
  '001': 1,
  AD: 1,
  AE: 6,
  AF: 6,
  AI: 1,
  AL: 1,
  AM: 1,
  AN: 1,
  AR: 1,
  AT: 1,
  AU: 1,
  AX: 1,
  AZ: 1,
  BA: 1,
  BE: 1,
  BG: 1,
  BH: 6,
  BM: 1,
  BN: 1,
  BY: 1,
  CH: 1,
  CL: 1,
  CM: 1,
  CN: 1,
  CR: 1,
  CY: 1,
  CZ: 1,
  DE: 1,
  DJ: 6,
  DK: 1,
  DZ: 6,
  EC: 1,
  EE: 1,
  EG: 6,
  ES: 1,
  FI: 1,
  FJ: 1,
  FO: 1,
  FR: 1,
  GB: 1,
  GE: 1,
  GF: 1,
  GP: 1,
  GR: 1,
  HR: 1,
  HU: 1,
  IE: 1,
  IQ: 6,
  IR: 6,
  IS: 1,
  IT: 1,
  JO: 6,
  KG: 1,
  KW: 6,
  KZ: 1,
  LB: 1,
  LI: 1,
  LK: 1,
  LT: 1,
  LU: 1,
  LV: 1,
  LY: 6,
  MC: 1,
  MD: 1,
  ME: 1,
  MK: 1,
  MN: 1,
  MQ: 1,
  MV: 5,
  MY: 1,
  NL: 1,
  NO: 1,
  NZ: 1,
  OM: 6,
  PL: 1,
  QA: 6,
  RE: 1,
  RO: 1,
  RS: 1,
  RU: 1,
  SD: 6,
  SE: 1,
  SI: 1,
  SK: 1,
  SM: 1,
  SY: 6,
  TJ: 1,
  TM: 1,
  TR: 1,
  UA: 1,
  UY: 1,
  UZ: 1,
  VA: 1,
  VN: 1,
  XK: 1,
}

const WEEKDAY_INDEX: Record<CalendarWeekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

export function validateLocale(locale: string): void {
  if (locale.includes('-u-ca-')) {
    const calendar = locale.split('-u-ca-')[1]?.split('-')[0]?.toLowerCase()
    if (calendar && calendar !== 'gregory' && calendar !== 'iso8601') {
      throw new Error(
        `Calendar does not support non-Gregorian calendar "${calendar}" requested in locale "${locale}". Only Gregorian calendar is supported.`
      )
    }
  }
}

export function getWeekStart(
  locale: string,
  firstDayOfWeek?: CalendarWeekday
): number {
  if (firstDayOfWeek && firstDayOfWeek in WEEKDAY_INDEX) {
    return WEEKDAY_INDEX[firstDayOfWeek]
  }

  validateLocale(locale)

  // Explicit Unicode extension fw (first day of week)
  if (locale.includes('-fw-')) {
    const fw = locale.split('-fw-')[1]?.split('-')[0]?.toLowerCase()
    if (fw === 'mon') return 1
    if (fw === 'tue') return 2
    if (fw === 'wed') return 3
    if (fw === 'thu') return 4
    if (fw === 'fri') return 5
    if (fw === 'sat') return 6
    if (fw === 'sun') return 0
  }

  if (locale.includes('-ca-iso8601')) {
    return 1
  }

  // Check region subtag
  let region: string | undefined
  try {
    if (typeof Intl !== 'undefined' && Intl.Locale) {
      const loc = new Intl.Locale(locale)
      // Check if getWeekInfo is supported
      // @ts-ignore
      const weekInfo = loc.getWeekInfo ? loc.getWeekInfo() : loc.weekInfo
      if (weekInfo && typeof weekInfo.firstDay === 'number') {
        return weekInfo.firstDay % 7
      }
      region = loc.maximize().region
    }
  } catch {
    // Ignore error
  }

  if (!region) {
    const parts = locale.split('-')
    if (parts.length > 1 && parts[1] !== 'u') {
      region = parts[1].toUpperCase()
    }
  }

  if (region && region in weekStartData) {
    return weekStartData[region]
  }

  return 0
}

export interface WeekdayHeader {
  weekday: number
  visibleText: string
  accessibleName: string
}

// Map 0..6 (Sun..Sat) to sample UTC dates for formatting
// 2024-01-07 was a Sunday
const REFERENCE_SUNDAY_MS = Date.UTC(2024, 0, 7)

export function getWeekdayHeaders(
  locale: string,
  firstDayOfWeek: number,
  style: 'narrow' | 'short' | 'long' = 'short'
): WeekdayHeader[] {
  validateLocale(locale)
  const headers: WeekdayHeader[] = []

  // Ensure Gregorian formatting
  const safeLocale = locale.includes('-u-ca-') ? locale : `${locale}-u-ca-gregory`
  const shortFormatter = new Intl.DateTimeFormat(safeLocale, {
    weekday: style,
    timeZone: 'UTC',
  })
  const fullFormatter = new Intl.DateTimeFormat(safeLocale, {
    weekday: 'long',
    timeZone: 'UTC',
  })

  for (let i = 0; i < 7; i++) {
    const day = (firstDayOfWeek + i) % 7
    // Date for this day of week
    const date = new Date(REFERENCE_SUNDAY_MS + day * 86400000)
    headers.push({
      weekday: day,
      visibleText: shortFormatter.format(date),
      accessibleName: fullFormatter.format(date),
    })
  }

  return headers
}
