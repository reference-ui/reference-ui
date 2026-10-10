/**
 * useEditHandlers: the input's edit surface. Change events stage verbatim
 * text and live-request newly parseable meanings raw; composition
 * sessions suspend publish and restore pre-composition text on invalid
 * finals; runCommit flushes the buffer through the pure commit decision
 * (optimistically ending the session so Firefox's in-keydown implicit
 * submit cannot double-publish); arrows step, Home/End jump to supplied
 * bounds, and Enter commits in place while a clean field stays native
 * for form submission.
 */
import * as React from 'react'
import { parseDraftNumber } from '../draft/parse'
import type { DraftNumberSymbols } from '../draft/symbols'
import { decideCommit } from '../step/commit'
import type { NumberFieldCommitBehavior, NumberFieldInvalidCommitReason } from '../types'
import type { EditSession } from './use-edit-session'

export interface EditHandlersOptions {
  session: EditSession
  value: number | null
  min: number
  max: number
  step: number
  latticeMin: number | undefined
  latticeMax: number | undefined
  symbols: DraftNumberSymbols
  percentStyle: boolean
  commitBehavior: NumberFieldCommitBehavior
  displayValue: string
  displayRoundTrip: (candidate: number) => number
  disabled: boolean
  readOnly: boolean
  onInvalidCommit: ((attempted: number, reason: NumberFieldInvalidCommitReason) => void) | undefined
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
}

