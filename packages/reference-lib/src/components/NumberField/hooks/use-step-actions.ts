/**
 * useStepActions: increment and decrement as commit boundaries. A complete
 * dirty candidate (parseable, clamped once) is the step base; empty or
 * incomplete drafts fall back to the controlled value, never NaN. Each
 * action ends the dirty session, resets per-session live dedupe to
 * control, and requests the pure advance — steps are requests, so the
 * echo path recognizes their echoes and stepper holds survive ticks.
 */
import * as React from 'react'
import { parseDraftNumber } from '../draft/parse'
import type { DraftNumberSymbols } from '../draft/symbols'
import { nextStepValue } from '../step/advance'
import type { EditSession } from './use-edit-session'

export interface StepActionsOptions {
  session: EditSession
  value: number | null
  min: number
  max: number
  step: number
  symbols: DraftNumberSymbols
  percentStyle: boolean
  disabled: boolean
  readOnly: boolean
}

export interface StepActions {
  stepBase: number | null
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
}

export function useStepActions(options: StepActionsOptions): StepActions {
  const {
    session,
    value,
    min,
    max,
    step,
    symbols,
    percentStyle,
    disabled,
    readOnly,
  } = options
  const { draft, setDraft, lastLiveRef, requestValue } = session

  // A complete dirty candidate (parseable, clamped once) is the step base;
  // empty or incomplete drafts fall back to controlled value, never NaN.
  // The locale parser (W-25) lets formatted drafts ("1,000", "12" under a
  // percent style) step from their numeric meaning.
  const stepBase = React.useMemo(() => {
    if (draft === null || draft.trim() === '') return null
    const num = parseDraftNumber(draft, symbols, percentStyle)
    if (Number.isNaN(num)) return null
    return Math.max(min, Math.min(max, num))
  }, [draft, symbols, percentStyle, min, max])

  const increment = React.useCallback(
    (factor = 1) => {
      if (disabled || readOnly) return
      // Step actions are commit boundaries: the session ends even when
      // the step itself is suppressed (FEATURES #2: no change → no event).
      setDraft(null)
      // Per-session live dedupe resets to control with the session end.
      lastLiveRef.current = value
      const base = stepBase ?? value
      const decision = nextStepValue({ base, value, direction: 1, factor, min, max, step })
      if (decision.kind === 'noop') return
      // NF-DYNAMIC-05: steps are requests — the echo path recognizes the
      // echo (holds survive their own ticks; only unrelated replacements
      // advance the replacement generation).
      lastLiveRef.current = decision.candidate
      requestValue(decision.candidate)
    },
    [value, min, max, step, stepBase, disabled, readOnly, requestValue, setDraft, lastLiveRef]
  )

  const decrement = React.useCallback(
    (factor = 1) => {
      if (disabled || readOnly) return
      // Step actions are commit boundaries: the session ends even when
      // the step itself is suppressed (FEATURES #2: no change → no event).
      setDraft(null)
      // Per-session live dedupe resets to control with the session end.
      lastLiveRef.current = value
      const base = stepBase ?? value
      const decision = nextStepValue({ base, value, direction: -1, factor, min, max, step })
      if (decision.kind === 'noop') return
      // NF-DYNAMIC-05: steps are requests — the echo path recognizes the
      // echo (holds survive their own ticks; only unrelated replacements
      // advance the replacement generation).
      lastLiveRef.current = decision.candidate
      requestValue(decision.candidate)
    },
    [value, min, max, step, stepBase, disabled, readOnly, requestValue, setDraft, lastLiveRef]
  )

  return { stepBase, increment, decrement }
}
