/**
 * Numeric solver input from DOM-ordered panel registrations (FEATURES #3):
 * numbers stay live every render while measured strings resolve post-mount
 * at pointerdown capture and on idle resize. toSolverConstraints merges the
 * two, resolveMeasuredBound resolves one string bound against the captured
 * available size, and measuredEntriesEqual gates the only render trigger —
 * unresolved strings and parse failures silently take the default bound.
 */
import {
  resolveConstraintToPercentage,
  type PanelConstraints,
} from '../math/splitter-math'
import type { RegisteredPanel } from '../context'
import { DEFAULT_PANEL_MAX_SIZE, DEFAULT_PANEL_MIN_SIZE, sanitizeBoundNumber } from './geometry'

// FEATURES #3: numeric solver input from DOM-ordered Panel registrations.
// Numbers are live every render; measured strings resolve post-mount at
// pointerdown capture and on idle resize, and land here through `measured`.
// Unresolved strings (SSR, zero size) and parse failures silently take the
// default bound — the dev diagnostic for genuinely invalid input comes from
// the raw-prop validatePanelConstraints check, not this hot function.
export interface MeasuredEntry {
  min: number | null
  max: number | null
}

export function toSolverConstraints(
  panels: RegisteredPanel[],
  measured: ReadonlyMap<string, MeasuredEntry>
): PanelConstraints[] {
  return panels.map((panel) => {
    const entry = measured.get(panel.key)
    const minSize =
      typeof panel.min === 'number'
        ? sanitizeBoundNumber(panel.min, DEFAULT_PANEL_MIN_SIZE)
        : (entry?.min ?? DEFAULT_PANEL_MIN_SIZE)
    const maxSize =
      typeof panel.max === 'number'
        ? sanitizeBoundNumber(panel.max, DEFAULT_PANEL_MAX_SIZE)
        : (entry?.max ?? DEFAULT_PANEL_MAX_SIZE)
    return {
      minSize,
      maxSize,
      collapsible: panel.collapsible,
      collapsedSize: sanitizeBoundNumber(panel.collapsedSize, 0),
    }
  })
}

// One string bound resolved against the captured available size, or null
// when the prop is not a string (the live-number path owns those).
export function resolveMeasuredBound(
  raw: number | string | undefined,
  element: HTMLDivElement | null,
  availableGroupSize: number,
  fallback: number
): number | null {
  if (typeof raw !== 'string') return null
  return resolveConstraintToPercentage(raw, availableGroupSize, element, fallback)
}

export function measuredEntriesEqual(
  a: ReadonlyMap<string, MeasuredEntry>,
  b: ReadonlyMap<string, MeasuredEntry>
): boolean {
  if (a.size !== b.size) return false
  for (const [key, entry] of a) {
    const other = b.get(key)
    if (!other || other.min !== entry.min || other.max !== entry.max) return false
  }
  return true
}
