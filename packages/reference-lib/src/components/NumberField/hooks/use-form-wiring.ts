/**
 * useFormWiring: native submit and reset observation plus post-reset sync.
 * Submit commits a still-dirty buffer once and blocks on failed
 * boundaries, pending requests, or owned invalid state — read-only
 * fields serialize without numeric blocking, and every dirty field
 * processes the same submit independently. An unprevented reset clears
 * the session and bumps the reset generation; the post-reset sync then
 * re-syncs both owned inputs from controlled state, since native reset
 * clobbers controlled input DOM values behind React's back.
 */
import * as React from 'react'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import type { EditSession } from './use-edit-session'

export interface FormWiringOptions {
  session: EditSession
  runCommitRef: React.MutableRefObject<(text: string) => 'requested' | 'failed' | 'noop'>
  name: string | undefined
  form: string | undefined
  inputRef: React.RefObject<HTMLInputElement | null>
  hiddenRef: React.RefObject<HTMLInputElement | null>
  readOnly: boolean
  ownedInvalid: boolean
  displayValue: string
  canonicalHiddenValue: string
}

export function useFormWiring(options: FormWiringOptions): void {
  const {
    session,
    runCommitRef,
    name,
    form,
    inputRef,
    hiddenRef,
    readOnly,
    ownedInvalid,
    displayValue,
    canonicalHiddenValue,
  } = options
  const {
    setDraft,
    draftRef,
    valueRef,
    failedBoundaryRef,
    pendingRequestRef,
    setFailedBoundary,
    resetEpoch,
    setResetEpoch,
  } = session

  // Native submit/reset observation (PATCHES §5): resolved through the
  // owned inputs' .form so lookup stays scoped to the owner tree (open
  // ShadowRoot included — never document-global). Every dirty field
  // processes the same submit independently: listeners never
  // short-circuit on defaultPrevented (NF-FORM-13).
  const submitStateRef = React.useRef({ readOnly, ownedInvalid })
  submitStateRef.current = { readOnly, ownedInvalid }
  React.useEffect(() => {
    const formElement = hiddenRef.current?.form ?? inputRef.current?.form ?? null
    if (!formElement) return
    const onSubmit = (e: Event) => {
      const state = submitStateRef.current
      // Read-only fields serialize canonical state without numeric
      // blocking; disabled fields are omitted natively.
      if (state.readOnly) return
      const dirty = draftRef.current
      if (dirty !== null) {
        // Still-dirty at submit: process the commit once (NF-FORM-06/07).
        // A completed request needs an explicit retry after the echo; a
        // failed boundary persists; only a true noop (hidden already
        // canonical, field otherwise valid) lets the submit through.
        const outcome = runCommitRef.current(dirty)
        if (
          outcome === 'noop' &&
          !failedBoundaryRef.current &&
          !state.ownedInvalid &&
          !pendingRequestRef.current
        ) {
          return
        }
        e.preventDefault()
        return
      }
      if (failedBoundaryRef.current || pendingRequestRef.current || state.ownedInvalid) {
        e.preventDefault()
      }
    }
    const onReset = (e: Event) => {
      // An application-cancelled reset leaves the active session exactly
      // intact; propagate nothing.
      if (e.defaultPrevented) return
      setDraft(null)
      draftRef.current = null
      pendingRequestRef.current = false
      setFailedBoundary(false)
      setResetEpoch(epoch => epoch + 1)
    }
    formElement.addEventListener('submit', onSubmit)
    formElement.addEventListener('reset', onReset)
    return () => {
      formElement.removeEventListener('submit', onSubmit)
      formElement.removeEventListener('reset', onReset)
    }
  }, [name, form, setFailedBoundary])

  // Post-reset sync (NF-FORM-08/14): native reset clobbers controlled
  // input DOM values behind React's back, so re-sync both owned inputs
  // from controlled state after every unprevented reset. Focus never
  // moves (programmatic reset keeps it, clicked reset already blurred);
  // a still-focused Input gets its caret at the formatted end. Reset
  // never changes the controlled number or application custom validity.
  const postResetSyncRef = React.useRef({ displayValue, canonicalHiddenValue })
  postResetSyncRef.current = { displayValue, canonicalHiddenValue }
  const firstResetSyncRef = React.useRef(true)
  useIsomorphicLayoutEffect(() => {
    if (firstResetSyncRef.current) {
      firstResetSyncRef.current = false
      return
    }
    // Per-session live dedupe resets to control with the reset session end.
    session.lastLiveRef.current = valueRef.current
    const sync = postResetSyncRef.current
    const input = inputRef.current
    if (input) {
      input.value = sync.displayValue
      // NF-ENV-06: focus ownership reads from the owner root (a shadow
      // input is never document.activeElement).
      const root = input.getRootNode() as Document | ShadowRoot
      if (root.activeElement === input) {
        try {
          input.setSelectionRange(sync.displayValue.length, sync.displayValue.length)
        } catch {
          // ignore if not supported
        }
      }
    }
    if (hiddenRef.current) hiddenRef.current.value = sync.canonicalHiddenValue
  }, [resetEpoch])
}
