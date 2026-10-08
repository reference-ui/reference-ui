import type { VirtualFocusItem } from '../Listbox'

/**
 * Pure virtual-focus helpers (#5). Navigation validation, logical search,
 * and duplicate detection live here so unit tests pin them without a
 * browser; Combobox.tsx owns refs, pending timing, and diagnostics.
 */

/** First duplicated logical value, or null when values are unique. */
export function findDuplicateValue(items: readonly VirtualFocusItem[]): string | null {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.value)) return item.value
    seen.add(item.value)
  }
  return null
}

/** Logical index of the active value, or null when absent/unknown. */
export function currentVirtualIndex(
  items: readonly VirtualFocusItem[],
  activeValue: string | null
): number | null {
  if (activeValue == null) return null
  const index = items.findIndex(item => item.value === activeValue)
  return index === -1 ? null : index
}

export type VirtualTargetValidity = 'ok' | 'out-of-range' | 'disabled'

/**
 * Navigation-target validation (CB-ADAPTER-05): a `getNextIndex` result
 * must be in range and enabled. Null (no move) is valid and handled by
 * the caller, never passed here.
 */
export function validateVirtualTarget(
  items: readonly VirtualFocusItem[],
  index: number
): VirtualTargetValidity {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) return 'out-of-range'
  if (items[index]?.disabled) return 'disabled'
  return 'ok'
}

/** Mount validation (CB-ADAPTER-05): range only — disabled cells mount. */
export function validateVirtualMount(
  items: readonly VirtualFocusItem[],
  index: number
): boolean {
  return Number.isInteger(index) && index >= 0 && index < items.length
}

function matchLabel(item: VirtualFocusItem): string {
  return item.textValue || item.value
}

/**
 * Prefix search over logical items (CB-ADAPTER-07): first enabled item
 * whose label starts with the text (case-insensitive). Empty text
 * resolves to the first enabled item, mirroring the non-virtual
 * typing rule; no match resolves to null (active clears).
 */
export function findVirtualMatch(
  items: readonly VirtualFocusItem[],
  text: string
): number | null {
  if (text.length === 0) {
    const first = items.findIndex(item => !item.disabled)
    return first === -1 ? null : first
  }
  const lowered = text.toLowerCase()
  const match = items.findIndex(
    item => !item.disabled && matchLabel(item).toLowerCase().startsWith(lowered)
  )
  return match === -1 ? null : match
}

/**
 * Reading direction for navigation requests (mirrors Listbox's local
 * helper): computed style of the source element, document fallback,
 * SSR-safe.
 */
export function directionForElement(el: HTMLElement | null | undefined): 'ltr' | 'rtl' {
  if (el != null && typeof window !== 'undefined') {
    try {
      if (window.getComputedStyle(el).direction === 'rtl') return 'rtl'
    } catch {
      return 'ltr'
    }
  }
  if (typeof document !== 'undefined' && document.dir === 'rtl') return 'rtl'
  return 'ltr'
}
