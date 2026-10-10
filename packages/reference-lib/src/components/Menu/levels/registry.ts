/**
 * The menu level tree: stable root identity, root-trigger and direction
 * reads, descendant checks, and deepest-first open ordering. The root
 * adopts its Popover layer; each open nested Menu owns one child
 * Overlay layer; Escape, outside press, and selection consult these
 * orderings to unwind deepest-first. Pure over the registry; unit-tested.
 */
import { getDirection } from '../../RovingFocus'
import type { MenuLevelValue, SubmenuRegistration } from '../context'

export const MENU_ROOT_ID = 'menu-root'

export function rootTriggerOf(level: MenuLevelValue | null): HTMLElement | null {
  let current = level
  while (current?.parent) current = current.parent
  return current?.getTrigger() ?? null
}

// Direction for submenu keys, default placement, and intent math. Menu
// content portals to document.body and loses the author's dir context, so
// the root trigger — the one tree node that stays in the authored DOM — is
// the direction source. Overlay-direct roots (context menus) have no trigger
// part and fall back to the level's own mounted nodes.
export function levelDirection(level: MenuLevelValue | null): 'ltr' | 'rtl' {
  const rootTrigger = rootTriggerOf(level)
  if (rootTrigger) return getDirection(rootTrigger)
  return getDirection(level?.getContentNode() ?? level?.getTrigger() ?? null)
}

export function isLevelDescendantOf(
  registry: Map<string, SubmenuRegistration>,
  id: string,
  ancestorId: string
): boolean {
  let current = registry.get(id)
  while (current) {
    if (current.parentId === ancestorId) return true
    if (current.parentId === MENU_ROOT_ID) return false
    current = registry.get(current.parentId)
  }
  return false
}

export function openRegistrationsDeepestFirst(
  registry: Map<string, SubmenuRegistration>
): SubmenuRegistration[] {
  return [...registry.values()].filter(r => r.isOpen).sort((a, b) => b.depth - a.depth)
}
