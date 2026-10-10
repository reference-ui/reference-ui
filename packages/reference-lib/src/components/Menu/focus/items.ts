/**
 * Menu item focus: the enabled-item selector, level-scoped item
 * discovery, first/edge focus moves, and container-level arrow, Home,
 * End, PageUp, and PageDown handling. Pointer-opened menus focus the
 * container itself, so the container mirrors the 1D roving mapping
 * while item keys keep roving authority. Unit-tested in happy-dom.
 */
import type * as React from 'react'

export const ENABLED_MENUITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]),' +
  '[role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]),' +
  '[role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'

export function levelItems(content: HTMLElement | null): HTMLElement[] {
  if (!content) return []
  // Scope to this level: a nested menuitem must resolve to its own content.
  // (Submenu contents portal out as siblings, but never match descendants.)
  return Array.from(content.querySelectorAll<HTMLElement>(ENABLED_MENUITEM_SELECTOR)).filter(
    el => el.closest('[data-reference-menu-content]') === content
  )
}

export function focusFirstEnabledItem(content: HTMLElement | null) {
  levelItems(content)[0]?.focus()
}

// B-33: content-focused edge navigation. Pointer-opened menus focus the
// container itself, and RovingFocus keys are item-level only, so the
// container handles its own arrows/Home/End (mirroring RovingFocus 1D
// mapping: PageUp→first, PageDown→last). Callers gate on
// e.target === e.currentTarget so item keys keep roving authority.
export function focusEdgeEnabledItem(content: HTMLElement | null, edge: 'first' | 'last') {
  const items = levelItems(content)
  if (items.length === 0) return
  const target = edge === 'last' ? items[items.length - 1] : items[0]
  target?.focus()
}

export function handleContentContainerKey(
  e: React.KeyboardEvent<HTMLDivElement>,
  content: HTMLElement | null
): boolean {
  if (e.target !== e.currentTarget) return false
  if (e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'PageUp') {
    e.preventDefault()
    focusEdgeEnabledItem(content, 'first')
    return true
  }
  if (e.key === 'ArrowUp' || e.key === 'End' || e.key === 'PageDown') {
    e.preventDefault()
    focusEdgeEnabledItem(content, 'last')
    return true
  }
  return false
}
