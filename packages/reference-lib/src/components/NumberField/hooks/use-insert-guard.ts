/**
 * useInsertGuard: native paste and typing validation. Paste validates in
 * native beforeinput/paste listeners — never React's onBeforeInput, which
 * React derives from keypress/textInput/paste/compositionend and never
 * feeds the native beforeinput event. Native ordering gives the SPEC order
 * for free: every consumer paste observer runs before this validation,
 * and a consumer veto cancels the insertion natively before it ever runs.
 * The paste listener only stashes the payload; only beforeinput prevents.
 */
import * as React from 'react'
import { isImpossibleInsertion, parseDraftNumber } from '../draft/parse'
import type { DraftNumberSymbols } from '../draft/symbols'
import { setNativeInputValue, useIsomorphicLayoutEffect } from '../shared/dom'

export interface InsertGuardOptions {
  inputRef: React.RefObject<HTMLInputElement | null>
  composingRef: React.MutableRefObject<boolean>
  disabled: boolean
  readOnly: boolean
  symbols: DraftNumberSymbols
  percentStyle: boolean
  groupingDisabled: boolean
}

// NF-EDIT-08/09 + NF-PARSE-07: paste validates in NATIVE
// beforeinput/ paste listeners — never React's onBeforeInput, which
// React derives from keypress/textInput/paste/compositionend and
// never feeds the native beforeinput event (verified in the
// react-dom bundle: onBeforeInput registers compositionend,
// keypress, textInput, paste). Native ordering gives the SPEC order
// for free: every consumer paste observer (paste phase) runs before
// this beforeinput validation, and a consumer paste/beforeinput
// veto cancels the insertion natively before we ever run. The paste
// listener only stashes the payload (failing open on unreadable
// clipboards, NF-EDIT-10); only beforeinput ever prevents.
export function useInsertGuard(options: InsertGuardOptions): void {
  const { inputRef, composingRef, disabled, readOnly, symbols, percentStyle, groupingDisabled } = options
  const pasteStashRef = React.useRef<string | null>(null)
  const handleBeforeInput = React.useCallback(
    (e: Event) => {
      const native = e as InputEvent
      // Paste and ordinary typing validate here; compositional and
      // deletion insertions stay fully native (NF-EDIT-11).
      if (native.inputType !== 'insertFromPaste' && native.inputType !== 'insertText') return
      if (disabled || readOnly) return
      // Mid-composition insertions land natively and stage verbatim
      // via the ordinary input path (NF-EDIT-11: never mid-session).
      if (composingRef.current) return
      // Authoritative insert text first, native paste stash second;
      // unreadable either way fails open (NF-EDIT-10).
      const payload = (typeof native.data === 'string' ? native.data : null) ?? pasteStashRef.current
      pasteStashRef.current = null
      if (payload === null) return
      const node = e.currentTarget as HTMLInputElement | null
      if (!node) return
      let start: number
      let end: number
      try {
        start = node.selectionStart ?? node.value.length
        end = node.selectionEnd ?? node.value.length
      } catch {
        return
      }
      const current = node.value
      // NF-EDIT-02 tendency gate: ordinary typed insertions cancel
      // only the impossible — letters (other than one well-placed
      // exponent e), a duplicate decimal, a second/misplaced sign.
      // Valid partials ("-", "1.", "1e") always stage verbatim.
      if (native.inputType === 'insertText') {
        if (isImpossibleInsertion(current, start, end, payload, symbols)) {
          e.preventDefault()
        }
        return
      }
      // NF-PARSE-07: grouping-disabled fields strip pasted group
      // tokens — the number and caret model survive, separators go.
      let insert = payload
      if (groupingDisabled && symbols.group !== null && insert.includes(symbols.group)) {
        insert = insert.split(symbols.group).join('')
      }
      const spliced = current.slice(0, start) + insert + current.slice(end)
      // Strict live grammar (NF-EDIT-09): letters, conflicting
      // affixes, malformed grouping, ambiguous punctuation, and
      // overflow prevent with zero mutation — text, selection,
      // control, and callbacks all stay.
      if (Number.isNaN(parseDraftNumber(spliced, symbols, percentStyle))) {
        e.preventDefault()
        return
      }
      if (insert === payload) return
      // Stripped payload: native landing would insert the separators,
      // so apply the ungrouped splice through a real input event
      // (consumer input observers still run in native order) with the
      // caret after the inserted text.
      e.preventDefault()
      setNativeInputValue(node, spliced)
      node.dispatchEvent(new Event('input', { bubbles: true }))
      const caret = start + insert.length
      try {
        node.setSelectionRange(caret, caret)
      } catch {
        // ignore if not supported
      }
    },
    [disabled, readOnly, symbols, percentStyle, groupingDisabled]
  )
  useIsomorphicLayoutEffect(() => {
    const node = inputRef.current
    if (!node) return
    const stash = (e: Event) => {
      try {
        pasteStashRef.current = (e as ClipboardEvent).clipboardData?.getData('text') ?? null
      } catch {
        pasteStashRef.current = null
      }
    }
    node.addEventListener('paste', stash)
    node.addEventListener('beforeinput', handleBeforeInput)
    return () => {
      node.removeEventListener('paste', stash)
      node.removeEventListener('beforeinput', handleBeforeInput)
    }
  }, [inputRef, handleBeforeInput])
}
