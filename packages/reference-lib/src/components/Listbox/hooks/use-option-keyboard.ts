/**
 * Listbox option keyboard handling: Enter/Space activation (modified
 * activation stays with the browser, LB-KEY-06), buffer-aware Space
 * routing into typeahead, printable-character typeahead through the
 * kernel entry guard, and arrow navigation delegation. PageUp/PageDown
 * are never repurposed, Escape/Tab pass through, and focus landing in
 * an interactive descendant never promotes the option (LB-KEY-07).
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
// Kernel seam (F2 #2): the typeahead entry guard converges on RovingFocus;
// the search model stays local (TypeaheadModel lacks the LB-KEY-04
// empty-buffer cycle branch).
import { shouldIgnoreTypeaheadKey } from '../../RovingFocus/RovingFocus'
import { isInteractiveDescendant } from '../shared/interactive'
import type { ListboxContextValue } from '../types'

export interface OptionKeyboardHandlers {
  handleKeyDownCapture: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handleFocus: (e: React.FocusEvent<HTMLDivElement>) => void
}

export interface OptionKeyboard {
  context: ListboxContextValue | null
  combobox: ComboboxContextValue | null
  value: string
  index: number | undefined
  isDisabled: boolean
  optionRef: React.RefObject<HTMLDivElement | null>
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement> | undefined
  onKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> | undefined
  onFocus: React.FocusEventHandler<HTMLDivElement> | undefined
}

export function useOptionKeyboard({
  context,
  combobox,
  value,
  index,
  isDisabled,
  optionRef,
  onKeyDown,
  onKeyDownCapture,
  onFocus,
}: OptionKeyboard): OptionKeyboardHandlers {
  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(e)
    // LB-KEY-06: Do NOT repurpose PageUp/PageDown
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.stopPropagation()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // B-02: keydowns from portaled row content are not this option's keys.
    if (!e.currentTarget.contains(e.target as Node)) return
    if (isInteractiveDescendant(e.target, e.currentTarget)) return

    // LB-POINTER-04: a disabled option never runs consumer activation —
    // not even for pass-through keys. Observation (focus landing on an
    // already-focused node) still reports via onFocus.
    if (isDisabled) return

    if (e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Escape' || e.key === 'Tab') {
      onKeyDown?.(e)
      return
    }

    onKeyDown?.(e)
    if (e.defaultPrevented) return

    // LB-KEY-06: modified activation stays with the browser/application —
    // Ctrl/Meta/Alt/Shift+Enter (or Space) must not select. Navigation keys
    // intentionally keep kernel parity (arrows move regardless of modifiers;
    // movement never selects, so LB-MULTI-05 still holds).
    const hasActivationModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey

    if (e.key === 'Enter') {
      if (hasActivationModifier) return
      e.preventDefault()
      if (context) {
        context.selectOption(value)
      } else if (combobox) {
        combobox.handleSelect(value)
      }
      return
    }

    if (e.key === ' ') {
      if (hasActivationModifier) return
      const hasBuffer = context?.typeaheadHasBuffer?.() ?? false
      if (!hasBuffer) {
        e.preventDefault()
        if (context) {
          context.selectOption(value)
        } else if (combobox) {
          combobox.handleSelect(value)
        }
      } else {
        e.preventDefault()
        e.stopPropagation()
        if (context?.virtual && index != null) {
          context.handleVirtualTypeahead(' ', index)
        } else if (context) {
          context.handleStandaloneTypeahead(' ', value)
        }
      }
      return
    }

    // Typeahead handling for printable characters (kernel entry guard;
    // Space routes through the buffer-aware branch above). The guard also
    // skips IME-composing keys, which previously fed the buffer.
    if (e.key !== ' ' && !shouldIgnoreTypeaheadKey(e)) {
      if (context?.virtual && index != null) {
        e.preventDefault()
        e.stopPropagation()
        context.handleVirtualTypeahead(e.key, index)
        return
      } else if (context) {
        e.preventDefault()
        e.stopPropagation()
        context.handleStandaloneTypeahead(e.key, value)
        return
      }
    }

    // Navigation handling
    if (context?.virtual && index != null) {
      context.navigateVirtual(e, index)
      return
    }

    if (context && optionRef.current) {
      context.navigateStandalone(e, optionRef.current)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(e)
    // LB-KEY-07: focus landing in an interactive descendant (input, button)
    // is the descendant's own focus — it must not promote the option to the
    // roving tab stop or the combobox active value.
    if (e.target !== e.currentTarget) return
    if (!isDisabled && context) {
      context.setFocusedValue(value)
    }
    if (!isDisabled && combobox) {
      combobox.setActiveValue(value)
    }
  }

  return { handleKeyDownCapture, handleKeyDown, handleFocus }
}
