/**
 * Range endpoint handlers: input, keydown, blur, focus, click, and
 * composition per endpoint over the draft hook's state. Typing moves
 * the open pane on complete endpoints and live-publishes complete
 * ordered constrained drafts; Enter commits, Escape cancels to
 * committed state, Alt+Down opens, and arrows step the caret segment
 * with the single field's contract. Focus moves the pane to the
 * focused endpoint.
 */
import * as React from 'react'
import type { DateRangeValue, ISODate } from '../../Calendar'
import { type ISODate as CanonicalISODate, isValidISODate, type ISOMonth } from '../../Calendar/dates/iso'
import {
  formatLocalDate,
  isDateWithinConstraints,
  parseLocalDate,
} from '../engine/parse'
import { resolveStep } from '../engine/stepping'
import { restoreCaretAt } from '../shared/caret'
import type { DateFieldRangeEndpoint } from '../types'

export interface RangeHandlersOptions {
  disabled: boolean
  readOnly: boolean
  buffers: Record<DateFieldRangeEndpoint, string>
  value: DateRangeValue | null
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  isDirty: boolean
  endpointRefs: Record<DateFieldRangeEndpoint, React.RefObject<HTMLInputElement | null>>
  composingRef: React.RefObject<DateFieldRangeEndpoint | null>
  setBuffers: React.Dispatch<React.SetStateAction<Record<DateFieldRangeEndpoint, string>>>
  setIsDirty: (dirty: boolean) => void
  setFailed: (failed: boolean) => void
  setActiveEndpoint: (endpoint: DateFieldRangeEndpoint) => void
  setPaneMonthState: (month: ISOMonth) => void
  setIsOpen: (open: boolean) => void
  commitEndpoint: (endpoint: DateFieldRangeEndpoint) => void
  cancelRange: () => void
  checkLivePublish: (next: Record<DateFieldRangeEndpoint, string>) => void
}

export function useRangeHandlers(options: RangeHandlersOptions) {
  const {
    disabled,
    readOnly,
    buffers,
    value,
    locale,
    min,
    max,
    isDateUnavailable,
    isDirty,
    endpointRefs,
    composingRef,
    setBuffers,
    setIsDirty,
    setFailed,
    setActiveEndpoint,
    setPaneMonthState,
    setIsOpen,
    commitEndpoint,
    cancelRange,
    checkLivePublish,
  } = options

  const handleEndpointInput = React.useCallback(
    (endpoint: DateFieldRangeEndpoint, e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const next = { ...buffers, [endpoint]: e.target.value }
      setBuffers(next)
      setIsDirty(true)
      setFailed(false)
      // A complete typed endpoint moves the open pane without dismissing
      // (single-field DF-CAL-02 parity); partial text never moves it.
      const parsed = parseLocalDate(next[endpoint], locale)
      if (parsed.valid && parsed.iso != null) {
        setPaneMonthState(parsed.iso.slice(0, 7) as ISOMonth)
      }
      if (composingRef.current) return
      checkLivePublish(next)
    },
    [disabled, readOnly, buffers, locale, checkLivePublish, composingRef, setBuffers, setFailed, setIsDirty, setPaneMonthState]
  )

  const handleEndpointKeyDown = React.useCallback(
    (endpoint: DateFieldRangeEndpoint, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.defaultPrevented || disabled) return
      if (e.key === 'Enter') {
        commitEndpoint(endpoint)
      } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
        e.preventDefault()
        setIsOpen(true)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelRange()
      } else if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Up' || e.key === 'Down') &&
        !e.altKey &&
        !readOnly
      ) {
        // Per-endpoint caret stepping: same contract as the single field.
        const committedEndpoint = value?.[endpoint] ?? null
        const text = isDirty
          ? buffers[endpoint]
          : committedEndpoint != null && isValidISODate(committedEndpoint)
            ? formatLocalDate(committedEndpoint, locale)
            : ''
        const base = isDirty
          ? parseLocalDate(buffers[endpoint], locale)
          : committedEndpoint != null && isValidISODate(committedEndpoint)
            ? { valid: true, iso: committedEndpoint as ISODate }
            : { valid: false, iso: null as ISODate | null }
        const input =
          endpointRefs[endpoint].current ?? (e.target as HTMLInputElement | null)
        const caret = input?.selectionStart ?? text.length
        const step = resolveStep({
          text,
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
        const next = { ...buffers, [endpoint]: step.nextText }
        setBuffers(next)
        setIsDirty(true)
        setFailed(false)
        setPaneMonthState(step.stepped.slice(0, 7) as ISOMonth)
        checkLivePublish(next)
        restoreCaretAt(input, Math.min(caret, next[endpoint].length))
      }
    },
    [
      disabled,
      readOnly,
      setIsOpen,
      commitEndpoint,
      cancelRange,
      isDirty,
      buffers,
      value,
      locale,
      min,
      max,
      isDateUnavailable,
      checkLivePublish,
      endpointRefs,
      setBuffers,
      setFailed,
      setIsDirty,
      setPaneMonthState,
    ]
  )

  const handleEndpointBlur = React.useCallback(
    (endpoint: DateFieldRangeEndpoint, e: React.FocusEvent<HTMLInputElement>) => {
      if (e.defaultPrevented) return
      commitEndpoint(endpoint)
    },
    [commitEndpoint]
  )

  const handleEndpointFocus = React.useCallback(
    (endpoint: DateFieldRangeEndpoint) => {
      // The Calendar pane follows the focused endpoint (DF-RANGE-03).
      setActiveEndpoint(endpoint)
      const parsed = parseLocalDate(buffers[endpoint], locale)
      const effective =
        parsed.valid && parsed.iso != null ? parsed.iso : (value?.[endpoint] ?? null)
      if (effective != null && isValidISODate(effective)) {
        setPaneMonthState(effective.slice(0, 7) as ISOMonth)
      }
    },
    [buffers, locale, value, setActiveEndpoint, setPaneMonthState]
  )

  const handleEndpointClick = React.useCallback(
    (_endpoint: DateFieldRangeEndpoint) => {
      if (disabled) return
      setIsOpen(true)
    },
    [disabled, setIsOpen]
  )

  const handleCompositionStart = React.useCallback((endpoint: DateFieldRangeEndpoint) => {
    composingRef.current = endpoint
  }, [composingRef])

  const handleCompositionEnd = React.useCallback((endpoint: DateFieldRangeEndpoint) => {
    if (composingRef.current !== endpoint) return
    composingRef.current = null
  }, [composingRef])

  return {
    handleEndpointInput,
    handleEndpointKeyDown,
    handleEndpointBlur,
    handleEndpointFocus,
    handleEndpointClick,
    handleCompositionStart,
    handleCompositionEnd,
  }
}
