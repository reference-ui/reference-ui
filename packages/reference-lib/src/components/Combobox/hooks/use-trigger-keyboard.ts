/**
 * Combobox Trigger keydown: Enter/Space activation decided in keydown
 * (closed opens, open-with-active commits, open-without-active closes —
 * suppressing the native click so paths never double-fire), arrow open
 * and stepping, grid horizontal/page keys and tree horizontal
 * delegation, Escape/Tab select-only mirror, Home/End, and printable
 * typeahead that opens when closed then cycles matches. Focus stays on
 * the Trigger throughout; nothing commits until activation.
 */
import * as React from 'react'
import type { TypeaheadModel } from '../../RovingFocus/typeahead'
import { shouldIgnoreTypeaheadKey } from '../../RovingFocus/typeahead'
import type { ComboboxContextValue } from '../combobox-context'
import { mountedValue, stepActiveValue } from '../navigation/step'
import { directionForElement } from '../virtual-focus'

export interface TriggerKeyboard {
  context: ComboboxContextValue | null
  typeaheadRef: React.MutableRefObject<TypeaheadModel | null>
  isDisabled: boolean | undefined
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> | undefined
}

export function useTriggerKeyboard({
  context,
  typeaheadRef,
  isDisabled,
  onKeyDown,
}: TriggerKeyboard): (e: React.KeyboardEvent<HTMLButtonElement>) => void {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled) return
    if (!context) return
    const enabled = context.getOrderedOptions().filter(opt => !opt.disabled)
    const mountedActiveValue = mountedValue(context.activeValue, enabled)
    const keyboardActiveValue =
      context.activeSource === 'keyboard' ? mountedActiveValue : null

    const activateFirstLast = (which: 'first' | 'last') => {
      const target = which === 'first' ? enabled[0] : enabled[enabled.length - 1]
      if (target) {
        e.preventDefault()
        context.setActiveValue(target.value, 'keyboard')
        target.node?.scrollIntoView({ block: 'nearest' })
      }
    }

    // Enter/Space decide in keydown (preventing the native click):
    // closed opens, open-with-active commits, open-without-active closes.
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      if (!context.isOpen) {
        context.setIsOpen(true)
      } else if (mountedActiveValue != null) {
        context.handleSelect(mountedActiveValue)
      } else {
        context.setActiveValue(null)
        context.setIsOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!context.isOpen) {
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
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!context.isOpen) {
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
      return
    }

    // #5: grid horizontal/page keys exist only for select-only Triggers
    // (editable inputs keep them native per CB-EDIT-03) and only with an
    // adapter; otherwise ignored as before. Tree popups delegate
    // horizontal keys to expansion (FEATURES #6); windowed lists leave
    // horizontal/page keys alone (no contract).
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (context.isOpen && context.virtualAdapter) {
        e.preventDefault()
        context.navigateVirtual(e.key)
      } else if (
        context.isOpen &&
        context.popupRole === 'tree' &&
        !context.collectionConflict
      ) {
        e.preventDefault()
        const active = mountedActiveValue
        const entry =
          active != null
            ? context.getOrderedOptions().find(opt => opt.value === active)
            : undefined
        if (active != null && entry?.isBranch) {
          const expandKey =
            directionForElement(context.sourceRef.current) === 'rtl'
              ? 'ArrowLeft'
              : 'ArrowRight'
          context.requestTreeExpansion(active, e.key === expandKey)
        }
      }
      return
    }

    if (e.key === 'PageUp' || e.key === 'PageDown') {
      if (context.isOpen && context.virtualAdapter) {
        e.preventDefault()
        context.navigateVirtual(e.key)
      }
      return
    }

    // #13: select-only mirror — Escape/Tab close with a value commit or
    // no-commit, native focus, cleared active ID, and zero text callbacks.
    if (e.key === 'Escape') {
      if (context.isOpen) {
        // #7: granular hook first (Overlay #3 vocabulary); preventDefault
        // stops the clear and the dismissal (CB-REVERT-02).
        context.onEscape?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) return
        e.preventDefault()
        context.setActiveValue(null)
        context.setIsOpen(false)
      }
      return
    }

    if (e.key === 'Tab') {
      if (context.isOpen) {
        if (keyboardActiveValue != null) {
          context.handleSelect(keyboardActiveValue)
        } else {
          context.setActiveValue(null)
          context.setIsOpen(false)
        }
      }
      return
    }

    if (e.key === 'Home') {
      if (context.isOpen) {
        if (context.virtualAdapter ?? context.windowedListAdapter) context.navigateVirtual('Home')
        else activateFirstLast('first')
      }
      return
    }

    if (e.key === 'End') {
      if (context.isOpen) {
        if (context.virtualAdapter ?? context.windowedListAdapter) context.navigateVirtual('End')
        else activateFirstLast('last')
      }
      return
    }

    // #8: printable typeahead opens when closed, then cycles enabled
    // matches; focus stays on Trigger and nothing commits until activation.
    if (!shouldIgnoreTypeaheadKey(e)) {
      const model = typeaheadRef.current
      if (!model) return
      if (!context.isOpen) {
        context.setIsOpen(true)
        return
      }
      // #5: with an adapter the buffer searches logical items (mounted
      // or not) and scrolls unmounted matches into the DOM. Windowed
      // Listboxes share the logical search (CB-VIRT/CB-COMP-01).
      const adapter = context.virtualAdapter ?? context.windowedListAdapter
      if (adapter) {
        const match = model.handleKey(
          e.key,
          context.activeValue,
          adapter.items.map(item => ({ id: item.value, text: item.textValue || item.value }))
        )
        if (match != null && match !== context.activeValue) {
          const index = adapter.items.findIndex(item => item.value === match)
          if (index !== -1) context.requestVirtualIndex(index)
        }
        return
      }
      const match = model.handleKey(
        e.key,
        context.activeValue,
        enabled.map(opt => ({
          id: opt.value,
          text: opt.textValue ?? opt.value,
        }))
      )
      if (match != null && match !== context.activeValue) {
        context.setActiveValue(match, 'keyboard')
        enabled.find(opt => opt.value === match)?.node?.scrollIntoView({ block: 'nearest' })
      }
    }
  }

  return handleKeyDown
}
