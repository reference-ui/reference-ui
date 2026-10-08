/**
 * Runtime classes that are unmatchable by construction. Textual `&`
 * substitution can merge the class into a longer identifier or an
 * unparsable selector, so the runtime class never appears as a standalone
 * selector in `@layer utilities`. Entries are exact class strings for one
 * station, each citing the v2 test that prints the same shape. The ghost
 * gauge skips them for presence but fails if one goes stale (now appears,
 * or is no longer emitted), so the list cannot rot or hide a real ghost.
 */
import { expect } from 'vitest'

export const UNMATCHABLE_CLASSES: Record<string, readonly string[]> = {
  // ATM-COND-27 (SPEC-V2-72): `&_elem` → `.<cls>_elem` (:48), `&html` →
  // `.<cls>html` (:279), `&h1, &h2` → `.<cls>h1, .<cls>h2` (:378), and
  // `&(:focus)` → `.<cls>(:focus)` (:532) — the last also unparsable (see
  // css-quarantine.ts). Both engines print these byte-for-byte; the pin
  // documents grammar totality, not matchability. Permanent.
  'ATM-COND-27': [
    '@reference-ui/lib__[&(:focus)]:c_pink.500',
    '@reference-ui/lib__[&_elem]:c_red.500',
    '@reference-ui/lib__[&h1,_&h2]:c_cyan.500',
    '@reference-ui/lib__[&html]:c_amber.500',
  ],
}

export function unmatchableFor(stationId: string): readonly string[] {
  return UNMATCHABLE_CLASSES[stationId] ?? []
}

/** True when `name` is an exact documented exemption for `stationId`. */
export function isUnmatchable(stationId: string, name: string): boolean {
  return unmatchableFor(stationId).includes(name)
}

/**
 * Fail when an exemption for `stationId` goes stale: the class now appears
 * in `utilities`, or no emitted class claims it. Takes the live class map
 * plus the collected utility selectors; the ghost gauge calls it so the
 * exemption list cannot rot or hide a real ghost.
 */
export function assertExemptionsFresh(
  emitted: readonly string[],
  utilities: Set<string>,
  stationId: string
): void {
  const live = new Set(emitted)
  const stale = unmatchableFor(stationId).filter(
    name => utilities.has(name) || !live.has(name)
  )
  expect(
    stale,
    `ATM-GHOST-01 ${stationId}: unmatchable exemption(s) went stale, remove from UNMATCHABLE_CLASSES: ${stale.join(', ')}`
  ).toEqual([])
}
