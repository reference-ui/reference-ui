/**
 * Listbox's unmatched-value check: a controlled value that names no
 * registered option renders nothing selected, so dev names the component,
 * the bad value, and the registered values. The registry is the mounted
 * options in document order, or the adapter's logical items in virtual mode,
 * so an unmounted logical item never false-positives. The effect is keyed on
 * the value, the registry version, and the logical items; an identical verdict
 * is not repeated, because the mount pass re-runs once options register.
 * Combobox-owned and uncontrolled values, production builds, and an empty
 * registry never warn.
 */
import * as React from 'react'
import { isProductionEnv, warnListbox } from '../shared/warn'
import type { ListboxSelection, OptionRecord, VirtualFocusItem } from '../types'

export interface UnmatchedValueInput {
  selection: ListboxSelection
  value: unknown
  isControlled: boolean
  items: readonly VirtualFocusItem[] | undefined
  getOrderedOptions: () => OptionRecord[]
  registryVersion: number
}

export function useUnmatchedValueWarning({
  selection,
  value,
  isControlled,
  items,
  getOrderedOptions,
  registryVersion,
}: UnmatchedValueInput): void {
  const entries = valueEntries(selection, value)
  // A string key rather than JSON: a diagnostic must never throw from render.
  const entriesKey = entries
    .map(entry => `${typeof entry}:${String(entry)}`)
    .join('\u0000')
  const lastMessageRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const message =
      isControlled && !isProductionEnv()
        ? unmatchedMessage(selection, entries, registeredValues(items, getOrderedOptions))
        : null
    if (message === lastMessageRef.current) return
    lastMessageRef.current = message
    if (message !== null) warnListbox(message)
  }, [isControlled, selection, entriesKey, registryVersion, items])
}

// What a controlled value asks for: nothing for null, one value for single
// selection, and every element of the array for multiple selection.
function valueEntries(selection: ListboxSelection, value: unknown): unknown[] {
  if (value == null) return []
  if (selection === 'multiple' && Array.isArray(value)) return value
  return [value]
}

function registeredValues(
  items: readonly VirtualFocusItem[] | undefined,
  getOrderedOptions: () => OptionRecord[]
): string[] {
  if (items) return items.map(item => item.value)
  return getOrderedOptions().map(record => record.value)
}

// Null when there is nothing to report: an empty registry (options may still be
// resolving) or every entry matching a registered value. Duplicate entries are
// listed once.
function unmatchedMessage(
  selection: ListboxSelection,
  entries: unknown[],
  registered: string[]
): string | null {
  if (registered.length === 0) return null
  const known = new Set<unknown>(registered)
  const unmatched = Array.from(new Set(entries)).filter(entry => !known.has(entry))
  if (unmatched.length === 0) return null
  const names = registered.map(entry => String(entry)).join(', ')
  if (selection === 'multiple') {
    const listed = unmatched.map(entry => `"${String(entry)}"`).join(', ')
    return `value contains ${listed} matching no option (registered values: ${names}).`
  }
  const bad = String(unmatched[0])
  return `value "${bad}" matches no option (registered values: ${names}).`
}
