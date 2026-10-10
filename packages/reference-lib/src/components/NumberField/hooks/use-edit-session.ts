/**
 * useEditSession: the dirty edit session and everything that can end it.
 * Typing stages the verbatim draft while newly parseable meanings publish
 * live; echoes preserve the session with exact text and caret while every
 * other authoritative change — value replacement, effective locale/format
 * swap, constraint edit — replaces the buffer, bumps the replacement
 * generation, clears transient failures, and invalidates composition. The
 * caret effect replays each selection edge by logical digit across
 * formatting replacements. Failed boundaries and pending requests block
 * submit until a new edit, an echo, or an unprevented reset clears them.
 */
import * as React from 'react'
import { isLogicalDigitChar, offsetAfterLogicalDigits } from '../draft/caret'
import { isEqualFormatOptions, type DraftNumberSymbols } from '../draft/symbols'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import type { NumberFieldCommitBehavior } from '../types'

export interface EditSessionOptions {
  value: number | null
  displayValue: string
  locale: string
  formatOptions: Intl.NumberFormatOptions | undefined
  min: number
  max: number
  step: number
  commitBehavior: NumberFieldCommitBehavior
  disabled: boolean
  readOnly: boolean
  symbols: DraftNumberSymbols
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: ((value: number | null) => void) | undefined
}

export interface EditSession {
  draft: string | null
  setDraft: React.Dispatch<React.SetStateAction<string | null>>
  draftRef: React.MutableRefObject<string | null>
  valueRef: React.MutableRefObject<number | null>
  failedBoundary: boolean
  setFailedBoundary: (failed: boolean) => void
  failedBoundaryRef: React.MutableRefObject<boolean>
  pendingRequestRef: React.MutableRefObject<boolean>
  clearTransientFailures: () => void
  resetEpoch: number
  setResetEpoch: React.Dispatch<React.SetStateAction<number>>
  lastLiveRef: React.MutableRefObject<number | null>
  composingRef: React.MutableRefObject<boolean>
  compositionSnapshotRef: React.MutableRefObject<string | null>
  compositionFalloutRef: React.MutableRefObject<boolean>
  compositionCancelRef: React.MutableRefObject<boolean>
  icuCaptureRef: React.MutableRefObject<{ node: HTMLInputElement; text: string } | null>
  icuCaptureDoneRef: React.MutableRefObject<boolean>
  caretCaptureRef: React.MutableRefObject<{ text: string; start: number; end: number } | null>
  caretRestoreSkipRef: React.MutableRefObject<boolean>
  invalidateComposition: (displayLength: number) => void
  replacementEpoch: number
  requestValue: (candidate: number | null) => void
}

