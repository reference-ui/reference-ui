/**
 * Range draft: both endpoints parse independently from their buffers
 * while a range applies only when both are complete, ordered, and
 * constrained. The Calendar shows the committed range when clean, else
 * the draft as a range when complete and ordered, a pending anchor when
 * only the start is complete (the machine is start-anchored — an
 * end-only draft can never anchor), and null otherwise. Commits resolve
 * per endpoint, cancellation restores committed state with no callback,
 * and the pane follows the focused endpoint and complete typed input.
 */
import * as React from 'react'
import type { DateRangeValue, ISODate } from '../../Calendar'
import { type ISODate as CanonicalISODate, isValidISODate, type ISOMonth } from '../../Calendar/dates/iso'
import {
  formatLocalDate,
  isDateWithinConstraints,
} from '../engine/parse'
import { resolveRangeDraft } from '../engine/draft'
import type { DateFieldRangeEndpoint } from '../types'
import { useFormObservers } from './use-form-observers'
import { useRangeCommit } from './use-range-commit'
import { useRangeHandlers } from './use-range-handlers'

export interface RangeDraftOptions {
  value: DateRangeValue | null
  onChange: (value: DateRangeValue | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled: boolean
  readOnly: boolean
  setIsOpen: (open: boolean) => void
}

export function useRangeDraft(options: RangeDraftOptions) {
  const {
    value,
    onChange,
    locale,
    min,
    max,
    isDateUnavailable,
    disabled,
    readOnly,
    setIsOpen,
  } = options

  const formatEndpoint = React.useCallback(
    (iso: ISODate | null | undefined): string =>
      iso != null && isValidISODate(iso) ? formatLocalDate(iso, locale) : (iso ?? ''),
    [locale]
  )

  // Programmatic constraint-invalid per endpoint; a committed inverted
  // range is author error and marks both endpoints.
  const committedInverted =
    value != null && value.end != null && value.start > value.end
  const constraintInvalid: Record<DateFieldRangeEndpoint, boolean> = {
    start:
      committedInverted ||
      (value?.start != null &&
        isValidISODate(value.start) &&
        !isDateWithinConstraints(
          value.start,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )),
    end:
      committedInverted ||
      (value?.end != null &&
        isValidISODate(value.end) &&
        !isDateWithinConstraints(
          value.end,
          min as CanonicalISODate,
          max as CanonicalISODate,
          isDateUnavailable
        )),
  }

  const [buffers, setBuffers] = React.useState<Record<DateFieldRangeEndpoint, string>>(() => ({
    start: value?.start != null && isValidISODate(value.start)
      ? formatLocalDate(value.start, locale)
      : (value?.start ?? ''),
    end: value?.end != null && isValidISODate(value.end)
      ? formatLocalDate(value.end, locale)
      : (value?.end ?? ''),
  }))
  const [isDirty, setIsDirty] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [resetEpoch, setResetEpoch] = React.useState(0)
  const [activeEndpoint, setActiveEndpoint] =
    React.useState<DateFieldRangeEndpoint>('start')
  const [paneMonth, setPaneMonthState] = React.useState<ISOMonth | undefined>(undefined)
  const composingRef = React.useRef<DateFieldRangeEndpoint | null>(null)

  const startInputRef = React.useRef<HTMLInputElement | null>(null)
  const endInputRef = React.useRef<HTMLInputElement | null>(null)
  const endpointRefs = React.useMemo(
    () => ({ start: startInputRef, end: endInputRef }),
    []
  )

  const setPaneMonth = React.useCallback((month: ISOMonth) => {
    setPaneMonthState(month)
  }, [])

  // Draft resolution (render-derived): canApply plus what the
  // Calendar shows — the committed range when clean, else the draft as
  // a range, a pending anchor, or null.
  const { canApply, calendarValue } = resolveRangeDraft({
    buffers,
    locale,
    value,
    min,
    max,
    isDateUnavailable,
    isDirty,
    failed,
  })

  // Authoritative value/locale replace: reformat both endpoints, end the
  // session, clear failure. Range reformats on accepted live echo too —
  // when draft and committed agree semantically there is nothing
  // pending, so the buffers normalize instead of preserving keystrokes.
  React.useEffect(() => {
    composingRef.current = null
    setBuffers({
      start:
        value?.start != null && isValidISODate(value.start)
          ? formatLocalDate(value.start, locale)
          : (value?.start ?? ''),
      end:
        value?.end != null && isValidISODate(value.end)
          ? formatLocalDate(value.end, locale)
          : (value?.end ?? ''),
    })
    setIsDirty(false)
    setFailed(false)
  }, [value, locale])

  const { commitEndpoint, cancelRange, checkLivePublish, handleRangeSelect } = useRangeCommit({
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
  })

  const {
    handleEndpointInput,
    handleEndpointKeyDown,
    handleEndpointBlur,
    handleEndpointFocus,
    handleEndpointClick,
    handleCompositionStart,
    handleCompositionEnd,
  } = useRangeHandlers({
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
  })

  // Form observers mirror the single field: a failed boundary blocks
  // until resolution; dirty submits process once then block for retry;
  // reset reformats both endpoints without touching controlled state.
  useFormObservers({
    getInput: () => startInputRef.current,
    getResetTarget: () => endpointRefs[activeEndpoint].current,
    disabled,
    readOnly,
    failed,
    isDirty,
    onCommit: () => {
      commitEndpoint('start')
      commitEndpoint('end')
    },
    onResetState: () => {
      setBuffers({
        start: formatEndpoint(value?.start),
        end: formatEndpoint(value?.end),
      })
      setIsDirty(false)
      setFailed(false)
      setResetEpoch((epoch) => epoch + 1)
    },
  })

  return {
    constraintInvalid,
    buffers,
    isDirty,
    failed,
    resetEpoch,
    activeEndpoint,
    paneMonth,
    setPaneMonth,
    endpointRefs,
    calendarValue,
    canApply,
    handleRangeSelect,
    handleEndpointInput,
    handleEndpointKeyDown,
    handleEndpointBlur,
    handleEndpointFocus,
    handleEndpointClick,
    handleCompositionStart,
    handleCompositionEnd,
  }
}
