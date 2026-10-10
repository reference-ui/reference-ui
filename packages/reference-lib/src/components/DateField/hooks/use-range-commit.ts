/**
 * Range commit core: the draft-to-committed decisions — live publish on
 * complete ordered constrained drafts (null when both clear), per
 * endpoint commits that apply, invert-fail, or revert-and-fail, Escape
 * cancellation restoring committed state with no callback, and picker
 * selection folding anchors into the draft and completions into
 * publishes. The draft hook owns the state; this hook owns the verbs.
 */
import * as React from 'react'
import type { DateRangeValue, ISODate } from '../../Calendar'
import { type ISODate as CanonicalISODate, isValidISODate } from '../../Calendar/dates/iso'
import {
  formatLocalDate,
  isDateWithinConstraints,
  parseLocalDate,
} from '../engine/parse'
import type { DateFieldRangeEndpoint } from '../types'

export interface RangeCommitOptions {
  buffers: Record<DateFieldRangeEndpoint, string>
  value: DateRangeValue | null
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  onChange: (value: DateRangeValue | null) => void
  isDirty: boolean
  failed: boolean
  composingRef: React.RefObject<DateFieldRangeEndpoint | null>
  formatEndpoint: (iso: ISODate | null | undefined) => string
  setBuffers: React.Dispatch<React.SetStateAction<Record<DateFieldRangeEndpoint, string>>>
  setIsDirty: (dirty: boolean) => void
  setFailed: (failed: boolean) => void
  setActiveEndpoint: (endpoint: DateFieldRangeEndpoint) => void
  setIsOpen: (open: boolean) => void
}

function rangesEqual(a: DateRangeValue | null, b: DateRangeValue | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.start === b.start && (a.end ?? null) === (b.end ?? null)
}

export function useRangeCommit(options: RangeCommitOptions) {
  const {
    buffers,
    value,
    locale,
    min,
    max,
    isDateUnavailable,
    onChange,
    isDirty,
    failed,
    composingRef,
    formatEndpoint,
    setBuffers,
    setIsDirty,
    setFailed,
    setActiveEndpoint,
    setIsOpen,
  } = options

  const draftEqualsCommitted = React.useCallback(
    (next: Record<DateFieldRangeEndpoint, string>): boolean => {
      const s = parseLocalDate(next.start, locale)
      const e = parseLocalDate(next.end, locale)
      if (!s.valid || !e.valid) return false
      if (value == null) return s.iso == null && e.iso == null
      return s.iso === value.start && (e.iso ?? null) === (value.end ?? null)
    },
    [value, locale]
  )

  const checkLivePublish = React.useCallback(
    (next: Record<DateFieldRangeEndpoint, string>) => {
      const s = parseLocalDate(next.start, locale)
      const e = parseLocalDate(next.end, locale)
      if (s.valid && s.iso == null && e.valid && e.iso == null) {
        if (value !== null) onChange(null)
        return
      }
      if (!s.valid || s.iso == null || !e.valid || e.iso == null) return
      if (s.iso > e.iso) return
      if (
        !isDateWithinConstraints(
          s.iso,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        ) ||
        !isDateWithinConstraints(
          e.iso,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )
      ) {
        return
      }
      if (!rangesEqual({ start: s.iso, end: e.iso }, value)) {
        onChange({ start: s.iso, end: e.iso })
      }
    },
    [value, locale, min, max, isDateUnavailable, onChange]
  )

  const commitEndpoint = React.useCallback(
    (endpoint: DateFieldRangeEndpoint) => {
      if (composingRef.current) return
      if (!isDirty && !failed) return
      const other: DateFieldRangeEndpoint = endpoint === 'start' ? 'end' : 'start'
      const res = parseLocalDate(buffers[endpoint], locale)
      const otherRes = parseLocalDate(buffers[other], locale)

      if (res.valid && res.iso == null) {
        // A cleared endpoint is a legal draft state and never publishes
        // alone; emptying both publishes null once.
        if (otherRes.valid && otherRes.iso == null && value !== null) {
          onChange(null)
          setBuffers({ start: '', end: '' })
          setIsDirty(false)
          setFailed(false)
        } else if (draftEqualsCommitted(buffers)) {
          setIsDirty(false)
        }
        return
      }

      if (
        res.valid &&
        res.iso != null &&
        isDateWithinConstraints(
          res.iso,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )
      ) {
        if (
          otherRes.valid &&
          otherRes.iso != null &&
          isDateWithinConstraints(
            otherRes.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          const s = endpoint === 'start' ? res.iso : otherRes.iso
          const en = endpoint === 'start' ? otherRes.iso : res.iso
          if (s <= en) {
            if (!rangesEqual({ start: s, end: en }, value)) {
              onChange({ start: s, end: en })
            }
            setBuffers({
              start: formatLocalDate(s, locale),
              end: formatLocalDate(en, locale),
            })
            setIsDirty(false)
            setFailed(false)
            return
          }
          // Both complete but inverted: preserve the text, fail the
          // boundary — completion (not the commit) resolves it.
          setFailed(true)
          return
        }
        // This endpoint is valid; the other side is still being drafted.
        if (draftEqualsCommitted(buffers)) setIsDirty(false)
        return
      }

      // Incomplete, impossible, or out-of-constraints text reverts this
      // endpoint to committed state and fails the boundary.
      const committedEndpoint = value?.[endpoint] ?? null
      const next = {
        ...buffers,
        [endpoint]:
          committedEndpoint != null && isValidISODate(committedEndpoint)
            ? formatLocalDate(committedEndpoint, locale)
            : '',
      }
      setBuffers(next)
      setFailed(true)
      if (draftEqualsCommitted(next)) setIsDirty(false)
    },
    [buffers, isDirty, failed, value, locale, min, max, isDateUnavailable, onChange, draftEqualsCommitted]
  )

  const cancelRange = React.useCallback(() => {
    // Escape/Cancel: the draft restores to committed state with no
    // callback, and the picker closes.
    setBuffers({
      start: formatEndpoint(value?.start),
      end: formatEndpoint(value?.end),
    })
    setIsDirty(false)
    setFailed(false)
    setIsOpen(false)
  }, [value, formatEndpoint, setIsOpen])

  const handleRangeSelect = React.useCallback(
    (next: DateRangeValue) => {
      if (
        !isDateWithinConstraints(
          next.start as CanonicalISODate,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        ) ||
        (next.end != null &&
          !isDateWithinConstraints(
            next.end as CanonicalISODate,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          ))
      ) {
        return
      }
      if (next.end == null) {
        // Pending anchor stays in the draft (never publishes): a Calendar
        // anchor click restarts the draft and clears the end buffer, so
        // the two-click gesture always completes on the second click.
        setBuffers({
          start: formatLocalDate(next.start as CanonicalISODate, locale),
          end: '',
        })
        setIsDirty(true)
        setFailed(false)
        setActiveEndpoint('end')
        return
      }
      if (!rangesEqual(next, value)) {
        onChange(next)
      }
      setBuffers({
        start: formatLocalDate(next.start as CanonicalISODate, locale),
        end: formatLocalDate(next.end as CanonicalISODate, locale),
      })
      setIsDirty(false)
      setFailed(false)
      setIsOpen(false)
    },
    [value, locale, min, max, isDateUnavailable, onChange, setIsOpen]
  )

  return { commitEndpoint, cancelRange, checkLivePublish, handleRangeSelect }
}
