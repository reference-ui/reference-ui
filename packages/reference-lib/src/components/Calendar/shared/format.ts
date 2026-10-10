/**
 * Locale collection names: formatMonthYear names the shown pane for the
 * Heading and the nav targets, formatYear names the month/year views, and
 * the short/long month pair names the collection cells and the drill-down
 * button. Gregorian is forced and years 0–99 are corrected off the
 * Date.UTC 19xx mapping, matching the grid kernels.
 */
export function formatMonthYear(locale: string, year: number, month0: number): string {
  // Date.UTC maps years 0..99 onto 19xx; setUTCFullYear restores the true
  // proleptic-Gregorian year (same correction the grid kernels apply).
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

export function formatYear(locale: string, year: number): string {
  const date = new Date(Date.UTC(2000, 0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

export function formatShortMonth(locale: string, year: number, month0: number): string {
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'short',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}

export function formatLongMonth(locale: string, year: number, month0: number): string {
  const date = new Date(Date.UTC(2000, month0, 1))
  date.setUTCFullYear(year)
  return date.toLocaleDateString(locale, {
    month: 'long',
    timeZone: 'UTC',
    calendar: 'gregory',
  })
}
