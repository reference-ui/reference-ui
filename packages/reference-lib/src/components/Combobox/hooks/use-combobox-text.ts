/**
 * Combobox's text session: input edits with logical/mounted live
 * resolution, the committed-label composition (mounted textValue, else
 * the label cache that survives filtering unmounts, else the raw value),
 * revert-to-committed, and unmatched-text resolution — custom commit
 * when allowed, committed-text restore otherwise. Select-only sources
 * have no text authority, so revert and resolve are no-ops there.
 */
import * as React from 'react'
import type { ComboboxOptionEntry } from '../combobox-context'
import type { ComboboxSession } from './use-combobox-session'

export interface ComboboxText {
  handleInputChange: (nextInput: string) => void
  getCommittedLabel: () => string
  revertToCommittedText: () => void
  resolveUnmatchedText: () => void
}

export function useComboboxText(
  session: ComboboxSession,
  args: {
    value: string | null
    onChange: (value: string | null) => void
    notifyInput: ((value: string) => void) | undefined
    selectOnly: boolean
    allowCustomValue: boolean
    collectionConflict: boolean
    getOrderedOptions: () => ComboboxOptionEntry[]
    setActiveValue: (val: string | null, source?: 'keyboard' | 'pointer' | null) => void
    searchVirtual: (text: string) => void
  }
): ComboboxText {
  const {
    isControlledInput,
    inputValue,
    setInternalInput,
    isOpen,
    optionsMapRef,
    labelCacheRef,
    pendingTypingRef,
    needsResolveRef,
    adapterRef,
    windowedRef,
  } = session
  const {
    value,
    onChange,
    notifyInput,
    selectOnly,
    allowCustomValue,
    collectionConflict,
    getOrderedOptions,
    setActiveValue,
    searchVirtual,
  } = args

  const handleInputChange = React.useCallback(
    (nextInput: string) => {
      if (!isControlledInput) setInternalInput(nextInput)
      notifyInput?.(nextInput)
      // Logical typing (#5, CB-ADAPTER-07; CB-VIRT shares it): prefix
      // search over logical items (mounted or not); unmounted matches
      // pend + scroll. Conflicted collections take no active state
      // (CB-ADAPTER-08).
      if (collectionConflict) return
      if (adapterRef.current ?? windowedRef.current) {
        // Logical adapters resolve live; only closed typing pends (a
        // fresh open wipes event-time state, and the resolver restores
        // it). Typing while open must not arm the flag, or a later mount
        // would clobber arrow navigation with a stale search.
        if (!isOpen) pendingTypingRef.current = true
        searchVirtual(nextInput)
        return
      }
      const enabled = getOrderedOptions().filter(opt => !opt.disabled)
      // Typing is fresh keyboard intent, so the first match is Tab-eligible.
      // Live resolution also satisfies a pending open (the resolver must
      // not run after us and wipe fresher intent back to null).
      if (enabled.length > 0) {
        needsResolveRef.current = false
        pendingTypingRef.current = false
        const first = enabled[0]
        if (first) setActiveValue(first.value, 'keyboard')
      } else {
        pendingTypingRef.current = true
      }
    },
    [isControlledInput, notifyInput, getOrderedOptions, setActiveValue, searchVirtual, collectionConflict, isOpen]
  )

  // Committed display label (#1 composition): the mounted option's
  // textValue, else the label cache (survives filtering unmounts), else
  // the raw value. Shared by revert and custom-value matching so the two
  // paths agree on what "already committed" means.
  const getCommittedLabel = React.useCallback((): string => {
    if (value == null) return ''
    return (
      optionsMapRef.current.get(value)?.textValue ??
      labelCacheRef.current.get(value) ??
      String(value)
    )
  }, [value])

  const revertToCommittedText = React.useCallback(() => {
    // #13: select-only has no text authority — revert is a no-op there.
    if (selectOnly) return
    const committedLabel = getCommittedLabel()
    if (inputValue !== committedLabel) {
      handleInputChange(committedLabel)
    }
  }, [selectOnly, inputValue, handleInputChange, getCommittedLabel])

  // Unmatched-text session resolution (#2, W-24, CB-CUSTOM-01/02). With
  // `allowCustomValue`, exact input text commits as the value (empty maps
  // to `null`, never normalized); otherwise the committed text is
  // restored. Silent when the text already matches the committed value
  // (Zag `isCustomValue`: inputValue !== valueAsString). No text
  // callback on the custom path — the input already shows the text.
  const resolveUnmatchedText = React.useCallback(() => {
    // #13: select-only has no text authority.
    if (selectOnly) return
    if (!allowCustomValue) {
      revertToCommittedText()
      return
    }
    // Two-authority conflict (#5, CB-ADAPTER-08): commits stay inert.
    if (collectionConflict) return
    if (inputValue === getCommittedLabel()) return
    // B-36: re-committing the identical value is silent — dismiss still runs.
    const nextVal = inputValue === '' ? null : inputValue
    if (nextVal !== value) {
      onChange(nextVal)
    }
  }, [
    selectOnly,
    allowCustomValue,
    collectionConflict,
    inputValue,
    getCommittedLabel,
    value,
    onChange,
    revertToCommittedText,
  ])

  return { handleInputChange, getCommittedLabel, revertToCommittedText, resolveUnmatchedText }
}
