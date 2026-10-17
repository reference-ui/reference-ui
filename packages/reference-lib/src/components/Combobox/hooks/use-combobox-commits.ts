/**
 * Combobox's commit paths: option selection with text sync and dismiss,
 * the outside-press revert that runs in Overlay's pointerdown phase
 * (before blur, while the registry is still mounted), and the blur path
 * that resolves unmatched text and closes when focus truly leaves.
 * Closed popovers never commit; conflicts hold commits inert; Firefox's
 * same-task Tab→blur skips the synchronously committed session.
 */
import * as React from 'react'
import type { ComboboxSession } from './use-combobox-session'

export interface ComboboxCommits {
  handleSelect: (nextVal: string | null) => void
  handleOutsidePress: () => void
  handleSourceBlur: (relatedTarget: EventTarget | null) => void
}

export function useComboboxCommits(
  session: ComboboxSession,
  args: {
    value: string | null
    onChange: (value: string | null) => void
    closeOnBlur: boolean
    selectOnly: boolean
    collectionConflict: boolean
    setIsOpen: (open: boolean) => void
    handleInputChange: (nextInput: string) => void
    resolveUnmatchedText: () => void
  }
): ComboboxCommits {
  const {
    isControlledInput,
    isOpen,
    popoverId,
    sourceRef,
    optionsMapRef,
    activeSourceRef,
    setActiveSourceState,
    setActiveValueState,
    justCommittedRef,
  } = session
  const {
    value,
    onChange,
    closeOnBlur,
    selectOnly,
    collectionConflict,
    setIsOpen,
    handleInputChange,
    resolveUnmatchedText,
  } = args

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      // Closed popovers never commit (CB-CLOSE-04): exit-kept content is
      // inert, so late clicks/presses during the visual exit are dropped.
      // Every legitimate caller is an open path (open Enter/Tab, Trigger
      // activation, mounted option/cell press).
      if (!isOpen) return
      // Two-authority conflict (#5, CB-ADAPTER-08): no adapter
      // receives a commit until exactly one authority remains.
      if (collectionConflict) return
      // Re-committing the identical value is silent (Listbox single
      // LB-SINGLE-05 parity) — text sync and dismiss still run.
      if (nextVal !== value) {
        onChange(nextVal)
      }
      if (nextVal !== null && !isControlledInput && !selectOnly) {
        const selectedOpt = optionsMapRef.current.get(nextVal)
        const labelText = selectedOpt?.textValue ?? nextVal
        handleInputChange(labelText)
      }
      // Synchronous commit mark (see justCommittedRef).
      justCommittedRef.current = true
      setIsOpen(false)
    },
    [isControlledInput, isOpen, selectOnly, value, onChange, handleInputChange, setIsOpen, collectionConflict]
  )

  // Outside press (#3): Overlay dismisses non-inert layers synchronously
  // on pointerdown — before blur — so the revert must run in the same
  // phase. This granular hook fires first inside requestOutside, reusing
  // Overlay's own inside/outside accounting (no duplicate geometry).
  const handleOutsidePress = React.useCallback(() => {
    if (!closeOnBlur) return
    resolveUnmatchedText()
  }, [closeOnBlur, resolveUnmatchedText])

  const handleSourceBlur = React.useCallback(
    (relatedTarget: EventTarget | null) => {
      if (!closeOnBlur) return
      if (
        relatedTarget instanceof HTMLElement &&
        (sourceRef.current?.contains(relatedTarget) ||
          (typeof document !== 'undefined' &&
            document.getElementById(popoverId)?.contains(relatedTarget)))
      ) {
        return
      }
      // Focus left the combobox while open: editable resolves unmatched
      // text (custom commit when allowed, else committed-text restore),
      // both shapes clear active, and close is requested unless already
      // requested. Covers keyboard and programmatic focus exits, inside
      // dialogs or out (CB-CLOSE-02 branch); pointer exits resolve
      // earlier in handleOutsidePress (while the registry is still
      // mounted) so order stays resolve-before-dismiss. Blur after
      // unmount must NOT resolve: the registry is empty and the raw-value
      // fallback would fabricate a phantom text request.
      // A same-task blur after a synchronous commit (Firefox
      // Tab→blur ordering) skips the resolved session exactly as the
      // post-flush blur does on Chromium (no-op but deduped close).
      if (isOpen && !justCommittedRef.current) {
        resolveUnmatchedText()
        activeSourceRef.current = null
        setActiveSourceState(null)
        setActiveValueState(null)
      }
      setIsOpen(false)
    },
    [closeOnBlur, isOpen, popoverId, resolveUnmatchedText, setIsOpen]
  )

  return { handleSelect, handleOutsidePress, handleSourceBlur }
}
