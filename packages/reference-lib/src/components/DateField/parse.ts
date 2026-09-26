import {
  type ISODate,
  parseISODate,
  formatISODate,
  isValidISODate,
  getDaysInMonth,
  addCalendarDays,
  addCalendarMonths,
  compareISODate,
} from '../Calendar/iso'

export const DIGIT_SYSTEMS: Record<string, string> = {
  latn: '0123456789',
  arab: '٠١٢٣٤٥٦٧٨٩',
  arabext: '۰۱۲۳۴۵۶۷۸۹',
  deva: '०१२३४५६७८९',
  beng: '০১২৩৪৫६৭৮৯',
  fullwide: '０１२३४५६७८९',
  hanidec: '〇一二三四五六七八九',
}

export const FORMAT_CONTROL_RE = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/gu

export function normalizeDigits(str: string): { text: string; valid: boolean } {
  const nonLatnSystems = new Set<string>()

  for (const char of str) {
    for (const [sys, digits] of Object.entries(DIGIT_SYSTEMS)) {
      if (sys !== 'latn' && digits.includes(char)) {
        nonLatnSystems.add(sys)
      }
    }
  }

  // Mixing two non-ASCII digit scripts is rejected
  if (nonLatnSystems.size > 1) {
    return { text: '', valid: false }
  }

  let result = ''
  for (const char of str) {
    let replaced = false
    for (const [sys, digits] of Object.entries(DIGIT_SYSTEMS)) {
      if (sys !== 'latn') {
        const idx = digits.indexOf(char)
        if (idx !== -1) {
          result += String(idx)
          replaced = true
          break
        }
      }
    }
    if (!replaced) {
      result += char
    }
  }

  return { text: result, valid: true }
}

export function formatLocalDate(dateStr: ISODate, locale: string): string {
  const { year, month, day } = parseISODate(dateStr)
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  if (locale.startsWith('ja')) {
    const formatter = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long', timeZone: 'UTC' })
    return formatter.format(d)
  }
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return formatter.format(d)
}

export function getLocaleSegmentOrder(locale: string): Array<'day' | 'month' | 'year'> {
  if (locale.startsWith('ja')) {
    return ['year', 'month', 'day']
  }
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const parts = formatter.formatToParts(new Date(Date.UTC(2024, 0, 15, 12, 0, 0)))
  const order: Array<'day' | 'month' | 'year'> = []
  for (const part of parts) {
    if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
      if (!order.includes(part.type)) {
        order.push(part.type)
      }
    }
  }
  return order.length === 3 ? order : ['year', 'month', 'day']
}

export interface ParseResult {
  valid: boolean
  incomplete: boolean
  iso: ISODate | null
  error?: string
}

export function parseLocalDate(text: string, locale: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { valid: true, incomplete: false, iso: null }
  }

  // Check digit systems
  const { text: normalized, valid: digitValid } = normalizeDigits(trimmed)
  if (!digitValid) {
    return { valid: false, incomplete: false, iso: null, error: 'Conflicting digit scripts' }
  }

  const clean = normalized.replace(FORMAT_CONTROL_RE, '').trim()

  // Canonical ISO check: exactly YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean)
  if (isoMatch) {
    if (isValidISODate(clean)) {
      return { valid: true, incomplete: false, iso: clean }
    } else {
      return { valid: false, incomplete: false, iso: null, error: 'Invalid Gregorian date' }
    }
  }

  // Disallowed characters check (e.g. time colons, letters)
  if (/[^0-9/\.\-\s年月日]/.test(clean)) {
    return { valid: false, incomplete: false, iso: null, error: 'Invalid characters in date' }
  }

  const groups = clean.match(/\d+/g)
  if (!groups || groups.length < 3) {
    return { valid: false, incomplete: true, iso: null }
  }

  if (groups.length > 3) {
    return { valid: false, incomplete: false, iso: null, error: 'Too many segments' }
  }

  const order = getLocaleSegmentOrder(locale)
  let dayStr = ''
  let monthStr = ''
  let yearStr = ''

  for (let i = 0; i < 3; i++) {
    const seg = order[i]
    if (seg === 'day') dayStr = groups[i]
    else if (seg === 'month') monthStr = groups[i]
    else if (seg === 'year') yearStr = groups[i]
  }

  // Two-digit years are incomplete
  if (yearStr.length !== 4) {
    return { valid: false, incomplete: true, iso: null }
  }

  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  if (year < 1 || year > 9999 || month < 1 || month > 12) {
    return { valid: false, incomplete: false, iso: null, error: 'Out of Gregorian bounds' }
  }

  const maxDays = getDaysInMonth(year, month)
  if (day < 1 || day > maxDays) {
    return { valid: false, incomplete: false, iso: null, error: 'Impossible day in month' }
  }

  const iso = formatISODate(year, month, day)
  return { valid: true, incomplete: false, iso }
}

