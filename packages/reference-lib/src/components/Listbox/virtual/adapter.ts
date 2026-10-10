/**
 * Listbox's virtual-adapter contract: validateVirtualAdapter rejects
 * duplicate logical values, out-of-range or duplicate mounted indices,
 * and value/disabled mismatches between a mounted option and the logical
 * item at its index. toMountedIndexEntries projects the option registry
 * into the mounted shape validation compares. Pure — the registry hook
 * calls both at mount time and on adapter replacement.
 */

import type { ListboxVirtualAdapter } from '../types'

export interface MountedIndexEntry<TValue extends string = string> {
  value: TValue
  index?: number
  disabled?: boolean
}

export function validateVirtualAdapter<TValue extends string = string>(
  virtual: ListboxVirtualAdapter<TValue>,
  mountedOptions: Array<MountedIndexEntry<TValue>>
) {
  const seenValues = new Set<string>()
  for (const item of virtual.items) {
    if (seenValues.has(item.value)) {
      throw new Error(`Duplicate value in virtual items: "${item.value}"`)
    }
    seenValues.add(item.value)
  }

  const seenIndices = new Set<number>()
  for (const opt of mountedOptions) {
    if (opt.index == null || opt.index < 0 || opt.index >= virtual.items.length) {
      throw new Error(
        `Option index ${opt.index} out of range (0..${virtual.items.length - 1})`
      )
    }
    if (seenIndices.has(opt.index)) {
      throw new Error(`Duplicate mounted option index: ${opt.index}`)
    }
    seenIndices.add(opt.index)

    const expectedItem = virtual.items[opt.index]
    if (opt.value !== expectedItem.value) {
      throw new Error(
        `Mounted option value "${opt.value}" does not match virtual item value "${expectedItem.value}" at index ${opt.index}`
      )
    }
    if (Boolean(opt.disabled) !== Boolean(expectedItem.disabled)) {
      throw new Error(
        `Mounted option disabled state does not match virtual item disabled state at index ${opt.index}`
      )
    }
  }
}

export function toMountedIndexEntries<TValue extends string = string>(
  records: Iterable<{ value: TValue; index?: number; disabled: boolean }>
): Array<MountedIndexEntry<TValue>> {
  return Array.from(records)
    .filter((rec): rec is { value: TValue; index: number; disabled: boolean } => rec.index != null)
    .map(rec => ({ value: rec.value, index: rec.index, disabled: rec.disabled }))
}
