/**
 * `createSlotCacheKey` reduces a slot set to a stable string by joining the
 * sorted slot ids, so hosts can memoize per-region work regardless of the
 * order registrations arrived in. Registration order is meaningful to the
 * registry; the cache key deliberately erases it.
 */
import type { SlotRegistration } from '../types'

export function createSlotCacheKey(slots: SlotRegistration[]): string {
  return slots
    .map(s => s.slotId)
    .sort()
    .join(',')
}