export function useEditSession(options: EditSessionOptions): EditSession {
  const {
    value,
    displayValue,
    locale,
    formatOptions,
    min,
    max,
    step,
    commitBehavior,
    disabled,
    readOnly,
    symbols,
    inputRef,
    onChange,
  } = options

  // The dirty edit session (B-19 verbatim draft + NFLAST ruling (c)
  // live-request). Typing stages the draft verbatim so bounded decimals
  // like "2.5" survive the "." keystroke instead of clamping to the max;
  // newly parseable meanings are requested live (raw); commit boundaries
  // (blur, Enter, handled steps) flush whatever differs from control.
  const [draft, setDraft] = React.useState<string | null>(null)
  const draftRef = React.useRef<string | null>(null)
  draftRef.current = draft
  // Controlled-value mirror for listeners/effects whose dependency lists
  // must not resubscribe per value (reset sync below).
  const valueRef = React.useRef<number | null>(value)
  valueRef.current = value

  // Failed-boundary + pending-request submit blocking (NF-COMMIT-07,
  // NF-FORM-05/06/11/12). A failed boundary is set by invalid, incomplete,
  // or validate-rejected commits; a pending request is set by any commit
  // or step the parent has not echoed yet. Both block submit without
  // consuming themselves; both clear only on a new user edit, an echo or
  // authoritative programmatic change, or an unprevented reset. The ref
  // mirror lets native submit listeners read synchronously.
  const [failedBoundary, setFailedBoundaryState] = React.useState(false)
  const failedBoundaryRef = React.useRef(false)
  const setFailedBoundary = React.useCallback((failed: boolean) => {
    failedBoundaryRef.current = failed
    setFailedBoundaryState(failed)
  }, [])
  const pendingRequestRef = React.useRef(false)
  const clearTransientFailures = React.useCallback(() => {
    pendingRequestRef.current = false
    setFailedBoundary(false)
  }, [setFailedBoundary])

  // Form reset generation (NF-FORM-08/14): steppers end active holds when
  // it advances; the post-reset sync effect re-syncs controlled inputs.
  const [resetEpoch, setResetEpoch] = React.useState(0)

  // NFLAST ruling (c): the latest requested numeric meaning (live or
  // commit). A controlled value change matching it is the latest echo —
  // the dirty session survives with exact text/caret (NF-COMMIT-08);
  // anything else is a stale echo or an unrelated replacement: the
  // buffer is replaced from controlled state and the session ends with
  // zero callback (NF-COMMIT-11, NF-DYNAMIC-01). Either way the change
  // is authoritative and clears pending/failed transient state. The ref
  // also dedupes live requests (NF-EDIT-03/05).
  const lastLiveRef = React.useRef<number | null>(value)
  // NF-EDIT-11: an open IME/synthetic composition suspends live publish
  // (stepping/commit already suspend via isComposing in handleKeyDown).
  // Staged text still buffers verbatim; the final event only ends the
  // suspension — publish happens at the next input event or boundary.
  const composingRef = React.useRef(false)
  // NF-EDIT-12: pre-composition draft snapshot for invalid-final restore.
  const compositionSnapshotRef = React.useRef<string | null>(null)
  // NF-EDIT-17/18: an authoritative replacement during composition arms
  // one swallow — the stale end/input fallout is ignored (and the DOM
  // node is reverted to controlled text, since no state change follows).
  const compositionFalloutRef = React.useRef(false)
  // NF-DYNAMIC-05: disable/read-only/part-removal cancels an open
  // composition session outright (no fallout swallow — nothing was
  // replaced); the stale compositionend is then ignored once.
  const compositionCancelRef = React.useRef(false)
  // NF-ENV-02 pre-commit SSR capture (node + serialized text), taken
  // once on the first render and validated by the mount effect.
  const icuCaptureRef = React.useRef<{ node: HTMLInputElement; text: string } | null>(null)
  const icuCaptureDoneRef = React.useRef(false)
  // NF-EDIT-07: pre-commit caret capture (text + selection read during
  // render, while the DOM still holds the outgoing text) and the one-shot
  // skip a composition invalidation consumes — its explicit end placement
  // is the placement, never a logical remap.
  const caretCaptureRef = React.useRef<{ text: string; start: number; end: number } | null>(null)
  const caretRestoreSkipRef = React.useRef(false)
  const invalidateComposition = React.useCallback((displayLength: number) => {
    if (!composingRef.current) return
    composingRef.current = false
    compositionSnapshotRef.current = null
    compositionFalloutRef.current = true
    caretRestoreSkipRef.current = true
    const node = inputRef.current
    if (node) {
      try {
        node.setSelectionRange(displayLength, displayLength)
      } catch {
        // ignore if not supported
      }
    }
  }, [inputRef])
  // NF-DYNAMIC-05: non-echo controlled replacements and effective
  // locale/format swaps advance the replacement generation — active
  // stepper holds end without a stale release step (their own echoes
  // never bump, so holds survive normal ticking).
  const [replacementEpoch, setReplacementEpoch] = React.useState(0)
  React.useEffect(() => {
    const echoed = value === lastLiveRef.current
    lastLiveRef.current = value
    clearTransientFailures()
    if (!echoed) {
      draftRef.current = null
      setDraft(null)
      setReplacementEpoch(epoch => epoch + 1)
      invalidateComposition(displayValue.length)
    }
  }, [value, clearTransientFailures, invalidateComposition, displayValue])

  // W-25: an effective locale/format change replaces a dirty draft from
  // controlled state (React Aria parity); a referentially new but
  // effectively equal formatOptions object preserves the session.
  // Effective changes are authoritative and clear failed/pending too.
  // The live-dedupe ref resets to control: dedupe is per-session, so a
  // new session re-requests even a meaning the old session published.
  const prevFormatRef = React.useRef({ locale, formatOptions })
  React.useEffect(() => {
    const prev = prevFormatRef.current
    if (prev.locale !== locale || !isEqualFormatOptions(prev.formatOptions, formatOptions)) {
      prevFormatRef.current = { locale, formatOptions }
      lastLiveRef.current = value
      draftRef.current = null
      setDraft(null)
      setReplacementEpoch(epoch => epoch + 1)
      clearTransientFailures()
      invalidateComposition(displayValue.length)
    }
  }, [locale, formatOptions, clearTransientFailures, value, invalidateComposition, displayValue])

  // NF-DYNAMIC-05: disabling or read-locking mid-composition cancels
  // the session — staged text stays for the blur boundary (disable
  // natively blurs a focused input), but the session no longer suspends
  // publish and its stale end is ignored once.
  React.useEffect(() => {
    if ((disabled || readOnly) && composingRef.current) {
      composingRef.current = false
      compositionSnapshotRef.current = null
      compositionCancelRef.current = true
    }
  }, [disabled, readOnly])

  // NF-EDIT-07: formatting replacements preserve the caret by logical
  // digit. The capture (taken during render, pre-commit) holds the
  // outgoing text and selection; when the committed text differs and the
  // input still has focus in its own root, each selection edge follows
  // its preceding-digit count into the new text. Typing commits are
  // exact-text no-ops (capture equals render); blurred replacements keep
  // the browser default; unsupported selection APIs fail open.
  const renderedText = draft ?? displayValue
  useIsomorphicLayoutEffect(() => {
    if (caretRestoreSkipRef.current) {
      caretRestoreSkipRef.current = false
      return
    }
    const node = inputRef.current
    const capture = caretCaptureRef.current
    if (!node || !capture || capture.text === renderedText) return
    const root = node.getRootNode() as Document | ShadowRoot
    if (root.activeElement !== node) return
    const digits = symbols.digits
    const mapOffset = (offset: number): number => {
      const clamped = Math.max(0, Math.min(offset, capture.text.length))
      let count = 0
      for (const char of Array.from(capture.text.slice(0, clamped))) {
        if (isLogicalDigitChar(char, digits)) count += 1
      }
      return offsetAfterLogicalDigits(renderedText, count, digits)
    }
    try {
      node.setSelectionRange(mapOffset(capture.start), mapOffset(capture.end))
    } catch {
      // ignore if not supported
    }
  }, [renderedText, symbols, inputRef])

  // Authoritative constraint changes revalidate and clear failed/pending
  // (NF-COMMIT-07, NF-DYNAMIC-03): the new bounds/step/policy supersede
  // any retained boundary. State itself recomputes from props each render.
  const prevConstraintsRef = React.useRef({ min, max, step, commitBehavior })
  React.useEffect(() => {
    const prev = prevConstraintsRef.current
    if (
      prev.min !== min ||
      prev.max !== max ||
      prev.step !== step ||
      prev.commitBehavior !== commitBehavior
    ) {
      prevConstraintsRef.current = { min, max, step, commitBehavior }
      lastLiveRef.current = value
      clearTransientFailures()
    }
  }, [min, max, step, commitBehavior, clearTransientFailures, value])

  // Every requested candidate is pending until the parent echoes it or
  // an authoritative change supersedes it; un-acked requests block
  // submit so stale hidden state can never serialize (NF-COMMIT-07).
  const requestValue = React.useCallback(
    (candidate: number | null) => {
      pendingRequestRef.current = true
      onChange?.(candidate)
    },
    [onChange]
  )

  return {
    draft,
    setDraft,
    draftRef,
    valueRef,
    failedBoundary,
    setFailedBoundary,
    failedBoundaryRef,
    pendingRequestRef,
    clearTransientFailures,
    resetEpoch,
    setResetEpoch,
    lastLiveRef,
    composingRef,
    compositionSnapshotRef,
    compositionFalloutRef,
    compositionCancelRef,
    icuCaptureRef,
    icuCaptureDoneRef,
    caretCaptureRef,
    caretRestoreSkipRef,
    invalidateComposition,
    replacementEpoch,
    requestValue,
  }
}