export interface EditHandlers {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: () => void
  runCommit: (text: string) => 'requested' | 'failed' | 'noop'
  runCommitRef: React.MutableRefObject<(text: string) => 'requested' | 'failed' | 'noop'>
  commitDraft: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function useEditHandlers(options: EditHandlersOptions): EditHandlers {
  const {
    session,
    value,
    min,
    max,
    step,
    latticeMin,
    latticeMax,
    symbols,
    percentStyle,
    commitBehavior,
    displayValue,
    displayRoundTrip,
    disabled,
    readOnly,
    onInvalidCommit,
    increment,
    decrement,
  } = options
  const {
    setDraft,
    draftRef,
    lastLiveRef,
    composingRef,
    compositionSnapshotRef,
    compositionFalloutRef,
    compositionCancelRef,
    clearTransientFailures,
    setFailedBoundary,
    requestValue,
  } = session

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // NF-EDIT-17/18: one swallow for stale composition fallout after
      // an authoritative replacement — the DOM node reverts to
      // controlled text, since no state change (and no callback) follows.
      if (compositionFalloutRef.current && !composingRef.current) {
        compositionFalloutRef.current = false
        const controlled = draftRef.current ?? displayValue
        if (e.target.value !== controlled) {
          e.target.value = controlled
        }
        return
      }
      // A new user edit supersedes any retained failed/pending boundary
      // (NF-COMMIT-07); the verbatim text stages the dirty session.
      clearTransientFailures()
      const text = e.target.value
      setDraft(text)
      // NF-EDIT-11: mid-composition input stages the buffer verbatim but
      // never publishes — not even a parseable final-looking string.
      if (composingRef.current) return
      // NFLAST ruling (c) live requests (NF-EDIT-03/04/05): a newly
      // parseable meaning is requested immediately — raw, never
      // clamped/snapped/rounded (those are commit-time, NF-COMMIT-05).
      // Incomplete grammar stays silent; repeated meanings dedupe
      // against both the controlled value and the latest request.
      if (text.trim() === '') {
        if (value !== null && lastLiveRef.current !== null) {
          lastLiveRef.current = null
          requestValue(null)
        }
        return
      }
      const parsed = parseDraftNumber(text, symbols, percentStyle)
      if (Number.isNaN(parsed)) return
      const canonical = Object.is(parsed, -0) ? 0 : parsed
      if (canonical === value || canonical === lastLiveRef.current) return
      lastLiveRef.current = canonical
      requestValue(canonical)
    },
    [clearTransientFailures, value, symbols, percentStyle, requestValue, displayValue, compositionFalloutRef, composingRef, draftRef, lastLiveRef, setDraft]
  )

  // NF-EDIT-11 composition session: start suspends live publish, end
  // only lifts the suspension — the staged buffer commits at the next
  // boundary (synthetic final event carries no text of its own), while
  // a real post-end input event publishes through the ordinary path
  // with lastLiveRef dedupe guarding the double-publish.
  const handleCompositionStart = React.useCallback(() => {
    composingRef.current = true
    // A fresh session supersedes any armed fallout swallow or cancel.
    compositionFalloutRef.current = false
    compositionCancelRef.current = false
    compositionSnapshotRef.current = draftRef.current
  }, [composingRef, compositionFalloutRef, compositionCancelRef, compositionSnapshotRef, draftRef])
  const handleCompositionEnd = React.useCallback(() => {
    // NF-DYNAMIC-05: a cancelled session ignores its stale end — the
    // buffer after cancellation is fresh user state, never restored.
    if (compositionCancelRef.current) {
      compositionCancelRef.current = false
      composingRef.current = false
      compositionSnapshotRef.current = null
      return
    }
    composingRef.current = false
    const snapshot = compositionSnapshotRef.current
    compositionSnapshotRef.current = null
    // NF-EDIT-12: a non-empty unparseable final result restores
    // pre-composition text immediately (null snapshot = was clean).
    // Valid finals and empties keep the staged buffer for the next
    // boundary; empties commit null there.
    const final = draftRef.current
    if (
      final !== null &&
      final !== '' &&
      Number.isNaN(parseDraftNumber(final, symbols, percentStyle))
    ) {
      setDraft(snapshot)
    }
  }, [symbols, percentStyle, compositionCancelRef, composingRef, compositionSnapshotRef, draftRef, setDraft])

  // Commit outcome for submit handling: 'requested' means the parent has
  // not echoed yet (submit must wait for an explicit retry), 'failed'
  // records a boundary that blocks every later submit, 'noop' leaves the
  // already-canonical hidden state submittable.
  const runCommit = React.useCallback(
    (text: string): 'requested' | 'failed' | 'noop' => {
      // The session ends optimistically: accepted commits echo through
      // the controlled prop, rejected ones snap back to controlled state,
      // and invalid text reverts — all without a request for no-change.
      // The ref clears synchronously (mirroring onReset): Firefox runs
      // implicit submit inside the Enter-keydown default action, before
      // React flushes — a render-only clear lets onSubmit re-commit the
      // same draft and double-publish onChange (NF-FORM-12/EDIT-14/
      // COMMIT-02/COMP-01). The submit listener still blocks via the
      // pending/failed refs, so no submit behavior changes.
      setDraft(null)
      draftRef.current = null
      // Per-session live dedupe: the session ends, so the next session
      // re-requests from control even for a repeated meaning.
      lastLiveRef.current = value
      const decision = decideCommit({
        text,
        value,
        min,
        max,
        latticeMin,
        latticeMax,
        step,
        symbols,
        percentStyle,
        commitBehavior,
        roundTrip: displayRoundTrip,
      })
      if (decision.kind === 'failed') {
        setFailedBoundary(true)
        return 'failed'
      }
      if (decision.kind === 'noop') return 'noop'
      requestValue(decision.candidate)
      if (decision.invalidReason !== undefined && decision.candidate !== null) {
        onInvalidCommit?.(decision.candidate, decision.invalidReason)
      }
      return 'requested'
    },
    [
      value,
      min,
      max,
      latticeMin,
      latticeMax,
      step,
      symbols,
      percentStyle,
      commitBehavior,
      displayRoundTrip,
      requestValue,
      onInvalidCommit,
      setFailedBoundary,
      setDraft,
      draftRef,
      lastLiveRef,
    ]
  )
  const runCommitRef = React.useRef(runCommit)
  runCommitRef.current = runCommit

  const commitDraft = React.useCallback(() => {
    if (draftRef.current === null) return
    runCommit(draftRef.current)
  }, [runCommit, draftRef])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      // Synthetic/IME composition suspends stepping and commit (NF-EDIT-11):
      // the session's final input event carries the text; keys — including
      // Enter and arrows — stay native and unhandled until it ends.
      if (e.nativeEvent?.isComposing) return
      const factor = e.shiftKey ? 10 : 1

      if (e.key === 'ArrowUp') {
        // Alt/Ctrl/Meta-modified arrows stay native (NF-KEY-03).
        if (e.altKey || e.ctrlKey || e.metaKey) return
        e.preventDefault()
        increment(factor)
      } else if (e.key === 'ArrowDown') {
        if (e.altKey || e.ctrlKey || e.metaKey) return
        e.preventDefault()
        decrement(factor)
      } else if (e.key === 'Home') {
        // Home/End target supplied bounds only when unmodified (NF-KEY-04).
        if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
        if (min === -Infinity) return
        e.preventDefault()
        setDraft(null)
        // FEATURES #2: already at the bound is no change — the key
        // stays handled (caret pinned) but emits nothing.
        if (value === min) return
        requestValue(min)
      } else if (e.key === 'End') {
        if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
        if (max === Infinity) return
        e.preventDefault()
        setDraft(null)
        // FEATURES #2: already at the bound is no change — the key
        // stays handled (caret pinned) but emits nothing.
        if (value === max) return
        requestValue(max)
      } else if (e.key === 'Enter') {
        // Enter commits the draft in place (no blur): invalid text
        // reverts, valid text publishes once. A clean field is untouched
        // and the key stays native for form submission.
        if (draftRef.current !== null && !e.altKey && !e.ctrlKey && !e.metaKey) {
          commitDraft()
        }
      }
    },
    [disabled, readOnly, increment, decrement, commitDraft, value, min, max, requestValue, setDraft, draftRef]
  )

  return {
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    runCommit,
    runCommitRef,
    commitDraft,
    handleKeyDown,
  }
}
