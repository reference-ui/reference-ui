/**
 * Range draft resolution: both endpoints parse independently from
 * their buffers while a range applies only when both are complete,
 * ordered, and constrained. The Calendar shows the committed range
 * when clean, else the draft as a range when complete and ordered, a
 * pending anchor when only the start is complete (the machine is
 * start-anchored — an end-only draft can never anchor), and null
 * otherwise. Pure in, pure out; the draft hook feeds it the session.
 */
import type { DateRangeValue, ISODate } from '../../Calendar'
import type { ISODate as CanonicalISODate } from '../../Calendar/dates/iso'
import { isDateWithinConstraints, parseLocalDate } from './parse'
import type { DateFieldRangeEndpoint } from '../types'

export interface RangeDraftInputs {
  buffers: Record<DateFieldRangeEndpoint, string>
  locale: string
  value: DateRangeValue | null
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  isDirty: boolean
  failed: boolean
}

export interface RangeDraft {
  canApply: boolean
  calendarValue: DateRangeValue | null
}

export function resolveRangeDraft(inputs: RangeDraftInputs): RangeDraft {
  const { buffers, locale, value, min, max, isDateUnavailable, isDirty, failed } = inputs
  const startParsed = parseLocalDate(buffers.start, locale)
  const endParsed = parseLocalDate(buffers.end, locale)
  const startValid = startParsed.valid && startParsed.iso != null
  const endValid = endParsed.valid && endParsed.iso != null
  const draftOrdered =
    startValid && endValid && (startParsed.iso as string) <= (endParsed.iso as string)
  const canApply =
    startValid &&
    endValid &&
    draftOrdered &&
    isDateWithinConstraints(
      startParsed.iso as CanonicalISODate,
      min as CanonicalISODate,
      max as CanonicalISODate,
      isDateUnavailable
    ) &&
    isDateWithinConstraints(
      endParsed.iso as CanonicalISODate,
      min as CanonicalISODate,
      max as CanonicalISODate,
      isDateUnavailable
    )

  const calendarValue: DateRangeValue | null =
    isDirty || failed
      ? startValid && endValid
        ? draftOrdered
          ? { start: startParsed.iso as ISODate, end: endParsed.iso as ISODate }
          : null
        : startValid
          ? { start: startParsed.iso as ISODate, end: null }
          : null
      : value

  return { canApply, calendarValue }
}