export function getSegmentAtCaret(
  text: string,
  caretPos: number,
  locale: string
): 'day' | 'month' | 'year' {
  const order = getLocaleSegmentOrder(locale)
  const clean = text.replace(FORMAT_CONTROL_RE, '')

  const regex = /\d+/g
  let match: RegExpExecArray | null
  const spans: Array<{ start: number; end: number; segment: 'day' | 'month' | 'year' }> = []
  let idx = 0

  while ((match = regex.exec(clean)) !== null) {
    if (idx < order.length) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        segment: order[idx],
      })
    }
    idx++
  }

  if (spans.length === 0) {
    return order[0]
  }

  for (const span of spans) {
    if (caretPos >= span.start && caretPos <= span.end) {
      return span.segment
    }
  }

  if (caretPos < spans[0].start) {
    return spans[0].segment
  }

  let preceding = spans[0].segment
  for (const span of spans) {
    if (caretPos >= span.end) {
      preceding = span.segment
    }
  }
  return preceding
}

export function stepDateSegment(
  date: ISODate,
  segment: 'day' | 'month' | 'year',
  delta: number
): ISODate | null {
  if (segment === 'day') {
    try {
      return addCalendarDays(date, delta)
    } catch {
      return null
    }
  }

  if (segment === 'month') {
    try {
      return addCalendarMonths(date, delta)
    } catch {
      return null
    }
  }

  if (segment === 'year') {
    const { year, month, day } = parseISODate(date)
    const newYear = year + delta
    if (newYear < 1 || newYear > 9999) {
      return null
    }
    const maxDays = getDaysInMonth(newYear, month)
    const newDay = Math.min(day, maxDays)
    return formatISODate(newYear, month, newDay)
  }

  return null
}

export function assertValidDateBounds(min?: unknown, max?: unknown): void {
  if (min !== undefined && !isValidISODate(min)) {
    throw new Error(
      `[reference-ui] DateField: "min" must be a canonical ISO date (YYYY-MM-DD), received ${JSON.stringify(min)}.`
    )
  }
  if (max !== undefined && !isValidISODate(max)) {
    throw new Error(
      `[reference-ui] DateField: "max" must be a canonical ISO date (YYYY-MM-DD), received ${JSON.stringify(max)}.`
    )
  }
  if (min !== undefined && max !== undefined && compareISODate(min, max) > 0) {
    throw new Error(
      `[reference-ui] DateField: "min" (${min}) must not be after "max" (${max}).`
    )
  }
}

export function isDateWithinConstraints(
  date: ISODate,
  min?: ISODate,
  max?: ISODate,
  isDateUnavailable?: (date: ISODate) => boolean
): boolean {
  if (min && compareISODate(date, min) < 0) return false
  if (max && compareISODate(date, max) > 0) return false
  if (isDateUnavailable && isDateUnavailable(date)) return false
  return true
}
