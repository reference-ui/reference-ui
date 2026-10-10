/**
 * Single-field edit session: the dirty text buffer plus its flag, the
 * failed-boundary latch, the live typing path (only a complete valid
 * in-constraints date requests), the commit boundary (blur/Enter), the
 * caret-aware segment stepping, composition suspension, and the
 * programmatic value/locale synchronization with its accepted-live-echo
 * exception. The layout renders the buffer while dirty, else the
 * locale-formatted controlled value.
 */
import * as React from 'react'
import type { ISODate } from '../../Calendar'
import { type ISODate as CanonicalISODate, isValidISODate } from '../../Calendar/dates/iso'
import {
  formatLocalDate,
  isDateWithinConstraints,
  parseLocalDate,
} from '../engine/parse'
import { resolveStep } from '../engine/stepping'
import { restoreCaretAt } from '../shared/caret'
import { useFormObservers } from './use-form-observers'

export interface EditSessionOptions {
  value: ISODate | null
  onChange: (value: ISODate | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled: boolean
  readOnly: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function useEditSession(options: EditSessionOptions) {
  const {
    value,
    onChange,
    locale,
    min,
    max,
    isDateUnavailable,
    disabled,
    readOnly,
    isOpen,
    setIsOpen,
  } = options

  // Programmatic constraint-invalid: a canonical value outside min/max or
  // marked unavailable still displays; dirty text is never invalid here.
  const constraintInvalid =
    value != null &&
    isValidISODate(value) &&
    // Bounds already passed assertValidDateBounds above; the casts bridge
    // Calendar's string-typed ISODate to the canonical template type.
    !isDateWithinConstraints(
      value,
      min as CanonicalISODate,
      max as CanonicalISODate,
      isDateUnavailable
    )

  // Dirty edit session (PATCHES #1): the transient text buffer plus its
  // flag. A user edit starts the session even when the resulting string
  // equals formatted controlled text — data-editing reflects the flag,
  // not string inequality.
  const [buffer, setBuffer] = React.useState<string>(() =>
    value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
  )
  const [isDirty, setIsDirty] = React.useState(false)
  const [hasFailedBoundary, setHasFailedBoundary] = React.useState(false)
  // Native form.reset() mutates the hidden input behind React's value
  // tracker; remounting it on each reset restores canonical serialization.
  const [resetEpoch, setResetEpoch] = React.useState(0)
  const isComposingRef = React.useRef(false)

  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Live value / locale synchronization (DF-CMT-04/05/06): a programmatic
  // change replaces the buffer from latest controlled state — except an
  // accepted live echo (dirty buffer parses to the new value), which
  // preserves the buffer. A change during composition invalidates that
  // session, so a stale compositionend is ignored (DF-CMT-07). Reads the
  // render's buffer/isDirty: the effect runs only on value/locale edges.
  React.useEffect(() => {
    if (isComposingRef.current) {
      isComposingRef.current = false
    }
    if (isDirty) {
      const parsed = parseLocalDate(buffer, locale)
      if (parsed.valid && parsed.iso === value) {
        return
      }
    }
    setBuffer(
      value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
    )
    setIsDirty(false)
    setHasFailedBoundary(false)
  }, [value, locale])

  // Commit boundary (blur / Enter): a complete in-constraints candidate
  // requests once when it differs from the prop and reformats; empty
  // requests null once; incomplete, impossible, or out-of-constraints
  // text reverts to formatted controlled state and fails the boundary,
  // which surfaces managed invalid until the next resolution. Never
  // clamps, never publishes garbage (B-15), never publishes past
  // min/max/unavailable (B-16).
  const commit = React.useCallback(() => {
    if (isComposingRef.current) return
    if (!isDirty) return

    const res = parseLocalDate(buffer, locale)
    if (res.valid && res.iso) {
      if (
        isDateWithinConstraints(
          res.iso,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )
      ) {
        if (res.iso !== value) {
          onChange(res.iso)
        }
        setBuffer(formatLocalDate(res.iso, locale))
        setIsDirty(false)
        setHasFailedBoundary(false)
        return
      }
    }

    if (res.valid && res.iso === null) {
      if (value !== null) {
        onChange(null)
      }
      setBuffer('')
      setIsDirty(false)
      setHasFailedBoundary(false)
      return
    }

    setBuffer(
      value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
    )
    setIsDirty(false)
    setHasFailedBoundary(true)
  }, [buffer, locale, value, min, max, isDateUnavailable, onChange, isDirty])

  const handleDateSelect = React.useCallback(
    (nextDate: ISODate | null) => {
      // Never publish a violating date: reject without commit or dismiss,
      // never clamp. Clearing (null) is always allowed.
      if (
        nextDate !== null &&
        !isDateWithinConstraints(
          nextDate as CanonicalISODate,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )
      ) {
        return
      }
      onChange(nextDate)
      // Picker selection is a programmatic value echo: it reformats the
      // input and ends any dirty session (DF-CMT-05 shape).
      setBuffer(
        nextDate != null && isValidISODate(nextDate)
          ? formatLocalDate(nextDate, locale)
          : (nextDate ?? '')
      )
      setIsDirty(false)
      setHasFailedBoundary(false)
      setIsOpen(false)
    },
    [onChange, locale, min, max, isDateUnavailable, setIsOpen]
  )

  // Live typing path: every keystroke joins the dirty buffer; only a
  // complete valid in-constraints date requests, and only when it
  // differs from the prop. Partial, impossible, and out-of-constraints
  // text stays visible and silent.
  const handleInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const nextText = e.target.value
      setIsDirty(true)
      setHasFailedBoundary(false)
      setBuffer(nextText)

      if (isComposingRef.current) return

      const res = parseLocalDate(nextText, locale)
      if (res.valid && res.iso === null) {
        if (value !== null) {
          onChange(null)
        }
      } else if (res.valid && res.iso) {
        if (
          res.iso !== value &&
          isDateWithinConstraints(
            res.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          onChange(res.iso)
        }
      }
    },
    [disabled, readOnly, locale, value, min, max, isDateUnavailable, onChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.defaultPrevented || disabled) return

      // Enter is a commit boundary (DF-CMT-01).
      if (e.key === 'Enter') {
        commit()
      } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
        e.preventDefault()
        setIsOpen(true)
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      } else if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Up' || e.key === 'Down') &&
        !e.altKey &&
        !readOnly
      ) {
        // Caret-aware segment stepping (PATCHES #2): the day/month/year
        // segment under the caret steps ±1 (Shift = ±10) with Gregorian
        // carry, and each step commits one ISO. From null/incomplete
        // text there is no base date, so the keys stay native no-ops
        // (DF-KEY-05); disabled/read-only suppress stepping (DF-KEY-06).
        // A step landing outside min/max or on an unavailable date is
        // locked out like a disabled Calendar day: no publish, text kept.
        const currentText = isDirty
          ? buffer
          : value != null && isValidISODate(value)
            ? formatLocalDate(value, locale)
            : (value ?? '')
        const base = isDirty
          ? parseLocalDate(buffer, locale)
          : value != null && isValidISODate(value)
            ? { valid: true, iso: value as ISODate }
            : { valid: false, iso: null as ISODate | null }
        const input = inputRef.current ?? (e.target as HTMLInputElement | null)
        const caret = input?.selectionStart ?? currentText.length
        const step = resolveStep({
          text: currentText,
          base,
          caret,
          locale,
          key: e.key,
          shiftKey: e.shiftKey,
          isAllowed: (iso) =>
            isDateWithinConstraints(
              iso as CanonicalISODate,
              min as CanonicalISODate,
              max as CanonicalISODate,
              isDateUnavailable
            ),
        })
        if (step == null) return
        e.preventDefault()
        if (step.stepped !== value) {
          onChange(step.stepped)
        }
        setBuffer(step.nextText)
        setIsDirty(false)
        setHasFailedBoundary(false)
        // Keep the caret in the stepped segment for repeated steps.
        restoreCaretAt(input, Math.min(caret, step.nextText.length))
      }
    },
    [
      disabled,
      readOnly,
      isOpen,
      setIsOpen,
      commit,
      isDirty,
      buffer,
      value,
      locale,
      min,
      max,
      isDateUnavailable,
      onChange,
    ]
  )

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.defaultPrevented) return
      commit()
    },
    [commit]
  )

  const handleClick = React.useCallback(() => {
    if (disabled) return
    setIsOpen(true)
  }, [disabled, setIsOpen])

  // Composition suspends parsing and commit; the native input event
  // carrying the finalized text runs the live path, so compositionend
  // only clears the flag — and a flag already cleared by a programmatic
  // value/locale replace marks the end stale and ignored (DF-CMT-07).
  const handleCompositionStart = React.useCallback(() => {
    isComposingRef.current = true
  }, [])

  const handleCompositionEnd = React.useCallback(() => {
    if (!isComposingRef.current) return
    isComposingRef.current = false
  }, [])

  // Form observers (PATCHES #5, NumberField NF-FORM-06/07/08 rules): every
  // dirty field observes each submit; a failed boundary blocks until a
  // documented resolution (valid edit, accepted commit, authoritative
  // value change, or unprevented reset); reset reformats without
  // changing controlled ISO.
  useFormObservers({
    getInput: () => inputRef.current,
    getResetTarget: () => inputRef.current,
    disabled,
    readOnly,
    failed: hasFailedBoundary,
    isDirty,
    onCommit: commit,
    onResetState: () => {
      setBuffer(
        value != null && isValidISODate(value) ? formatLocalDate(value, locale) : (value ?? '')
      )
      setIsDirty(false)
      setHasFailedBoundary(false)
      setResetEpoch((epoch) => epoch + 1)
    },
  })

  return {
    constraintInvalid,
    buffer,
    isDirty,
    hasFailedBoundary,
    resetEpoch,
    inputRef,
    handleDateSelect,
    handleInput,
    handleKeyDown,
    handleBlur,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
  }
}
