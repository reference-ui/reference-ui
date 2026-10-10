/**
 * Combobox Input keydown: IME composition shielding, arrow open and
 * stepping, tree-bridge horizontal delegation, virtual page keys, Enter
 * session resolution, native-preserving Tab, and the granular Escape
 * hook. Tab commits keyboard-derived active only — never a stale
 * pointer preview — and only a still-mounted option may commit
 * (CB-NAV-07).
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../combobox-context'
import { mountedValue, stepActiveValue } from '../navigation/step'
import { directionForElement } from '../virtual-focus'

export interface InputKeyboard {
  context: ComboboxContextValue | null
  inputRef: React.MutableRefObject<HTMLInputElement | null>
  isComposingRef: React.MutableRefObject<boolean>
  isDisabled: boolean | undefined
  isReadOnly: boolean
  isOpen: boolean
  setIsOpen: ((open: boolean) => void) | undefined
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined
}

export function useInputKeyboard({
  context,
  inputRef,
  isComposingRef,
  isDisabled,
  isReadOnly,
  isOpen,
  setIsOpen,
  onKeyDown,
}: InputKeyboard): (e: React.KeyboardEvent<HTMLInputElement>) => void {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || isReadOnly) return
    if (!context || !setIsOpen) return
    // IME composition owns the key: take no action and shield the
    // document-level Overlay Escape listener, while leaving the native
    // default (composition cancel) untouched (CB-EDIT-05/09).
    if (
      isComposingRef.current ||
      e.key === 'Process' ||
      e.nativeEvent.isComposing ||
      (e.nativeEvent as KeyboardEvent).keyCode === 229
    ) {
      e.stopPropagation()
      return
    }

    const enabled = context.getOrderedOptions().filter(opt => !opt.disabled)

    // The active value can go stale when its option unmounts (dynamic
    // collections); only a still-mounted option may commit (CB-NAV-07).
    const mountedActiveValue = mountedValue(context.activeValue, enabled)
    // #9: Tab commits keyboard-derived active only — never a stale
    // pointer preview (CB-COMMIT-04 narrows vendor Shift+Tab behavior).
    const keyboardActiveValue =
      context.activeSource === 'keyboard' ? mountedActiveValue : null

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        context.requestArrowOpen(1)
      } else if (context.virtualAdapter ?? context.windowedListAdapter) {
        context.navigateVirtual('ArrowDown')
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: 1,
          setActive: context.setActiveValue,
        })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        context.requestArrowOpen(-1)
      } else if (context.virtualAdapter ?? context.windowedListAdapter) {
        context.navigateVirtual('ArrowUp')
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: -1,
          setActive: context.setActiveValue,
        })
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Tree-bridge delegation (FEATURES #6, CB-TREE-01): with a sole
      // Tree popup open, horizontal keys expand/collapse instead of
      // moving the caret — the caret yields to the tree, while listbox
      // and grid popups keep these keys native (CB-EDIT-03). Leaves and
      // missing active values swallow the key with no request.
      if (isOpen && context.popupRole === 'tree' && !context.collectionConflict) {
        e.preventDefault()
        const active = mountedActiveValue
        const entry =
          active != null
            ? context.getOrderedOptions().find(opt => opt.value === active)
            : undefined
        if (active != null && entry?.isBranch) {
          const expandKey =
            directionForElement(inputRef.current) === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
          context.requestTreeExpansion(active, e.key === expandKey)
        }
      }
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      // Virtual grids only (#5): single-line inputs have no native page
      // scroll, so the adapter owns these keys. Non-virtual inputs leave
      // them native (LB-KEY-06 parity); Left/Right/Home/End stay native
      // even for grids (CB-EDIT-03) — 2D horizontal nav is the Trigger's.
      if (isOpen && context.virtualAdapter) {
        e.preventDefault()
        context.navigateVirtual(e.key)
      }
    } else if (e.key === 'Enter') {
      // Open Enter always resolves the session, so the key is always
      // handled while open (RAC "prevent default on Enter if isOpen",
      // CB-COMMIT-08): active commits, else custom commits when allowed
      // (CB-CUSTOM-01) or the committed text is restored (CB-COMMIT-02).
      // Closed Enter stays native (form submit). Zag's custom branch
      // skips prevention only because Zag tolerates rather than commits
      // custom text there — ours commits, so the form must not also fire.
      if (!isOpen) {
        // Native: fall through with no preventDefault.
      } else if (mountedActiveValue != null) {
        e.preventDefault()
        context.handleSelect(mountedActiveValue)
      } else {
        e.preventDefault()
        context.resolveUnmatchedText()
        context.setActiveValue(null)
        setIsOpen(false)
      }
    } else if (e.key === 'Tab') {
      // Native traversal is never prevented. With no keyboard-eligible
      // active option the session resolves (custom commit when allowed,
      // else revert) and closes instead of committing an option
      // (CB-COMMIT-05); closed popups leave Tab entirely native (CB-COMMIT-09).
      if (isOpen) {
        if (keyboardActiveValue != null) {
          context.handleSelect(keyboardActiveValue)
        } else {
          context.resolveUnmatchedText()
          context.setActiveValue(null)
          setIsOpen(false)
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        // #7: granular hook runs first with the real native event
        // (Overlay #3 vocabulary); preventDefault stops revert,
        // callbacks, and dismissal (CB-REVERT-02). The native flag is
        // read live — the synthetic wrapper may have copied it early.
        // Our own preventDefault then shields the Overlay layer, so the
        // path below stays the single dismissal sequence (CB-CLOSE-03).
        context.onEscape?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) return
        e.preventDefault()
        context.revertToCommittedText()
        context.setActiveValue(null)
        setIsOpen(false)
      }
    }
  }

  return handleKeyDown
}
