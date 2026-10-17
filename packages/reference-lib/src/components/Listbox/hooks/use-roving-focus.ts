/**
 * Listbox's roving focus: the preferred tab stop (selected value when
 * mounted and enabled, else the first enabled option) and deterministic
 * focus recovery when the focused option unmounts, disables, or moves
 * (LB-DYNAMIC-02/04, LB-GROUP-04). A pending virtual target owns focus
 * while its window lands, so recovery never fires over it. Reads the
 * registry and session; returns only the tab-stop value.
 */
import * as React from 'react'
import type { ListboxSession } from './use-listbox-session'
import type {
  ListboxSelection,
  ListboxValue,
  ListboxVirtualAdapter,
  OptionRecord,
} from '../types'

export function useRovingFocus(
  session: ListboxSession,
  getOrderedOptions: () => OptionRecord[],
  optionsVersion: number,
  selection: ListboxSelection,
  controlledValue: ListboxValue | null,
  virtual: ListboxVirtualAdapter | undefined
): string | null {
  const { focusedValue, setFocusedValue, pendingVirtualIndex, lastOrderedValuesRef } = session

  // Preferred tab value determination (LB-DOM-08)
  const preferredTabValue = React.useMemo(() => {
    const ordered = getOrderedOptions()
    const enabled = ordered.filter(o => !o.disabled)

    if (selection === 'single') {
      if (typeof controlledValue === 'string') {
        const matching = enabled.find(o => o.value === controlledValue)
        if (matching) return matching.value
      }
    } else if (Array.isArray(controlledValue)) {
      const matching = enabled.find(o => controlledValue.includes(o.value))
      if (matching) return matching.value
    }

    return enabled.length > 0 ? enabled[0].value : null
  }, [getOrderedOptions, selection, controlledValue, optionsVersion])

  // LB-DYNAMIC-02 & LB-DYNAMIC-04: Deterministic focus recovery
  React.useEffect(() => {
    const ordered = getOrderedOptions()
    const currentValues = ordered.map(o => o.value)

    // LB-VIRT-06: a pending virtual target owns focus — the mounted set
    // legitimately lacks it until the window lands. Never recover over it.
    if (virtual && pendingVirtualIndex != null) {
      lastOrderedValuesRef.current = currentValues
      return
    }

    if (focusedValue != null) {
      const currentRecord = ordered.find(o => o.value === focusedValue)

      if (!currentRecord || currentRecord.disabled) {
        const oldIndex = lastOrderedValuesRef.current.indexOf(focusedValue)
        let nextTarget: OptionRecord | undefined

        if (oldIndex !== -1) {
          // First search forward in lastOrderedValues for the nearest enabled option in ordered
          for (let i = oldIndex + 1; i < lastOrderedValuesRef.current.length; i++) {
            const val = lastOrderedValuesRef.current[i]
            const rec = ordered.find(o => o.value === val && !o.disabled)
            if (rec) {
              nextTarget = rec
              break
            }
          }
          // If no forward target, search backward
          if (!nextTarget) {
            for (let i = oldIndex - 1; i >= 0; i--) {
              const val = lastOrderedValuesRef.current[i]
              const rec = ordered.find(o => o.value === val && !o.disabled)
              if (rec) {
                nextTarget = rec
                break
              }
            }
          }
        }

        if (!nextTarget) {
          nextTarget = ordered.find(o => !o.disabled)
        }

        // Adopt DOM focus that already sits on a live option. A stale focusedValue can
        // outlive its option, and this effect may run after a focus event moved focus
        // to an option, so recovery must not pull that focus back to its own target.
        const liveFocus =
          typeof document === 'undefined'
            ? undefined
            : ordered.find(o => !o.disabled && o.ref.current === document.activeElement)
        if (liveFocus) {
          setFocusedValue(liveFocus.value)
        } else if (nextTarget) {
          setFocusedValue(nextTarget.value)
          nextTarget.ref.current?.focus()
        } else {
          setFocusedValue(null)
        }
      } else if (
        typeof document !== 'undefined' &&
        (document.activeElement === null || document.activeElement === document.body)
      ) {
        // LB-GROUP-04: the focused value survived (moved between native
        // groups, same identity) but its DOM node detached and focus fell
        // to body — restore DOM focus to the same value. Only when focus
        // has nowhere else to be; never steal from elsewhere.
        currentRecord.ref.current?.focus()
      }
    }

    lastOrderedValuesRef.current = currentValues
  }, [optionsVersion, focusedValue, getOrderedOptions, virtual, pendingVirtualIndex])

  return preferredTabValue
}
