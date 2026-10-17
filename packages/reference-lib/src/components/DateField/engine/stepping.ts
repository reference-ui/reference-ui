/**
 * Caret-aware segment stepping shared by both field machines: resolveStep
 * locates the day/month/year segment under the caret, steps it ±1 (Shift
 * = ±10) with Gregorian carry, and formats the stepped ISO back to
 * locale text. Null when there is no base date, the step leaves the
 * domain, or the landing refuses constraints — the keys stay native
 * no-ops and the text is kept.
 */
import type { CanonicalISODate } from '../../Calendar/dates/iso'
import { formatLocalDate, getSegmentAtCaret, stepDateSegment } from './parse'

export interface StepBase {
  valid: boolean
  iso: string | null
}

export interface StepRequest {
  text: string
  base: StepBase
  caret: number
  locale: string
  key: string
  shiftKey: boolean
  isAllowed: (date: string) => boolean
}

export function resolveStep(request: StepRequest): { stepped: string; nextText: string } | null {
  const { text, base, caret, locale, key, shiftKey, isAllowed } = request
  if (!base.valid || base.iso == null) return null
  const segment = getSegmentAtCaret(text, caret, locale)
  const delta = (key === 'ArrowUp' || key === 'Up' ? 1 : -1) * (shiftKey ? 10 : 1)
  const stepped = stepDateSegment(base.iso as CanonicalISODate, segment, delta)
  if (stepped == null) return null
  if (!isAllowed(stepped)) return null
  return { stepped, nextText: formatLocalDate(stepped, locale) }
}
