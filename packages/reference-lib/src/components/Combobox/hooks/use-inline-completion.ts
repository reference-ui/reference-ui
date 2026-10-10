/**
 * Combobox inline completion (#1): the display value carrying the active
 * label under inline/both autocomplete, suffix-only selection that
 * preserves the user's own caret moves, and IME composition ownership —
 * composition clears the completion through React state (deferred to a
 * microtask so React 17 never commits inside the composition dispatch).
 * Preview navigation never emits text callbacks: prop-driven value sets
 * dispatch no change events.
 */
import * as React from 'react'
import { completesInline, completionForPrefix } from '../autocomplete'
import type { ComboboxContextValue } from '../combobox-context'

export interface InlineCompletion {
  displayValue: string
  isComposingRef: React.MutableRefObject<boolean>
  handleCompositionStart: (e: React.CompositionEvent<HTMLInputElement>) => void
  handleCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
}

export function useInlineCompletion(
  context: ComboboxContextValue | null,
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  onCompositionStart: React.CompositionEventHandler<HTMLInputElement> | undefined,
  onCompositionEnd: React.CompositionEventHandler<HTMLInputElement> | undefined
): InlineCompletion {
  const isComposingRef = React.useRef(false)
  // Composition display state (#1): the completion must clear while the
  // IME owns the text. State (not just the ref) so the display value
  // below recomputes through React on every major — no imperative write
  // for a version-specific tracker to restore.
  const [isComposing, setIsComposing] = React.useState(false)
  const inputValue = context?.inputValue ?? ''

  // #1: inline completion for autocomplete="inline"/"both". The DISPLAY
  // value (not the controlled text) carries the active label: React itself
  // sets the DOM from the prop, so no imperative write exists for a
  // version-specific controlled-input tracker to restore (17 parity).
  // Preview navigation never emits text callbacks (CB-MODE-07) —
  // prop-driven value sets dispatch no change events.
  const completed =
    context != null &&
    completesInline(context.autocomplete) &&
    context.isOpen &&
    !isComposing
      ? completionForPrefix(context.inputValue, context.activeOptionText)
      : null
  const displayValue = completed ?? inputValue

  // Suffix selection for fresh completions: the effect applies when the
  // (completion, prefix) pair changes and leaves the caret alone
  // otherwise, so the user's own caret moves survive re-renders. One
  // exception: React 17/18 rewrites the value prop on unrelated commits,
  // collapsing the caret to the end — a collapsed-at-end caret with an
  // unchanged pair is re-selected (a user's Left/Home/click lands
  // elsewhere and is preserved).
  const prevCompletionRef = React.useRef<{ completed: string; prefix: string } | null>(null)
  React.useLayoutEffect(() => {
    const node = inputRef.current
    const prev = prevCompletionRef.current
    if (completed == null || !node || !context) {
      prevCompletionRef.current = null
      return
    }
    const prefix = context.inputValue
    if (prev && prev.completed === completed && prev.prefix === prefix) {
      if (
        node.selectionStart === completed.length &&
        node.selectionEnd === completed.length
      ) {
        node.setSelectionRange(prefix.length, completed.length)
      }
      return
    }
    prevCompletionRef.current = { completed, prefix }
    node.setSelectionRange(prefix.length, completed.length)
  })

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionStart?.(e)
    // #1: composition owns the text — the display state clears any inline
    // completion through React so the IME never composes over a selected
    // suffix (CB-EDIT-05). Deferred like compositionend: a synchronous
    // React 17 commit inside compositionstart would rewrite the value
    // and collapse a pending replacement range (fill-over-content lands
    // at the collapsed caret, 02-F2). The ref keeps gates synchronous.
    isComposingRef.current = true
    queueMicrotask(() => {
      setIsComposing(true)
    })
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionEnd?.(e)
    isComposingRef.current = false
    // The display recompute must not commit synchronously: React 17
    // flushes discrete-event setState inside the compositionend dispatch,
    // before Firefox dispatches the trailing input event, so the commit
    // re-asserts the stale controlled value over the just-composed DOM
    // text and the edit is swallowed (02-F1..F3/F5..F7/F9/F10). A
    // microtask lands after the input event (same-task dispatch); the
    // ref above keeps the behavioral gates synchronous.
    queueMicrotask(() => {
      setIsComposing(false)
    })
  }

  return { displayValue, isComposingRef, handleCompositionStart, handleCompositionEnd }
}
