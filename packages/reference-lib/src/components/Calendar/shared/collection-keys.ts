/**
 * Collection arrow delta for the 3-column month/year fields: horizontal
 * keys reverse under inherited RTL, vertical keys step a full row and
 * never reverse. Null when the key is not a collection move. Shared by
 * the Months and Years parts so both fields move the same way.
 */
export function collectionKeyDelta(key: string, rtl: boolean): number | null {
  if (key === 'ArrowLeft') return rtl ? 1 : -1
  if (key === 'ArrowRight') return rtl ? -1 : 1
  if (key === 'ArrowUp') return -3
  if (key === 'ArrowDown') return 3
  return null
}
